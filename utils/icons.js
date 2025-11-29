import { InlineKeyboard, InputFile } from "grammy";
import sharp from "sharp";

export const findIcons = async (ctx) => {
  const query = ctx.match || ctx?.message?.reply_to_message?.text;

  // Validation: Check if user typed a name
  if (!query) {
    return ctx.reply("⚠️ Please provide an icon name.\nExample: `/icon home`", {
      parse_mode: "Markdown",
    });
  }

  const msg = await ctx.reply(`🔍 Searching for "${query}"...`);

  try {
    // Call Iconify Search API
    // Limit to 10 results to avoid cluttering the chat
    const response = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=10`
    );
    const data = await response.json();

    // Check if icons were found
    if (!data.icons || data.icons.length === 0) {
      return ctx.api.editMessageText(
        msg.chat.id,
          msg.message_id,
        "❌ No icons found with that name.");
    }

    // Build the Inline Keyboard
    const keyboard = new InlineKeyboard();
    
    data.icons.forEach((iconName, i) => {
      const name = iconName.split(':')[1] || iconName;
      keyboard.text(name, `choose:${iconName}`)
      if(i % 2 === 1) keyboard.row()
    });

    await ctx.api.editMessageText(
      msg.chat.id,
          msg.message_id,
      `Found ${data.total} icons. Select one to download:`, {
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error(error);
    await ctx.reply("❌ API Error. Please try again later.");
  }
};

export const iconCallback = async (ctx) => {
  const action = ctx.match[1]; // svg or png
  const iconName = ctx.match[2]; // the actual icon name

  await ctx.answerCallbackQuery({ text: `Processing ${iconName}...` });

  try {
    // 1. Fetch SVG
    const svgUrl = `https://api.iconify.design/${iconName}.svg?width=64`;
    const svgData = await fetch(svgUrl).then((r) => r.text());

    if (!svgData) throw new Error("SVG fetch failed");

    // If the user selected SVG mode
    if (action === "svg") {
      const svgBuffer = Buffer.from(svgData, "utf-8");

      return ctx.replyWithDocument(
        new InputFile(svgBuffer, `@pencemo-${iconName}.svg`),
        {
          caption: `✅ Downloaded SVG for \`${iconName}\``,
          parse_mode: "Markdown",
        }
      );
    }

    // If the user selected PNG mode
    if (action === "png") {
      const pngBuffer = await sharp(Buffer.from(svgData))
        .resize(1000)
        .png()
        .toBuffer();

      return ctx.replyWithDocument(
        new InputFile(pngBuffer, `@pencemo-${iconName}.png`),
        {
          caption: `🖼️ PNG exported for \`${iconName}\``,
          parse_mode: "Markdown",
        }
      );
    }

    await ctx.reply("❌ Unknown format requested.");

  } catch (err) {
    console.error(err);
    await ctx.reply("❌ Failed to download or convert icon.");
  }
};


export const chooseFormat = async (ctx) => {
  const iconName = ctx.match[1];
  await ctx.answerCallbackQuery();
  
  const kb = new InlineKeyboard()
    .text("📄 SVG", `get:svg:${iconName}`)
    .text("🖼 PNG", `get:png:${iconName}`);

  await ctx.editMessageText(`Choose format for: *${iconName}*`, {
    reply_markup: kb,
    parse_mode: "Markdown",
  });
};

import { BOT_USERNAME, LOGO_ENDPOINT } from "../config.js";
import { InputFile } from "grammy";
import { Menu, MenuRange } from "@grammyjs/menu";
import axios from "axios";
import sharp from "sharp";
import { forceSub } from "./middleware.js";

const userLogo = new Map();

async function fetchAvailableOptions(brand) {
    try {
      const res = await axios.get(`${LOGO_ENDPOINT}/${brand}/data`);
      if (!Array.isArray(res.data)) return [];
      return res.data;
    } catch (err) {
      // console.error("Fetch data error:", err);
      return [];
    }
  }
  

  function hasOption(available, variant, version) {
    return available.some(
      (o) => o.variant === variant && o.version === version
    );
  }
  

  async function downloadFinalLogo(ctx, logo, format) {
    const { brand, variant, version, available } = logo;
  
    // find matching option from /data
    const match = available.find(
      (o) => o.variant === variant && o.version === version
    );
  
    if (!match) {
      return ctx.reply("❌ This combination is not available.");
    }
  
    const svgURL = match.logo;
  
    try {
      const response = await axios.get(svgURL, { responseType: "arraybuffer" });
  
      const svgBuffer = Buffer.from(response.data);
  
      if (format === "svg") {
        return ctx.replyWithDocument(
          new InputFile(svgBuffer, `@pencemo-${brand}-${variant}-${version}.svg`)
        );
      }
  
      if (format === "png") {
        const pngBuffer = await sharp(svgBuffer).png().resize(1000).toBuffer();
        return ctx.replyWithDocument(
          new InputFile(pngBuffer, `@pencemo-${brand}-${variant}-${version}.png`)
        );
      }
    } catch (err) {
      console.error("Download Error:", err);
      return ctx.reply("❌ Failed to download logo.");
    }
  }
  

  async function safeUpdate(ctx) {
    try {
      await ctx.menu.update();
    } catch (err) {
      if (!String(err?.description || "").includes("message is not modified")) {
        console.error("Menu update error:", err);
      }
    }
  }
  
  
  export const logoMenu = new Menu("logo-menu").dynamic(async (ctx) => {
    const state = userLogo.get(ctx.from.id);
    const range = new MenuRange();
  
    if (!state) return range.text("❌ Context not available.");
  
    const { variant, version, available } = state;
  
    // Check version availability count
    const versionsAvailable = [
      hasOption(available, variant, "color"),
      hasOption(available, variant, "black"),
      hasOption(available, variant, "white")
    ].filter(Boolean).length;
  
    // Check variant availability count
    const glyphAvailable =
      hasOption(available, "glyph", "color") ||
      hasOption(available, "glyph", "black") ||
      hasOption(available, "glyph", "white");
  
    const wordmarkAvailable =
      hasOption(available, "wordmark", "color") ||
      hasOption(available, "wordmark", "black") ||
      hasOption(available, "wordmark", "white");
  
    const variantCount = [glyphAvailable, wordmarkAvailable].filter(Boolean).length;
  
    // -----------------------------
    // VERSION BUTTONS (only if > 1)
    // -----------------------------
    if (versionsAvailable > 1) {
      if (hasOption(available, variant, "color")) {
        range.text(version === "color" ? "✅ Color" : "Color", async (ctx) => {
          if (version === "color") return ctx.answerCallbackQuery("Already color.");
          userLogo.set(ctx.from.id, { ...state, version: "color" });
          await safeUpdate(ctx);
        });
      }
  
      if (hasOption(available, variant, "black")) {
        range.text(version === "black" ? "✅ Black" : "Black", async (ctx) => {
          if (version === "black") return ctx.answerCallbackQuery("Already black.");
          userLogo.set(ctx.from.id, { ...state, version: "black" });
          await safeUpdate(ctx);
        });
      }
  
      if (hasOption(available, variant, "white")) {
        range.text(version === "white" ? "✅ White" : "White", async (ctx) => {
          if (version === "white") return ctx.answerCallbackQuery("Already white.");
          userLogo.set(ctx.from.id, { ...state, version: "white" });
          await safeUpdate(ctx);
        });
      }
  
      range.row();
    }
  
    // -----------------------------
    // VARIANT BUTTONS (only if > 1)
    // -----------------------------
    if (variantCount > 1) {
      if (glyphAvailable) {
        range.text(
          variant === "glyph" ? "✅ Glyph" : "Glyph",
          async (ctx) => {
            if (variant === "glyph") return ctx.answerCallbackQuery("Already glyph.");
            userLogo.set(ctx.from.id, { ...state, variant: "glyph" });
            await safeUpdate(ctx);
          }
        );
      }
  
      if (wordmarkAvailable) {
        range.text(
          variant === "wordmark" ? "✅ Wordmark" : "Wordmark",
          async (ctx) => {
            if (variant === "wordmark") return ctx.answerCallbackQuery("Already wordmark.");
            userLogo.set(ctx.from.id, { ...state, variant: "wordmark" });
            await safeUpdate(ctx);
          }
        );
      }
  
      range.row();
    }
  
    // -----------------------------
    // DOWNLOAD BUTTONS (always shown)
    // -----------------------------
    range
      .text("⬇️ SVG", async (ctx) => {
        const logo = userLogo.get(ctx.from.id);
        await downloadFinalLogo(ctx, logo, "svg");
      })
      .text("⬇️ PNG", async (ctx) => {
        const logo = userLogo.get(ctx.from.id);
        await downloadFinalLogo(ctx, logo, "png");
      });
  
    return range;
  });
  
  
 
  export const sendLogo = async (ctx) => {
    if(!await forceSub(ctx)) return;
    // const brand = ctx.match?.trim()?.toLowerCase().replace(/ /g, "_").replace("logo_", "").replace("refresh_", "")// || ctx.message.text?.trim()?.toLowerCase().replace(/ /g, "_").replace("logo_", "");
    const raw = Array.isArray(ctx.match)
  ? ctx.match[0]           // take first matched string
  : ctx.match || "";

const brand = raw
  .toString()
  .trim()
  .toLowerCase()
  .replace(/ /g, "_")
  .replace("logo_", "")
  .replace("refresh_", "");
  
    if (!brand) return ctx.reply("Usage: /logo google");
    const logos = userLogo.get(ctx.from.id);
    if(logos && logos?.brand === brand){
      return await ctx.reply(
        `🎨 Select logo options for *${brand}*`,
        {
          parse_mode: "Markdown",
          reply_markup: logoMenu,
        }
      );
    }
  
    const msg = await ctx.reply("🔍 Searching for logo...");
    
   
    // Step 3: fetch data while animation runs
    const available = await fetchAvailableOptions(brand);
  
  
    if (available.length === 0) {
      try {
        return await ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          "😥 Logo not found. please check spelling and try again."
        );
      } catch {
        return ctx.reply("😥 Logo not found.");
      }
    }
  
    // Step 5: save state
    userLogo.set(ctx.from.id, {
      brand,
      variant: "glyph",
      version: "color",
      available,
    });
  
    // Step 6: show menu
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      `🎨 Select logo options for *${brand}*\n\n\`Choose your mode\`\n\*Variant : Glyph | Wordmark\nVersion : Color | Black | White\*`,
      {
        parse_mode: "Markdown",
        reply_markup: logoMenu,
      }
    );
  };
  

  export const sendLogoInChat = async (ctx) => {
    const brand = ctx.message.text?.toLowerCase()
    .replace(/logo/gi, "")
    .replace(/png/gi, "")
    ?.trim()
    .replace(/ /g, "_")
    const available = await fetchAvailableOptions(brand);
  
    if (available.length === 0) return
  
    // Step 5: save state
    userLogo.set(ctx.from.id, {
      brand,
      variant: "glyph",
      version: "color",
      available,
    });
  
    // Step 6: show menu 
    await ctx.reply(
      `🎨 Click button to get *${brand}* logo file\n\n©️ @pencemodesigns`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Get Logo 🚀",
                url: `https://t.me/${BOT_USERNAME}?start=logo_${brand}`,
              }
            ]
          ]
        },
      }
    );
  };
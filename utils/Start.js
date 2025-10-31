import { InlineKeyboard } from "grammy";
import { isAdmin } from "../Helpers/isAdmin.js";
import { CHANNEL_USERNAME, SUB_CHANNEL_ID } from "../config.js";
import Batch from "../db/Batch.js";
import File from "../db/File.js";
import { api } from "../index.js";

export const startMsg = async (ctx) => {
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const args = ctx.message?.text?.split(" ");
  const param = args?.[1];

  try {
    const member = await api.getChatMember(SUB_CHANNEL_ID, chatId);

    // 🔸 Check if user is subscribed
    const notSubscribed = ["left", "kicked"].includes(member.status);

    // 🟢 No deep link
    if (!param) {
      if (notSubscribed) {
        const keyboard = new InlineKeyboard().url(
          "🔔 Join Channel",
          `https://t.me/${CHANNEL_USERNAME}`
        );
        await ctx.reply(
          `📢 Please join our channel to use this bot!\n👉 @${CHANNEL_USERNAME}`,
          { reply_markup: keyboard }
        );
        return;
      }

      return ctx.reply("👋 Welcome to File Sharing Bot!");
    }

    // 🟠 Deep link (file or batch)
    if (notSubscribed) {
      const keyboard = new InlineKeyboard()
        .url("🔔 Join Channel", `https://t.me/${CHANNEL_USERNAME}`)
        .text("🔄 Refresh", `refresh_${param}`); // callback data with prefix

      await ctx.reply(
        `📢 Please join our channel to access this file!\n👉 @${CHANNEL_USERNAME}`,
        { reply_markup: keyboard }
      );
      return;
    }

    // ✅ Handle batch links
    if (param.startsWith("batch_")) {
      const batch = await Batch.findOne({ batchId: param });
      if (!batch) return ctx.reply("⚠️ Invalid or expired batch link.");

      await ctx.reply(`📦 Sending ${batch.slugs.length} files...`);
      for (const slug of batch.slugs) {
        const file = await File.findOne({ slug });
        if (!file) {
          await ctx.reply(`❌ File not found for slug: ${slug}`);
          continue;
        }
      
        try {
          await ctx.api.copyMessage(ctx.chat.id, file.chatId, file.messageId, {
            protect_content: true,
          });
        } catch (err) {
          console.error(`Error copying message for slug ${slug}:`, err.description);
          await ctx.reply(`⚠️ Couldn't send file (${slug}) — maybe deleted or private.`);
          continue;
        }
      }
      return ctx.reply("✅ All files sent successfully!");
    }

    // ✅ Handle single file links
    const file = await File.findOne({ slug: param });
    if (!file) return ctx.reply("⚠️ Invalid file link.");

    try {
      await ctx.api.copyMessage(ctx.chat.id, file.chatId, file.messageId, {
        protect_content: true,
      });
    } catch (err) {
      console.error(`Error :`, err.description);
      await ctx.reply(`⚠️ Couldn't send file — maybe deleted or private.`);
    }
  } catch (e) {
    console.error("Error in startMsg:", e);
    const keyboard = new InlineKeyboard().url(
      "🔔 Join Channel",
      `https://t.me/${CHANNEL_USERNAME}`
    );
    await ctx.reply(
      `📢 Please join our channel to use this bot!\n👉 @${CHANNEL_USERNAME}`,
      { reply_markup: keyboard }
    );
  }
};
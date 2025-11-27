import { InlineKeyboard } from "grammy";
import { isAdmin, isPrivateChat } from "../Helpers/isAdmin.js";
import { BOT_USERNAME, CHANNEL_USERNAME, SUB_CHANNEL_ID } from "../config.js";
import Batch from "../db/Batch.js";
import File from "../db/File.js";
import { api } from "../index.js";
import { escapeMarkdownSpecialChars } from "../Helpers/helpers.js";
import { sendLogo } from "./logotypes.js";

export const startMsg = async (ctx) => {
  if(!isPrivateChat(ctx)){
    return ctx.reply("Yes, I'm alive...", {
      reply_to_message_id: ctx.message.message_id,
      reply_markup:{
        inline_keyboard: [
          [
              { text: 'Go Here 🚀', url: `https://t.me/${BOT_USERNAME}` }
          ]
        ]
    }
    });
  }
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

      const {id} = ctx.from;
      const name = ctx.from.first_name || ctx.from.username || ctx.from.last_name || "User";
      const firstname = escapeMarkdownSpecialChars(name)
      return ctx.reply(`Hi [${firstname}](tg://user?id=${id}) \n*Welcome to ${ctx.me.first_name} 👋*\n\n*I'm a support bot of pencemodesigs*📝\n\nUse /help for more\n\n★Join here 👉 @pencemodesign`,{ 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
        reply_markup:{
          inline_keyboard: [
            [
              { text: 'Help ⚙️', callback_data: 'help' },
              { text: 'About 📝', callback_data: 'about' }
            ],
            [
                { text: 'Support Group 👩‍💻', url: 'https://t.me/pencemodesign' }
            ]
          ]
      }
      });

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
          await ctx.api.copyMessage(ctx.chat.id, file.chatId, file.messageId);
        } catch (err) {
          console.error(`Error copying message for slug ${slug}:`, err.description);
          await ctx.reply(`⚠️ Couldn't send file (${slug}) — maybe deleted or private.`);
          continue;
        }
      }
      return ctx.reply("✅ All files sent successfully!");
    }
    // ✅ Handle batch links
    if (param.startsWith("logo_")) {
      sendLogo(ctx)
      return
    }

    // ✅ Handle single file links
    const file = await File.findOne({ slug: param });
    if (!file) return ctx.reply("⚠️ Invalid file link.");

    try {
      await ctx.api.copyMessage(ctx.chat.id, file.chatId, file.messageId);
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
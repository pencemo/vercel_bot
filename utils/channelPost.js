import { ADMIN_ONLY_TEXT } from "../Helpers/Utils.js";
import { extractData } from "../Helpers/helpers.js";
import { isAdmin } from "../Helpers/isAdmin.js";
import { SUB_CHANNEL_ID } from "../config.js";

export const channelPost = async (ctx) => {
    // Check admin
    if (!isAdmin(ctx.from?.id)) {
      return ctx.reply(ADMIN_ONLY_TEXT);
    }
  
    const reply = ctx.msg?.reply_to_message;
    if (!reply) {
      return ctx.reply(
        "Please reply to the message you want to post in the channel.\n\n" +
        "You can also add buttons using: [Name](url)"
      );
    }
  
    const text = ctx.msg.text || "";
    const data = extractData(text) || {};
  
    try {
      await ctx.api.copyMessage(
        SUB_CHANNEL_ID,      // Target channel ID
        ctx.chat.id,         // Source chat ID (very important!)
        reply.message_id,    // Correct message id
        {
          reply_markup: data.buttons
            ? { inline_keyboard: data.buttons }
            : undefined,
        }
      );
  
      await ctx.reply("✅ Message posted to channel!");
    } catch (err) {
      console.error("Copy Error:", err);
      await ctx.reply("❌ Failed to post message to channel.");
    }
  };
  
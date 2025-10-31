import { api } from "../index.js";
import Batch from "../db/Batch.js";
import File from "../db/File.js";
import { SUB_CHANNEL_ID } from "../config.js";

export const refresh = async (ctx) => {
    const param = ctx.match[1];
    const chatId = ctx.from.id;
  
    try {
      const member = await api.getChatMember(SUB_CHANNEL_ID, chatId);
  
      if (["left", "kicked"].includes(member.status)) {
        await ctx.answerCallbackQuery({
          text: "❌ You’re still not subscribed. Join and tap Refresh again!",
          show_alert: true,
        });
        return;
      }
  
      // ✅ Subscribed now, send the file or batch
      if (param.startsWith("batch_")) {
        const batch = await Batch.findOne({ batchId: param });
        if (!batch) return ctx.reply("⚠️ Invalid or expired batch link.");
  
        await ctx.editMessageText(`📦 Sending ${batch.slugs.length} files...`);
        for (const slug of batch.slugs) {
          const file = await File.findOne({ slug });
          if (file) {
            await ctx.api.copyMessage(ctx.chat.id, file.chatId, file.messageId, {
              protect_content: true,
            });
          }
        }
        await ctx.editMessageText("✅ All files sent successfully!");
        return;
      }
  
      const file = await File.findOne({ slug: param });
      if (!file) return ctx.reply("⚠️ Invalid file link.");
  
      await ctx.editMessageText("✅ You’re verified! Sending your file...");
      await ctx.api.copyMessage(ctx.chat.id, file.chatId, file.messageId, {
        protect_content: true,
      });
    } catch (err) {
      console.error("Refresh error:", err);
      await ctx.answerCallbackQuery({
        text: "⚠️ Error checking your subscription. Try again later.",
        show_alert: true,
      });
    }
  }

export const callBackMsg =  async (ctx) => {

    const data = ctx.callbackQuery.data;
    if(data == "help"){
      return ctx.editMessageText("This is help Callback") 
    }
  }
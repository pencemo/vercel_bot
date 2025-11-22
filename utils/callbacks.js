import { api } from "../index.js";
import Batch from "../db/Batch.js";
import File from "../db/File.js";
import { SUB_CHANNEL_ID } from "../config.js";
import { ABOUT_TEXT, ADMIN_TEXT, HELP_TEXT, aboutMarkup, adminMarkup, helpMarkup } from "../Helpers/Utils.js";
import { escapeMarkdownSpecialChars } from "../Helpers/helpers.js";
import { isAdmin } from "../Helpers/isAdmin.js";
import User from "../db/User.js";
import { Filter } from "../db/models.js";

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
      await ctx.answerCallbackQuery();
      if (param.startsWith("batch_")) {
        const batch = await Batch.findOne({ batchId: param });
        if (!batch) return ctx.reply("⚠️ Invalid or expired batch link.");
  
        await ctx.editMessageText(`📦 Sending ${batch.slugs.length} files...`);
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
        await ctx.editMessageText("✅ All files sent successfully!");
        return;
      }
  
      const file = await File.findOne({ slug: param });
      if (!file) return ctx.reply("⚠️ Invalid file link.");
  
      await ctx.editMessageText("✅ You’re verified! Sending your file...");
      
    try {
      await ctx.api.copyMessage(ctx.chat.id, file.chatId, file.messageId);
    } catch (err) {
      console.error(`Error :`, err.description);
      await ctx.reply(`⚠️ Couldn't send file — maybe deleted or private.`);
    }
    } catch (err) {
      console.error("Refresh error:", err);
      await ctx.answerCallbackQuery({
        text: "⚠️ Error checking your subscription. Try again later.",
        show_alert: true,
      });
    }
  }

export const callBackMsg =  async (ctx) => {

  await ctx.answerCallbackQuery();

    const data = ctx.callbackQuery.data;
    if(data == "help"){
      const admin = isAdmin(ctx.from.id);
      return ctx.editMessageText(HELP_TEXT, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: helpMarkup(admin),
      }) 
    }
    if(data == "about"){
      return ctx.editMessageText(ABOUT_TEXT, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: aboutMarkup,
      }) 
    }
    if(data == "admin"){
      return ctx.editMessageText(ADMIN_TEXT, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: adminMarkup,
      })
    }
    if(data == "users"){
      const usersCount = await User.countDocuments()
      return ctx.editMessageText("Users count: "+usersCount, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: {inline_keyboard : [[{text: "Back 🔙", callback_data: "admin"}]]},
      })
    }
    if(data == "files"){
      const fileCount = await File.countDocuments()
      return ctx.editMessageText("Files count: "+fileCount, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: {inline_keyboard : [[{text: "Back 🔙", callback_data: "admin"}]]},
      })
    }
    if(data == "filters"){
      const filtersCount = await Filter.countDocuments()
      return ctx.editMessageText("Filtes count: "+filtersCount, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: {inline_keyboard : [[{text: "Back 🔙", callback_data: "admin"}]]},
      })
    }
    if(data == "batch"){
      const batchCount = await Batch.countDocuments()
      return ctx.editMessageText("Batch count: "+batchCount, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: {inline_keyboard : [[{text: "Back 🔙", callback_data: "admin"}]]},
      })
    }
    if(data == "delBatchYes"){
      const batches = await Batch.deleteMany()
      if(!batches) return ctx.editMessageText("⚠️ Error deleting batch")
      return ctx.editMessageText("All Batch deleted succesfull 🗑️")
    }
    if(data == "delFileYes"){
      const files = await File.deleteMany()
      if(!files) return ctx.editMessageText("⚠️ Error deleting file")
      return ctx.editMessageText("All File deleted succesfull 🗑️")
    }
    if(data == "delFilter"){
      const filters = await Filter.deleteMany()
      if(!filters) return ctx.editMessageText("⚠️ Error deleting filters")
      return ctx.editMessageText("All Filters deleted succesfull 🗑️")
    }
    if(data == "unbanAll"){
      const unbanUsers = await User.updateMany({isBlocked: true}, {isBlocked: false})
      if(!unbanUsers) return ctx.editMessageText("⚠️ Error unban filters")
      return ctx.editMessageText("Unban All users")
    }
    if(data == "delNo"){
      // try {
      //   await ctx.api.deleteMessage(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id);
      //  } catch(err){
      //   console.log(err);
      //  }
       return ctx.editMessageText("Canceld 🚫")
    }
  }
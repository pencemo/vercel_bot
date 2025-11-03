import { ADMIN_ONLY_TEXT } from "../Helpers/Utils.js";
import { generateSlug } from "../Helpers/generateSlug.js";
import { isAdmin, isPrivateChat } from "../Helpers/isAdmin.js";
import { BOT_USERNAME, CHANNEL_ID } from "../config.js";
import Batch from "../db/Batch.js";
import File from "../db/File.js";

const userBatchSessions = new Map();

export const batchCommand = async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply(ADMIN_ONLY_TEXT);
      }
   
    userBatchSessions.set(ctx.from.id, []);
    await ctx.reply(
      "📁 Batch mode activated!\n\nSend me all the files you want to include.\nWhen done, type /done to get your link."
    );
  };
  
  // ────────────────────────────────
  // /done command
  // ────────────────────────────────
export const doneCommand = async (ctx) => {
    const userId = ctx.from.id;
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply(ADMIN_ONLY_TEXT);
    }
    
    const batchList = userBatchSessions.get(userId);
    if (!batchList || batchList.length === 0) {
        userBatchSessions.delete(userId);
      return ctx.reply("❗You don’t have an active batch. Use /batch first.");
    }
  
    const batchId = "batch_" + generateSlug(8);
    await Batch.create({
      batchId,
      slugs: batchList,
      uploaderId: userId
    });
  
    userBatchSessions.delete(userId);
  
    const link = `https://t.me/${BOT_USERNAME}?start=${batchId}`;
    await ctx.reply(
      `✅ Batch created with ${batchList.length} files!\n\n🔗 Link: ${link}  \n\n <code>[Button](${link})</code>`, {
        parse_mode: "html",
      }
    );
  };



export const fileSave = async (ctx) => {
    const userId = ctx.from.id;
  
    if (!isAdmin(ctx.from.id)) {
        return
    }
    // forward to storage channel
    const forwarded = await ctx.api.copyMessage(
      CHANNEL_ID,
      ctx.chat.id,
      ctx.message.message_id
    );
  
    const slug = generateSlug(8);
  
    await File.create({
      slug,
      chatId: CHANNEL_ID,
      messageId: forwarded.message_id,
      uploaderId: userId,
      fileName: ctx.message.document?.file_name || "Unknown",
      caption: ctx.message.caption || ""
    });
  
    // add to batch if active
    if (userBatchSessions.has(userId)) {
      const batch = userBatchSessions.get(userId);
      batch.push(slug);
      userBatchSessions.set(userId, batch);
      await ctx.reply(`✅ File added to batch (${batch.length} total).`);
    } else {
      const link = `https://t.me/${BOT_USERNAME}?start=${slug}`;
      await ctx.reply(`✅ File saved!\n\n🔗 Link: ${link} \n\n <code>[Button](${link})</code>`, {
        parse_mode: "html",
      });
    }
  };


  export const deleteBatch = async (ctx) => { 
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply(ADMIN_ONLY_TEXT);
  }
    
    const slug = ctx.match;
    if(!slug) return ctx.reply("❗Please provide a valid batch slug.");
    const batch = await Batch.findOne({ batchId: slug });
    if (!batch) {
      return ctx.reply("❗Batch not found.");
    }
    await batch.deleteOne();
    ctx.reply("✅ Batch deleted.");
  }

  export const deleteLink = async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply(ADMIN_ONLY_TEXT);
  }
    const slug = ctx.match;
    if(!slug) return ctx.reply("❗Please provide a valid file slug.");
    const file = await File.findOne({ slug });
    if (!file) {
      return ctx.reply("❗File not found.");
    }
    await file.deleteOne();
    ctx.reply("✅ File deleted.");
  }
import { Bot, InlineKeyboard } from "grammy";
import User from "../db/User.js";
import { isAdmin } from "../Helpers/isAdmin.js";
import { extractData } from "../Helpers/helpers.js";


// pending broadcasts: Map<adminId, { chatId, messageId }>
const pendingBroadcasts = new Map();

export const broadcast = async (ctx) => {
    // 1) check admin
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply(ADMIN_ONLY_TEXT);
      }
  
    const reply = ctx.message?.reply_to_message;
    if (!reply) {
      return ctx.reply("Please reply to a message you want to broadcast, then send /broadcast with button if needed like [Name](url).");
    }

    const { text } = ctx.message;
    const data = extractData(text);
  
    // save message info for this admin
    pendingBroadcasts.set(ctx.from.id, {
      chatId: ctx.chat.id,
      messageId: reply.message_id,
      button: data?.buttons || [],
    });
  
    const usersCount = await User.countDocuments({ isBlocked: { $ne: true } });
  
    const keyboard = new InlineKeyboard()
      .text("✅ Yes, send", "bc:confirm")
      .text("❌ Cancel", "bc:cancel");
  
    await ctx.reply(
      `Broadcast to ~${usersCount} users\n` +
        "This will send the *same message* to all\n\nConfirm?",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  };
  

  export const broadcastCallback = async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply(ADMIN_ONLY_TEXT);
      }
  
    const data = ctx.callbackQuery.data;
  
    if (data === "bc:cancel") {
      pendingBroadcasts.delete(ctx.from.id);
      await ctx.answerCallbackQuery({ text: "Broadcast cancelled." });
      return ctx.editMessageText("Broadcast cancelled.");
    }
  
    // confirm
    const info = pendingBroadcasts.get(ctx.from.id);
    if (!info) {
      await ctx.answerCallbackQuery({ text: "No pending broadcast found.", show_alert: true });
      return;
    }
  
    await ctx.answerCallbackQuery(); // remove loading
  
    await ctx.editMessageText("Broadcast started… This may take some time.");
  
    // start broadcast
    const date = Date.now();
    broadcastToAllUsers(ctx, info.chatId, info.messageId, info.button) 
      .then(async ({ success, failed, failedIds, total }) => {
        await User.updateMany({ _id: { $in: failedIds } }, { $set: { isBlocked: true } });
        const sec =  Math.ceil((Date.now() - date) / 1000);
        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;
        const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        await ctx.reply(
          `Broadcast finished.\n\n✅ Sent: ${success}\n❌ Failed: ${failed}\n🕵️‍♂️ Total : ${total}\n🕛 Time : ${formatted} M`
        );
      })
      .catch(async (err) => {
        console.error("Broadcast error:", err);
        await ctx.reply("Broadcast failed with an error. Check logs.");
      })
      .finally(() => {
        pendingBroadcasts.delete(ctx.from.id);
      });
  };
  

  async function broadcastToAllUsers(ctx, fromChatId, fromMessageId, button) {
    const users = await User.find({ isBlocked: { $ne: true } }).lean();
  
    const CHUNK_SIZE = 25;         // messages per batch
    const SLEEP_BETWEEN = 10000;    // ms between batches
  
    let success = 0;
    let failed = 0;
    let failedIds = []
  
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
  
      try {
        await ctx.api.copyMessage(
          user.chatId,
          fromChatId,
          fromMessageId,
          {
            reply_markup: {
              inline_keyboard: button,
            }
          }
        );
        success++;
      } catch (err) {
        failed++;
        failedIds.push(user._id)
        console.error(`Failed to send to ${user.chatId}:`, err.description);
      }
  
      // throttle: sleep every CHUNK_SIZE
      if (i > 0 && i % CHUNK_SIZE === 0) {
        await new Promise((res) => setTimeout(res, SLEEP_BETWEEN));
      }
    }
  
    return { success, failed, failedIds, total: users.length};
  }
  
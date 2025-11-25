import { InlineKeyboard } from "grammy";
import { isAdmin } from "../Helpers/isAdmin.js";
import { CHANNEL_USERNAME, GROUP_ID, SUB_CHANNEL_ID } from "../config.js";
import { api } from "../index.js";
import User from "../db/User.js";

export const forceSub = async (ctx, next) => {
    const chatId = ctx.from?.id;
    if (!chatId) return;
    if (isAdmin(chatId)) return await next();
  
    try {
      const member = await api.getChatMember(SUB_CHANNEL_ID, chatId);
      if (["left", "kicked"].includes(member.status)) {
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
    } catch (error) {
      console.error("Error checking subscription:", error);
      const keyboard = new InlineKeyboard().url(
        "🔔 Join Channel",
        `https://t.me/${CHANNEL_USERNAME}`
      );
      await ctx.reply(
        `⚠️ Unable to verify your subscription.\nPlease make sure you've joined @${CHANNEL_USERNAME}.`,
        { reply_markup: keyboard }
      );
      return;
    }
  
    await next();
  };



export const userMiddleWare = async (ctx, next) => {
  // If there's no sender info (like channel posts), skip user tracking
  if (!ctx.from) return next();
  if(ctx?.chat?.type == "private") {
    const { id, username, first_name, last_name } = ctx.from;
  
    let user = await User.findOne({ chatId: id }).exec();
  
    if (!user) {
      await User.create({
        chatId: id,
        username: username || '',
        firstName: first_name || '',
        lastName: last_name || '',
      });
      return next();
    }else if(user && user.isBlocked) {
      user.isBlocked = false;
      await user.save();
    }
  
    if (user.isBan && !user.isAdmin) {
      return ctx.reply("🚫 You are blocked by admin.");
    }
  }else {
    const id =  String(ctx?.chat?.id)
    const groupIds = GROUP_ID.split(",").map(g => g.trim());

    if(!id)return next()
    if(!groupIds.includes(id)){
      return ctx.reply("I can't send massage here 😏")
    }
  }

  return next();
}
import { ABOUT_TEXT, HELP_TEXT, aboutMarkup, helpMarkup } from "../Helpers/Utils.js"
import { escapeMarkdownSpecialChars } from "../Helpers/helpers.js"
import { isAdmin } from "../Helpers/isAdmin.js";
import { ADMIN_ID } from "../config.js";
import User from "../db/User.js";
import { bot } from "../index.js";

export const helpCommand = async(ctx)=>{
    const admin = isAdmin(ctx.from.id);
ctx.reply(HELP_TEXT, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: helpMarkup(admin),
  })
}

export const aboutCommand = async(ctx)=>{
ctx.reply(ABOUT_TEXT, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: aboutMarkup,
  })
}

export const banUser = async(ctx)=>{
    const username =  ctx.message.text.replace(/^\/(?:ban)\s*/, "").trim();

    if(!username) return ctx.reply("Please provide a username to ban")

    const user = await User.findOneAndUpdate({username:username}, {isBlocked: true});
    if(!user) return ctx.reply("User not found")
    ctx.reply(`@${username} has been banned`)
    
}

export const unbanUser = async(ctx)=>{
    const username =  ctx.message.text.replace(/^\/(?:unban)\s*/, "").trim();

    if(!username) return ctx.reply("Please provide a username to unban")

    const user = await User.findOneAndUpdate({username:username}, {isBlocked: false});
    
    if(!user) return ctx.reply("User not found")

    ctx.reply(`@${username} has been unbanned`)
}

export const toAdmin = async(ctx)=>{
    const chat = ctx?.message?.text?.replace(/^\/(?:toadmin)\s*/, "").trim() || ctx?.message?.reply_to_message?.text

    if(!chat) return ctx.reply("Please provide a chat or replay to a massage")
    try {
        await bot.api.sendMessage(ADMIN_ID, `💌 Message from @${ctx?.from?.username}\n\n ${chat}`);
        ctx.reply("Message sent to admin")
      } catch (error) {
        if (error.response && error.response.error_code === 403) {
          ctx.reply(`Admin not found`);
        } else {
          ctx.reply(`Error sending message to admin`);
        }
      }
}
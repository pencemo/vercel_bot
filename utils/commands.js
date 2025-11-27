import {
  ABOUT_TEXT,
  ADMIN_ONLY_TEXT,
  HELP_TEXT,
  aboutMarkup,
  helpMarkup,
} from "../Helpers/Utils.js";
import { escapeMarkdownV2 } from "../Helpers/helpers.js";
import { isAdmin, isPrivateChat } from "../Helpers/isAdmin.js";
import { ADMIN_ID } from "../config.js";
import User from "../db/User.js";
import { bot } from "../index.js";

export const helpCommand = async (ctx) => {
  const admin = isAdmin(ctx.from.id);
  ctx.reply(HELP_TEXT, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: helpMarkup(admin),
  });
};

export const aboutCommand = async (ctx) => {
  ctx.reply(ABOUT_TEXT, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: aboutMarkup,
  });
};

export const banUser = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply(ADMIN_ONLY_TEXT);
  }
  const username = ctx.message.text.replace(/^\/(?:ban)\s*/, "").trim();

  if (!username) return ctx.reply("Please provide a username to ban");

  const user = await User.findOneAndUpdate(
    { username: username },
    { isBan: true }
  );
  if (!user) return ctx.reply("User not found");
  ctx.reply(`@${username} has been banned`);
};

export const banUsersList = async (ctx) => {
  // Check admin access
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply(ADMIN_ONLY_TEXT);
  }

  // Fetch all blocked users
  const users = await User.find({ isBan: true });

  if (!users || users.length === 0) {
    return ctx.reply("🚫 No banned users found.");
  }

  // Escape MarkdownV2 special characters safely
  const escapeMarkdownV2 = (text = "") => {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
  };

  // Format each user with a tg:// link
  const usernames = users
    .map((u, i) => {
      const name = u.username || u.firstName || u.lastName ||  "Unknown";
      const safeName = escapeMarkdownV2(name);
      return `${i+1} [${safeName}](tg://user?id=${u.chatId})`;
    })
    .join("\n");
  // Send response
  return ctx.reply(`${usernames}\n\n🚷 *${users.length} Banned Users*`, {
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Unban All 🔓", callback_data: "unbanAll" },
      ]
      ],
    },
  });
};


export const unbanUser = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply(ADMIN_ONLY_TEXT);
  }
  const username = ctx.message.text.replace(/^\/(?:unban)\s*/, "").trim();

  if (!username) return ctx.reply("Please provide a username to unban");

  const user = await User.findOneAndUpdate(
    { username: username },
    { isBan: false }
  );

  if (!user) return ctx.reply("User not found");

  ctx.reply(`@${username} has been unbanned`);
};

export const toAdmin = async (ctx) => {
  const chat =
    ctx?.message?.text?.replace(/^\/(?:toadmin)\s*/, "").trim() ||
    ctx?.message?.reply_to_message?.text;
  if (!chat) return ctx.reply("Please send /toadmin <MSG> or replay to a massage");
  try {
    await bot.api.sendMessage(
      ADMIN_ID,
      `Id : \`${ctx?.from?.id}\`\n\n 💌 Message from @${ctx?.from?.username}\n\n ${escapeMarkdownV2(chat)}`, {
        parse_mode: "MarkdownV2",
      }
    );
    ctx.reply("Message sent to admin");
  } catch (error) {
    if (error.response && error.response.error_code === 403) {
      ctx.reply(`Admin not found`);
    } else {
      ctx.reply(`Error sending message to admin`);
    }
  }
};

export const delBatchAll = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply(ADMIN_ONLY_TEXT);
}
  ctx.reply("Are you sure you want to delete all batches? (y/n)", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Yes ✅", callback_data: "delBatchYes" },
        { text: "No ❌", callback_data: "delNo" }
      ]
      ],
    },
  });
}

export const delFileAll = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply(ADMIN_ONLY_TEXT);
}
  ctx.reply("Are you sure you want to delete all Files? (y/n)", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Yes ✅", callback_data: "delFileYes" },
        { text: "No ❌", callback_data: "delNo" }
      ]
      ],
    },
  });
}

export const delFiltersAll = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply(ADMIN_ONLY_TEXT);
}
  ctx.reply("Are you sure you want to delete all Filtes?", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Delete Filter ✅", callback_data: "delFilter" },
        { text: "No ❌", callback_data: "delNo" }
      ]
      ],
    },
  });
}

export const getId = (ctx) => {
  if(isPrivateChat(ctx)){
    ctx.reply("Your ID : "+ctx.from.id)
  }else{
    ctx.reply("Chat ID : "+ctx.chat.id)
  }
}


export const toUsr = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply(ADMIN_ONLY_TEXT);
  }
  const id = ctx?.match
  if (!id) return ctx.reply("Please provide a id to send massage /tousr <userId>");

  const chat = ctx?.message?.reply_to_message
  if (!chat) return ctx.reply("Please replay to a massage");

  try {
    await bot.api.copyMessage(
      id, ctx.chat.id, chat.message_id 
    );
    ctx.reply("Message sent to user");
  } catch (error) {
    if (error.response && error.response.error_code === 403) {
      ctx.reply(`User not found`);
    } else {
      ctx.reply(`Error sending message to user`);
    }
  }
}
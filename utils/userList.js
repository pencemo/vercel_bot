import { InlineKeyboard } from "grammy";
import User from "../db/User.js";
import { isAdmin } from "../Helpers/isAdmin.js";
import { ADMIN_ONLY_TEXT } from "../Helpers/Utils.js";

const ITEMS_PER_PAGE = 20;

const escapeMarkdownV2 = (text = "") => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
};

// MAIN COMMAND
export const allUsers = async (ctx) => {
  const page = parseInt(ctx.match) || 0
  try {
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply(ADMIN_ONLY_TEXT);
    }

    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      return ctx.reply("🚫 No users found.");
    }

    await userListPage(ctx, page, totalUsers); // start from page 0
  } catch (err) {
    console.error("❌ Error in allUsers:", err);
    return ctx.reply("❌ Error fetching users.");
  }
};

// RENDER PAGE
async function userListPage(ctx, page, totalUsers, isEdited = false) {
  const skip = page * ITEMS_PER_PAGE;

  const users = await User.find()
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(ITEMS_PER_PAGE);

  const usernames = users
    .map((u, i) => {
      const index = skip + i + 1;
      const name =
        u.username || u.firstName || u.lastName || "Unknown";
      const safeName = escapeMarkdownV2(name);
      return `${index}. [${safeName}](tg://user?id=${u.chatId}) ${
        u.isBlocked ? "❌" : ""
      }`;
    })
    .join("\n");

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  const keyboard = new InlineKeyboard();
  if (page > 0) keyboard.text("⬅️ Previous", `users_page_${page - 1}`);
  if (page < totalPages - 1)
    keyboard.text("Next ➡️", `users_page_${page + 1}`);

  const text = `📄 *All Users*\n*Page:* ${page + 1}/${totalPages}\n*Total:* ${totalUsers}\n\n${usernames}\n\nUse /userlist <number> to select page`;

  if (isEdited) {
    return ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }

  return ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}

// CALLBACK HANDLER
export const registerUserPagination = async (ctx) => {
  try {
    const match = ctx.callbackQuery.data.match(/users_page_(\d+)/);

    if (!match) return ctx.answerCallbackQuery();

    const page = parseInt(match[1]);
    const totalUsers = await User.countDocuments();

    await ctx.answerCallbackQuery();
    await userListPage(ctx, page, totalUsers, true);
  } catch (err) {
    console.error("❌ Pagination error:", err);
    return ctx.answerCallbackQuery({
      text: "Error loading page",
      show_alert: true,
    });
  }
};

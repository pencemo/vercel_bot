import { InlineKeyboard } from "grammy";
import { ADMIN_ONLY_TEXT } from "../Helpers/Utils.js";
import { isAdmin } from "../Helpers/isAdmin.js";
import User from "../db/User.js";
const escapeMarkdownV2 = (text = "") => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
};

let ITEMS_PER_PAGE = 20;

export const allUsers = async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply(ADMIN_ONLY_TEXT);
    }

    // Fetch all blocked users
    const users = await User.countDocuments();

    if (users.length === 0) {
      return ctx.reply("🚫 No users found.");
    }

    const page = 0; // start from first page
    await userListPage(ctx, page, users);
  } catch (error) {
    console.error("❌ Error in allFilters:", error);
    ctx.reply("Error fetching filters.");
  }
};

async function userListPage(ctx, page, totalUsers, isEdited = false) {
  const skip = page * ITEMS_PER_PAGE;

  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(ITEMS_PER_PAGE);

  const usernames = users
    .map((u, i) => {
      const isBlocked = u.isBlocked;
      const name = u.username || u.firstName || u.lastName || "Unknown";
      const safeName = escapeMarkdownV2(name);
      return `${i + 1}. [${safeName}](tg://user?id=${u.chatId}) ${isBlocked ? "❌" : ""}`;
    })
    .join("\n");

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  // Create keyboard
  const keyboard = new InlineKeyboard();

  if (page > 0) keyboard.text("⬅️ Previous", `users_prev_${page - 1}`);
  if (page < totalPages - 1) keyboard.text("Next ➡️", `users_next_${page + 1}`);

  const message = `📄 *All Users (Page ${
    page + 1
  }/${totalPages}:${totalUsers})*\n\n${usernames}`;
  if (isEdited) {
    return await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
  await ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}

// Handle callback buttons
export const registerUserPagination = async (ctx) => {
  try {
    const [, , pageStr] = ctx.match;
    const page = parseInt(pageStr);
    const totalUsers = await User.countDocuments();

    await ctx.answerCallbackQuery();
    await userListPage(ctx, page, totalUsers, true);
  } catch (err) {
    console.error("❌ Pagination error:", err);
    await ctx.answerCallbackQuery({
      text: "Error loading page",
      show_alert: true,
    });
  }
};

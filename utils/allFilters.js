import { Filter } from "../db/models.js";

import { InlineKeyboard } from "grammy";

const ITEMS_PER_PAGE = 20;

// In-memory pagination state (keyed by user ID)
const userPages = new Map();

const allFilters = async (ctx) => {
  try {
    const totalFilters = await Filter.countDocuments();
    if (totalFilters === 0) {
      return ctx.reply("No filters found.");
    }

    const page = 0; // start from first page
    await sendFilterPage(ctx, page, totalFilters);

  } catch (error) {
    console.error("❌ Error in allFilters:", error);
    ctx.reply("Error fetching filters.");
  }
};

// Helper function to show a given page
async function sendFilterPage(ctx, page, totalFilters, isEdited = false) {
  const skip = page * ITEMS_PER_PAGE;

  const filters = await Filter.find()  
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(ITEMS_PER_PAGE);

  const filterNames = filters.map((f) => f.name).join("\n- ");
  const totalPages = Math.ceil(totalFilters / ITEMS_PER_PAGE);

  // Create keyboard
  const keyboard = new InlineKeyboard();

  if (page > 0) keyboard.text("⬅️ Previous", `filters_prev_${page - 1}`);
  if (page < totalPages - 1) keyboard.text("Next ➡️", `filters_next_${page + 1}`);

  // Save current page for this user
  userPages.set(ctx.from.id, page);
  

  const message = `📄 *All Filters (Page ${page + 1}/${totalPages}:${totalFilters})*\n\n- ${filterNames}`;
  if(isEdited){
    return await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }) 
  }
  await ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: keyboard, 
  });
}

// Handle callback buttons
export const registerFilterPagination =  async (ctx) => {
    try {
      const [, , pageStr] = ctx.match;
      const page = parseInt(pageStr);
      const totalFilters = await Filter.countDocuments();

      // await ctx.editMessageText(
      //   "Loading filters...",
      //   { reply_markup: undefined }
      // );
      await ctx.answerCallbackQuery();
      await sendFilterPage(ctx, page, totalFilters, true);

    } catch (err) {
      console.error("❌ Pagination error:", err);
      await ctx.answerCallbackQuery({ text: "Error loading page", show_alert: true });
    }
  }

  
export {  allFilters };
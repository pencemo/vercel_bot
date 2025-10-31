import { isAdmin, isPrivateChat } from "../Helpers/isAdmin.js";
import { Filter } from "../db/models.js";
import { addMarkdownFormatting, escapeMarkdownSpecialChars, escapeRegex, extractData } from "../Helpers/helpers.js";

const addFilters = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    if (!isPrivateChat(ctx)) return; 
    return ctx.reply("🚫 Sorry, this feature is only available to admins.");
}
  try {
  const replayText = ctx.message.reply_to_message;
  if (!replayText) {
    return ctx.reply("Reply to a message to add filter");
  }
  if (replayText.text.length > 4096) {
    return ctx.reply("Message is too long");
  }
  if(!replayText.text) {
    return ctx.reply("Message is empty");
  }
    const { text } = ctx.message;
    const data = extractData(text);
    if(data.name.length == 0) {
      return ctx.reply("Send a valid filter name");
    }
    
    
    const isFilter = await Filter.findOne({
      name: {
        $in: data.name.map((n) => new RegExp(`^${escapeRegex(n)}$`, "i")),
      },
    });
    const exist = data.name.filter((name) => isFilter?.name?.includes(name)).join(", ");
    if (isFilter) {
      return ctx.reply("Filter name is already exists : "+exist);
    }
    const contant = await addMarkdownFormatting(replayText.text, replayText.entities)

    const isContent = await Filter.findOne({ contant });
    if (isContent) {
      isContent.name.push(...data.name);
      isContent.buttons.push(...data.buttons);
      await isContent.save();
      return ctx.reply(`Added filters for - ${data.name.join(", ")}`);
    }
    const filter = new Filter({
      ...data,
      contant: await addMarkdownFormatting(
        replayText.text,
        replayText.entities
      ),
    });
    filter.save();
    ctx.reply(`Added filters for - ${data.name.join(", ")}`);
  } catch (error) {
    console.log(error);
    ctx.reply("Error adding filter");
  }
};


function escapeMarkdownV2(text) { 
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}


const findFilter = async (ctx) => {
  const text = (ctx.message?.text || "").trim();
  if (!text) return ctx.reply("Message is empty");

  const repId = ctx.message.reply_to_message
    ? ctx.message.reply_to_message.message_id
    : ctx.message.message_id;

  try {
    const allFilters = await Filter.find({}, { name: 1, contant: 1, buttons: 1 }).lean();

    if (!allFilters || allFilters.length === 0) {
      return ctx.reply("No filters available");
    }

    let matchedFilter = null;

    // loop over all filters
    for (const f of allFilters) {
      if (!Array.isArray(f.name)) continue;

      for (const name of f.name) {
        if (!name) continue;

        const escapedName = escapeRegex(String(name).trim());
        // Match words or surrounded by punctuation/spaces (case insensitive, unicode)
        const pattern = new RegExp(
          `(^|\\s|[\\p{P}\\p{S}])${escapedName}($|\\s|[\\p{P}\\p{S}])`,
          "iu"
        );

        if (pattern.test(text)) {
          matchedFilter = f;
          break; // stop checking more names for this filter
        }
      }

      if (matchedFilter) break; // stop checking other filters
    }

    if (!matchedFilter) {
      return 
    }

    // validate content
    const content = matchedFilter.contant || "";
    if (!content) return ctx.reply("Message is empty");
    if (content.length > 4096) return ctx.reply("Message is too long");

    // prepare buttons
    const replyMarkup =
      Array.isArray(matchedFilter.buttons) && matchedFilter.buttons.length > 0
        ? { inline_keyboard: matchedFilter.buttons }
        : undefined;

    // escape markdown and reply
    const safeText = escapeMarkdownV2(content);

    return ctx.reply(safeText, {
      reply_markup: replyMarkup,
      reply_to_message_id: repId,
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    console.error("Error in findFilter:", error);
    return ctx.reply("Error while finding filter");
  }
};


 
const deleteFilter = async (ctx) => {
  const text = ctx.message.text;
  if (!isAdmin(ctx.from.id)) {
    if (!isPrivateChat(ctx)) return; 
    return ctx.reply("🚫 Sorry, this feature is only available to admins.");
}

  try {
    const filterKey = extractData(text);

    if (!filterKey.name || filterKey.name.length === 0) {
      return ctx.reply("⚠️ Send a valid filter name");
    }

    // Create case-insensitive regex for each name
    const regexArray = filterKey.name.map((n) => {
      const pattern = new RegExp(`^${escapeRegex(n.trim())}$`, "i");
      return pattern;
    });

    // Perform deleteMany (case-insensitive)
    const deleted = await Filter.deleteMany({
      name: { $in: regexArray },
    });

    if (deleted.deletedCount === 0) {
      return ctx.reply(`⚠️ Filter - ${filterKey.name.join(", ")} not found`);
    }

    return ctx.reply(`🗑️  Deleted filter(s): ${filterKey.name.join(", ")}`);

  } catch (error) {
    console.error("❌ Error in deleteFilter:", error);
    return ctx.reply("An error occurred while deleting filter(s).");
  }
};

const removeFilter = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    if (!isPrivateChat(ctx)) return; 
    return ctx.reply("🚫 Sorry, this feature is only available to admins.");
}
  const text = ctx.message.text.replace(/\/rmv /, "");
  try{
    const filter = await Filter.findOne({
      name: { $regex: new RegExp(`^${text}$`, "i") },
    });
    if (!filter) {
      return ctx.reply("Filter not found");
    }
    if(filter.name.length == 1) {
      return ctx.reply("Only one filter exist, use /del to delete filter");
    }
    filter.name = filter.name.filter((name) => name !== text);
    await filter.save();
    ctx.reply(`Removed filter - ${text}`);
  }catch (error) {
    console.log(error);
    ctx.reply("Error removing filter");
  }
}


export { addFilters, findFilter, deleteFilter, removeFilter };

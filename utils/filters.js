import { Filter } from "../db/models.js";
import { addMarkdownFormatting, extractData } from "./helpers.js";

const addFilters = async (ctx) => {
  if (ctx.chat.type != "private") {
    return ctx.reply("This command only works in supergroups");
  }
  const replayText = ctx.message.reply_to_message;
  if (!replayText) {
    return ctx.reply("Reply to a message to add filter");
  }
  try {
    const { text } = ctx.message;
    const data = extractData(text);
    const isFilter = await Filter.findOne({ name: { $all: data.name } });
    if (isFilter) {
      return ctx.reply("Filter already exists");
    }
    const filter = new Filter({
      ...data,
      contant: await addMarkdownFormatting(
        replayText.text,
        replayText.entities
      ),
    });
    filter.save();
    ctx.reply(`Added `);
  } catch (error) {
    console.log(error);
    ctx.reply("Error adding filter");
  }
};

const findFilter = async (ctx) => {
  const { text } = ctx.message;
  const repId = ctx.message.reply_to_message
    ? ctx.message.reply_to_message.message_id
    : ctx.message.message_id;

  const oneFilter = await Filter.findOne({ name: { $in: text } });
  if (oneFilter) {
    return ctx.reply(oneFilter.contant, {
      reply_markup: { inline_keyboard: oneFilter.buttons },
      reply_to_message_id: repId,
      parse_mode: "MarkdownV2",
    });
  }
};

export { addFilters, findFilter };

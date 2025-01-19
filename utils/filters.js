import { Filter } from "../db/models.js";
import { addMarkdownFormatting, extractData } from "./helpers.js";

const addFilters = async (ctx) => {
  if (ctx.chat.type != "private") {
    return ctx.reply("This command only works in private chat");
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
    ctx.reply(`Added filters for - ${data.name.join(", ")}`);
  } catch (error) {
    console.log(error);
    ctx.reply("Error adding filter");
  }
};

const findFilter = async (ctx) => {
  const text = ctx.message.text;
  const repId = ctx.message.reply_to_message
    ? ctx.message.reply_to_message.message_id
    : ctx.message.message_id;

  try {
    
    const oneFilter = await Filter.findOne({ name: { $in: text } });
    
    if (oneFilter) {
      
      const replyMarkup = oneFilter.buttons.length > 0
        ? { inline_keyboard: oneFilter.buttons }
        : { inline_keyboard: null };

      // Log the replyMarkup before sending the message
      if(oneFilter.contant.length > 4096) { 
        return ctx.reply("Message is too long");
      } 
      if(!oneFilter.contant) {
        return ctx.reply("Message is empty");
      }
      return ctx.reply(oneFilter.contant, { 
        reply_markup: replyMarkup, 
        reply_to_message_id: repId,
        parse_mode: "MarkdownV2",
      });
    }
  } catch (error) {
    console.error("Error in findFilter:", error); // Handle any errors
  }
};


export { addFilters, findFilter };
 
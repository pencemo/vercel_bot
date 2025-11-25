import { InlineKeyboard } from "grammy";
import convertToAscii from "./converter.js";

export const convertCommand = async (ctx) => {
  const text = (ctx.msg?.text || "").trim();
  var asciiArray = convertToAscii(text);
  let asciiText = "";
  asciiArray.map((item) => {
    asciiText += item.chunk;
  });

  if (!asciiText) return ctx.reply("Please enter a valid text");
  if (asciiText.length > 4000) return ctx.reply("Text too long");

  const keyboard = new InlineKeyboard()
    .copyText("Copy Text 📋", asciiText)
    .row()
    .copyText("MLKV & Apple", asciiText?.replace(/ï/g, "@"))
    .copyText("Scribe", asciiText?.replace(/ï/g, ">"));

  await ctx.reply(
    `${asciiText}\n\nUse the buttons below to convert to another fonts 👇👇`,
    {
      reply_markup: keyboard,
    }
  );
};

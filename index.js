import { Bot } from "grammy";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { connection } from "./db/connection.js";
import { Filter } from "./db/models.js";
import { addMarkdownFormatting, extractData } from "./utils/helpers.js";
import { markdownv2 as format } from "telegram-format";
import { addFilters, findFilter } from "./utils/filters.js";
dotenv.config();

const token = process.env.BOT_TOKEN;
const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Create a bot object
const bot = new Bot(token);

app.post("/api/webhook", async (req, res) => {
  await bot.init();
  const update = req.body;
  try {
    await bot.handleUpdate(update);
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling webhook update:", error);
    res.status(500).send("Internal Server Error");
  }
});

const start = async () => {
  const url = `${process.env.WEBHOOK_URL}/api/webhook`;
  try {
    if (process.env.NODE_ENV !== "development") {
      await bot.api.setWebhook(url);
      console.log("New webhook set successfully at:", url);
    } else {
      console.log("Starting bot in development mode...");
      bot.start();
    }
  } catch (error) {
    console.error("Error setting webhook or starting bot:", error);
  }
};

bot.use((ctx, next) => {
  const groupId = process.env.GROUP_ID;
  const admin = process.env.ADMIN_ID;

  if (ctx.chat.type === "private" && ctx.from.id != admin) {
    return ctx.reply("You are not authorized to use this bot");
  }
  if (ctx.chat.type !== "private" && ctx.chat.id != groupId) {
    return ctx.reply("You are not authorized to use this bot");
  }

  return next();
});

bot.command("add", addFilters);  
bot.command("start", (ctx) => ctx.reply("Welcome to the bot"));

bot.command("msg", (ctx) => {
  const str = ctx.message.text;
  const data = extractData(str);
  ctx.reply(
    `Filters: ${data.name.join(", ")}\n`,
    {
      reply_markup: {
        inline_keyboard: data.buttons,
      },
    }
  );
}); 

bot.on("message:text", findFilter);

bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx.reply("An error occurred");
});

start();
connection()
// Vercel serverless function export
export default app;

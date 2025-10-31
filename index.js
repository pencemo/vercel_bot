import { Api, Bot } from "grammy";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { connection } from "./db/connection.js";
import { addFilters, deleteFilter, findFilter, removeFilter } from "./utils/filters.js";
import { allFilters, registerFilterPagination } from "./utils/allFilters.js";
import { startMsg } from "./utils/Start.js";
import { batchCommand, doneCommand, fileSave } from "./utils/Batch.js";
import { ADMIN_ID, BOT_TOKEN, GROUP_ID, SUB_CHANNEL_ID } from "./config.js";
import User from "./db/User.js";
import { forceSub, userMiddleWare } from "./utils/middleware.js";
import Batch from "./db/Batch.js";
import File from "./db/File.js";
import { callBackMsg, refresh } from "./utils/callbacks.js";
dotenv.config();

const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Create a bot object 
const bot = new Bot(BOT_TOKEN);
export const api = new Api(BOT_TOKEN);

app.post("/webhook", async (req, res) => {
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
  const url = `${process.env.WEBHOOK_URL}/webhook`;
  try {
    if (process.env.NODE_ENV !== "development") {
      app.listen(port, () => {console.log(port);})
      await bot.api.setWebhook(url);
      console.log("New webhook :", url);
    } else {
      console.log("Starting bot in development mode...");
      bot.start();
    }
  } catch (error) {
    console.error("Error setting webhook or starting bot:", error);
  }
};

bot.use(userMiddleWare);


// bot.use(forceSub)

bot.command("add", addFilters);  
bot.command("del", deleteFilter);  
bot.command("rmv", removeFilter);  
bot.command("filters", allFilters);  
bot.command("start", startMsg);
bot.command("batch", batchCommand);
bot.command("done", doneCommand);
bot.command("id", (ctx) => ctx.reply("Your ID : "+ctx.from.id));
bot.command("ping", (ctx) => ctx.reply("pong"));
// bot.command("help", (ctx)=>{
//   ctx.reply("This is help Command", {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: "Help", callback_data: "help" }]
//       ]
//     }
//   })
// });

bot.on("message:text", findFilter);
bot.on(["message:document", "message:photo", "message:video"], fileSave);

bot.callbackQuery(/^filters_(next|prev)_(\d+)$/, registerFilterPagination);
bot.callbackQuery(/^refresh_(.+)$/, refresh);
bot.on("callback_query:data", callBackMsg)

bot.catch(async (err) => {
  const ctx = err.ctx;
  console.error("Bot error:", err.message);
  await ctx.reply("An error occurred", err.message);
});
 
start();
connection()


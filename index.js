import { Api, Bot } from "grammy";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { connection } from "./db/connection.js";
import { addFilters, deleteFilter, findFilter, removeFilter } from "./utils/filters.js";
import { allFilters, registerFilterPagination } from "./utils/allFilters.js";
import { startMsg } from "./utils/Start.js";
import { batchCommand, deleteBatch, deleteLink, doneCommand, fileSave } from "./utils/Batch.js";
import { BOT_TOKEN } from "./config.js";
import { userMiddleWare } from "./utils/middleware.js";
import { callBackMsg, refresh } from "./utils/callbacks.js";
import { helpCommand, aboutCommand, banUser, unbanUser, toAdmin, delBatchAll, delFileAll, delFiltersAll, banUsersList } from "./utils/commands.js";
dotenv.config();

const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Create a bot object 
export const bot = new Bot(BOT_TOKEN);
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

bot.command("start", startMsg);
bot.chatType("private").command("add", addFilters);
bot.chatType("private").command("del", deleteFilter);  
bot.chatType("private").command("rmv", removeFilter);  
bot.chatType("private").command("dellink", deleteLink);
bot.chatType("private").command("delallbatch", delBatchAll);
bot.chatType("private").command("delallfile", delFileAll);
bot.chatType("private").command("delfiter", delFiltersAll);
bot.chatType("private").command("batch", batchCommand);
bot.chatType("private").command("delbatch", deleteBatch);
bot.chatType("private").command("done", doneCommand);
bot.chatType("private").command("ban", banUser);
bot.chatType("private").command("unban", unbanUser);
bot.chatType("private").command("banlist", banUsersList);
bot.command("filters", allFilters);

bot.chatType("private").command("about", aboutCommand);
bot.chatType("private").command("help", helpCommand);
bot.chatType("private").command("toadmin", toAdmin);
bot.command("id", (ctx) => ctx.reply("Your ID : "+ctx.from.id));
bot.command("ping", (ctx) => ctx.reply("pong"));

bot.on(["message:text", "edited_message:text"], findFilter);
bot.chatType("private").on(["message:document", "message:photo", "message:video"], fileSave);

bot.callbackQuery(/^filters_(next|prev)_(\d+)$/, registerFilterPagination);
bot.callbackQuery(/^refresh_(.+)$/, refresh);
bot.on("callback_query:data", callBackMsg)

bot.catch(async (err) => {
  const ctx = err.ctx;
  console.error("Bot error:", err);
  await ctx.reply("An error occurred 😥");
});

// bot.command("file", (ctx) => ctx.replyWithDocument("BQACAgUAAxkBAAIIGmkErVggOPcUYBvjUvWejgt9ZLwkAAJXGQACBdsoVNWVjztMV9AnNgQ"));
// bot.on("message:file", (ctx)=>{
//   console.log(ctx.message);
//   if(ctx){
//     ctx.reply(ctx.message.document.file_id);
//   }
// })

start();
connection()

// export default webhookCallback(bot, "vercel");


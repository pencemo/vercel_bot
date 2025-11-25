import { Api, Bot } from "grammy";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { connection } from "./db/connection.js";
import { addFilters, deleteFilter, findFilter, removeFilter } from "./utils/filters.js";
import { allFilters, registerFilterPagination } from "./utils/allFilters.js";
import { startMsg } from "./utils/Start.js";
import { batchCommand, deleteBatch, deleteLink, doneCommand, fileSave, getLink, updateBatch } from "./utils/Batch.js";
import { BOT_TOKEN } from "./config.js";
import { userMiddleWare } from "./utils/middleware.js";
import { callBackMsg, refresh } from "./utils/callbacks.js";
import { helpCommand, aboutCommand, banUser, unbanUser, toAdmin, delBatchAll, delFileAll, delFiltersAll, banUsersList, getId, toUsr } from "./utils/commands.js";
import { qrCallback, qrcode } from "./utils/Qrcode.js";
import { broadcast, broadcastCallback } from "./utils/broadcast.js";
import { settingsCommand, settingsMenu } from "./utils/Settings.js";
import { allUsers, registerUserPagination } from "./utils/userList.js";
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
bot.use(settingsMenu);

bot.command("start", startMsg);
bot.chatType("private").command("add", addFilters);
bot.chatType("private").command("del", deleteFilter);  
bot.chatType("private").command("rmv", removeFilter);  
bot.chatType("private").command("dellink", deleteLink);
bot.chatType("private").command("delallbatch", delBatchAll);
bot.chatType("private").command("delallfile", delFileAll);
bot.chatType("private").command("delfiter", delFiltersAll);
bot.chatType("private").command("link", getLink);
bot.chatType("private").command("batch", batchCommand);
bot.chatType("private").command("delbatch", deleteBatch);
bot.chatType("private").command("addtobatch", updateBatch);
bot.chatType("private").command("done", doneCommand);
bot.chatType("private").command("ban", banUser);
bot.chatType("private").command("unban", unbanUser);
bot.chatType("private").command("banlist", banUsersList);
bot.chatType("private").command("userlist", allUsers);
bot.command("filters", allFilters);

bot.chatType("private").command("about", aboutCommand);
bot.chatType("private").command("help", helpCommand);
bot.chatType("private").command("toadmin", toAdmin);
bot.chatType("private").command("touser", toUsr);
bot.chatType("private").command("broadcast", broadcast);
bot.chatType("private").command("qrcode", qrcode)
bot.chatType("private").command("settings", settingsCommand)
bot.command("id", getId);
bot.command("ping", (ctx) => ctx.reply("pong"));

bot.on(["message:text", "edited_message:text"], findFilter);
bot.on(["message:document", "message:video"], fileSave); 

bot.callbackQuery(/^filters_(next|prev)_(\d+)$/, registerFilterPagination); 
bot.callbackQuery(/users_page_/, registerUserPagination); 
bot.callbackQuery(/^qr:(png|jpg|svg)$/, qrCallback); 
bot.callbackQuery(["bc:confirm", "bc:cancel"], broadcastCallback); 
bot.callbackQuery(/^refresh_(.+)$/, refresh);
bot.on("callback_query:data", callBackMsg)

bot.catch(async (err) => {
  const ctx = err.ctx;
  console.error("Bot error:", err);
  await ctx.reply("An error occurred 😥");
});

// bot.on("message:document", async (ctx) => {
//   console.log(ctx.message); // check what you get here

//   const doc = ctx.message.document;
//   if (!doc) return; // safety, but normally not needed for this filter

//   await ctx.replyWithDocument(doc.file_id);
// });

// bot.on("message:photo", async (ctx) => {
//   console.log(ctx.message);

//   const photos = ctx.message.photo;      // PhotoSize[]
//   const largestPhoto = photos.at(-1);
//   const fileId = largestPhoto.file_id;

//   await ctx.replyWithPhoto(fileId);
// });


start();
connection()



import { Bot } from "grammy";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.BOT_TOKEN;
const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Create a bot object
const bot = new Bot(token);

// const update = async () => {
// }
// update()
app.post("/webhook", async (req, res) => {
  await bot.init()
  const update = req.body;
  try {
    await bot.handleUpdate(update);
    res.send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

const start = async () => {
  // await bot.init()
  const url = `${process.env.WEBHOOK_URL}/webhook`;
  if (process.env.NODE_ENV !== "development") {
    try {
        // First, delete any existing webhook
        // await bot.api.deleteWebhook();
        // console.log("Previous webhook deleted");
        // Now set the new webhook
        await bot.api.setWebhook(url);
        console.log("New webhook set successfully");
  
      } catch (error) {
        console.error("Error setting webhook:", error);
      }
  }
};


bot.use((ctx, next) => {
  const admin = process.env.ADMIN_ID;
  if (!admin) {
    return ctx.reply("Admin ID is not set.");
  }
  if (ctx.from.id != admin) {
    return ctx.reply("You are not authorized to use this bot.");
  }
  return next();
});

bot.command("start", (ctx) => ctx.reply("Welcome to the bot!"));


start();
// bot.start();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
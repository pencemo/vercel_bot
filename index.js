import { Bot } from "grammy";
import express from "express"
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.BOT_TOKEN
const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Create a bot object
const bot = new Bot(token);
// bot.init()  

app.post('/webhook', async (req, res) => {
    const update = req.body;
    try {
      await bot.handleUpdate(update);
      res.send('OK');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

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

// bot.use((ctx, next) => {
//     console.log(`Received message from ${ctx.from.first_name}: ${ctx.message.text}`);
//     return next();
// })

bot.command("start", (ctx) => ctx.reply("Welcome to the bot!"));


// Setup a webhook
// export default async (req, res) => {
//     if (req.method === 'POST') {
//       const update = req.body;
//       await bot.init()
//       await bot.handleUpdate(update);
//       res.status(200).send('OK');
//     } else {
//       res.status(405).send('Method Not Allowed');
//     }
//   };

const start = async () => {
    const url = `${process.env.WEBHOOK_URL}/webhook`;
  if (process.env.NODE_ENV !== "development") {
    try {
        await bot.api.setWebhook(url);
        console.log("Bot is running");
      } catch (error) {
        console.error("Error setting webhook:", error);
      }
  }
}

start();
bot.start();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
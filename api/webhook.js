import { bot } from "../index.js";

export default async function handler(req, res) {
    if (req.method === "POST") {
      try {
        await bot.handleUpdate(req.body);
        res.status(200).send("OK");
      } catch (err) {
        console.error("Error handling update:", err);
        res.status(500).send("Internal Server Error");
      }
    } else {
      res.status(200).send("Bot is live!");
    }
  }
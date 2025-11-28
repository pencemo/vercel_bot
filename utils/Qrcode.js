import { InlineKeyboard, InputFile } from "grammy";
import QRCode from "qrcode";
import { forceSub } from "./middleware.js";
const userQrText = new Map(); // Map<userId, text>
// cooldown store
const userLastQr = new Map(); // Map<userId, timestamp>

const COOLDOWN_MS = 5 * 60_000; // 5 min limit per QR

// /qrcode [text]
// OR reply to a message with /qrcode
export const qrcode =  async (ctx) => {
  if(!await forceSub(ctx)) return;
    const userId = ctx.from.id;
    const now = Date.now();
    const last = userLastQr.get(userId) ?? 0; 
    const diff = now - last;
  
    if (diff < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - diff) / 1000);
      const minutes = Math.floor(waitSec / 60);
        const seconds = waitSec % 60;
        const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      await ctx.reply(`Please wait ${formatted}s before creating another QR.`);
      return;
    }

  const replied = ctx.message?.reply_to_message;
  let text = "";

  // 1) if command is reply → use replied text
  if (replied?.text) {
    text = replied.text.trim();
  } else {
    // 2) else use text after command
    const raw = ctx.match?.trim();
    if (raw) text = raw;
  }

  if (!text) {
    return ctx.reply(
      "How to use:\n" +
      "• Reply to a message and send /qrcode\n" +
      "• Or: /qrcode Your text here\n\n" +
      "Then choose the format (PNG/JPG/SVG)."
    );
  }

  // Save text for this user
  userQrText.set(ctx.from.id, text);

  // Inline buttons for format
  const keyboard = new InlineKeyboard()
    .text("PNG 🖼️", "qr:png")
    .text("SVG 📄", "qr:svg");

  await ctx.reply(
    "Choose QR code format for this text:\n\n" +
      `\`${text.slice(0, 80)}${text.length > 80 ? "..." : ""}\``,
    {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    }
  );
};

// Handle button clicks
export const qrCallback = async (ctx) => {
  const format = ctx.match[1]; // png | jpg | svg
  const userId = ctx.from.id;
  const text = userQrText.get(userId);

  const now = Date.now();
  const last = userLastQr.get(userId) ?? 0;
  const diff = now - last;

  if (diff < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - diff) / 1000);
      const minutes = Math.floor(waitSec / 60);
        const seconds = waitSec % 60;
        const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    await ctx.answerCallbackQuery({
      text: `Please wait ${formatted}s before creating another QR.`,
      show_alert: true,
    });
    return;
  }

  if (!text) {
    await ctx.answerCallbackQuery({
      text: "No text found. Send /qrcode again.",
      show_alert: true,
    });
    return;
  }

  // ----- cooldown check -----
  

  // update last time
  userLastQr.set(userId, now);
  await ctx.answerCallbackQuery(); // remove "loading" on button
  try {
      if (format === "svg") {
          // SVG output
        await ctx.editMessageText("Your svg is redy 🎉")
      const svgString = await QRCode.toString(text, {
        type: "svg",
        margin: 2,
        scale: 6,
      });

      const svgBuffer = Buffer.from(svgString, "utf8");

      await ctx.replyWithDocument(
        new InputFile(svgBuffer, "qrcode.svg")
      );
      return;
    }

    // PNG buffer
    const pngBuffer = await QRCode.toBuffer(text, {
      type: "png",
      margin: 2,
      scale: 8,
    });

    if (format === "png") {
        await ctx.editMessageText("Your png is redy 🎉")
      await ctx.replyWithDocument(
        new InputFile(pngBuffer, "qrcode.png")
      );
    } 
  } catch (err) {
    console.error("QR error:", err);
    await ctx.reply("Failed to generate QR code. Please try again.");
  }
};
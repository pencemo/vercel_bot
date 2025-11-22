import User from "../db/User.js";
import { Menu, MenuRange } from "@grammyjs/menu";

const settingsMenu = new Menu("settings-menu").dynamic(async (ctx) => {
  const user = await User.findOne({ chatId: ctx.from.id });
  const range = new MenuRange();

  if (!user) {
    range.text("You are not registered");
    return range;
  }

  const isFilter = user.mode === "filter";
  const isConverter = user.mode === "converter";

  range
    .text(
      isFilter ? "✅ Mode: Filter" : "Mode: Filter",
      async (ctx) => {
        // if already filter, do nothing (or show toast)
        if (isFilter) {
          await ctx.answerCallbackQuery({
            text: "Already in Filter mode.",
            show_alert: false,
          });
          return;
        }

        await User.updateOne(
          { chatId: ctx.from.id },
          { $set: { mode: "filter" } }
        );

        try {
           ctx.menu.update();
        } catch (err) {
          // ignore 'message is not modified' just in case
          if (
            !String(err.description || "").includes("message is not modified")
          ) {
            throw err;
          }
        }
      }
    )
    .row()
    .text(
      isConverter ? "✅ Mode: Converter" : "Mode: Converter",
      async (ctx) => {
        if (isConverter) {
          await ctx.answerCallbackQuery({
            text: "Already in Converter mode.",
            show_alert: false,
          });
          return;
        }

        await User.updateOne(
          { chatId: ctx.from.id },
          { $set: { mode: "converter" } }
        );

        try {
           ctx.menu.update();
        } catch (err) {
          if (
            !String(err.description || "").includes("message is not modified")
          ) {
            throw err;
          }
        }
      }
    );

  return range;
});


   const settingsCommand = async (ctx) => {
    const user = await User.findOne({ chatId: ctx.from.id });
  
    if (!user) {
      return ctx.reply("You are not registered");
    }
  
    return ctx.reply("⚙️ Settings\n\nChoose your mode:\n\n*Filter :* Get filter in pm\n*Converter :* Unicode to ASSCI", {
      reply_markup: settingsMenu,
      parse_mode: "MarkdownV2",
    });
  };

export {settingsCommand, settingsMenu}
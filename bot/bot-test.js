// Simple test for Telegram bot
const { Telegraf } = require("telegraf");
require("dotenv").config();

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
console.log(`Using bot token: ${token ? token.substring(0, 8) + "..." : "NOT FOUND"}`);

// Create bot instance
const bot = new Telegraf(token);

// Command handlers
bot.start((ctx) => {
  console.log("Received /start command");
  return ctx.reply("Hello! I am the SocialBoost Campaign Bot. I help coordinate social media campaigns and reward participants.");
});

bot.help((ctx) => {
  return ctx.reply(
    "Available commands:\\n" +
    "/start - Start the bot\\n" +
    "/help - Display this help message\\n" +
    "/status - Check bot status\\n" +
    "/link - Link social media accounts\\n" +
    "/campaigns - View available campaigns"
  );
});

bot.command("status", (ctx) => {
  return ctx.reply("Bot is operational ✅");
});

// Default handler for messages
bot.on("text", (ctx) => {
  console.log(`Received message: ${ctx.message.text}`);
  return ctx.reply("I received your message. Use /help to see available commands.");
});

// Launch bot
console.log("Starting bot...");
bot.launch()
  .then(() => {
    console.log("✅ Bot started successfully!");
    console.log(`Bot username: @${bot.botInfo.username}`);
  })
  .catch((error) => {
    console.error("❌ Error starting bot:", error);
  });

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

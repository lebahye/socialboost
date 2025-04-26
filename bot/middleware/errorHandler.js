
const errorHandler = async (err, ctx) => {
  console.error(`Error in bot update ${ctx.update.update_id}:`, err);
  
  if (err.code === 403) {
    console.log(`User ${ctx.from?.id} has blocked the bot`);
    return;
  }
  
  if (err.message.includes('database') || err.message.includes('sql')) {
    await ctx.reply('A database error occurred. Please try again.');
    return;
  }
  
  await ctx.reply('An error occurred. Please try again or contact support.')
    .catch(console.error);
};

module.exports = errorHandler;

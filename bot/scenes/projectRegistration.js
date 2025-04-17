const { Scenes } = require('telegraf');
const Project = require('../models/Project');

const projectRegistrationScene = new Scenes.WizardScene(
  'projectRegistration',
  // Step 1: Ask for project name
  async (ctx) => {
    await ctx.reply('Please enter a name for your project:');
    return ctx.wizard.next();
  },
  // Step 2: Get name and ask for description
  async (ctx) => {
    if (!ctx.message?.text) {
      await ctx.reply('Please provide a valid project name.');
      return;
    }
    ctx.wizard.state.projectData = {
      name: ctx.message.text,
      ownerId: ctx.from.id.toString()
    };
    await ctx.reply('Great! Now please provide a brief description of your project:');
    return ctx.wizard.next();
  },
  // Step 3: Save project
  async (ctx) => {
    if (!ctx.message?.text) {
      await ctx.reply('Please provide a valid description.');
      return;
    }

    try {
      ctx.wizard.state.projectData.description = ctx.message.text;
      const project = await Project.save(ctx.wizard.state.projectData);

      await ctx.reply(
        `✅ Project created successfully!\n\n` +
        `*${project.name}*\n` +
        `${project.description}\n\n` +
        `Use /project to manage your projects.`,
        { parse_mode: 'Markdown' }
      );

      return ctx.scene.leave();
    } catch (error) {
      console.error('Error saving project:', error);
      await ctx.reply('Sorry, there was an error creating your project. Please try again.');
      return ctx.scene.leave();
    }
  }
);

module.exports = projectRegistrationScene;
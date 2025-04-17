
const { Scenes } = require('telegraf');
const Project = require('../models/Project');

const projectRegistrationScene = new Scenes.WizardScene(
  'projectRegistration',
  // Step 1: Ask for project name
  async (ctx) => {
    await ctx.reply(
      '🚀 *Project Registration - Step 1/3*\n\n' +
      'What would you like to name your project?\n\n' +
      'Please enter a clear, descriptive name (max 50 characters).',
      { parse_mode: 'Markdown' }
    );
    ctx.wizard.state.projectData = {};
    return ctx.wizard.next();
  },

  // Step 2: Get project name and ask for description
  async (ctx) => {
    const projectName = ctx.message.text.trim();

    if (projectName.length < 3 || projectName.length > 50) {
      await ctx.reply(
        '⚠️ Project name must be between 3 and 50 characters.\n\n' +
        'Please enter a valid project name:'
      );
      return;
    }

    ctx.wizard.state.projectData.name = projectName;

    await ctx.reply(
      '🚀 *Project Registration - Step 2/3*\n\n' +
      'Great! Now please provide a description for your project.\n\n' +
      'This will help users understand what your project is about.',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 3: Get description and ask for category
  async (ctx) => {
    const description = ctx.message.text.trim();

    if (description.length < 10 || description.length > 500) {
      await ctx.reply(
        '⚠️ Description must be between 10 and 500 characters.\n\n' +
        'Please enter a valid description:'
      );
      return;
    }

    ctx.wizard.state.projectData.description = description;

    await ctx.reply(
      '🚀 *Project Registration - Step 3/3*\n\n' +
      'Last step! Please select your project category:\n\n' +
      '1. DeFi\n' +
      '2. NFT\n' +
      '3. GameFi\n' +
      '4. Web3\n' +
      '5. Other\n\n' +
      'Reply with the number of your choice.',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 4: Finalize project creation
  async (ctx) => {
    const categoryMap = {
      '1': 'DeFi',
      '2': 'NFT',
      '3': 'GameFi',
      '4': 'Web3',
      '5': 'Other'
    };

    const categoryChoice = ctx.message.text.trim();
    const category = categoryMap[categoryChoice];

    if (!category) {
      await ctx.reply(
        '⚠️ Please select a valid category (1-5):'
      );
      return;
    }

    try {
      ctx.wizard.state.projectData.category = category;
      ctx.wizard.state.projectData.ownerId = ctx.from.id.toString();

      const project = await Project.create(ctx.wizard.state.projectData);

      await ctx.reply(
        '🎉 *Congratulations! Your project has been registered.*\n\n' +
        `*Name:* ${project.name}\n` +
        `*Category:* ${project.category}\n` +
        `*Free Campaigns:* ${project.subscription.campaignsRemaining}\n\n` +
        'You can now:\n' +
        '• Create campaigns with /newcampaign\n' +
        '• View your projects with /myprojects\n' +
        '• Manage this project with /project',
        { parse_mode: 'Markdown' }
      );

      return ctx.scene.leave();
    } catch (error) {
      console.error('Error creating project:', error);
      await ctx.reply('An error occurred while creating your project. Please try again.');
      return ctx.scene.leave();
    }
  }
);

module.exports = projectRegistrationScene;

const { Scenes } = require('telegraf');
const db = require('../db'); // Updated import
const Campaign = require('../models/Campaign');

const campaignScene = new Scenes.WizardScene(
  'campaignCreation',
  // Step 1: Campaign details
  async (ctx) => {
    try {
      ctx.scene.state.campaignData = ctx.scene.state.campaignData || {};
      ctx.session.campaignData = ctx.scene.state.campaignData;

      ctx.scene.state.checkpoint = 'details';
      await ctx.reply('Enter campaign name:');
      return ctx.wizard.next();
    } catch (error) {
      console.error('Campaign scene step 1 error:', error);
      await ctx.reply('An error occurred. Please try /start again.');
      return ctx.scene.leave();
    }
  },
  // Step 2: Handle name input
  async (ctx) => {
    try {
      if (!ctx.message?.text) {
        await ctx.reply('Please enter a valid campaign name:');
        return;
      }

      ctx.scene.state.campaignData.name = ctx.message.text;
      await ctx.reply('Enter campaign description:');
      return ctx.wizard.next();
    } catch (error) {
      console.error('Campaign scene step 2 error:', error);
      await ctx.reply('Error saving campaign name. Please try again.');
    }
  },
  // Step 3: Handle description input
  async (ctx) => {
    try {
      if (!ctx.message?.text) {
        await ctx.reply('Please enter a valid description:');
        return;
      }

      ctx.scene.state.campaignData.description = ctx.message.text;

      const campaign = await Campaign.create({
        name: ctx.scene.state.campaignData.name,
        description: ctx.scene.state.campaignData.description,
        createdBy: ctx.from.id.toString(),
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        projectId: ctx.scene.state.campaignData.projectId || null,
        projectName: ctx.scene.state.campaignData.projectName || 'Default Project',
        rewards: []
      });

      await ctx.reply('Campaign created successfully!');
      return ctx.scene.leave();
    } catch (error) {
      console.error('Campaign creation error:', error);
      await ctx.reply('Error creating campaign. Please try again.');
      return ctx.scene.leave();
    }
  }
);

// Add leave handler
campaignScene.leave((ctx) => {
  if (ctx.scene.state.completed) {
    ctx.session.lastCompletedCampaign = ctx.scene.state.campaignData;
  }
  delete ctx.scene.state;
});

module.exports = campaignScene;
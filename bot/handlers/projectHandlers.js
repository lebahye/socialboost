const Project = require('../models/Project');
const Campaign = require('../models/Campaign');

/**
 * Handler for creating a new project
 */
const newProjectHandler = async (ctx) => {
  // Begin the project registration scene
  return ctx.scene.enter('projectRegistration');
};

/**
 * Handler for listing all projects
 */
const listProjectsHandler = async (ctx) => {
  try {
    const projects = await Project.findByTelegramId(ctx.from.id.toString());

    if (!projects || projects.length === 0) {
      return ctx.reply('You don\'t have any projects yet. Use /newproject to create one.');
    }

    const projectList = await Promise.all(projects.map(async (project) => {
      const campaigns = await Campaign.find({ projectId: project.id });
      return `📂 *${project.name}*\n` +
             `Description: ${project.description}\n` +
             `Campaigns: ${campaigns.length}\n` +
             `Created: ${new Date(project.created_at).toLocaleDateString()}\n`;
    }));

    await ctx.replyWithMarkdown(
      '*Your Projects:*\n\n' + projectList.join('\n')
    );
  } catch (error) {
    console.error('Error in listProjectsHandler:', error);
    await ctx.reply('An error occurred while fetching your projects.');
  }
};

const manageProjectHandler = async (ctx) => {
  try {
    const projectId = ctx.message.text.split(' ')[1];
    if (!projectId) {
      return ctx.reply('Please provide a project ID: /project <id>');
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return ctx.reply('Project not found.');
    }

    if (project.owner_id !== ctx.from.id.toString()) {
      return ctx.reply('You don\'t have permission to manage this project.');
    }

    const campaigns = await Campaign.find({ projectId });

    const stats = {
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalParticipants: campaigns.reduce((sum, c) => sum + (c.participants || 0), 0),
      averageEngagement: campaigns.length ? 
        (campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length).toFixed(2) + '%' : 
        'N/A'
    };

    await ctx.replyWithMarkdown(
      `*Project: ${project.name}*\n\n` +
      `📊 *Statistics:*\n` +
      `Active Campaigns: ${stats.activeCampaigns}\n` +
      `Total Participants: ${stats.totalParticipants}\n` +
      `Average Engagement: ${stats.averageEngagement}\n\n` +
      `Use these commands to manage:\n` +
      `/newcampaign - Create new campaign\n` +
      `/campaigns - List all campaigns\n` +
      `/analytics ${projectId} - View detailed analytics`
    );
  } catch (error) {
    console.error('Error in manageProjectHandler:', error);
    await ctx.reply('An error occurred while managing the project.');
  }
};

module.exports = {
  newProjectHandler,
  listProjectsHandler,
  manageProjectHandler
};
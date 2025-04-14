const Project = require('../models/Project');
const User = require('../models/User');

/**
 * Handler for creating a new project
 */
const newProjectHandler = async (ctx) => {
  // Begin the project registration scene
  return ctx.scene.enter('projectRegistration');
};

/**
 * Handler for managing an existing project
 */
const manageProjectHandler = async (ctx) => {
  const userId = ctx.from.id.toString();

  try {
    // Find projects owned by this user
    const projects = await Project.find({ ownerId: userId });

    if (!projects || projects.length === 0) {
      return ctx.reply('You don\'t have any projects yet. Use /newproject to create one.');
    }

    // Parse project ID if provided
    const args = ctx.message.text.split(' ');

    if (args.length < 2) {
      // No project ID provided, list the user's projects
      const projectsList = projects.map((p, i) =>
        `${i+1}. ${p.name} (ID: ${p._id})`
      ).join('\n');

      return ctx.reply(
        'Your projects:\n\n' +
        projectsList +
        '\n\nTo manage a specific project, use "/project [ID]"'
      );
    }

    // Find the specific project
    const projectId = args[1];
    const project = await Project.findOne({
      _id: projectId,
      ownerId: userId
    });

    if (!project) {
      return ctx.reply('Project not found or you don\'t have permission to manage it.');
    }

    // Show project details and management options
    const message = `
Project: ${project.name}
Description: ${project.description}
Created: ${project.createdAt.toDateString()}
Website: ${project.website || 'Not set'}

What would you like to do with this project?
    `;

    return ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 Edit Details', callback_data: `edit_project_${project._id}` }],
          [{ text: '📊 View Analytics', callback_data: `project_analytics_${project._id}` }],
          [{ text: '📣 Create Campaign', callback_data: `create_campaign_${project._id}` }],
          [{ text: '🗂 Manage Campaigns', callback_data: `list_campaigns_${project._id}` }]
        ]
      }
    });

  } catch (error) {
    console.error('Error in manageProjectHandler:', error);
    return ctx.reply('An error occurred while managing your project. Please try again later.');
  }
};

/**
 * Handler for listing all projects
 */
const listProjectsHandler = async (ctx) => {
  const userId = ctx.from.id.toString();

  try {
    const projects = await Project.find({ ownerId: userId });

    if (!projects || projects.length === 0) {
      return ctx.reply('You don\'t have any projects yet. Use /newproject to create one.');
    }

    const projectsList = projects.map((p, i) => {
      const campaignCount = p.campaigns ? p.campaigns.length : 0;
      return `${i+1}. ${p.name}\n   Campaigns: ${campaignCount}\n   ID: ${p._id}`;
    }).join('\n\n');

    return ctx.reply(
      '📋 Your Projects:\n\n' +
      projectsList +
      '\n\nTo manage a project, use "/project [ID]"'
    );

  } catch (error) {
    console.error('Error in listProjectsHandler:', error);
    return ctx.reply('An error occurred while listing your projects. Please try again later.');
  }
};

module.exports = {
  newProjectHandler,
  manageProjectHandler,
  listProjectsHandler
};

const { Composer } = require('telegraf');
const { Pool } = require('pg');
const Project = require('../models/Project');
const Campaign = require('../models/Campaign');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


/**
 * Handler for creating a new project
 */
async function createProject(ctx) {
  try {
    const { name, description, category } = ctx.session.projectData;
    const ownerId = ctx.from.id.toString();

    const client = await pool.connect();
    try {
      const res = await client.query(
        'INSERT INTO projects (name, description, owner_id, category) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, ownerId, category]
      );
      const project = res.rows[0];

      if (project) {
        // Update user as project owner
        await client.query(
          'UPDATE users SET is_project_owner = true WHERE telegram_id = $1',
          [ownerId]
        );

        await ctx.reply('🎉 Congratulations! Your project has been registered.\n\n' +
          `Name: ${name}\n` +
          `Category: ${category}\n` +
          'Free Campaigns: 3\n\n' +
          'You can now:\n' +
          '• Create campaigns with /newcampaign\n' +
          '• View your projects with /myprojects\n' +
          '• Manage this project with /project');
      } else {
        throw new Error('Project creation failed');
      }
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating project:', error);
    await ctx.reply('Sorry, there was an error creating your project. Please try again.');
  }
}

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
    const client = await pool.connect();
    try {
      const { rows: projects } = await client.query(
        'SELECT * FROM projects WHERE owner_id = $1',
        [ctx.from.id.toString()]
      );

      if (!projects || projects.length === 0) {
        return ctx.reply('You don\'t have any projects yet. Use /newproject to create one.');
      }

      const projectList = await Promise.all(projects.map(async (project) => {
        const { rows: campaigns } = await client.query(
          'SELECT * FROM campaigns WHERE project_id = $1',
          [project.id]
        );
        return `📂 *${project.name}*\n` +
               `Description: ${project.description}\n` +
               `Campaigns: ${campaigns.length}\n` +
               `Created: ${new Date(project.created_at).toLocaleDateString()}\n`;
      }));

      await ctx.replyWithMarkdown(
        '*Your Projects:*\n\n' + projectList.join('\n')
      );
    } finally {
      client.release();
    }
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

    const client = await pool.connect();
    try {
      const { rows: projects } = await client.query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );
      const project = projects[0];

      if (!project) {
        return ctx.reply('Project not found.');
      }

      if (project.owner_id !== ctx.from.id.toString()) {
        return ctx.reply('You don\'t have permission to manage this project.');
      }

      const { rows: campaigns } = await client.query(
        'SELECT * FROM campaigns WHERE project_id = $1',
        [projectId]
      );


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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in manageProjectHandler:', error);
    await ctx.reply('An error occurred while managing the project.');
  }
};

module.exports = {
  newProjectHandler,
  listProjectsHandler,
  manageProjectHandler,
  createProject //Export the createProject function
};
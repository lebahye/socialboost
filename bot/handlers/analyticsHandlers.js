
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Handler for viewing analytics for projects and campaigns
 */
const analyticsHandler = async (ctx) => {
  if (!ctx.from) {
    return ctx.reply('User information not available. Please try again.');
  }
  
  const userId = ctx.from.id.toString();

  try {
    // Parse arguments
    const args = ctx.message.text.split(' ');

    if (args.length < 2) {
      // No specific project - show overall stats
      const { rows: projects } = await pool.query(
        'SELECT * FROM projects WHERE owner_id = $1',
        [userId]
      );

      if (!projects || projects.length === 0) {
        return ctx.reply('You don\'t have any projects yet. Use /newproject to create one first.');
      }

      // Get all campaigns for all projects
      let totalCampaigns = 0;
      let totalParticipants = 0;
      let totalEngagement = 0;

      for (const project of projects) {
        const { rows: campaigns } = await pool.query(
          'SELECT * FROM campaigns WHERE project_id = $1',
          [project.id]
        );
        
        totalCampaigns += campaigns.length;

        for (const campaign of campaigns) {
          totalParticipants += campaign.participants ? 
            (typeof campaign.participants === 'string' ? 
              JSON.parse(campaign.participants).length : 
              campaign.participants.length) : 0;

          if (campaign.stats && typeof campaign.stats === 'string') {
            const stats = JSON.parse(campaign.stats);
            if (stats.engagement) {
              totalEngagement +=
                (stats.engagement.likes || 0) +
                (stats.engagement.retweets || 0) +
                (stats.engagement.comments || 0);
            }
          } else if (campaign.stats && campaign.stats.engagement) {
            totalEngagement +=
              (campaign.stats.engagement.likes || 0) +
              (campaign.stats.engagement.retweets || 0) +
              (campaign.stats.engagement.comments || 0);
          }
        }
      }

      return ctx.reply(
        `📊 Overall Analytics\n\n` +
        `Projects: ${projects.length}\n` +
        `Campaigns: ${totalCampaigns}\n` +
        `Total Participants: ${totalParticipants}\n` +
        `Total Engagement: ${totalEngagement}\n\n` +
        `For project-specific analytics, use "/analytics [projectId]"`
      );
    }

    // Specific project analytics
    const projectId = args[1];
    
    // Query using PostgreSQL
    const { rows: projectRows } = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [projectId, userId]
    );
    
    const project = projectRows[0];
    
    if (!project) {
      return ctx.reply('Project not found or you don\'t have permission to view analytics.');
    }

    const { rows: campaigns } = await pool.query(
      'SELECT * FROM campaigns WHERE project_id = $1',
      [project.id]
    );

    // Calculate project stats
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;

    let totalParticipants = 0;
    let totalEngagement = 0;

    for (const campaign of campaigns) {
      totalParticipants += campaign.participants ? 
        (typeof campaign.participants === 'string' ? 
          JSON.parse(campaign.participants).length : 
          campaign.participants.length) : 0;

      try {
        if (campaign.stats && typeof campaign.stats === 'string') {
          const stats = JSON.parse(campaign.stats);
          if (stats && stats.engagement) {
            totalEngagement +=
              (stats.engagement.likes || 0) +
              (stats.engagement.retweets || 0) +
              (stats.engagement.comments || 0);
          }
        } else if (campaign.stats && campaign.stats.engagement) {
          totalEngagement +=
            (campaign.stats.engagement.likes || 0) +
            (campaign.stats.engagement.retweets || 0) +
            (campaign.stats.engagement.comments || 0);
        }
      } catch (statsError) {
        console.error('Error parsing campaign stats:', statsError);
        // Continue with other campaigns instead of breaking
      }
    }

    return ctx.reply(
      `📊 Analytics for "${project.name}"\n\n` +
      `Active Campaigns: ${activeCampaigns}\n` +
      `Completed Campaigns: ${completedCampaigns}\n` +
      `Total Participants: ${totalParticipants}\n` +
      `Total Engagement: ${totalEngagement}\n\n` +
      `For campaign-specific analytics, use "/analytics ${projectId} [campaignId]"`
    );

  } catch (error) {
    console.error('Error in analyticsHandler:', error);
    return ctx.reply('An error occurred while fetching analytics. Please try again later.');
  }
};

/**
 * Handler for exporting project or campaign data
 */
const exportDataHandler = async (ctx) => {
  const userId = ctx.from.id.toString();

  try {
    const args = ctx.message.text.split(' ');

    if (args.length < 2) {
      return ctx.reply(
        'Please specify what data to export:\n\n' +
        '/export projects - Export all your projects\n' +
        '/export project [projectId] - Export a specific project\n' +
        '/export campaign [campaignId] - Export a specific campaign\n'
      );
    }

    const exportType = args[1];

    if (exportType === 'projects') {
      // Export all projects
      const { rows: projects } = await pool.query(
        'SELECT * FROM projects WHERE owner_id = $1',
        [userId]
      );

      if (!projects || projects.length === 0) {
        return ctx.reply('You don\'t have any projects to export.');
      }

      // Format projects data as a CSV-like text
      const exportData = projects.map(p => {
        return `${p.name},${p.description || 'No description'},${p.created_at},${p.id}`;
      }).join('\n');

      const header = 'Name,Description,Created,ID\n';

      return ctx.reply(
        `📤 Projects Export\n\n\`\`\`\n${header}${exportData}\n\`\`\`\n\n` +
        `For a more detailed export, please use the web dashboard.`
      );
    } else if (exportType === 'project' && args.length >= 3) {
      // Export specific project with campaigns
      const projectId = args[2];
      const { rows: projectRows } = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
        [projectId, userId]
      );

      const project = projectRows[0];
      if (!project) {
        return ctx.reply('Project not found or you don\'t have permission to export it.');
      }

      const { rows: campaigns } = await pool.query(
        'SELECT * FROM campaigns WHERE project_id = $1',
        [project.id]
      );

      // Basic text export of project details
      const exportData =
        `Project: ${project.name}\n` +
        `Description: ${project.description || 'N/A'}\n` +
        `Created: ${project.created_at}\n` +
        `Website: ${project.website || 'N/A'}\n\n` +
        `Campaigns (${campaigns.length}):\n` +
        campaigns.map((c, i) => {
          const participantsCount = c.participants ? 
            (typeof c.participants === 'string' ? 
              JSON.parse(c.participants).length : 
              c.participants.length) : 0;
          return `${i+1}. ${c.name} - Status: ${c.status} - Participants: ${participantsCount}`;
        }).join('\n');

      return ctx.reply(
        `📤 Project Export\n\n\`\`\`\n${exportData}\n\`\`\`\n\n` +
        `For a more detailed export, please use the web dashboard.`
      );
    } else if (exportType === 'campaign' && args.length >= 3) {
      // Export specific campaign details
      const campaignId = args[2];
      const { rows: campaignRows } = await pool.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );

      const campaign = campaignRows[0];
      if (!campaign) {
        return ctx.reply('Campaign not found.');
      }

      const { rows: projectRows } = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
        [campaign.project_id, userId]
      );

      const project = projectRows[0];
      if (!project) {
        return ctx.reply('You don\'t have permission to export this campaign.');
      }

      // Parse participants if stored as JSON string
      let participants = [];
      if (campaign.participants) {
        participants = typeof campaign.participants === 'string' ?
          JSON.parse(campaign.participants) : campaign.participants;
      }

      // Basic text export of campaign details
      const participantsList = participants.length > 0
        ? participants.map((p, i) => `  ${i+1}. User ID: ${p.userId}, Participated: ${p.participated}, Date: ${p.participationDate || 'N/A'}`).join('\n')
        : 'No participants yet';

      const exportData =
        `Campaign: ${campaign.name}\n` +
        `Description: ${campaign.description || 'N/A'}\n` +
        `Project: ${project.name}\n` +
        `Status: ${campaign.status}\n` +
        `Created: ${campaign.created_at}\n` +
        `Start Date: ${campaign.start_date || 'N/A'}\n` +
        `End Date: ${campaign.end_date || 'N/A'}\n` +
        `Target URL: ${campaign.x_post_url || 'N/A'}\n\n` +
        `Participants (${participants.length}):\n${participantsList}`;

      return ctx.reply(
        `📤 Campaign Export\n\n\`\`\`\n${exportData}\n\`\`\`\n\n` +
        `For a more detailed export, please use the web dashboard.`
      );
    } else {
      return ctx.reply(
        'Invalid export command. Please use one of the following formats:\n\n' +
        '/export projects - Export all your projects\n' +
        '/export project [projectId] - Export a specific project\n' +
        '/export campaign [campaignId] - Export a specific campaign\n'
      );
    }

  } catch (error) {
    console.error('Error in exportDataHandler:', error);
    return ctx.reply('An error occurred while exporting data. Please try again later.');
  }
};

module.exports = {
  analyticsHandler,
  exportDataHandler
};

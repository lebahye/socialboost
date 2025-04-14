const mongoose = require('mongoose');

// Define reward schema
const rewardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['community_role', 'exclusive_access', 'recognition', 'merchandise', 'whitelist', 'custom'],
    required: true
  },
  description: { type: String, required: true },
  requirements: { type: String },
  value: { type: String }
});

// Define campaign participant schema
const campaignParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  telegramId: { type: Number, required: true },
  telegramUsername: { type: String },
  participated: { type: Boolean, default: false },
  participationDate: { type: Date },
  rewarded: { type: Boolean, default: false },
  rewardType: { type: String },
  rewardedDate: { type: Date },
  remindersSent: { type: Number, default: 0 },
  lastReminderSent: { type: Date },
  engagementMetrics: {
    likes: { type: Boolean, default: false },
    retweets: { type: Boolean, default: false },
    comments: { type: Boolean, default: false },
    mentions: { type: Boolean, default: false }
  }
});

// Define reminder settings schema
const reminderSettingsSchema = new mongoose.Schema({
  sendAutomatically: { type: Boolean, default: true },
  platforms: {
    telegram: { type: Boolean, default: true },
    x: { type: Boolean, default: false },
    discord: { type: Boolean, default: false }
  },
  interval: { type: Number, default: 12 }, // In hours
  lastSent: { type: Date },
  message: { type: String },
  messageTemplate: { type: String }
});

// Define engagement stats schema
const engagementStatsSchema = new mongoose.Schema({
  likes: { type: Number, default: 0 },
  retweets: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  mentions: { type: Number, default: 0 }
});

// Define growth stats schema
const growthStatsSchema = new mongoose.Schema({
  newFollowers: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 }
});

// Define campaign stats schema
const campaignStatsSchema = new mongoose.Schema({
  participationRate: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  engagement: { type: engagementStatsSchema, default: () => ({}) },
  growth: { type: growthStatsSchema, default: () => ({}) }
});

// Define main campaign schema
const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: { type: String, required: true },
  xPostUrl: { type: String, required: true },
  discordUrl: { type: String },
  telegramChannelUrl: { type: String },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  targetParticipants: { type: Number, default: 100 },
  currentParticipants: { type: Number, default: 0 },
  rewards: [rewardSchema],
  createdBy: { type: Number, required: true }, // Telegram ID of creator
  participants: [campaignParticipantSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  reminders: { type: reminderSettingsSchema, default: () => ({}) },
  private: { type: Boolean, default: false },
  tags: [{ type: String }],
  requirements: { type: String },
  stats: { type: campaignStatsSchema, default: () => ({}) },
  // For internal tracking
  xPostId: { type: String },
  lastChecked: { type: Date },
  checkFrequency: { type: Number, default: 6 } // In hours
});

// Indexes
campaignSchema.index({ projectId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ tags: 1 });
campaignSchema.index({ 'participants.telegramId': 1 });
campaignSchema.index({ endDate: 1 });

// Methods
campaignSchema.methods.updateParticipationStats = function() {
  const totalParticipants = this.participants.length;
  const participatedCount = this.participants.filter(p => p.participated).length;

  this.stats.participationRate = totalParticipants > 0
    ? Math.round((participatedCount / totalParticipants) * 100)
    : 0;

  this.currentParticipants = participatedCount;

  return this;
};

campaignSchema.methods.calculateEngagement = function() {
  const participants = this.participants;
  let totalLikes = 0;
  let totalRetweets = 0;
  let totalComments = 0;
  let totalMentions = 0;

  participants.forEach(participant => {
    if (participant.participated && participant.engagementMetrics) {
      if (participant.engagementMetrics.likes) totalLikes++;
      if (participant.engagementMetrics.retweets) totalRetweets++;
      if (participant.engagementMetrics.comments) totalComments++;
      if (participant.engagementMetrics.mentions) totalMentions++;
    }
  });

  this.stats.engagement = {
    likes: totalLikes,
    retweets: totalRetweets,
    comments: totalComments,
    mentions: totalMentions
  };

  return this;
};

campaignSchema.methods.recordParticipation = async function(telegramId, engagementType) {
  const participant = this.participants.find(p => p.telegramId === telegramId);

  if (participant) {
    participant.participated = true;
    participant.participationDate = new Date();

    // Record engagement type
    if (engagementType && participant.engagementMetrics) {
      participant.engagementMetrics[engagementType] = true;
    }

    // Update stats
    this.updateParticipationStats();
    this.calculateEngagement();

    // Check if campaign is completed
    if (this.currentParticipants >= this.targetParticipants) {
      this.status = 'completed';
    }

    // Update the project stats
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.projectId);
    if (project) {
      await project.updateStats();
    }

    return this.save();
  }

  return null;
};

campaignSchema.methods.addParticipant = function(telegramId, telegramUsername, userId) {
  // Check if participant already exists
  const exists = this.participants.some(p => p.telegramId === telegramId);

  if (!exists) {
    this.participants.push({
      userId,
      telegramId,
      telegramUsername,
      participated: false
    });
  }

  return this;
};

// Statics
campaignSchema.statics.findActive = function() {
  return this.find({ status: 'active', endDate: { $gt: new Date() } });
};

campaignSchema.statics.findByProjectId = function(projectId) {
  return this.find({ projectId });
};

campaignSchema.statics.findUserCampaigns = function(telegramId) {
  return this.find({ 'participants.telegramId': telegramId });
};

// Model
const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;

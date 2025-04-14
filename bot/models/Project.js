const mongoose = require('mongoose');

// Define social media accounts schema
const socialAccountsSchema = new mongoose.Schema({
  telegram: {
    username: { type: String, required: true },
    channelName: { type: String },
    channelUrl: { type: String },
    memberCount: { type: Number }
  },
  x: {
    username: { type: String },
    followersCount: { type: Number },
    profileUrl: { type: String }
  },
  discord: {
    serverName: { type: String },
    serverUrl: { type: String },
    memberCount: { type: Number }
  },
  website: { type: String }
});

// Define follower growth schema
const followerGrowthSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  telegram: { type: Number, default: 0 },
  x: { type: Number, default: 0 },
  discord: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

// Define project statistics schema
const projectStatsSchema = new mongoose.Schema({
  totalCampaigns: { type: Number, default: 0 },
  activeCampaigns: { type: Number, default: 0 },
  participantCount: { type: Number, default: 0 },
  participationRate: { type: Number, default: 0 },
  averageEngagement: { type: Number, default: 0 },
  followerGrowth: [followerGrowthSchema]
});

// Define subscription schema
const subscriptionSchema = new mongoose.Schema({
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  autoRenew: { type: Boolean, default: false },
  campaignsRemaining: { type: Number, default: 0 },
  features: [{ type: String }],
  paymentMethod: { type: String },
  paymentId: { type: String }
});

// Define project owner schema
const projectOwnerSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true },
  telegramUsername: { type: String },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'admin' },
  addedDate: { type: Date, default: Date.now },
  lastActive: { type: Date }
});

// Define settings schema
const projectSettingsSchema = new mongoose.Schema({
  defaultReminderInterval: { type: Number, default: 12 }, // In hours
  defaultReminderPlatforms: [{ type: String, enum: ['telegram', 'x', 'discord'] }],
  defaultCampaignDuration: { type: Number, default: 7 }, // In days
  autoRenewal: { type: Boolean, default: false },
  preferredRewardTypes: [{ type: String }]
});

// Define main project schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  logo: { type: String },
  owners: [projectOwnerSchema],
  socialAccounts: { type: socialAccountsSchema, default: () => ({}) },
  category: [{ type: String }],
  subscription: { type: subscriptionSchema, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  stats: { type: projectStatsSchema, default: () => ({}) },
  settings: { type: projectSettingsSchema, default: () => ({}) },
  campaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }]
});

// Indexes
projectSchema.index({ 'owners.telegramId': 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ 'socialAccounts.telegram.username': 1 });
projectSchema.index({ 'socialAccounts.x.username': 1 });

// Methods
projectSchema.methods.isOwner = function(telegramId) {
  return this.owners.some(owner => owner.telegramId === telegramId);
};

projectSchema.methods.addOwner = function(telegramId, telegramUsername, role = 'member') {
  if (!this.isOwner(telegramId)) {
    this.owners.push({
      telegramId,
      telegramUsername,
      role,
      addedDate: new Date(),
      lastActive: new Date()
    });
  }
  return this;
};

projectSchema.methods.updateStats = async function() {
  const Campaign = mongoose.model('Campaign');

  // Get active campaigns count
  const activeCampaigns = await Campaign.countDocuments({
    _id: { $in: this.campaigns },
    status: 'active'
  });

  // Get participation stats
  const campaigns = await Campaign.find({ _id: { $in: this.campaigns } });

  let totalParticipants = 0;
  let participatedCount = 0;
  let engagementSum = 0;

  campaigns.forEach(campaign => {
    totalParticipants += campaign.participants.length;
    participatedCount += campaign.participants.filter(p => p.participated).length;

    if (campaign.stats && campaign.stats.engagement) {
      const engagementMetrics = campaign.stats.engagement;
      const campaignEngagement = (
        (engagementMetrics.likes || 0) +
        (engagementMetrics.retweets || 0) * 2 +
        (engagementMetrics.comments || 0) * 3 +
        (engagementMetrics.mentions || 0) * 3
      ) / campaign.participants.length;

      engagementSum += campaignEngagement;
    }
  });

  // Update stats
  this.stats.totalCampaigns = campaigns.length;
  this.stats.activeCampaigns = activeCampaigns;
  this.stats.participantCount = totalParticipants;
  this.stats.participationRate = totalParticipants > 0
    ? Math.round((participatedCount / totalParticipants) * 100)
    : 0;
  this.stats.averageEngagement = campaigns.length > 0
    ? Math.round(engagementSum / campaigns.length)
    : 0;

  return this.save();
};

// Statics
projectSchema.statics.findByTelegramId = function(telegramId) {
  return this.find({ 'owners.telegramId': telegramId });
};

projectSchema.statics.findByCategory = function(category) {
  return this.find({ category: { $in: Array.isArray(category) ? category : [category] } });
};

// Model
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;

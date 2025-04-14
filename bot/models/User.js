const mongoose = require('mongoose');

// Define payment history schema
const paymentHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String }
});

// Define social accounts schema
const socialAccountSchema = new mongoose.Schema({
  platform: { type: String, enum: ['x', 'discord', 'telegram'], required: true },
  username: { type: String, required: true },
  accountId: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationExpiry: { type: Date },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date }
});

// Define notification settings schema
const notificationSettingsSchema = new mongoose.Schema({
  mentions: { type: Boolean, default: true },
  campaigns: { type: Boolean, default: true },
  rewards: { type: Boolean, default: true },
  platform: {
    telegram: { type: Boolean, default: true },
    x: { type: Boolean, default: false },
    discord: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  }
});

// Define main user schema
const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  language: { type: String, default: 'en' },
  isActive: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now },

  // Social media accounts
  socialAccounts: [socialAccountSchema],

  // Project owner specific fields
  isProjectOwner: { type: Boolean, default: false },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],

  // Payment and subscription
  credits: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  premiumUntil: { type: Date },
  subscriptionPlan: { type: String },
  subscriptionId: { type: String },

  // Referrals
  referredBy: { type: Number }, // telegramId of referrer
  referralCode: { type: String, unique: true, sparse: true },
  referrals: [{ type: Number }], // Array of telegramIds

  // Payments
  paymentHistory: [paymentHistorySchema],

  // User settings
  notificationSettings: { type: notificationSettingsSchema, default: () => ({}) },
  privacy: {
    allowDataSharing: { type: Boolean, default: false },
    allowProfileDisplay: { type: Boolean, default: true }
  },

  // Campaign participation tracking
  campaignsParticipated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],

  // Stats
  stats: {
    totalEarned: { type: Number, default: 0 },
    campaignsCompleted: { type: Number, default: 0 },
    averageEngagement: { type: Number, default: 0 },
    lastActive: { type: Date }
  },

  // Conversation state for multi-step commands
  currentState: { type: String },
  stateData: { type: mongoose.Schema.Types.Mixed }
});

// Indexes
userSchema.index({ telegramId: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ 'socialAccounts.platform': 1, 'socialAccounts.username': 1 });

// Methods
userSchema.methods.hasVerifiedAccount = function(platform) {
  return this.socialAccounts.some(acc => acc.platform === platform && acc.isVerified);
};

userSchema.methods.addCredits = async function(amount, description) {
  this.credits += amount;
  this.stats.totalEarned += amount > 0 ? amount : 0;

  this.paymentHistory.push({
    amount,
    description,
    status: 'completed'
  });

  return this.save();
};

userSchema.methods.generateReferralCode = function() {
  const code = `${this.telegramId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  this.referralCode = code;
  return code;
};

// Statics
userSchema.statics.findByPlatformUsername = function(platform, username) {
  return this.findOne({
    'socialAccounts.platform': platform,
    'socialAccounts.username': username
  });
};

userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referralCode });
};

// Model
const User = mongoose.model('User', userSchema);

module.exports = User;

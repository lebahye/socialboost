
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Campaign = require('./models/Campaign');
require('dotenv').config();

async function testConnection() {
  try {
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB!\n');

    // Get database stats
    const { db } = mongoose.connection;
    const stats = await db.stats();
    console.log('Database Stats:');
    console.log('- Database:', db.databaseName);
    console.log('- Collections:', stats.collections);
    console.log('- Total Documents:', stats.objects, '\n');

    // Count documents in each collection
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const campaignCount = await Campaign.countDocuments();

    console.log('Collection Counts:');
    console.log('- Users:', userCount);
    console.log('- Projects:', projectCount);
    console.log('- Campaigns:', campaignCount);

  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nConnection closed.');
  }
}

testConnection();

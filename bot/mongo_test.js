
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Attempting to connect to Replit MongoDB...');
    
    await mongoose.connect(process.env.REPLIT_MONGO_URL);
    console.log('Successfully connected to MongoDB!\n');
    
    // Get connection info
    const { host, name } = mongoose.connection;
    console.log('Connection Details:');
    console.log('Host:', host);
    console.log('Database:', name);
    
    await mongoose.disconnect();
    console.log('\nConnection closed.');
    
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  }
}

testConnection();

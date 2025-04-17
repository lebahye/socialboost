
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    
    // Remove port number if present in mongodb+srv:// URI
    const mongoUri = process.env.MONGODB_URI.includes('mongodb+srv://')
      ? process.env.MONGODB_URI.split(':').slice(0, -1).join(':')
      : process.env.MONGODB_URI;
    
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB!\n');
    
    // Get connection info
    const { host, port, name } = mongoose.connection;
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

// Database connection utility for MongoDB
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db('shvip');
  
  cachedClient = client;
  cachedDb = db;
  
  return db;
}

// Verify admin token
function verifyToken(authHeader) {
  if (!authHeader) {
    return false;
  }
  
  const token = authHeader.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken) {
    console.error('ADMIN_TOKEN not configured');
    return false;
  }
  
  return token === adminToken;
}

module.exports = { connectToDatabase, verifyToken };

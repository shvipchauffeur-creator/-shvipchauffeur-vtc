// List all drivers
const { connectToDatabase, verifyToken } = require('./utils/db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!verifyToken(event.headers.authorization)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('drivers');
    
    const limit = parseInt(event.queryStringParameters?.limit) || 50;
    const status = event.queryStringParameters?.status;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const drivers = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ drivers, total: drivers.length }),
    };
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// List all rides
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
    const collection = db.collection('rides');
    
    const limit = parseInt(event.queryStringParameters?.limit) || 50;
    const status = event.queryStringParameters?.status;
    const driverId = event.queryStringParameters?.driver_id;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    if (driverId) {
      query.driverId = driverId;
    }

    const rides = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Enrich with driver info
    const driversCollection = db.collection('drivers');
    const enrichedRides = await Promise.all(
      rides.map(async (ride) => {
        if (ride.driverId) {
          const driver = await driversCollection.findOne({ _id: ride.driverId });
          if (driver) {
            ride.driverName = `${driver.firstname} ${driver.lastname}`;
          }
        }
        return ride;
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ rides: enrichedRides, total: enrichedRides.length }),
    };
  } catch (error) {
    console.error('Error fetching rides:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

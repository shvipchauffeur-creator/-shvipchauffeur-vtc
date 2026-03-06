// Create or update a driver
const { connectToDatabase, verifyToken } = require('./utils/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
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
    const data = JSON.parse(event.body);
    const db = await connectToDatabase();
    const collection = db.collection('drivers');
    
    const now = new Date().toISOString();
    
    if (data._id) {
      // Update existing driver
      const { _id, ...updateData } = data;
      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { 
          $set: { 
            ...updateData, 
            updatedAt: now 
          } 
        }
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Driver updated successfully',
          driverId: _id,
        }),
      };
    } else {
      // Create new driver
      const driver = {
        ...data,
        status: 'active',
        rating: 0,
        rides: 0,
        revenue: 0,
        createdAt: now,
        updatedAt: now,
      };
      
      const result = await collection.insertOne(driver);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Driver created successfully',
          driverId: result.insertedId,
        }),
      };
    }
  } catch (error) {
    console.error('Error saving driver:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

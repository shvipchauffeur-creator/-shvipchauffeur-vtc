// Update ride status
const { connectToDatabase, verifyToken } = require('./utils/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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
    const collection = db.collection('rides');
    
    const { rideId, status, ...updateData } = data;
    
    if (!rideId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ride ID is required' }),
      };
    }

    const updateFields = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    if (status) {
      updateFields.status = status;
      
      // Add timestamps based on status
      if (status === 'in_progress') {
        updateFields.startedAt = new Date().toISOString();
      } else if (status === 'completed') {
        updateFields.completedAt = new Date().toISOString();
      }
    }

    await collection.updateOne(
      { _id: new ObjectId(rideId) },
      { $set: updateFields }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Ride updated successfully',
        rideId,
        status,
      }),
    };
  } catch (error) {
    console.error('Error updating ride:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

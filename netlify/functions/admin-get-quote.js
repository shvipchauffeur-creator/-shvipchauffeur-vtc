// Get a single quote by ID
const { connectToDatabase, verifyToken } = require('./utils/db');
const { ObjectId } = require('mongodb');

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
    const collection = db.collection('quotes');
    
    const id = event.queryStringParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Quote ID is required' }),
      };
    }

    let quote;
    try {
      quote = await collection.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      // If ObjectId fails, try finding by string id
      quote = await collection.findOne({ id: id });
    }

    if (!quote) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Quote not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(quote),
    };
  } catch (error) {
    console.error('Error fetching quote:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Export data to CSV or JSON
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
    const type = event.queryStringParameters?.type || 'full';
    const format = event.queryStringParameters?.format || 'json';
    
    let data = {};
    
    if (type === 'payments' || type === 'full') {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const charges = await stripe.charges.list({ limit: 100 });
      data.payments = charges.data.map(c => ({
        id: c.id,
        amount: c.amount / 100,
        currency: c.currency,
        status: c.status,
        customerEmail: c.receipt_email,
        created: new Date(c.created * 1000).toISOString(),
      }));
    }
    
    if (type === 'quotes' || type === 'full') {
      data.quotes = await db.collection('quotes').find().toArray();
    }
    
    if (type === 'invoices' || type === 'full') {
      data.invoices = await db.collection('invoices').find().toArray();
    }
    
    if (type === 'drivers' || type === 'full') {
      data.drivers = await db.collection('drivers').find().toArray();
    }
    
    if (type === 'rides' || type === 'full') {
      data.rides = await db.collection('rides').find().toArray();
    }
    
    if (type === 'clients' || type === 'full') {
      // Aggregate unique clients from quotes
      const quotes = await db.collection('quotes').find().toArray();
      const clientsMap = new Map();
      quotes.forEach(q => {
        if (!clientsMap.has(q.customerEmail)) {
          clientsMap.set(q.customerEmail, {
            email: q.customerEmail,
            name: q.customerName,
            phone: q.customerPhone,
            firstContact: q.createdAt,
            quotesCount: 0,
            totalSpent: 0,
          });
        }
        const client = clientsMap.get(q.customerEmail);
        client.quotesCount++;
        if (q.status === 'accepted') {
          client.totalSpent += parseFloat(q.amount) || 0;
        }
      });
      data.clients = Array.from(clientsMap.values());
    }

    if (format === 'csv') {
      // Convert to CSV
      const collection = type === 'full' ? 'data' : type;
      const rows = Array.isArray(data[collection]) ? data[collection] : [];
      
      if (rows.length === 0) {
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'text/csv' },
          body: 'No data',
        };
      }
      
      const headers_row = Object.keys(rows[0]).join(',');
      const csvRows = rows.map(row => 
        Object.values(row).map(v => 
          typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
        ).join(',')
      );
      const csv = [headers_row, ...csvRows].join('\n');
      
      return {
        statusCode: 200,
        headers: { 
          ...headers, 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="shvip_${type}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
        body: csv,
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data, null, 2),
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

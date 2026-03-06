const { supabase } = require("./_supabase")

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return { statusCode: 405 }
  }

  const body = JSON.parse(event.body)

  const db = supabase()

  const { data, error } = await db
    .from("reservations")
    .insert([
      {
        pickup: body.pickup,
        dropoff: body.dropoff,
        datetime: body.datetime,
        price_eur: body.price,
        vehicle: body.vehicle,
        status: "confirmed"
      }
    ])

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, reservation: data })
  }
}
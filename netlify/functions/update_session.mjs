const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
  // Define session data
  const { code } = event.queryStringParameters
  const { userId } = event.queryStringParameters
  var { latitude } = event.queryStringParameters
  var { longitude } = event.queryStringParameters
  const { placeId } = event.queryStringParameters

  // Convert query string to a decimal
  latitude = parseFloat(latitude)
  longitude = parseFloat(longitude)

  var update_body = {
    [`user_coordinates.${userId}`]: {
      "latitude": latitude,
      "longitude": longitude
    }
  };

  if ( placeId ) {
    update_body[`user_coordinates.${userId}`]['place_id'] = placeId;
  }
  console.log(`update body: ${update_body}`);

  // Connect to MongoDB
  const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
  const collection = database.collection(process.env.MONGODB_SESSIONS_COLLECTION);

  // Submit update session request
  const filter = { "code": code }
  const update = {
    "$set": update_body
  };

  updateResult = await collection.updateOne(filter, update);

  // Get new session data and return upon success
  if (updateResult['modifiedCount'] == 1) {
    sessionDoc = await collection.findOne(filter);
    return {
      statusCode: 200,
      body: JSON.stringify({
        updateResult: updateResult,
        session: sessionDoc
      })
    }
  }
}
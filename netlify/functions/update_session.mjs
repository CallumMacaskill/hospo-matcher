const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
  // Define session data
  const { code } = event.queryStringParameters
  var { latitude } = event.queryStringParameters
  var { longitude } = event.queryStringParameters

  // Convert query string to a decimal
  latitude = parseFloat(latitude)
  longitude = parseFloat(longitude)

  // Connect to MongoDB
  const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
  const collection = database.collection(process.env.MONGODB_SESSIONS_COLLECTION);

  // Submit update session request
  const filter = { "code": code }
  const update = {
    "$push": {
      "coordinates": { "latitude": latitude, "longitude": longitude }
    }
  };

  update_result = await collection.updateOne(filter, update);
  console.log("Updated document")
  console.log(update_result)

  return {
    statusCode: 200,
    body: JSON.stringify(update_result)
  }
}
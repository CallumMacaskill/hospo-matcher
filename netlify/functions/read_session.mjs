const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
  // Define session data
  const { code } = event.queryStringParameters

  // Connect to MongoDB
  const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
  const collection = database.collection(process.env.MONGODB_SESSIONS_COLLECTION);

  // Read session document
  sessionDoc = await collection.findOne({ "code": code })
  console.log("Found document")
  console.log(sessionDoc)

  return {
    statusCode: 200,
    body: JSON.stringify(sessionDoc)
  }
}
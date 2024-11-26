const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
  // Define session data
  const { session_code } = event.queryStringParameters

  // Connect to MongoDB
  const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
  const collection = database.collection(process.env.MONGODB_SESSIONS_COLLECTION);

  // Read session document
  session_doc = await collection.findOne({ "code": session_code })
  console.log("Found document")
  console.log(session_doc)

  return {
    statusCode: 200,
    body: JSON.stringify(session_doc)
  }
}
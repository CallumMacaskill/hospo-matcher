const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
  // Define meetup data
  console.log('Query parameters:');
  console.log(event.queryStringParameters);
  const { code } = event.queryStringParameters

  // Connect to MongoDB
  const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
  const collection = database.collection(process.env.MONGODB_COLLECTION);

  // Read meetup document
  meetupDoc = await collection.findOne({ "code": code });
  console.log("Retrieved result:");
  console.log(meetupDoc);

  return {
    statusCode: 200,
    body: JSON.stringify(meetupDoc)
  }
}
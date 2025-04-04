const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
  // Define meetup data
  console.log('Query parameters:');
  console.log(event.queryStringParameters);
  const { code } = event.queryStringParameters
  const { userId } = event.queryStringParameters
  var { latitude } = event.queryStringParameters
  var { longitude } = event.queryStringParameters
  const { placeId } = event.queryStringParameters
  const locationId = crypto.randomUUID();

  // Convert query string to a decimal
  latitude = parseFloat(latitude)
  longitude = parseFloat(longitude)

  var update_body = {
    [`user_locations.${userId}`]: {
      "id": locationId,
      "latitude": latitude,
      "longitude": longitude
    }
  };

  if (placeId) {
    update_body[`user_locations.${userId}`]['place_id'] = placeId;
  }
  console.log('Update body');
  console.log(update_body);

  // Connect to MongoDB
  const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
  const collection = database.collection(process.env.MONGODB_COLLECTION);

  // Submit update meetup request
  const filter = { "code": code }
  const update = {
    "$push": update_body
  };

  updateResult = await collection.updateOne(filter, update, upsert=true);

  // Get new meetup data and return upon success
  if (updateResult['modifiedCount'] == 1) {
    meetupDoc = await collection.findOne(filter);
    return {
      statusCode: 200,
      body: JSON.stringify({
        updateResult: updateResult,
        meetup: meetupDoc
      })
    }
  }
}
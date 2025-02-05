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

    // Connect to MongoDB
    const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
    const collection = database.collection(process.env.MONGODB_SESSIONS_COLLECTION);

    // Define the update operation using $pull
    const filter = {
        "code": code
    };

    const update = {
        $pull: {
            [`user_coordinates.${userId}`]: {
                "latitude": latitude,
                "longitude": longitude
            }
        }
    };

    if (placeId) {
        update.$pull[`user_coordinates.${userId}`]["place_id"] = placeId;
    }

    console.log(filter)
    console.log(update)

    // Execute the update operation
    const updateResult = await collection.updateOne(filter, update);

    if (updateResult['modifiedCount'] == 1) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                updateResult: updateResult
            })
        }
    }
}
const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
    // Define session data
    let uuid = crypto.randomUUID();
    const { userId } = event.queryStringParameters
    var { latitude } = event.queryStringParameters
    var { longitude } = event.queryStringParameters

    // Convert query string to a decimal
    latitude = parseFloat(latitude)
    longitude = parseFloat(longitude)

    session = {
        "code": uuid,
        "user_coordinates": {
            [userId]: {
                "latitude": latitude,
                "longitude": longitude
            }
        }
    }
    console.log(session);

    // Connect to MongoDB
    const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
    const collection = database.collection(process.env.MONGODB_SESSIONS_COLLECTION);

    // Submit create session request
    collection.insertOne(session)
    console.log("Inserted document")

    return {
		statusCode: 200,
		body: JSON.stringify({
			session: session
		})
	}
}
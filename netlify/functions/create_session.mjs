const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
    // Define session data
    let uuid = crypto.randomUUID();
    var { latitude } = event.queryStringParameters
    var { longitude } = event.queryStringParameters

    // Convert query string to a decimal
    latitude = parseFloat(latitude)
    longitude = parseFloat(longitude)

    session = {
        "code": uuid,
        "coordinates": [
            {
                "latitude": latitude,
                "longitude": longitude
            }
        ],
    }

    // Connect to MongoDB
    const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
    const collection = database.collection(process.env.MONGODB_SESSIONS_COLLECTION);

    // Submit create session request
    collection.insertOne(session)
    console.log("Inserted document")

    return {
		statusCode: 200,
		body: JSON.stringify({
			session_code: uuid
		})
	}
}
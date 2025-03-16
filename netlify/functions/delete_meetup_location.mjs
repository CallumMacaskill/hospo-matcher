const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const clientPromise = mongoClient.connect();

export const handler = async (event) => {
    // Define meetup data
    console.log('Query parameters:');
    console.log(event.queryStringParameters);
    const { code } = event.queryStringParameters
    const { userId } = event.queryStringParameters
    const { locationId } = event.queryStringParameters

    // Connect to MongoDB
    const database = (await clientPromise).db(process.env.MONGODB_DATABASE);
    const collection = database.collection(process.env.MONGODB_COLLECTION);

    // Define the update operation using $pull
    const locationFilter = {
        "code": code
    };

    const locationUpdate = {
        $pull: {
            [`user_locations.${userId}`]: {
                "id": locationId,
            }
        }
    };

    console.log('Filter:')
    console.log(locationFilter)
    console.log('Update:')
    console.log(locationUpdate)

    // Execute the update operation
    const locationUpdateResult = await collection.updateOne(locationFilter, locationUpdate);

    // Filter to find documents where user_locations.${userId} exists and is an empty array
    const userLocationsFilter = {
        code: code,
        [`user_locations.${userId}`]: {
            $exists: true,
            $size: 0
        }
    };

    // Update operation to remove the specific userId entry from user_locations
    const userLocationsUpdate = {
        $unset: {
            [`user_locations.${userId}`]: ""
        }
    };

    // Perform the update operation
    const userLocationsUpdateResult = await collection.updateOne(userLocationsFilter, userLocationsUpdate);

    if (userLocationsUpdateResult.modifiedCount === 1) {
        console.log("User's locations record removed successfully");
    }

    if (updateResult['modifiedCount'] == 1) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                updateResult: updateResult
            })
        }
    }
}
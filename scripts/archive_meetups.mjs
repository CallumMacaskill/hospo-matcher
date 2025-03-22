import "dotenv/config"; // Load environment variables from .env
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
const sourceCollection = process.env.MONGODB_ARCHIVE_SOURCE_COLLECTION;
const targetCollection = process.env.MONGODB_ARCHIVE_TARGET_COLLECTION;

const client = new MongoClient(uri);

async function archiveOldRecords(window = 7, startDate = new Date()) {
    try {
        await client.connect();
        const db = client.db(dbName);

        // Calculate cutoff date by subtracting the window from the start date
        const cutoffDate = new Date(startDate);
        cutoffDate.setDate(cutoffDate.getDate() - window);

        // Find documents older than the cutoff date
        const documentsToArchive = await db.collection(sourceCollection)
            .find({ created_datetime: { $lt: cutoffDate } })
            .toArray();

        if (documentsToArchive.length === 0) {
            console.log("No records to archive.");
            return;
        }

        let modifiedCount = 0;

        // Process documents to remove place_id locations
        const processedDocuments = documentsToArchive.map(doc => {
            if (doc.user_locations) {
                Object.keys(doc.user_locations).forEach(userId => {
                    doc.user_locations[userId] = doc.user_locations[userId].map(location => {
                        if ("place_id" in location) {
                            modifiedCount++;
                            return { id: location.id }; // Keep only id key
                        }
                        return location;
                    });
                });
            }
            return doc;
        });

        // Insert processed documents into the archive collection
        await db.collection(targetCollection).insertMany(processedDocuments);

        // Delete archived documents from source collection
        await db.collection(sourceCollection).deleteMany({ created_datetime: { $lt: cutoffDate } });

        console.log(`Archived ${documentsToArchive.length} documents.`);
        console.log(`Modified ${modifiedCount} location records by removing place_id, latitude, and longitude.`);

    } catch (error) {
        console.error("Error during archiving:", error);
    } finally {
        await client.close();
    }
}

// Example usage with default values
archiveOldRecords().catch(console.error);

// Example usage with custom window and start date
// archiveOldRecords(10, new Date("2025-03-01")).catch(console.error);

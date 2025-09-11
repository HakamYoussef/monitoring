import { MongoClient, Db, Collection, Document } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'smart-monitoring-db'; // You can change this to your preferred database name

let client: MongoClient;
let db: Db;

// A function to check if the MongoDB URI is configured.
export function isMongoConfigured(): boolean {
  return !!uri;
}

async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  if (!uri) {
    // This will prevent the app from crashing if the URI is not set.
    // The calling functions should handle the case where the db is not available.
    console.error('MongoDB URI is not configured. Please set the MONGODB_URI environment variable.');
    throw new Error('MongoDB URI is not configured. Please set the MONGODB_URI environment variable.');
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    
    console.log('Connected to MongoDB');

    return { client, db };
  } catch (error) {
     console.error("Failed to connect to MongoDB:", error);
     // Propagate the error to be handled by the caller
     throw error;
  }
}

export async function getCollection<T extends Document>(
  collectionName: string,
): Promise<Collection<T> | null> {
  if (!isMongoConfigured()) {
    return null;
  }
  try {
    const { db } = await connectToDatabase();
    return db.collection<T>(collectionName);
  } catch (error) {
    // If connection fails, we return null, and the calling function should handle it.
    return null;
  }
}

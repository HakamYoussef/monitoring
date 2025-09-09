import { MongoClient, Db, Collection } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'smart-monitoring-db'; // You can change this to your preferred database name

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let client: MongoClient;
let db: Db;

async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  client = new MongoClient(uri!);
  await client.connect();
  db = client.db(dbName);
  
  console.log('Connected to MongoDB');

  return { client, db };
}

export async function getCollection<T>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

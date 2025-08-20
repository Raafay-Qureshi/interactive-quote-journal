import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cached: {
  client: MongoClient;
  db: Db;
} | null = null;

if (!uri) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

if (!dbName) {
  throw new Error(
    'Please define the MONGODB_DB environment variable inside .env.local'
  );
}

export async function connectToDatabase() {
  if (cached) {
    return cached;
  }

  const client = new MongoClient(uri!);

  const db = client.db(dbName);

  cached = {
    client,
    db,
  };

  return cached;
}
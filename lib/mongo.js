import { MongoClient } from 'mongodb';

let client;

export function db() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing in .env');
  if (!client) client = new MongoClient(process.env.MONGO_URI);
  return client.db(process.env.MONGODB_DATABASE || 'pigeon');
}
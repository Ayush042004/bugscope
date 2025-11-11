import mongoose from 'mongoose';

let isConnected = false;

async function dbConnect(): Promise<void> {
  if (isConnected) return;
  const uri = process.env.MONGO_URL || '';
  if (!uri) throw new Error('MONGO_URL not configured');
  const db = await mongoose.connect(uri);
  isConnected = db.connections[0].readyState === 1;
}

export default dbConnect;
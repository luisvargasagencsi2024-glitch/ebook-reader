import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri);
    console.log('MongoDB connected to:', uri);
    return;
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.join(process.cwd(), '.data');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    instance: { dbPath },
  });
  const localUri = mongod.getUri();
  await mongoose.connect(localUri);
  console.log('MongoDB Memory Server started at:', localUri);
  console.log('  Data path:', dbPath);
}

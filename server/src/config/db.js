import mongoose from 'mongoose';

let memoryServer;

export async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI is required in production');
    }
    // Dev fallback: spin up an in-memory MongoDB so the app runs with zero setup.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('careerleap');
    console.log('[db] MONGO_URI not set — using in-memory MongoDB (data resets on restart)');
  }

  await mongoose.connect(uri);
  console.log('[db] connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

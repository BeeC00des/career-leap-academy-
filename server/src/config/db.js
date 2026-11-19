import mongoose from 'mongoose';

let memoryServer;

export async function connectDB() {
  // Tolerate common copy-paste mistakes in dashboard env vars: surrounding spaces/quotes
  // or the whole "MONGO_URI=..." line pasted as the value.
  let uri = (process.env.MONGO_URI || '')
    .trim()
    .replace(/^MONGO_URI\s*=\s*/, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  if (uri && !/^mongodb(\+srv)?:\/\//.test(uri)) {
    // Never log the value itself — it contains the database password.
    throw new Error(
      `MONGO_URI is set but invalid: it must start with "mongodb+srv://" (it starts with "${uri.slice(0, 4)}…", length ${uri.length}). ` +
        'Re-paste only the connection string in your host\'s environment settings.'
    );
  }

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

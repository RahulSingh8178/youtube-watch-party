const mongoose = require("mongoose");

/**
 * Connects to MongoDB if a URI is provided.
 * Room state lives in memory (see classes/RoomManager.js) so the app is
 * fully functional even if MongoDB is unavailable - Mongo is only used
 * to persist room metadata (the "Persistent rooms" bonus requirement).
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("[db] No MONGODB_URI set - running with in-memory rooms only.");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("[db] Connected to MongoDB");
    return true;
  } catch (err) {
    console.warn(`[db] Could not connect to MongoDB (${err.message}). Falling back to in-memory rooms only.`);
    return false;
  }
}

module.exports = { connectDB };

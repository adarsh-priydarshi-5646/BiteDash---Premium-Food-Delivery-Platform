import mongoose from "mongoose";

/**
 * MongoDB Connection Configuration
 * Optimized for high-traffic production environments (5000+ req/s)
 */
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 100,           // Max concurrent connections
      minPoolSize: 20,            // Pre-warmed connections for instant availability
      maxIdleTimeMS: 30000,       // Close idle connections after 30s
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      w: 'majority',              // Write concern for data durability
      wtimeoutMS: 2500,
      readPreference: 'primaryPreferred',  // Read from primary, fallback to secondary
      compressors: ['zlib'],      // Network compression for faster transfers
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnect...');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });

    console.log("DB connected");
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

export default connectDb;

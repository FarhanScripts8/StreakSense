import mongoose from "mongoose";

const localFallbackUri = process.env.MONGO_URI_LOCAL || "mongodb://127.0.0.1:27017/aihabittracker";

export const connectDB = async () => {
    const attempts = [process.env.MONGO_URI, localFallbackUri].filter(Boolean);

    for (const uri of attempts) {
        try {
            const conn = await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log(`MongoDB connected: ${conn.connection.host}`);
            return;
        } catch (err) {
            console.warn(`MongoDB connection failed for ${uri}: ${err.message}`);
        }
    }

    console.warn("MongoDB unavailable; continuing without a database connection.");
};
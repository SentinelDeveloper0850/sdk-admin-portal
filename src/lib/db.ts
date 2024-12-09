import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cachedConn: typeof mongoose | null = null;

export async function connectToDatabase() {
  try {
    if (cachedConn) {
      console.log("Connected to MongoDB existing connection");
      return cachedConn;
    }

    console.log("MONGODB_URI", MONGODB_URI);

    if (MONGODB_URI) {
      const conn = await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB");
      cachedConn = conn;
    } else {
      console.log("No MONGODB_URI provided");
    }

    return cachedConn;
  } catch (error) {
    console.log("Connected error: ", error);
  }
}

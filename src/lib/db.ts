import mongoose, { ConnectionStates } from "mongoose";

const connectionString =
  process.env.MONGODB_URI;

if (!connectionString)
  throw new Error(
    "🧭 ~ Please define MONGODB_URI environment variable inside .env"
  );

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  if (mongoose.connection.readyState != ConnectionStates.connected) {
    try {
      if (cachedConnection) {
        console.log("🧭 ~ Using cached database connection");
        return cachedConnection;
      }

      if (connectionString) {
        const connection = await mongoose.connect(connectionString);
        console.log("🧭 ~ Connected to database");
        cachedConnection = connection;
      } else {
        throw new Error(
          "🧭 ~ Please define MONGODB_URI environment variable inside .env"
        );
      }

      return cachedConnection;
    } catch (error) {
      console.log("🧭 ~ Error connecting to database: ", error);
      throw error;
    }
  }
}

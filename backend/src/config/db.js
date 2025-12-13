import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Ricrea __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica il file .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });


export async function connectDB() {
  try {
    console.log("--- DEBUG CONNESSIONE ---");
    console.log("URI:", process.env.MONGO_URI);
    console.log("DB NAME:", process.env.DB_NAME);

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "PreFix"
    });

    console.log("Connesso su MONGODB:", mongoose.connection.name);
    return mongoose.connection;

  } catch (err) {
    console.error("Errore connessione Mongo:", err);
    process.exit(1);
  }
}

export default connectDB;
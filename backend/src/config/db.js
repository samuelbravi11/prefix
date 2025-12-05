import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Ricrea __dirname per ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica il file .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    console.log("--- DEBUG CONNESSIONE ---");
    console.log("URI:", process.env.MONGO_URI);
    console.log("DB NAME:", process.env.DB_NAME);

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });

    console.log(`Database connesso con successo a: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("Errore di connessione al database:", err);
    process.exit(1);
  }
};

export default connectDB;
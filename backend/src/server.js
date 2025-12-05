import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

import app from "./app.js";

// Carica variabili ambiente
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

// Funzione per stampare tutte le collection, anche vuote
const listAllCollections = async () => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections({}, { nameOnly: true }).toArray();

        console.log("Collezioni nel DB:");

        if (collections.length === 0) {
            console.log("Nessuna collection trovata");
        } else {
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`- ${col.name} (Documenti: ${count})`);
            }
        }
    } catch (err) {
        console.error("Errore nel recupero delle collection:", err);
    }
};

const startServer = async () => {
    try {
        // Connessione al database
        await connectDB();

        // Mostra tutte le collection
        await listAllCollections();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server avviato su http://localhost:${PORT}`);
            console.log(`DB in uso: ${process.env.DB_NAME}`);
        });
    } catch (error) {
        console.error("Errore durante l'avvio del server:", error);
        process.exit(1);
    }
};

startServer();
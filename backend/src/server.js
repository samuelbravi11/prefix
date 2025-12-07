import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import app from "./app.js";

// Carica variabili ambiente --> salvate in memoria ram per tutta l'esecuzione del server
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

/*
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
*/

async function startServer() {
    try {
        // Connessione Mongo
        const connection = await connectDB();
        console.log("Stato connessione:", connection.readyState);

        // elenco le collections
        const collections = await connection.db.listCollections().toArray();
        console.log("Collections esistenti:", collections.map(c => c.name));

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server avviato su http://localhost:${PORT}`);
            console.log(`DB in uso: ${process.env.DB_NAME}`);
        });
    } catch (error) {
        console.error("Errore durante l'avvio del server:", error);
        process.exit(1);
    }
}

startServer();
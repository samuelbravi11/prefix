import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

// Carica variabili ambiente --> salvate in memoria ram per tutta l'esecuzione del server
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

// Avvio server PDP
// questo server è isolato e si occupa solo di gestire le decisioni di autorizzazione e l'accesso al database per il controllo dei permessi.
// dividiamo le responsabilità tra il server proxy (Guard) e il server PDP per migliorare la sicurezza e la scalabilità dell'applicazione.
async function startServer() {
    try {
        // Connessione Mongo
        const connection = await connectDB();
        console.log("Stato connessione Mongo:", connection.readyState);

        // elenco le collections
        const collections = await connection.db.listCollections().toArray();
        console.log("Collections esistenti:", collections.map(c => c.name));

        const PORT = 3000;
        // Il server PDP ascolta solo su localhost per evitare accessi esterni non autorizzati.
        app.listen(PORT, "127.0.0.1");
    } catch (error) {
        console.error("Errore durante l'avvio del server:", error);
        process.exit(1);
    }
}

startServer();
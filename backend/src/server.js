import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Carica variabili ambiente --> salvate in memoria ram per tutta l'esecuzione del server
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

import app from "./app.js";

// Avvio server PDP
// questo server è isolato e si occupa solo di gestire le decisioni di autorizzazione e l'accesso al database per il controllo dei permessi.
// dividiamo le responsabilità tra il server proxy (Guard) e il server PDP per migliorare la sicurezza e la scalabilità dell'applicazione.
async function startServer() {
  try {
    // Connessione Mongo
    const connection = await connectDB();
    // connection.connection.name --> non va

    // Avvio server SOLO dopo DB
    const PORT = 4000;

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Server interno attivo su 127.0.0.1:${PORT}`);
      console.log(`DB in uso: ${process.env.DB_NAME}`);
    });

  } catch (err) {
    console.error("Errore avvio server interno:", err);
    process.exit(1);
  }
}

startServer();

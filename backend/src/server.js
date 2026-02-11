import dotenv from "dotenv";
import { initMongo } from "./config/dbManager.js";
import { startScheduler } from "./scheduler/scheduler.js";
import app from "./app.js";

// Carica variabili ambiente --> salvate in memoria ram per tutta l'esecuzione del server
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });
console.log("MONGODB_URI:", process.env.MONGODB_URI);

// Avvio server PDP
// questo server è isolato e si occupa solo di gestire le decisioni di autorizzazione e l'accesso al database per il controllo dei permessi.
// dividiamo le responsabilità tra il server proxy (Guard) e il server PDP per migliorare la sicurezza e la scalabilità dell'applicazione.
async function startServer() {
  try {
    // Connessione Mongo
    await initMongo();

    // Avvio server SOLO dopo DB
    const PORT = 4000;

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Server interno attivo su 127.0.0.1:${PORT}`);
      // Avvio lo scheduler solo una volta --> vive dentro il server interno decisionale
      startScheduler();
    });

  } catch (err) {
    console.error("Errore avvio server interno:", err);
    process.exit(1);
  }
}

startServer();

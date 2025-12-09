import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

// Carica variabili ambiente --> salvate in memoria ram per tutta l'esecuzione del server
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

// Il server principale funge anche da Guard (PEP) all’interno del modello di Access Control basato sui Ruoli (RBAC).
// La Guard intercetta tutte le richieste in ingresso e le inoltra a un servizio isolato chiamato PDP (Policy Decision Point).
//
// Il PDP è responsabile di determinare se l’utente è autorizzato a eseguire l’azione richiesta.
// 
// Per le richieste di autenticazione (ad esempio login o refresh token) il PDP concede sempre l’accesso,
// poiché si tratta di endpoint pubblici accessibili da utenti non autenticati.
//
// Per tutte le route protette da autorizzazione — attualmente tutte quelle sotto il prefisso /api/v1/ —
// la Guard invia al PDP le informazioni necessarie (utente, token, azione, risorsa).
//
// Il PDP (app.js) verifica:
//  - la validità del token (quindi l’utente deve essere autenticato);
//  - i ruoli associati all’utente;
//  - i permessi assegnati ai ruoli nel database;
//  - la corrispondenza tra il permesso richiesto e l’azione che l’utente vuole eseguire.
//
// In base alle policy RBAC definite nel database, il PDP restituisce una decisione (Permit o Deny),
// che la Guard applica consentendo o bloccando l’accesso alla risorsa richiesta.
//
// in riassunto: la Guard è un proxy che inoltra la richiesta al PDP e agisce in base alla risposta ricevuta.
async function startProxyServer() {
    try {
        const PORT = 5000;

        app.listen(PORT, () => {
            console.log(`Server/Guard avviato su http://localhost:${PORT}`);
            console.log(`DB in uso: ${process.env.DB_NAME}`);
        });
    } catch (error) {
        console.error("Errore durante l'avvio del server:", error);
        process.exit(1);
    }
}

startProxyServer();
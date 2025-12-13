import dotenv from "dotenv";

// Carica variabili ambiente --> salvate in memoria ram per tutta l'esecuzione del server
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

import app from "./proxyApp.js";

async function startProxyServer() {
    try {
        const PORT = 5000;

        app.listen(PORT, "127.0.0.1", () => {
            console.log(`Server Proxy avviato su 127.0.0.1:${PORT}`);
        });
    } catch (error) {
        console.error("Errore durante l'avvio del server:", error);
        process.exit(1);
    }
}

startProxyServer();


/* MODELLO RBAC
    Il server principale opera come proxy applicativo all’interno di un modello di Access Control basato sui Ruoli (RBAC).
    Il proxy rappresenta l’unico punto di ingresso per i client e gestisce tutte le richieste verso le API REST, accettando esclusivamente richieste che presentano un token valido negli header.

    All’interno di questa architettura, il modello RBAC è suddiviso nei seguenti componenti principali:

    1) PEP – Policy Enforcement Point (Guard / Proxy)
        Il PEP coincide con il proxy applicativo (Guard) e ha il compito di:
        - intercettare tutte le richieste in ingresso dai client;
        - verificare preliminarmente l’autenticazione dell’utente (presenza e validità del token);
        - tradurre la richiesta HTTP in un’azione autorizzativa (azione e risorsa);
        - inoltrare la richiesta di autorizzazione al PDP;
        - applicare la decisione restituita dal PDP, consentendo o bloccando l’accesso alla risorsa richiesta.
        Il PEP non contiene logica di policy e non conosce direttamente ruoli o permessi: si limita a far rispettare la decisione ricevuta.
        Il PEP è implementato come un proxy applicativo.
        Le sue responsabilità sono suddivise tra il server proxy e una serie di middleware:
        proxyServer / proxyApp --> intercettazione, routing, isolamento
        requireAuth --> autenticazione
        requireActiveUser --> stato utente
        rbacGuard --> enforcement RBAC (decisione PDP)

    2) PDP – Policy Decision Point
        Il PDP è un servizio isolato responsabile di determinare se un utente è autorizzato a eseguire una determinata operazione.
        
        Per gli endpoint di autenticazione (ad esempio login e refresh del token), il PDP concede sempre l’accesso, trattandosi di risorse pubbliche accessibili anche da utenti non autenticati;
        
        Per tutte le route protette (attualmente quelle sotto il prefisso /api/v1/), il PEP invia al PDP le informazioni necessarie alla decisione,
        tra cui: id utente, azione richiesta (derivata dal metodo HTTP), risorsa richiesta (endpoint normalizzato).
        Il PDP verifica quindi:
        - i ruoli associati all’utente;
        - i permessi assegnati a ciascun ruolo nel database;
        - la corrispondenza tra il permesso richiesto e l’azione che l’utente intende eseguire.
        Sulla base delle policy RBAC definite, il PDP restituisce una decisione esplicita (Permit o Deny), che il PEP applica immediatamente.
        Il PDP viene gestito in 3 parti:
        rbacDecisionController --> orchestrazione
        User/Role/Permission --> recupero dati
        MongoDB policy --> definizione policy

    3) PAP / PIP – Policy Administration Point e Policy Information Point
        Le componenti PAP e PIP sono implementate tramite il database MongoDB:
        - il PAP gestisce la definizione e l’amministrazione delle policy (ruoli, permessi, gerarchie);
        - il PIP fornisce al PDP le informazioni necessarie alla decisione, recuperando dati su utenti, ruoli e permessi.
*/
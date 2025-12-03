require("dotenv").config({ path: __dirname + "/../.env" });
const connectDB = require("./config/db");
const express = require("express");
const mongoose = require("mongoose");

const app = require("./app");

// Funzione per stampare tutte le collection, anche vuote
const listAllCollections = async () => {
    try {
        const db = mongoose.connection.db; // usa la connessione di Mongoose
        const collections = await db.listCollections({}, { nameOnly: true }).toArray();

        console.log("Collezioni nel DB:");
        if (collections.length === 0) {
            console.log("Nessuna collection trovata");
        } else {
            for (const col of collections) {
                // Recupera anche il numero di documenti nella collection
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
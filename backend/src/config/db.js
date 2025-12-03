const mongoose = require('mongoose');
const path = require('path');
// Assicurati che il percorso sia corretto rispetto a dove lanci il file
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        console.log("--- DEBUG CONNESSIONE ---");
        console.log("URI:", process.env.MONGO_URI);
        console.log("DB NAME:", process.env.DB_NAME); // Se questo è undefined, ecco il colpevole!
        
        // Usa solo l'URI base qui, il nome del DB lo passiamo nelle opzioni
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME, // <--- SPECIFICALO QUI ESPLICITAMENTE
            // useNewUrlParser e useUnifiedTopology non servono più nelle versioni recenti di Mongoose (6+), 
            // ma se usi la 5 lasciali.
        });

        console.log(`Database connesso con successo a: ${mongoose.connection.name}`);
    } catch (err) {
        console.error('Errore di connessione al database:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
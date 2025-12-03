const mongoose = require("mongoose");
const User = require("../models/Users");
const { generateAccessToken, generateRefreshToken } = require("../services/token.service");
const { comparePassword } = require("../services/auth.service");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// getAllUsers con debug corretto
exports.getAllUsers = async (req, res) => {
    try {
        console.log("--- DEBUG START ---");
        
        // 1. Verifica il nome del DB connesso
        console.log("DB Connesso (Mongoose):", mongoose.connection.name);
        
        // 2. TEST DIRETTO: Bypassiamo lo Schema Mongoose
        // Chiediamo direttamente al driver nativo di leggere la collection 'users'
        const rawUsers = await mongoose.connection.db.collection('users').find({}).toArray();
        
        console.log("RAW DRIVER RESULT (Dati Grezzi):", rawUsers);
        console.log("Numero documenti trovati (Grezzi):", rawUsers.length);

        // 3. Test Mongoose (Il tuo metodo standard)
        const mongooseUsers = await User.find();
        console.log("Mongoose Schema RESULT:", mongooseUsers);

        console.log("--- DEBUG END ---");

        res.status(200).json({
            dbName: mongoose.connection.name,
            rawCount: rawUsers.length,
            mongooseCount: mongooseUsers.length,
            data: mongooseUsers
        });

    } catch (error) {
        console.error("Errore critico:", error);
        res.status(500).json({ error: error.message });
    }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email e password richieste" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Credenziali errate" });
        }

        const valid = await comparePassword(password, user.auth.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: "Credenziali errate" });
        }

        // Payload del token (puoi aggiungere altri campi se servono)
        const payload = { id: user._id, email: user.email, role: user.role };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Salviamo l'hash del refresh token nel DB (per invalidarlo se serve)
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        user.auth.refreshTokens.push({ tokenHash: refreshTokenHash });
        await user.save();

        // Risposta al front-end
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Errore login:", error);
        res.status(500).json({ message: "Errore interno" });
    }
};

exports.register = async (req, res) => {
    // Implementa la logica di registrazione utente qui
    try {
        const { name, surname, email, password, role, securityNumber } = req.body;

        if (!name || !surname || !email || !password || !role || !securityNumber) {
            return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Utente già esistente" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            surname,
            email,
            role,
            securityNumber,
            auth: {
                passwordHash,
                refreshTokens: []
            }
        });

        await newUser.save();

        res.status(201).json({ message: "Utente registrato con successo" });

    } catch (error) {
        console.error("Errore registrazione:", error);
        res.status(500).json({ message: "Errore interno" });
    }       
}
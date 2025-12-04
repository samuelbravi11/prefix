const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const app = express();


app.use(cors({
  origin: "http://localhost:3000", // o "*" se vuoi permettere tutti
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // se vuoi inviare cookie o auth headers
}));


app.use(express.json());


app.use("/api/", userRoutes);


app.use("/", (req, res) => {
    res.send("API funzionante");
});




module.exports = app;
const express = require('express');
const userRoutes = require('./routes/userRoutes');




const app = express();


app.use(express.json());


app.use("/api/", userRoutes);


app.use("/", (req, res) => {
    res.send("API funzionante");
});




module.exports = app;
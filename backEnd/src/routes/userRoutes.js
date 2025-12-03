const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth.middleware');

// Applica il middleware di autenticazione a tutte le rotte definite in questo router
router.use(authMiddleware);

// Rotta per ottenere tutti gli utenti
router.get('/users', userController.getAllUsers);
router.post('/login', userController.login);
router.post('/register', userController.register);

module.exports = router;    

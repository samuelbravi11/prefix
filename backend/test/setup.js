// tests/setup.js
import 'dotenv/config'; // Carica il tuo .env se esiste

global.console.log = () => {}; // per silenziare gli output inutili di test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_super_secret_key';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test_refresh_token_secret_key';
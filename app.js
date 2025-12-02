import express from 'express';
import swaggerUi from 'swagger-ui-express';
import Path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);
console.log(__dirname);
const swaggerDocument = yaml.load(readFileSync(Path.join(__dirname, 'oas3.yaml'), 'utf8'));




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.get('/test', (req, res) => {
    let test = {
        message: "This is a test endpoint",
        status: "success"
    };
    res.status(200).json(test);
});


// Load OpenAPI (Swagger) document
//const swaggerDocument = yaml.load(readFileSync(Path.join(__dirname, '..', 'oas3.yaml'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;
// Handles authentication and routing for the application

import express from 'express'
import cookieParser from 'cookie-parser';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';

const app = express();

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

// Locate directory of resources
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {    // Send a login page
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

app.listen(PORT, () => {
    console.log(`Server active at http://127.0.0.1:${PORT}`);
});
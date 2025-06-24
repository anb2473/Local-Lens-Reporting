// Handles authentication and routing for the application

import express from 'express'
import cookieParser from 'cookie-parser';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import auth from './routes/auth/auth.js';
import user from './routes/user/user.js';
import authMiddleware from './middleware/authMiddleware.js';

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

app.get('/our-solution', (req, res) => {    // Send a login page
    res.sendFile(path.join(__dirname, 'public', 'our-solution.html'))
});

app.get('/about', (req, res) => {    // Send a login page
    res.sendFile(path.join(__dirname, 'public', 'about.html'))
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

app.get('/sign-up', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign-up.html'))
})

app.use('/auth', auth);                  // Use the auth routes
app.use('/user', authMiddleware, user)   // Link the auth middleware for requests to the user endpoints

app.listen(PORT, () => {
    console.log(`Server active at http://127.0.0.1:${PORT}`);
});
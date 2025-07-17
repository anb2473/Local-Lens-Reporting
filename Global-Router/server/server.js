// Handles authentication and routing for the application

import express from 'express'
import cookieParser from 'cookie-parser';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import auth from './routes/auth/auth.js';
import user from './routes/user/user.js';
import authMiddleware from './middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import prisma from './prismaClient.js';
import logger from './logger.js'; // adjust path as needed

const app = express();

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

// Locate directory of resources
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable rate limiting
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
});

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

app.get('/sign-up', async (req, res) => {
    try {
        const regions = await prisma.region.findMany();
        res.render('sign-up', { regions });
    } catch (error) {
        logger.error('Error fetching regions:', error);
        res.status(500).json({ error: 'Failed to fetch regions' });
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login')
    return;
});

app.use('/auth', authRateLimiter, auth);                  // Use the auth routes
app.use('/user', authMiddleware, user)   // Link the auth middleware for requests to the user endpoints

app.listen(PORT, () => {
    logger.info(`Server active at http://127.0.0.1:${PORT}`);
});
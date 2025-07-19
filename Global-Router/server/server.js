// Handles route endpoints and mounts /user and /auth routes
// and all frontend static files (auth frontend)
// other than EJS pages (user frontend)

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

// Define constants for configuration
const cooldownPeriod = 15 * 60 * 1000; // 15 minutes
const maxRequests = 5; // Max requests per IP

// Set function aliases for readability
const join = path.join;
const listRegions = prisma.region.findMany;

const app = express();

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

// Locate directory of resources
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up view engine for rendering EJS templates
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Define express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable rate limiting
const authRateLimiter = rateLimit({
    windowMs: cooldownPeriod,
    max: maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
});

// Expose static files (css, images)
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
    return res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.get('/our-solution', (req, res) => {
    return res.sendFile(join(__dirname, 'public', 'our-solution.html'));
});

app.get('/about', (req, res) => {
    return res.sendFile(join(__dirname, 'public', 'about.html'));
});

app.get('/login', (req, res) => {
    return res.sendFile(join(__dirname, 'public', 'login.html'));
})

app.get('/sign-up', async (req, res) => {
    try {
        const regions = await listRegions();
        res.render('sign-up', { regions });
    } catch (error) {
        logger.error('Error fetching regions:', error);
        res.status(500).json({ error: 'Failed to fetch regions' });
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    return res.redirect('/login');
});

app.use('/auth', authRateLimiter, auth);    // Use the auth routes
// Link the auth middleware for requests to the user endpoints
app.use('/user', authMiddleware, user);

app.listen(PORT, () => {
    logger.info(`Server active at http://127.0.0.1:${PORT}`);
});
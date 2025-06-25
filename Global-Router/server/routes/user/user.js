import express from 'express';
import prisma from '../../prismaClient.js';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';

const router = express.Router();

// Locate directory of resources
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(__filename, '..', '..', '..');

router.get('/search', async (req, res) => {
    const query = req.query.q || '';
    res.render('search', { query: query });
});

export default router;
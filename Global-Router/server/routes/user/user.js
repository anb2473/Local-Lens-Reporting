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
    try {
        const region = await prisma.region.findFirst({
            where: { name: query },
            include: {
                news: true
            }
        });
        
        const regions = await prisma.region.findMany({
            select: {
                name: true
            }
        });

        res.render('search', { 
            query: query, 
            region: region, 
            regions: regions,
            news: region?.news || []
        });
    } catch (error) {
        console.error('Error fetching region:', error);
        res.render('search', { 
            query: query, 
            error: 'Error fetching region data',
            regions: await prisma.region.findMany({
                select: {
                    name: true,
                },
            })
        });
    }
});

router.get('/post', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'post.html'));
    return;
});

router.post('/post', async (req, res) => {
    const { title, content } = req.body;
    const user = await prisma.user.findFirst({ where: { id: req.userID } });
    const region = await prisma.region.findFirst({ where: { id: user.regionId } });
    try {
        const post = await prisma.news.create({
            data: {
                title: title,
                content: content,
                region: { connect: { id: user.regionId } },
                user: { connect: { id: req.userID } }
            },
        });
        res.redirect(`/user/search?q=${region.name}`);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).send('Error creating post');
    }
});

export default router;
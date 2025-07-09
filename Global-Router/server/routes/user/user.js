import express from 'express';
import prisma from '../../prismaClient.js';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
// import {fetch, CookieJar} from 'node-fetch-cookies'

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
    res.render('post', { region: req.query.r || '' });
});

router.post('/post', async (req, res) => {
    const { title, content } = req.body;

    let jwt;
    try {
        const jwt_res = await fetch('http://validity-ai-server-service:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                passw: "passw0rd",
            })
        });

        if (!jwt_res.ok) {
            console.error('Failed to authenticate with AI server');
            return res.status(500).send('Failed to authenticate with AI server');
        }

        // Get the JWT from the response headers
        const setCookieHeader = jwt_res.headers.get('set-cookie');
        if (setCookieHeader) {
            const cookies = setCookieHeader.split(',');
            for (const cookie of cookies) {
                const parts = cookie.split(';')[0].split('=');
                if (parts[0].trim() === 'access_token') {
                    jwt = parts[1];
                    break;
                }
            }
        }

        if (!jwt) {
            console.error('No JWT found in response');
            return res.status(500).send('Failed to get JWT from AI server');
        }

        // Now verify title
        let titleRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${title.replaceAll(" ", "-")}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });
        let titleVerification = await titleRes.json();

        // Now verify content
        let contentRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${content.replaceAll(" ", "-")}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });
        let contentVerification = await contentRes.json();

        const regionName = req.query.r
        const user = await prisma.user.findFirst({ where: { id: req.userID } });

        let region;

        if (regionName === '') {
            region = await prisma.region.findFirst({ where: { id: regionId } });
        }
        else {
            region = await prisma.region.findFirst({ where: { name: regionName } });
        }

        const averagePlausibility = (contentVerification.average_plausibility + titleVerification.average_plausibility) / 2;

        const post = await prisma.news.create({
            data: {
                title: title,
                content: content,
                region: { connect: { id: region.id } },
                user: { connect: { id: req.userID } },
                titleReliability: titleVerification,
                contentReliability: contentVerification,
                averagePlausability: Math.floor(averagePlausibility * 100),
            },
        });
        res.redirect(`/user/search?q=${regionName}`);
    } catch (error) {
        console.error('Error in /post:', error);
        res.status(500).send('Error processing post');
    }
});

router.get('/news', async (req, res) => {
    const newsId = req.query.news;
    if (!newsId) {
        return res.status(400).send('News ID is required');
    }
    try {
        const news = await prisma.news.findUnique({
            where: { id: parseInt(newsId) },
        });

        if (!news) {
            return res.status(404).send('News not found');
        }

        res.render('news', { news });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).send('Error fetching news');
    }
})

export default router;
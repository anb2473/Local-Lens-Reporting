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
    res.sendFile(path.join(__dirname, 'public', 'post.html'));
    return;
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
            console.error('Failed to authentic.0ate with AI server');
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
        let titleVerification = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${title.replaceAll(" ", "-")}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });

        // Now verify content
        let contentVerification = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${content.replaceAll(" ", "-")}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });

        const regionName = req.query.r
        const user = await prisma.user.findFirst({ where: { id: req.userID } });

        if (regionName === '') {
            const region = await prisma.region.findFirst({ where: { id: regionId } });
        }
        else {
            const region = await prisma.region.findFirst({ where: { name: regionName } });
        }

        const post = await prisma.news.create({
            data: {
                title: title,
                content: content,
                region: { connect: { id: region.id } },
                user: { connect: { id: req.userID } },
                titleReliability: titleVerification ? titleVerification.json() : {},
                contentReliability: contentVerification ? contentVerification.json() : {},
            },
        });
        res.redirect(`/user/search?q=${regionName}`);
    } catch (error) {
        console.error('Error in /post:', error);
        res.status(500).send('Error processing post');
    }
});

export default router;
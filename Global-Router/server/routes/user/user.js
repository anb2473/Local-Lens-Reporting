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
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];
    
    try {
        const region = await prisma.region.findFirst({
            where: { name: query },
            include: {
                news: {
                    where: {
                        createdAt: {
                            gte: new Date(selectedDate + 'T00:00:00.000Z'),
                            lt: new Date(selectedDate + 'T23:59:59.999Z')
                        }
                    }
                }
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
            selectedDate: selectedDate,
            news: region?.news || []
        });
    } catch (error) {
        console.error('Error fetching region:', error);
        const regions = await prisma.region.findMany({
            select: {
                name: true,
            },
        });
        res.render('search', { 
            query: query, 
            region: null,
            regions: regions,
            selectedDate: selectedDate,
            error: 'Error fetching region data'
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
        // --- Name scanner start ---
        const allUsers = await prisma.user.findMany({ select: { id: true, fname: true, lname: true, email: true } });
        const referencedUsers = allUsers.filter(user => {
            const fullName = `${user.fname} ${user.lname}`.toLowerCase();
            return content.toLowerCase().includes(fullName);
        });

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
        let titleRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${title.replaceAll(" ", "-")}` , {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });
        let titleVerification = await titleRes.json();

        // Now verify content
        let contentRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${content.replaceAll(" ", "-")}` , {
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
                referencedUsers: referencedUsers,
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

router.get('/dashboard', async (req, res) => {
    try {
        const user = await prisma.user.findFirst({
            where: { id: req.userID },
            include: {
                news: {
                    include: {
                        region: true,
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
            },
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('dash', { user });
    } catch (error) {
        console.error('Error fetching user dashboard:', error);
        res.status(500).send('Error fetching dashboard');
    }
});

router.post('/edit-post', async (req, res) => {
    const { postId, title, content } = req.body;
    
    try {
        // Verify the post belongs to the current user
        const post = await prisma.news.findFirst({
            where: {
                id: parseInt(postId),
                userId: req.userID
            }
        });

        if (!post) {
            return res.status(404).send('Post not found or unauthorized');
        }

        // Get JWT for AI verification
        let jwt;
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
            return res.status(500).send('Failed to authenticate with AI server');
        }

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
            return res.status(500).send('Failed to get JWT from AI server');
        }

        // Verify new title and content
        const titleRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${title.replaceAll(" ", "-")}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });
        const titleVerification = await titleRes.json();

        const contentRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${content.replaceAll(" ", "-")}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });
        const contentVerification = await contentRes.json();

        const averagePlausibility = (contentVerification.average_plausibility + titleVerification.average_plausibility) / 2;

        // Update the post
        await prisma.news.update({
            where: { id: parseInt(postId) },
            data: {
                title: title,
                content: content,
                titleReliability: titleVerification,
                contentReliability: contentVerification,
                averagePlausability: Math.floor(averagePlausibility * 100),
            }
        });

        res.status(200).send('Post updated successfully');
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).send('Error updating post');
    }
});

router.post('/delete-post', async (req, res) => {
    const { postId } = req.body;
    
    try {
        // Verify the post belongs to the current user
        const post = await prisma.news.findFirst({
            where: {
                id: parseInt(postId),
                userId: req.userID
            }
        });

        if (!post) {
            return res.status(404).send('Post not found or unauthorized');
        }

        // Delete the post
        await prisma.news.delete({
            where: { id: parseInt(postId) }
        });

        res.status(200).send('Post deleted successfully');
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Error deleting post');
    }
});

router.get('/chat-dash', async (req, res) => {
    try {
        const user = await prisma.user.findFirst({
            where: { id: req.userID },
            include: {
                news: {
                    include: {
                        region: true,
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                chats: {
                    include: {
                        participants: true,
                        messages: {
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 1
                        }
                    }
                },
            },
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const chats = user.chats || [];
        res.render('chat-dash', { chats: chats })
    } catch (error) {
        console.error('Error fetching chat dashboard:', error);
        res.status(500).send('Error fetching chat dashboard');
    }
})

router.get('/chat', async (req, res) => {
    try {
        const chatId = parseInt(req.query.id);
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
            },
            include: {
                messages: {
                    include: {
                        owner: true
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                participants: true
            }
        });

        if (!chat) {
            return res.status(404).send('Chat not found');
        }

        res.render('chat', { chat: chat, userId: req.userID });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).send('Error fetching chat');
    }
})

router.post('/chat', async (req, res) => {
    try {
        const { chatId, content } = req.body;
        
        if (!chatId || !content) {
            return res.status(400).send('Chat ID and content are required');
        }

        // Verify the chat exists and user is a participant
        const chat = await prisma.chat.findFirst({
            where: {
                id: parseInt(chatId),
                participants: {
                    some: {
                        id: req.userID
                    }
                }
            }
        });

        if (!chat) {
            return res.status(404).send('Chat not found or unauthorized');
        }

        // Create the message
        const message = await prisma.message.create({
            data: {
                content: content,
                chatId: parseInt(chatId),
                userId: req.userID
            }
        });

        // Redirect back to the chat
        res.redirect(`/user/chat?id=${chatId}`);
    } catch (error) {
        console.error('Error posting chat:', error);
        res.status(500).send('Error posting chat');
    }
})

router.get('/mk-chat', async (req, res) => {
    const users = await prisma.user.findMany({
        where: {
            id: {
                not: req.userID
            }
        }
    });
    res.render('mk-chat', { users });
})

router.post('/mk-chat', async (req, res) => {
    const { chatName, participants } = req.body;
    
    try {
        // Validate input
        if (!chatName || !participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).send('Chat name and at least one participant are required');
        }

        // Get user IDs for participants (including current user)
        const participantEmails = [...participants, req.userID];
        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: participants
                }
            }
        });

        // Add current user to participants
        const currentUser = await prisma.user.findUnique({
            where: { id: req.userID }
        });

        if (!currentUser) {
            return res.status(404).send('Current user not found');
        }

        const allParticipants = [...users, currentUser];

        // Create the chat
        const chat = await prisma.chat.create({
            data: {
                name: chatName,
                participants: {
                    connect: allParticipants.map(user => ({ id: user.id }))
                }
            }
        });

        // Redirect to the chat dashboard
        res.redirect('/user/chat-dash');
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).send('Error creating chat');
    }
})

export default router;
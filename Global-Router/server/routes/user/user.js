// Handles user API endpoints and EJS frontend

import express from 'express';
import prisma from '../../prismaClient.js';
import sanitizer from 'sanitizer';
import logger from '../../logger.js';

const router = express.Router();

// Define constants for configuration
const dayStart = 'T00:00:00.000Z';
const dayEnd = 'T23:59:59.999Z';

// Set function aliases for readability
const sanitizeInput = sanitizer.sanitize;
const listRegions = prisma.region.findMany;
const listUsers = prisma.user.findMany;
const findRegion = prisma.region.findFirst;
const findUser = prisma.user.findUnique;
const findNews = prisma.news.findFirst;
const findChat = prisma.chat.findFirst;
const deleteNews = prisma.news.delete;
const findUsers = prisma.user.findMany;
const mkChat = prisma.chat.create;
const mkMessage = prisma.message.create;
const updateUser = prisma.user.update;
const mkNews = prisma.news.create;
const updateNews = prisma.news.update;

router.get('/search', async (req, res) => {
    try {
        const query = sanitizeInput(req.query.q) || '';
        const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

        const region = await prisma.region.findFirst({
            where: { name: query },
            include: {
                news: {
                    where: {
                        createdAt: {
                            // Created between start and end of the day
                            gte: new Date(selectedDate + dayStart),
                            lt: new Date(selectedDate + dayEnd)
                        }
                    }
                }
            }
        });
        
        const regions = await listRegions({
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
        logger.error('Error fetching region:', error);
        // Generate redundancy page
        const regions = await listRegions({
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
    return res.render('post', { region: req.query.r || '' });
});

router.post('/post', async (req, res) => {
    try {
        const body = req.body;
        const title = sanitizeInput(body.title);
        const content = sanitizeInput(body.content);
    
        let jwt;
        // Scan text for any user references
        const allUsers = await listUsers({ 
            select: { 
                id: true, 
                fname: true, 
                lname: true, 
                email: true 
            } 
        });
        // Extract name for each user and check if exists in content
        const lowercaseContent = content.toLowerCase()
        const referencedUsers = allUsers.filter(user => {
            const fullName = `${user.fname} ${user.lname}`.toLowerCase();
            return lowercaseContent.includes(fullName);
        });

        // Login to AI server to get JWT
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
            logger.error('Failed to authenticate with AI server');
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
            logger.error('No JWT found in response');
            return res.status(500).send('Failed to get JWT from AI server');
        }

        // Verify title
        let titleRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${title.replaceAll(" ", "-")}` , {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });
        let titleVerification = await titleRes.json();

        // Verify content
        let contentRes = await fetch(`http://validity-ai-server-service:8000/api/ta?claim=${content.replaceAll(" ", "-")}` , {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${jwt}`,
            },
        });
        let contentVerification = await contentRes.json();

        const regionName = req.query.r

        let region;

        // If no region name provided use users region
        if (regionName !== '') {
            region = await findRegion({
                where: {
                    name: regionName
                }
            });
        }
        else {
            region = await findRegion({ 
                where: { 
                    id: req.userID 
                } 
            });
        }

        const averagePlausibility = (contentVerification.average_plausibility + titleVerification.average_plausibility) / 2;

        const post = await mkNews({
            data: {
                title: title,
                content: content,
                // Link post to user and region
                region: { connect: { id: region.id } },
                user: { connect: { id: req.userID } },
                titleReliability: titleVerification,
                contentReliability: contentVerification,
                averagePlausability: Math.floor(averagePlausibility * 100),
                referencedUsers: referencedUsers,
            },
        });
        return res.redirect(`/user/search?q=${regionName}`);
    } catch (error) {
        logger.error('Error in /post:', error);
        return res.status(500).send('Error processing post');
    }
});

router.get('/news', async (req, res) => {
    const newsId = parseInt(req.query.news);
    if (isNaN(newsId)) {
        return res.status(400).send('Invalid post ID');
    }
    
    try {
        const news = await findNews({
            where: { id: parseInt(newsId) },
            include: {
                user: {
                    select: {
                        fname: true,
                        lname: true,
                        email: true
                    }
                }
            }
        });

        if (!news) {
            return res.status(404).send('News not found');
        }

        res.render('news', { news });
    } catch (error) {
        logger.error('Error fetching news:', error);
        res.status(500).send('Error fetching news');
    }
})

router.get('/dashboard', async (req, res) => {
    try {
        const user = await findUser({
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

        return res.render('dash', { user });
    } catch (error) {
        logger.error('Error fetching user dashboard:', error);
        return res.status(500).send('Error fetching dashboard');
    }
});

router.post('/edit-post', async (req, res) => {
    try {
        const postId = parseInt(req.body.postId);
        if (isNaN(postId)) {
            res.status(400).send('Invalid post ID')
        }
        const title = sanitizer.sanitize(req.body.title);
        const content = sanitizer.sanitize(req.body.content);
        
        // Verify the post belongs to the current user
        const post = await findNews({
            where: {
                id: postId,
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
        await updateNews({
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
        logger.error('Error updating post:', error);
        res.status(500).send('Error updating post');
    }
});

router.post('/delete-post', async (req, res) => {
    try {
        const postId = parseInt(req.body.postId);
        if (isNaN(postId)) {
            return res.status(400).send('Invalid post ID');
        }
    
        // Verify the post belongs to the current user
        const post = await findNews({
            where: {
                id: postId,
                userId: req.userID
            }
        });

        if (!post) {
            return res.status(404).send('Post not found or unauthorized');
        }

        await deleteNews({
            where: { 
                id: parseInt(postId) 
            }
        });

        return res.status(200).send('Post deleted successfully');
    } catch (error) {
        logger.error('Error deleting post:', error);
        return res.status(500).send('Error deleting post');
    }
});

router.get('/chat-dash', async (req, res) => {
    try {
        const user = await findUser({
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
        return res.render('chat-dash', { chats: chats })
    } catch (error) {
        logger.error('Error fetching chat dashboard:', error);
        return res.status(500).send('Error fetching chat dashboard');
    }
})

router.get('/chat', async (req, res) => {
    try {
        const chatId = parseInt(req.query.id);
        const chat = await findChat({
            where: {
                id: chatId,
            },
            include: {
                messages: {
                    include: {
                        owner: true,
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

        return res.render('chat', { chat: chat, userId: req.userID });
    } catch (error) {
        logger.error('Error fetching chat:', error);
        return res.status(500).send('Error fetching chat');
    }
})

router.post('/chat', async (req, res) => {
    try {
        const chatId = parseInt(req.body.chatId);
        if (isNaN(chatId)) {
            res.status(400).send('Invalid post ID');
        }
        const content = sanitizeInput(req.body.content);

        if (!chatId || !content) {
            return res.status(400).send('Chat ID and content are required');
        }

        // Verify the chat exists and user is a participant
        const chat = await findChat({
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
        const message = await mkMessage({
            data: {
                content: content,
                chatId: parseInt(chatId),
                userId: req.userID
            }
        });

        // Redirect back to the chat
        return res.redirect(`/user/chat?id=${chatId}`);
    } catch (error) {
        logger.error('Error posting chat:', error);
        return res.status(500).send('Error posting chat');
    }
})

router.get('/mk-chat', async (req, res) => {
    const users = await findUsers({
        where: {
            id: {
                not: req.userID
            }
        }
    });

    // Support pre-selecting participants by ID via query param
    let preselectedUsers = [];
    if (req.query.participants) {
        const ids = req.query.participants.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
            preselectedUsers = await findUsers({
                where: {
                    id: { in: ids }
                }
            });
        }
    }

    return res.render('mk-chat', { users, preselectedUsers });
})

router.post('/mk-chat', async (req, res) => {
    const body = req.body;
    const chatName = sanitizeInput(body.chatName);
    const participants = body.participants;
    
    try {
        // Validate input
        if (!chatName || !participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).send('Chat name and at least one participant are required');
        }

        // Get user IDs for participants (including current user)
        const users = await findUsers({
            where: {
                email: {
                    in: participants
                }
            }
        });

        // Add current user to participants
        const currentUser = await findUser({
            where: {
                id: req.userID 
            }
        });

        if (!currentUser) {
            return res.status(404).send('Current user not found');
        }

        const allParticipants = [...users, currentUser];

        // Create the chat
        const chat = await mkChat({
            data: {
                name: chatName,
                participants: {
                    connect: allParticipants.map(user => ({ id: user.id }))
                }
            }
        });

        // Redirect to the chat dashboard
        return res.redirect('/user/chat-dash');
    } catch (error) {
        logger.error('Error creating chat:', error);
        return res.status(500).send('Error creating chat');
    }
})

router.post('/update-profile', async (req, res) => {
    try {
        const { fname, lname } = req.body;
        if (!fname || !lname) {
            return res.status(400).json({ error: 'First and last name are required' });
        }
        const updated = await updateUser({
            where: { id: req.userID },
            data: { fname, lname }
        });
        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating profile:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

router.get('/download', async (req, res) => {
    try {
        const { region, date, format } = req.query;
        
        // Validate required parameters
        if (!region || !date || !format) {
            return res.status(400).json({ error: 'Region, date, and format are required' });
        }
        
        // Validate format
        if (!['markdown', 'json'].includes(format)) {
            return res.status(400).json({ error: 'Format must be either "markdown" or "json"' });
        }
        
        // Find the region
        const foundRegion = await findRegion({
            where: { name: region }
        });
        
        if (!foundRegion) {
            return res.status(404).json({ error: 'Region not found' });
        }
        
        // Get news stories for the region and date, ordered by plausibility
        const newsStories = await prisma.news.findMany({
            where: {
                regionId: foundRegion.id,
                createdAt: {
                    gte: new Date(date + 'T00:00:00.000Z'),
                    lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000) // Next day
                }
            },
            orderBy: {
                averagePlausability: 'desc'
            },
            include: {
                user: {
                    select: {
                        fname: true,
                        lname: true
                    }
                }
            }
        });
        
        if (newsStories.length === 0) {
            return res.status(404).json({ error: 'No news stories found for this region and date' });
        }
        
        let content, filename, contentType;
        
        if (format === 'markdown') {
            // Generate Markdown content
            content = `# News Stories for ${region} - ${date}\n\n`;
            content += `Generated on ${new Date().toLocaleDateString()}\n\n`;
            
            newsStories.forEach((story, index) => {
                content += `## ${index + 1}. ${story.title}\n\n`;
                content += `**Plausibility Score:** ${story.averagePlausability}\n\n`;
                content += `**Content:** ${story.content}\n\n`;
                if (story.user) {
                    content += `**Author:** ${story.user.fname} ${story.user.lname}\n\n`;
                }
                content += `**Date:** ${new Date(story.createdAt).toLocaleDateString()}\n\n`;
                content += `---\n\n`;
            });
            
            filename = `${region}_${date}_news.md`;
            contentType = 'text/markdown';
        } else {
            // Generate JSON content
            const jsonData = {
                region: region,
                date: date,
                generatedAt: new Date().toISOString(),
                totalStories: newsStories.length,
                stories: newsStories.map(story => ({
                    id: story.id,
                    title: story.title,
                    content: story.content,
                    averagePlausability: story.averagePlausability,
                    createdAt: story.createdAt,
                    author: story.user ? {
                        fname: story.user.fname,
                        lname: story.user.lname
                    } : null
                }))
            };
            
            content = JSON.stringify(jsonData, null, 2);
            filename = `${region}_${date}_news.json`;
            contentType = 'application/json';
        }
        
        // Set headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
        
        // Send the file content
        res.send(content);
        
        logger.info(`Download generated for region: ${region}, date: ${date}, format: ${format}`);
        
    } catch (error) {
        logger.error('Error generating download:', error);
        res.status(500).json({ error: 'Failed to generate download' });
    }
});

export default router;
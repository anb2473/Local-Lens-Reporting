import express from 'express';
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SALT_ROUNDS = 10;

// LOGIN
router.post('/login', async (req, res) => {
    const { email, passw } = req.body;

    const user = await prisma.user.findFirst({
        where: { email }
    });

    if (!user) {
        return res.status(404).json({ err: 'Incorrect password or email' });
    }

    const match = await bcrypt.compare(passw, user.passw);
    if (match) {
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Set JWT token in HTTP-only cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Authentication successful
        return res.status(200).json({ message: 'Login successful' });
    } else {
        // Authentication failed
        return res.status(401).json({ err: 'Incorrect password or email' });
    }
});

// SIGN-UP
router.post('/sign-up', async (req, res) => {
    const { email, passw, fname, lname, loc } = req.body;

    let region = await prisma.region.findFirst({ where: { name: loc } });
    if (!region) {
        // Create region with name and get its ID
        region = await prisma.region.create({
            data: { name: loc }
        });
        
        // Ban IP if creating regions too frequently
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipLog = await prisma.ipLog.findFirst({
            where: { ip }
        });

        if (ipLog && ipLog.requestCount > 10) {
            await prisma.ipLog.update({
                where: { ip },
                data: {
                    banned: true,
                    banReason: 'Creating too many regions'
                }
            });
        }
    }

    let region_id = region.id;

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
        return res.status(400).json({ err: 'User already exists' });
    }

    try {
        const passw_hash = await bcrypt.hash(passw, SALT_ROUNDS);

        const newUser = await prisma.user.create({
            data: {
                email,
                passw: passw_hash,
                fname,
                lname,
                regionId: region_id
            }
        });

        // Generate JWT token for new user
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Set JWT token in HTTP-only cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err: 'Internal server error' });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    res.clearCookie('jwt');
    return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
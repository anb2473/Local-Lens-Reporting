import express from 'express';
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sanitizer from 'sanitizer';
import logger from '../../logger.js';
import validator from 'validator';
const router = express.Router();

const SALT_ROUNDS = 10;
const maxJWTAge = 24 * 60 * 60 * 1000; // 24 hrs in ms
const minPasswLen = 6;
const JWT_SECRET = process.env.SECRET_KEY;

// Set function aliases for readability
const isValid = validator.isEmail;
const genJWT = jwt.sign;
const findUser = prisma.user.findFirst;
const checkPassw = bcrypt.compare;
const sanitizeInput = sanitizer.sanitize;
const updateIPLog = prisma.ipLog.update;
const findIPLog = prisma.ipLog.findFirst;
const findOrCreateRegion = prisma.region.upsert

router.post('/login', async (req, res) => {
    const body = req.body
    const email = body.email.trim();
    const passw = body.passw;

    if (!isValid(email)) {
        return res.status(400).json({ err: 'Invalid email format' });
    }
    if (typeof passw !== 'string') {     // Input validation
        return res.status(400).json({ err: 'Invalid password' });
    }

    const user = await findUser({
        where: {
            email: email 
        }
    });

    if (!user) {
        return res.status(404).json({ err: 'Incorrect password or email' });
    }

    const passwCorrect = await checkPassw(passw, user.passw);
    if (passwCorrect) {
        // Generate JWT token
        const token = genJWT(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set JWT token in HTTP-only cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
            sameSite: 'strict',
            maxAge: maxJWTAge
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
    const body = req.body;
    const email = body.email.trim();
    const passw = body.passw;
    const fname = sanitizeInput(body.fname).trim();
    const lname = sanitizeInput(body.lname).trim();
    const loc = sanitizeInput(body.loc).trim();

    if (!isValid(email)) {
        return res.status(400).json({ err: 'Invalid email format' });
    }
    if (typeof passw !== 'string' || passw.length < minPasswLen) {
        return res.status(400).json({ err: 'Password must be at least 6 characters' });
    }
    if (!fname || !lname || !loc) {
        return res.status(400).json({ err: 'All fields are required' });
    }
    
    let region = await prisma.region.findFirst({ 
        where: {
            name: loc
        }
    });

    if (!region) {
        // Create region with name and get its ID
        region = await findOrCreateRegion({
            where: { name: loc },
            update: {},
            create: { name: loc }
        });
        
        // Ban IP if creating regions too frequently
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipLog = await findIPLog({
            where: { 
                ip: ip
            }
        });

        if (ipLog && ipLog.requestCount > 10) {
            await updateIPLog({
                where: { 
                    ip: ip
                 },
                data: {
                    banned: true,
                    banReason: 'Creating too many regions'
                }
            });
        }
    }

    let region_id = region.id;

    const existing = await findUser({ 
        where: {
            email: email
        }
    });

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
        const token = genJWT(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set JWT token in HTTP-only cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: maxJWTAge
        });

        return res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ err: 'Internal server error' });
    }
});

export default router;
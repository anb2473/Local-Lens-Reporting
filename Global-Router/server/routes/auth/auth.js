import express from 'express';
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';

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
        // Authentication successful
        return res.status(200).json({ message: 'Login successful' });
    } else {
        // Authentication failed
        return res.status(401).json({ err: 'Incorrect password or email' });
    }
});

// SIGN-UP
router.post('/sign-up', async (req, res) => {
    const { email, passw, fname, lname } = req.body;

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
        return res.status(400).json({ err: 'User already exists' });
    }

    try {
        const passw_hash = await bcrypt.hash(passw, SALT_ROUNDS);

        await prisma.user.create({
            data: {
                email,
                passw: passw_hash,
                fname,
                lname
            }
        });

        return res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        return res.status(500).json({ err: 'Internal server error' });
    }
});

export default router;
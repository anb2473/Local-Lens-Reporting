import express from 'express';
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

const SALT_ROUNDS = 10; // A higher number increases security but also computation time

router.get('/login', (req, res) => {
    let data = req.json();
    let email = data.email;
    let passw = data.passw

    let user = prisma.user.findFirst({
        where: {
            email: email,
        }
    })

    if (!user) {
        return res.status(404).json({ error: 'Incorrect password or email' });
    }

    bcrypt.compare(passw, user.passw, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (result) {
            // Authentication successful
            return res.status(200).json({ message: 'Login successful' });
        } else {
            // Authentication failed
            return res.status(401).json({ error: 'Incorrect password or email' });
        }
    })
});

router.get('/sign-up', (req, res) => {
    data = req.json();
    let email = data.email;
    let passw = data.passw;
    let fname = data.fname;
    let lname = data.lname;

    // Hashing a password
    passw_hash = bcrypt.hash(passw, SALT_ROUNDS, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        hash
    });

    let user = prisma.user.create({
        data: {
            email: email,
            passw: passw_hash,
            fname: fname,
            lname: lname
        }
    });

    if (!user) {
        return res.status(400).json({ error: 'User already exists' });
    }

    return res.status(201).json({ message: 'User created successfully' });
});

export default {router};
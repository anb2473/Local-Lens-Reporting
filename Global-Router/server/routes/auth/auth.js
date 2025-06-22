import express from 'express';
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

const SALT_ROUNDS = 10; // A higher number increases security but also computation time

router.post('/login', (req, res) => {
    const { email, passw } = req.body;

    let user = prisma.user.findFirst({
        where: {
            email: email,
        }
    })

    if (!user) {
        return res.status(404).err('Incorrect password or email');
    }

    bcrypt.compare(passw, user.passw, (err, result) => {
        if (err) {
            return res.status(500).err('Internal server error');
        }
        if (result) {
            // Authentication successful
            return res.status(200).err('Login successful');
        } else {
            // Authentication failed
            return res.status(401).err('Incorrect password or email');
        }
    })
});

router.post('/sign-up', (req, res) => {
    const { email, passw, fname, lname } = req.body;

    // Hashing a password
    passw_hash = bcrypt.hash(passw, SALT_ROUNDS, (err, hash) => {
        if (err) {
            return res.status(500).err('Internal server error');
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
        return res.status(400).err('User already exists');
    }

    return res.status(201).err('User created successfully');
});

export default {router};
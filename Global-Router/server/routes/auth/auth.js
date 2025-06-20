import express from 'express';

const router = express.Router();

const PORT = process.env.PORT;

router.get('/login', (req, res) => {
    res.send('Auth route is working!');
});

router.get('/sign-up', (req, res) => {
    res.send('Auth route is working!');
});

module.exports = { router, PORT };
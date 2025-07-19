// Protects /user endpoints by checking for a valid JWT in cookies

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SECRET_KEY;

function authMiddleware(req, res, next) {
    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        
        // Attatch userId from JWT for EJS
        req.userID = decoded.userId;
        next(); // Route user to user pages
    });
}

export default authMiddleware;
import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.userID = decoded.userId;
        next(); // Route user to user pages
    });
}

export default authMiddleware;
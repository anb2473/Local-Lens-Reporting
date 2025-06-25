import prisma from '../prismaClient.js';

const getIp = (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
};

export const trackIp = async (req, res, next) => {
    const ip = getIp(req);
    
    // Track IP usage
    const existingIp = await prisma.ipLog.findFirst({
        where: { ip },
        orderBy: { createdAt: 'desc' }
    });

    if (existingIp && existingIp.banned) {
        return res.status(403).json({
            error: existingIp.banReason
        });
    }

    // Create or update IP log
    await prisma.ipLog.upsert({
        where: { ip },
        update: {
            lastUsed: new Date(),
            requestCount: {
                increment: 1
            }
        },
        create: {
            ip,
            requestCount: 1
        }
    });

    next();
};

export const banIp = async (ip) => {
    await prisma.ipLog.upsert({
        where: { ip },
        update: {
            banned: true,
            banReason: 'Suspicious activity detected'
        },
        create: {
            ip,
            banned: true,
            banReason: 'Suspicious activity detected'
        }
    });
};

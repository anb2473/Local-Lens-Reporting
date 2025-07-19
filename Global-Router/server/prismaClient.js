import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// No custom integration
const prisma = new PrismaClient();

export default prisma;
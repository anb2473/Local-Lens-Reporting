FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npx prisma generate

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "run", "prod"]
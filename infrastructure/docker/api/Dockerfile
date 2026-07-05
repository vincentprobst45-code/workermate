FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 3001

CMD ["node","dist/main"]
FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expõe a porta que o Render usa
EXPOSE 10000

CMD ["node", "index.js"]

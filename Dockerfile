FROM node:16

# Create app directory
WORKDIR /app


RUN apt-get update
RUN apt-get install ffmpeg -y


COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]

FROM node:8

LABEL author="Alex Mubarakshin"

WORKDIR /application

COPY /package.json ./

RUN npm install

COPY /client ./client
COPY /server.js ./

ENV PORT 8080

CMD ["sh", "-c", "node server.js -p ${PORT}"]
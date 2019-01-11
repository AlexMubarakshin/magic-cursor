const path = require('path');
const args = require('minimist')(process.argv.slice(2));
const PORT = args['p'] || 8080;

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const users = {};

app.use('/resources', express.static(path.resolve('./client')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve('./client/index.html'));
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve('./client/favicon.ico'));
});

io.on('connection', (socket) => {
    console.log('a user connected: ', socket.id);

    users[socket.id] = {
        userID: socket.id,
    };

    socket.emit('connected-users', users);

    socket.broadcast.emit('new-user-connected', users[socket.id]);

    socket.on('disconnect', () => {
        console.log('user disconnected: ', socket.id);
        delete users[socket.id];

        io.emit('disconnect', socket.id);
    });

    socket.on('cursor-movement', (movementData) => {
        users[socket.id].x = movementData.x;
        users[socket.id].y = movementData.y;

        socket.broadcast.emit('cursor-movement', users[socket.id]);
    });
});

server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}!`);
});
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const Poll = require('./model/poll');
const db = require('./config/db');
const { dot } = require('dotenv');


db();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

app.use(express.json())
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}));


// Add your Socket.io and Express configurations here
io.on('connection', (socket) => {
    const users = [];

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('pollData', async (data) => {
        try {
            const poll = new Poll(data);
            await poll.save();
            io.emit('pollData', { ...data, _id: poll._id });
        } catch (error) {
            console.error(error);
        }
    });

    socket.on('submitPoll', async (data) => {
        try {
            const poll = await Poll.findById(data.id);

            if (!poll) {
                return console.error('Poll not found');
            }
            const votes = poll.votes;

            votes.set(data.selected, (votes.get(data.selected) || 0) + 1);

            await poll.save();

            io.emit('submitPoll', { ...data, votes, totalClients: io.sockets.sockets.size });
        } catch (error) {
            console.error(error);
        }
    })

    // make a live poll using socket
    socket.on('vote', (vote) => {
        io.emit('vote', vote);
    });

    socket.on('role', (role) => {
        console.log('Role:', role);
    })

    socket.on('addName', (name) => {
        console.log('Name:', name);
        users.push(name);
        io.emit('addName', users);
    })

    console.log(users);


    // make a live chat using socket
    // socket.on('chat message', (msg) => {
    //     console.log('message: ' + msg);
    //     io.emit('chat message', msg);
    // });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
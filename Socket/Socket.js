import { Server } from 'socket.io';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

// CORS configuration fix: methods should be an array, not a string
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

export const getreciversocketid=(userId)=>userSocketMap[userId];


const userSocketMap = {}; // Maps userId -> socket.id


io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User connected - userId: ${userId}, socketId: ${socket.id}`);
    }

    // Emit current online users
    io.emit('getOnlineUser', Object.keys(userSocketMap));

    socket.on('disconnect', () => {
        if (userId) {
            console.log(`User disconnected - userId: ${userId}, socketId: ${socket.id}`);
            delete userSocketMap[userId]; // Corrected from () to []
        }

        // Emit updated list of online users
        io.emit('getOnlineUser', Object.keys(userSocketMap));
    });
});

export { app, server, io };

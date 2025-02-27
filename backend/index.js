import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://chat-frontend-nine-beige.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Enable both WebSocket and polling
  path: "/socket.io/", // Explicit path
});

const port = process.env.PORT || 4000;

// Add basic health check route
app.get("/", (req, res) => {
  res.send("Socket.IO server is running");
});

// Add CORS middleware
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://chat-frontend-nine-beige.vercel.app"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

let messages = [];
let rooms = [];
let users = [];
let roomMessages = [];

io.on("connect", (socket) => {
  socket.on("disconnect", () => {
    const index = users.findIndex((user) => user.id === socket.id);
    if (index !== -1) {
      users.splice(index, 1);
    }
    console.log({ users });
  });
  socket.on("message", (message, callback) => {
    messages.push(message);
    callback({
      status: "ok",
    });
    io.emit("reply", messages);
  });

  socket.on("create", (roomId, name, userId, callback) => {
    const userExisted = users.find((user) => user.id === userId);
    if (!userExisted) {
      users.push({
        name,
        id: socket.id,
      });
    }

    const currentRoom = rooms.find((room) => room.id === roomId);
    console.log(currentRoom);
    if (!currentRoom) {
      rooms.push({
        id: roomId,
        userIds: [socket.id],
        name,
      });
    } else {
      currentRoom.userIds = [...currentRoom.userIds, socket.id];
    }
    socket.join(roomId);
    const roomIdMessages = roomMessages.filter(
      (message) => message.roomId === roomId
    );
    io.to(roomId).emit("room reply", roomIdMessages);
    callback({
      status: "ok",
    });
  });

  socket.on("leave", (roomId) => {
    socket.leave(roomId);
    const currentRoom = rooms.find((room) => room.id === roomId);
    if (currentRoom) {
      currentRoom.userIds = currentRoom.userIds.filter(
        (id) => id !== socket.id
      );
      if (currentRoom?.userIds.length === 0) {
        const index = rooms.findIndex((room) => room.id === roomId);
        if (index !== -1) {
          rooms.splice(index, 1);
        }
      }
    }
  });

  socket.on("room message", (message, roomId, userId, name) => {
    roomMessages.push({
      message,
      roomId,
      userId,
      name,
    });
    const roomIdMessages = roomMessages.filter(
      (message) => message.roomId === roomId
    );
    io.to(roomId).emit("room reply", roomIdMessages);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.6:3000"],
  },
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello");
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

server.listen(8080, () => {
  console.log("Server running on port 8080");
});

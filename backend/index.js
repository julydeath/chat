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
  console.log(socket.id, "user joined");
  //   users.push({
  //     username,
  //   });
  socket.on("disconnect", () => {
    users.filter((user) => user.id === socket.id);
    console.log({ users });
  });
  socket.on("message", (message, callback) => {
    messages.push(message);
    callback({
      status: "ok",
    });
    io.emit("reply", messages);
  });

  socket.on("create", (roomId, username, callback) => {
    users.push({
      username,
      id: socket.id,
    });
    if (!rooms.find((room) => room.id === roomId)) {
      rooms.push({
        id: roomId,
        userId: socket.id,
        username,
      });
    }
    console.log({ users });
    console.log({ rooms });
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
    // rooms.filter((room) => room.id !== roomId);
  });

  socket.on("room message", (message, roomId) => {
    roomMessages.push({
      message,
      roomId,
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

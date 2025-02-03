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

io.on("connect", (socket) => {
  console.log(socket.id);
  socket.on("message", (message, callback) => {
    messages.push(message);
    callback({
      status: "ok",
    });
    io.emit("reply", messages);
  });

  socket.on("create", (name, callback) => {
    socket.join(name);
    callback({
      status: "ok",
    });
  });

  socket.on("room message", (message, roomId) => {
    io.to(roomId).emit("room reply", message);
  });
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});

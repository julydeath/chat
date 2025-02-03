import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello");
});

io.on("connect", (socket) => {
  console.log(socket.id);
  socket.on("message", (message, callback) => {
    console.log(message);
    callback({
      status: "ok",
    });
    io.emit("reply", message);
  });
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});

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

server.listen(8080, () => {
  console.log("Server running on port 8080");
});

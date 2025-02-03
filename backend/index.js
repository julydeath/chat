import express from "express";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);

app.listen(express.json());

app.get("/", (req, res) => {
  res.send("Hello");
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});

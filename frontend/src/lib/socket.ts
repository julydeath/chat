import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NEXT_PUBLIC_SOCKET_URL;

console.log(URL);

export const socket = io(URL, {
  transports: ["websocket", "polling"],
  path: "/socket.io/",
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
  withCredentials: true,
});

socket.on("connect_error", (err) => {
  console.log(`Connection error: ${err.message}`);
});

socket.on("connect", () => {
  console.log("Connected to Socket.IO server");
});

socket.on("disconnect", (reason) => {
  console.log(`Disconnected: ${reason}`);
});

"use client";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { sendMessage } from "../actions/sendMessage";

const Chat = () => {
  const [isConnected, setIsConnected] = useState<boolean>();

  const [messages, setMessages] = useState<string[]>([]);

  const [message, setMessage] = useState("");

  console.log({ isConnected });
  console.log({ messages });

  useEffect(() => {
    function OnConnect() {
      setIsConnected(true);
    }

    function OnReply(message: string) {
      setMessages([...messages, message]);
    }

    function OnDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", OnConnect);
    socket.on("reply", OnReply);
    socket.on("disconnect", OnDisconnect);

    return () => {
      socket.off("connect", OnConnect);
      socket.off("reply", OnReply);
      socket.off("disconnect", OnDisconnect);
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await socket
        .timeout(5000)
        .emitWithAck("message", message);
      console.log(response.status);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div>
      <div>
        <header>Chat</header>
      </div>
      <div className="text-white">
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      <form onSubmit={(e) => handleSubmit(e)}>
        <input
          name="message"
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message"
          className="bg-white text-black px-4 py-2 rounded-lg"
        />
        <button
          type="submit"
          className="bg-white text-black px-4 py-2 rounded-lg"
        >
          send
        </button>
      </form>
    </div>
  );
};

export default Chat;

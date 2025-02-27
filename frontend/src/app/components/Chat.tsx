"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";

const Chat = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function OnConnect() {
      setIsConnected(true);
    }

    function OnReply(allMessages: string[]) {
      if (Array.isArray(allMessages)) {
        setMessages([...allMessages]);
      }
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const response = await socket
        .timeout(5000)
        .emitWithAck("message", message);
      console.log(response.status);
      setMessages((prev) => [...prev, message]); // Add message to state
      setMessage(""); // Clear input field
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-between p-4 bg-base-100">
      {/* Header */}
      <div className="w-full max-w-3xl flex justify-between items-center py-2 px-4 bg-secondary text-bg-secondary-content rounded-lg mb-2">
        <header className="text-2xl font-medium">Chat</header>
        <div>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
      </div>
      {/* Messages */}
      <div className="flex-1 w-full max-w-3xl bg-neutral p-4 rounded-lg overflow-y-auto max-h-72">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-neutral-content text-primary-content p-2 my-2 rounded-lg"
          >
            {msg}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="w-full max-w-3xl my-10">
        <form className="flex gap-4" onSubmit={handleSubmit}>
          <input
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message..."
            className="input input-bordered w-full text-white"
          />
          <button className="btn btn-active">
            <span className="loading loading-spinner"></span>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

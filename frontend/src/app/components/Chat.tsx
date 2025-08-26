"use client";

import { socket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";

const Chat = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onReply(allMessages: string[]) {
      if (Array.isArray(allMessages)) {
        setMessages([...allMessages]);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("reply", onReply);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("reply", onReply);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      await socket.timeout(5000).emitWithAck("message", message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-between p-4 bg-gray-900 text-white">
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center py-3 px-6 bg-gray-800 rounded-lg shadow-md mb-4">
        <header className="text-3xl font-bold">Public Chat</header>
        <div
          className={`text-lg font-semibold ${
            isConnected ? "text-green-400" : "text-red-400"
          }`}
        >
          {isConnected ? "● Connected" : "● Disconnected"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 w-full max-w-4xl bg-gray-800 p-6 rounded-lg overflow-y-auto shadow-inner">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-gray-700 text-white p-3 my-2 rounded-lg shadow"
          >
            {msg}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="w-full max-w-4xl mt-4">
        <form className="flex gap-4" onSubmit={handleSubmit}>
          <input
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message..."
            className="input input-bordered w-full bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 rounded-lg"
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary rounded-lg shadow-md"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

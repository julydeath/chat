"use client";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";

const Room = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    function OnReply(messageData: string) {
      setMessages([...messages, messageData]);
    }

    function OnDisconnect() {
      setIsConnected(false);
    }

    socket.on("room reply", OnReply);
    socket.on("disconnect", OnDisconnect);

    return () => {
      socket.off("room reply", OnReply);
      socket.off("disconnect", OnDisconnect);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    socket.emit("room message", message, roomId);
    setMessages((prev) => [...prev, message]); // Add message to state
    setMessage(""); // Clear input field
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("yes");
      const response = await socket.timeout(5000).emitWithAck("create", roomId);
      console.log(response);
      setIsConnected(true);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-between p-4 bg-gray-900 text-white">
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center pb-4">
        <header className="text-2xl font-medium">Room - {roomId}</header>
        {!isConnected && (
          <div>
            <form className="flex gap-4" onSubmit={handleJoinRoom}>
              <input
                name="message"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room code..."
                className="flex-1 bg-white text-black px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Connect
              </button>
            </form>
          </div>
        )}
        <div>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 w-full max-w-2xl bg-gray-800 p-4 rounded-lg overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="bg-gray-700 p-2 my-2 rounded-lg">
            {msg}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="w-full max-w-2xl my-10">
        <form className="flex gap-4" onSubmit={handleSubmit}>
          <input
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message..."
            className="flex-1 bg-white text-black px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Room;

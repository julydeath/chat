"use client";
import { socket } from "@/lib/socket";
import { useEffect, useState, useRef } from "react";

const RoomChat = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [formError, setFormError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  type RoomMessage = {
    message: string;
    roomId: string;
    userId: string;
    name: string;
  };

  useEffect(() => {
    function OnReply(messageData: RoomMessage[]) {
      setMessages([...messageData]);
    }

    function OnDisconnect() {
      setIsConnected(false);
    }

    const storeUserId = localStorage.getItem("socket") || "";
    const storedName = localStorage.getItem("name") || "";
    const storedRoomId = localStorage.getItem("roomId") || "";

    setName(storedName);
    setRoomId(storedRoomId);
    setUserId(storeUserId);

    preFetch(storeUserId, storedName, storedRoomId);

    socket.on("room reply", OnReply);
    socket.on("disconnect", OnDisconnect);

    return () => {
      socket.off("room reply", OnReply);
      socket.off("disconnect", OnDisconnect);
    };
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const preFetch = async (uId: string, username: string, rId: string) => {
    console.log({ uId, username, rId });
    if (username.length > 0 && rId.length > 0) {
      await socket.timeout(5000).emitWithAck("create", rId, username, uId);
      setIsConnected(true);
    }
  };

  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;
    setLoading(true);
    try {
      socket.emit("room message", message, roomId, userId, name);
      setMessage(""); // Clear input field
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }

    if (!roomId.trim()) {
      setFormError("Room ID is required");
      return;
    }

    setFormError(""); // Clear any previous errors

    try {
      await socket.timeout(5000).emitWithAck("create", roomId, name, socket.id);
      localStorage.setItem("roomId", roomId);
      localStorage.setItem("name", name);
      localStorage.setItem("socket", socket.id!);
      setUserId(socket.id!);
      setIsConnected(true);

      // Close the modal after successful connection
      const closeButton = document
        .getElementById("my_modal_2")
        ?.querySelector("form[method='dialog'] button") as HTMLButtonElement

        closeButton.click()
    } catch (e) {
      console.log(e);
      setFormError("Failed to connect. Please try again.");
      localStorage.removeItem("roomId");
      localStorage.removeItem("name");
      localStorage.setItem("socket", socket.id!);
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leave", roomId);
    localStorage.removeItem("roomId");
    localStorage.removeItem("name");
    localStorage.setItem("socket", socket.id!);
    setIsConnected(false);
    setMessages([]);
    setRoomId("");
    setName("");
  };

  return (
    <div className="h-full flex flex-col items-center justify-between p-4 bg-gray-900 text-white">
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center py-3 px-6 bg-gray-800 rounded-lg shadow-md mb-4">
        <header className="text-3xl font-bold">
          Room - {roomId ? <span>{roomId}</span> : "Not Connected"}
        </header>
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <button
              className="btn btn-primary rounded-lg shadow-md"
              onClick={() => {
                setFormError(""); // Clear any previous errors
                const x = document.getElementById(
                  "my_modal_2"
                ) as HTMLDialogElement;
                x.showModal();
              }}
            >
              Join/Create Room
            </button>
          ) : (
            <button
              onClick={handleLeaveRoom}
              className="btn btn-error rounded-lg shadow-md"
            >
              Leave Room
            </button>
          )}
          <div
            className={`text-lg font-semibold ${
              isConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {isConnected ? "● Connected" : "● Disconnected"}
          </div>
        </div>
      </div>

      {/* Join Room Modal */}
      <dialog id="my_modal_2" className="modal">
        <div className="modal-box bg-gray-800 text-white rounded-lg shadow-lg">
          <h3 className="font-bold text-2xl mb-4">Join or Create a Room</h3>
          <form className="flex flex-col gap-4" onSubmit={handleJoinRoom}>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name *"
              className="input input-bordered w-full bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 rounded-lg"
              required
            />
            <input
              name="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room code *"
              className="input input-bordered w-full bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 rounded-lg"
              required
            />
            {formError && <div className="text-red-400 mt-2">{formError}</div>}
            <button type="submit" className="btn btn-primary w-full mt-4 rounded-lg shadow-md">
              Connect
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Messages */}
      <div className="flex-1 w-full max-w-4xl bg-gray-800 p-6 rounded-lg overflow-y-auto shadow-inner">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat ${
              msg.userId === userId ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-header text-sm opacity-70">
              {msg.name}
            </div>
            <div
              className={`chat-bubble ${
                msg.userId === userId
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {msg.message}
            </div>
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
            disabled={!isConnected || loading}
            className="input input-bordered w-full bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 rounded-lg"
          />
          <button
            type="submit"
            className="btn btn-primary rounded-lg shadow-md"
            disabled={!isConnected || loading}
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

export default RoomChat;

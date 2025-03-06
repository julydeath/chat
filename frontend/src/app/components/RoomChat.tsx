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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    socket.emit("room message", message, roomId, userId, name);
    setMessages((prev) => [...prev, { message, roomId, userId, name }]); // Add message to state
    setMessage(""); // Clear input field
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
    <div className="h-full flex flex-col items-center justify-between p-4 bg-base-100">
      {/* Header */}
      <div className="w-full flex items-center gap-20 justify-between pb-4 prose">
        <div>
          <header className="text-2xl font-medium ">
            Room ID - {roomId && roomId}
          </header>
        </div>

        {!isConnected ? (
          <div>
            <button
              className="btn"
              onClick={() => {
                setFormError(""); // Clear any previous errors
                const x = document.getElementById("my_modal_2") as HTMLDialogElement;
                x.showModal()
              }}
            >
              Join/Create
            </button>

            <dialog id="my_modal_2" className="modal">
              <div className="modal-box">
                <form className="flex flex-col" onSubmit={handleJoinRoom}>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name... *"
                    className="input input-bordered text-white"
                    required
                  />
                  <input
                    name="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room code... *"
                    className="input input-bordered my-4 text-white"
                    required
                  />
                  {formError && (
                    <div className="text-error mb-4">{formError}</div>
                  )}
                  <button type="submit" className="btn">
                    Connect
                  </button>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>
        ) : (
          <div>
            <button
              onClick={handleLeaveRoom}
              className="btn btn-outline btn-error"
            >
              Leave
            </button>
          </div>
        )}
        <div>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
      </div>
      {/* Messages */}
      <div className="flex-1 w-full max-w-3xl bg-gray-900 p-4 rounded-lg prose overflow-y-auto max-h-72">
        <div className="flex flex-col space-y-2">
          {messages.map((msg, index) => (
            <div key={index} className="bg-gray-700 p-2 rounded-lg">
              <strong>{msg.name}: </strong>
              {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Chat Input */}
      <div className="w-full max-w-3xl my-10">
        <form className="flex gap-4" onSubmit={handleSubmit}>
          <input
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message..."
            disabled={!isConnected}
            className="input input-bordered input-info w-full text-white"
          />
          <button type="submit" className="btn" disabled={!isConnected}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomChat;

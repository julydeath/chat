# Real-time Chat and Video Call Application

This is a full-stack real-time communication application built with Next.js, Express, and Socket.IO. It includes features like public chat, private chat rooms, and video calls.

## Features

- **Public Chat:** A global chat where all connected users can communicate.
- **Chat Rooms:** Users can create or join private chat rooms using a room ID.
- **Video Calls:** Two users can join a video call room for a peer-to-peer video conversation.
- **Real-time Communication:** All communication is done in real-time using WebSockets.

## Technologies Used

- **Frontend:**
  - [Next.js](https://nextjs.org/)
  - [React](https://reactjs.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [daisyUI](https://daisyui.com/)
  - [Socket.IO Client](https://socket.io/docs/v4/client-api/)
  - [TypeScript](https://www.typescriptlang.org/)

- **Backend:**
  - [Express.js](https://expressjs.com/)
  - [Socket.IO](https://socket.io/)
  - [Node.js](https://nodejs.org/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v18 or later)
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   The backend server will start on `http://localhost:4000`.

2. **Start the frontend development server:**
   In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend application will be available at `http://localhost:3000`.

3. **Open the application in your browser:**
   Navigate to `http://localhost:3000` to use the application. To access the chat and video features, go to `http://localhost:3000/connect`.

## Project Structure

- `backend/`: Contains the Express.js and Socket.IO server.
- `frontend/`: Contains the Next.js frontend application.

## How to Use

### Public Chat

- Navigate to the "Public Chat" tab to join the global chat.
- Enter a message and click "Send".

### Chat Rooms

- Navigate to the "Chat Rooms" tab.
- Click on "Join/Create Room".
- Enter your name and a room ID, then click "Connect".
- You can now chat with other users in the same room.

### Video Call

- Navigate to the "Video Call" tab.
- Enter a room ID and your username, then click "Join Room".
- Allow the browser to access your camera and microphone.
- You can start/stop your camera and screen sharing.
- The video call is limited to two users per room.

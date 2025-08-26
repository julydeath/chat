"use client";

import React, { useState, useEffect, useRef } from 'react';
import { socket } from "@/lib/socket";

interface User {
  id: string;
  name: string;
}

interface PeerConnection {
  peerId: string;
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
  uniqueId: string;
}

export default function VideoCall() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<PeerConnection[]>([]);
  const [roomId, setRoomId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInRoom, setIsInRoom] = useState<boolean>(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  // Generate a unique ID function
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN servers here if needed
    ]
  };

  useEffect(() => {
    // Socket event listeners
    socket.on('video-room-user-connected', handleUserConnected);
    socket.on('existing-users', handleExistingUsers);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('video-room-user-disconnected', handleUserDisconnected);
    socket.on('room-full', handleRoomFull);

    return () => {
      // Clean up socket listeners
      socket.off('video-room-user-connected', handleUserConnected);
      socket.off('existing-users', handleExistingUsers);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('video-room-user-disconnected', handleUserDisconnected);
      socket.off('room-full', handleRoomFull);
    };
  }, []);

  // Effect to update video refs when peer connections change
  useEffect(() => {
    peerConnections.forEach(peer => {
      if (peer.stream && videoRefs.current[peer.uniqueId || peer.peerId]) {
        videoRefs.current[peer.uniqueId || peer.peerId].srcObject = peer.stream;
      }
    });
  }, [peerConnections]);

  // Effect to update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || screenStream || null;
    }
  }, [localStream, screenStream]);

  const handleRoomFull = (data: { roomId: string }) => {
    setErrorMessage(`Room ${data.roomId} is full (maximum 2 users). Please try another room.`);
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  };

  const createPeerConnection = (peerId: string, stream?: MediaStream | null) => {
    const peerConnection = new RTCPeerConnection(configuration);
    const uniqueId = generateUniqueId();

    // Add local stream tracks
    if (stream) {
      stream.getTracks().forEach(track =>
        // console.log("Adding track to peer connection:", track.kind),
        peerConnection.addTrack(track, stream)
      );
    }

    // Track remote streams
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeerConnections(prev => 
        prev.map(pc => 
          pc.uniqueId === uniqueId ? { ...pc, stream: remoteStream } : pc
        )
      );
    };

    // ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    return { peerConnection, uniqueId };
  };

  const handleUserConnected = async (user: User) => {
    const { peerConnection, uniqueId } = createPeerConnection(user.id, localStream || screenStream);
    
    setPeerConnections(prev => [
      ...prev,
      {
        peerId: user.id,
        peerConnection,
        uniqueId
      }
    ]);

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socket.emit('offer', {
      to: user.id,
      offer: offer
    });
  };

  const handleExistingUsers = async (users: User[]) => {
    // Since we're limiting to 2 users, we should only ever have at most 1 existing user
    setIsInRoom(true);
    
    for (const user of users) {
      const { peerConnection, uniqueId } = createPeerConnection(user.id, localStream || screenStream);
      
      setPeerConnections(prev => [
        ...prev,
        {
          peerId: user.id,
          peerConnection,
          uniqueId
        }
      ]);
    }
  };

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit, from: string }) => {
    const { peerConnection, uniqueId } = createPeerConnection(data.from, localStream || screenStream);
    
    setPeerConnections(prev => [
      ...prev,
      {
        peerId: data.from,
        peerConnection,
        uniqueId
      }
    ]);
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', {
      to: data.from,
      answer: answer
    });
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit, from: string }) => {
    const peer = peerConnections.find(pc => pc.peerId === data.from);
    if (peer?.peerConnection) {
      await peer.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit, from: string }) => {
    const peer = peerConnections.find(pc => pc.peerId === data.from);
    if (peer?.peerConnection) {
      await peer.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  const handleUserDisconnected = (user: User) => {
    setPeerConnections(prev =>
      prev.filter(pc => pc.peerId !== user.id)
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);

      peerConnections.forEach(async (pc) => {
        // Remove existing tracks if any
        pc.peerConnection.getSenders().forEach(sender => 
          pc.peerConnection.removeTrack(sender)
        );
        
        // Add new camera tracks
        stream.getTracks().forEach(track => 
          pc.peerConnection.addTrack(track, stream)
        );
  
        // Renegotiate connection
        const offer = await pc.peerConnection.createOffer();
        await pc.peerConnection.setLocalDescription(offer);
        socket.emit('offer', {
          to: pc.peerId,
          offer: offer
        });
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Failed to access camera or microphone. Please check permissions.');
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      setScreenStream(stream);
      
      // Update all peer connections with new screen share stream
      peerConnections.forEach(async (pc) => {
        // Remove existing tracks
        pc.peerConnection.getSenders().forEach(sender => 
          pc.peerConnection.removeTrack(sender)
        );
        
        // Add new screen share tracks
        stream.getTracks().forEach(track => 
          pc.peerConnection.addTrack(track, stream)
        );

        // Renegotiate connection
        const offer = await pc.peerConnection.createOffer();
        await pc.peerConnection.setLocalDescription(offer);
        socket.emit('offer', {
          to: pc.peerId,
          offer: offer
        });
      });
    } catch (error) {
      console.error('Error sharing screen:', error);
      setErrorMessage('Failed to share screen. Please check permissions.');
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      setErrorMessage('Please enter both Room ID and Username.');
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return;
    }
    
    socket.emit('join-video-room', roomId, { name: username });
    setIsInRoom(true);
  };

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  const leaveRoom = () => {
    // Close all peer connections
    peerConnections.forEach(peer => {
      peer.peerConnection.close();
    });
    
    // Stop local streams
    stopCamera();
    stopScreenShare();
    
    // Clear peer connections
    setPeerConnections([]);
    
    // Notify server
    if (roomId) {
      socket.emit('leave-video-room', roomId);
    }
    
    setIsInRoom(false);
  };

  const renderVideoGrid = () => {
    return (
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-md text-sm">
            You ({username}) {screenStream ? "(Sharing Screen)" : ""}
          </div>
        </div>

        {/* Peer Videos */}
        {peerConnections.map((peer) => (
          <div
            key={peer.uniqueId}
            className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current[peer.uniqueId] = el;
              }}
              autoPlay
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-md text-sm">
              Remote User
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header & Controls */}
      <div className="bg-gray-800 p-4 shadow-md">
        {errorMessage && (
          <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">
            {errorMessage}
          </div>
        )}

        {!isInRoom ? (
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <input
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="input input-bordered bg-gray-700 text-white rounded-lg"
            />
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-bordered bg-gray-700 text-white rounded-lg"
            />
            <button onClick={joinRoom} className="btn btn-primary rounded-lg">
              Join Room
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <button
              onClick={startCamera}
              className="btn btn-success rounded-lg"
              disabled={!!localStream}
            >
              Start Camera
            </button>
            <button
              onClick={stopCamera}
              className="btn btn-warning rounded-lg"
              disabled={!localStream}
            >
              Stop Camera
            </button>
            <button
              onClick={startScreenShare}
              className="btn btn-info rounded-lg"
              disabled={!!screenStream}
            >
              Share Screen
            </button>
            <button
              onClick={stopScreenShare}
              className="btn btn-warning rounded-lg"
              disabled={!screenStream}
            >
              Stop Screen Share
            </button>
            <button onClick={leaveRoom} className="btn btn-error rounded-lg">
              Leave Room
            </button>
          </div>
        )}
      </div>

      {/* Video Grid or Placeholder */}
      {isInRoom ? (
        renderVideoGrid()
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <h2 className="text-3xl font-bold mb-4">Video Call</h2>
          <p className="text-lg text-gray-400">
            Enter a Room ID and your Username to start or join a video call.
          </p>
          <p className="mt-2 text-gray-500">
            This video call is limited to 2 users per room.
          </p>
        </div>
      )}
    </div>
  );
}
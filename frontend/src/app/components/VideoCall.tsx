"use client";

import { useState } from "react";
import ReactPlayer from "react-player";

export default function VideoCall() {
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [myStreams, setMyStreams] = useState<MediaStream | null>(null);
  //   const [videoUrl, setVideoUrl] = useState<string | null>(null);
  //   const [screenUrl, setScreenUrl] = useState<string | null>(null);

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });

      setMyStream(stream);
      //   setVideoUrl(URL.createObjectURL(stream));
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const handleStopCamera = () => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop()); // ✅ Fix .forEach() issue
      setMyStream(null);
      //   setVideoUrl(null);
    }
  };

  const handlesharetohost = async () => {
    try {
      const captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: true,
      });

      setMyStreams(captureStream);
      //   setScreenUrl(URL.createObjectURL(captureStream));
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const handleStopSharetohost = async () => {
    if (myStreams) {
      myStreams.getTracks().forEach((track) => track.stop());
    }
    setMyStreams(null);
  };

  //   useEffect(() => {
  //     return () => {
  //       // Cleanup streams when component unmounts
  //       myStream?.getTracks().forEach((track) => track.stop());
  //       myStreams?.getTracks().forEach((track) => track.stop());
  //     };
  //   }, [myStream, myStreams]);

  return (
    <div>
      <button className="btn" onClick={handleCamera}>
        Start Camera
      </button>
      <button className="btn" onClick={handleStopCamera}>
        Stop Camera
      </button>
      <button className="btn" onClick={handlesharetohost}>
        Share Screen
      </button>
      <button className="btn" onClick={handleStopSharetohost}>
        Stop Screen
      </button>

      {myStream && (
        <ReactPlayer width="40%" height="40%" playing url={myStream} />
      )}
      {myStreams && (
        <ReactPlayer width="100%" height="100%" playing url={myStreams} />
      )}
    </div>
  );
}

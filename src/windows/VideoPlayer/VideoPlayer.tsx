import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

export function VideoPlayer() {
  const { id } = useParams();
  const src = id ? decodeURIComponent(id) : "#";

  useEffect(() => {
    document.title = "Watchdog > Play Video";
    console.log(id);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  const playVideo = () => {
    videoRef.current?.play();
  };

  const pauseVideo = () => {
    videoRef.current?.pause();
  };

  return (
    <div className="p-10 h-150">
      <video
        controls
        autoPlay
        ref={videoRef}
        src={`file://${src}`}
        className=""
      />
    </div>
  );
}

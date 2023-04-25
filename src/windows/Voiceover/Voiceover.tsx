import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AudioRecorder from "./components/AudioRecorder";

export function Voiceover() {
  const { id } = useParams();
  const src = id ? decodeURIComponent(id) : "#";
  useEffect(() => {
    document.title = "Watchdog > Voiceover";
  }, []);

  return (
    <div className="container m-8 space-y-10">
      <AudioRecorder source={src} />
    </div>
  );
}

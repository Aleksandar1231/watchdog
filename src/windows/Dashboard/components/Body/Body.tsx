import { Recording } from "@/windows/Record";
import { useEffect, useState } from "react";
import VideoCard from "../VideoCard";

export function Body() {
  const [recordings, setRecordings] = useState<Recording[] | null>(null);

  useEffect(() => {
    async function getRecordings() {
      const recordings = (await window.main.getRecordings()) as Recording[];
      console.log(recordings);
      setRecordings(recordings);
    }

    getRecordings();
  }, []);

  return (
    <div className="container m-5">
      <div className="p-2 my-2">
        <h4>Recently recorded trading sessions</h4>
      </div>
      <div className="container mx-auto max-w-full flex flex-row flex-wrap">
        {recordings?.map((recording) => (
          <VideoCard
            key={recording.filePath}
            filePath={recording.filePath}
            isHighlight={recording.isHighlight}
            date={recording.date}
            thumbnail={recording.thumbnail}
          />
        ))}
      </div>
    </div>
  );
}

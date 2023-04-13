import { Recording } from "@/types";
import { useEffect, useState, useCallback } from "react";
import VideoCarousel from "../VideoCaroussel";

export function Body() {
  const [recordings, setRecordings] = useState<Recording[] | null>(null);

  const handleRecordingSave = useCallback(
    (recordings: Recording[]) => {
      console.log(recordings);
      setRecordings(recordings);
    },
    [setRecordings]
  );

  useEffect(() => {
    async function getRecordings() {
      await window.main.listenRecordingSave(handleRecordingSave);
      const recordings = await window.main.getRecordings();
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
          <VideoCarousel key={recording.filePath} recording={recording} />
        ))}
      </div>
    </div>
  );
}

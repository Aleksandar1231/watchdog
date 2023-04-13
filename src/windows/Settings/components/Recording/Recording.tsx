import DropdownMenu from "@/components/DropdownMenu";
import { useEffect, useState } from "react";

export function Recording(props: { config: any }) {
  const { config } = props;
  const [videoQuality, setVideoQuality] = useState("");

  useEffect(() => {
    if (config) {
      setVideoQuality(config.videoQuality);
    }
  }, [config]);

  const handleChange = async (newOption: any) => {
    setVideoQuality(newOption);
    await window.main.saveConfig({
      ...config,
      videoQuality: newOption,
    });
  };

  return (
    <div className="container space-y-2 ">
      <div className="text-lg font-bold">Recording</div>
      <div className="flex flex-row justify-left items-center space-x-4">
        <div className="text-sm w-1/6">Video Quality:</div>
        <div className="py-1 w-1/5 mr-6">
          <DropdownMenu
            values={["Low", "High"]}
            onChange={handleChange}
            selectedOption={videoQuality}
          />
        </div>
        <div></div>
      </div>
    </div>
  );
}

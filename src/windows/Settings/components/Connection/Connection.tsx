import { updateLogFilePath } from "@/redux/config";
import { RootState } from "@/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function Connection() {
  const config = useSelector((state: RootState) => state.config);
  const [selectedDirectory, setSelectedDirectory] = useState<string>(
    config.logFilePath
  );

  const dispatch = useDispatch();
  const handleDirectoryButtonClick = async () => {
    const result = await window.main.openDirectory();
    setSelectedDirectory(result);
    dispatch(updateLogFilePath(result));
    await window.main.saveConfig({ ...config, logFilePath: result });
    const c = await window.main.getConfig();
    console.log(c);
  };

  const handleDirectoryInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedDirectory(event.target.value);
    dispatch(updateLogFilePath(event.target.value));
    await window.main.saveConfig({
      ...config,
      logFilePath: event.target.value,
    });
  };

  return (
    <div className="container space-y-2 ">
      <div className="text-lg font-bold">Guerrilla Connection</div>
      <div className="flex flex-row justify-left items-center space-x-4">
        <div className="text-sm w-1/6">Event Log Location</div>
        <div className="border border-2 border-gray-300 py-1 w-3/5">
          <input
            className="w-full appearance-none bg-transparent border-none text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            value={selectedDirectory}
            onChange={handleDirectoryInputChange}
          />
        </div>
        <div>
          <button
            className="flex flex-shrink-0 bg-gray-200 border-gray-300 text-sm border-2 text-black py-1 px-3 "
            onClick={handleDirectoryButtonClick}
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
}

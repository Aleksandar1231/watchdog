import { useEffect, useState } from "react";

export function Connection(props: { config: any }) {
  const { config } = props;
  const [logFilePath, setLogFilePath] = useState<string>("");

  useEffect(() => {
    if (config) {
      setLogFilePath(config.logFilePath);
    }
  }, [config]);

  const handleDirectoryButtonClick = async () => {
    const result = await window.main.openDirectory();
    setLogFilePath(result);
    await window.main.saveConfig({ ...config, logFilePath: result });
  };

  const handleDirectoryInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLogFilePath(event.target.value);
    await window.main.saveConfig({
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
            value={logFilePath}
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

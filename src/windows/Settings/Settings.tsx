import { Config } from "@/types";
import { useCallback, useEffect, useState } from "react";
import Connection from "./components/Connection";
import Highlights from "./components/Highlights";
import Recording from "./components/Recording";

export function Settings() {
  const [config, setConfig] = useState<Config | null>(null);

  const handleConfigSave = useCallback(
    (config: Config) => {
      setConfig(config);
    },
    [setConfig]
  );

  useEffect(() => {
    document.title = "Watchdog > Settings";
    async function getLocalConfig() {
      window.main.listenConfigSave(handleConfigSave);
      const config = await window.main.getConfig();
      setConfig(config);
    }
    getLocalConfig();
  }, []);

  return (
    <div className="container m-8 max-w-full space-y-10">
      {/* <Connection config={config} /> */}
      <Recording config={config} />
      <Highlights config={config} />
    </div>
  );
}

import { useEffect, useState } from "react";
import Connection from "./components/Connection";
import Highlights from "./components/Highlights";
import Recording from "./components/Recording";

export function Settings() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    document.title = "Watchdog > Settings";
    async function getLocalConfig() {
      const config = await window.main.getConfig();
      setConfig(config);
    }
    getLocalConfig();
  }, []);

  return (
    <div className="container m-8 max-w-full space-y-10">
      <Connection config={config} />
      <Recording config={config} />
      <Highlights config={config} />
    </div>
  );
}

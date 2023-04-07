import { useEffect } from "react";
import Connection from "./components/Connection";
import Highlights from "./components/Highlights";
import Recording from "./components/Recording";

export function Settings() {
  useEffect(() => {
    document.title = "Watchdog > Settings";
  }, []);

  return (
    <div className="container m-8 max-w-full space-y-10">
      <Connection />
      <Recording />
      <Highlights />
    </div>
  );
}

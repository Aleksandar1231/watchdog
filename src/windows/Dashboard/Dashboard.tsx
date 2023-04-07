import { useEffect } from "react";
import TopMenu from "./components/TopMenu";
import Body from "./components/Body";

export function Dashboard() {
  useEffect(() => {
    document.title = "Watchdog > Dashboard";
  }, []);

  return (
    <div className="container mx-auto max-w-full">
      <TopMenu />
      <Body />
    </div>
  );
}

import { createHashRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./windows/Dashboard";
import Record from "./windows/Record";
import Settings from "./windows/Settings";
import VideoPlayer from "./windows/VideoPlayer";

const router = createHashRouter([
  { path: "/", element: <Dashboard /> },
  { path: "/settings", element: <Settings /> },
  { path: "/startSession", element: <Record /> },
  { path: "/videoPlayer/:id", element: <VideoPlayer /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

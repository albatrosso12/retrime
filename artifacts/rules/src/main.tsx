import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// Default to dark mode for the military aesthetic
document.documentElement.classList.add("dark");

// Set API base URL to the Worker
setBaseUrl(import.meta.env.VITE_API_URL || "https://retrime.korsetov2009.workers.dev");

// Set auth token getter to read from localStorage
setAuthTokenGetter(() => {
  return localStorage.getItem('auth_token');
});

createRoot(document.getElementById("root")!).render(<App />);

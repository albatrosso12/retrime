import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// Suppress Chrome extension errors aggressively
const chromeExtPatterns = [
  'Could not establish connection',
  'Receiving end does not exist',
  'runtime.lastError',
  'The message port closed',
  'Extension context invalidated'
];

// Suppress both error and unhandledrejection events
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const filename = event.filename || '';
  const isExtensionError = chromeExtPatterns.some(p => message.includes(p)) ||
    filename.includes('chrome-extension://') ||
    filename.includes('extensions::');
  if (isExtensionError) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason);
  if (chromeExtPatterns.some(p => reason.includes(p))) {
    event.preventDefault();
  }
});

// Default to dark mode for the military aesthetic
document.documentElement.classList.add("dark");

// Set API base URL to the Worker
const apiUrl = import.meta.env.VITE_API_URL || "https://retrime.korsetov2009.workers.dev";
setBaseUrl(apiUrl);

// Set auth token getter to read from localStorage
setAuthTokenGetter(() => {
  return localStorage.getItem('auth_token');
});

createRoot(document.getElementById("root")!).render(<App />);

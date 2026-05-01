import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Default to dark mode for the military aesthetic
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);

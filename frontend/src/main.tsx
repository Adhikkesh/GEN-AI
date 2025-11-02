import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { auth } from './lib/auth';

createRoot(document.getElementById("root")!).render(<App />);

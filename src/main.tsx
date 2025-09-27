import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/context/AppContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppProvider>
        <App />
      </AppProvider>
    </ThemeProvider>
  </StrictMode>
);

import { initializeState } from "@state/init";
import { createStore, Provider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app.tsx";
import {
  init as sseInit,
  onTopic as sseOnTopic,
  subscribe as sseSubscribe,
} from "./sse/client.ts";

if (process.env.NODE_ENV === "development") {
  sseInit();

  // Subscribe to frontend updates for pseudo-HMR
  sseOnTopic("frontend_updated", () => {
    console.log("[DEV] Frontend rebuilt, reloading...");
    window.location.reload();
  });
  sseSubscribe("frontend_updated");
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("root element not found");
}
const store = createStore();
initializeState(store);

createRoot(rootEl).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);

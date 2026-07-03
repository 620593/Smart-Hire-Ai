import React from "react";
import ReactDOM from "react-dom/client";

import App from "@/app/App";
import { Providers } from "@/app/providers";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>,
);

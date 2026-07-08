import "./utils/providerFetchPatch";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { initAnalytics } from "./utils/analytics";
import { installProviderFetchPatch } from "./utils/providerFetchPatch";


initAnalytics();

// FLIXYFY_FRONTEND_HOME_PROVIDER_FILTER_V6_INSTALL
try {
  installProviderFetchPatch();
} catch (err) {
  console.warn('FLIXYFY provider fetch patch disabled', err);
}
// FLIXYFY_PROVIDER_FILTER_V5_FINAL
installProviderFetchPatch();
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

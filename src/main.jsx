import { installProviderFetchPatch } from './utils/providerFetchPatch.js';
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { initAnalytics } from "./utils/analytics";
// FLIXYFY_FRONTEND_HOME_PROVIDER_DOM_BRIDGE_V8
installProviderFetchPatch();

// FLIXYFY_HOME_PROVIDER_FILTER_BRIDGE_V7_INSTALL
try {
  } catch (error) {
  console.warn("FLIXYFY_HOME_PROVIDER_FILTER_BRIDGE_V7_INSTALL_ERROR", error);
}
// END_FLIXYFY_HOME_PROVIDER_FILTER_BRIDGE_V7_INSTALL



initAnalytics();

// FLIXYFY_FRONTEND_HOME_PROVIDER_FILTER_V6_INSTALL
try {
  } catch (err) {
  console.warn('FLIXYFY provider fetch patch disabled', err);
}
// FLIXYFY_PROVIDER_FILTER_V5_FINAL
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

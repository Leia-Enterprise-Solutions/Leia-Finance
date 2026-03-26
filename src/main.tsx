import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";

import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/core.css";
import "./styles/app.css";
import "./styles/finance-tokens.css";
import "./styles/finance-core.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);


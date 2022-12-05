import { CssBaseline, ThemeProvider } from "@mui/material";
import { useAtomValue } from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { darkModeState } from "./atoms/uiState";
import SnackbarNotification from "./components/notification/SnackbarNotification";
import PageRefreshConfirmation from "./components/PageRefreshConfirmation";
import { light as lightTheme, dark as darkTheme } from "./configs/theme";
import "./styles/styles.scss";
import {
  default as init,
  Poseidon,
  curve_hash,
  groth16_verify,
} from "./zk-web";

// update zk wasm implementation
import { VMInstance } from "@terran-one/cosmwasm-vm-js";

init().then(() => {
  const poseidon = new Poseidon();
  VMInstance.poseidon_hash = poseidon.hash.bind(poseidon);
  VMInstance.curve_hash = curve_hash;
  VMInstance.groth16_verify = groth16_verify;
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

function Root() {
  const isDark = useAtomValue(darkModeState);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageRefreshConfirmation />
      <SnackbarNotification />
      <App />
    </ThemeProvider>
  );
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);

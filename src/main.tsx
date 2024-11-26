import "bootstrap/dist/css/bootstrap.min.css";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Store, StoreProvider } from "./Store.tsx";

window.parent.postMessage({ type: "setHeight", px: 1000 }, "*");

const store = new Store();

createRoot(document.getElementById("root")!).render(
  <StoreProvider store={store}>
    <App />
  </StoreProvider>
);

declare var USE_SERVICE_WORKER: boolean;

import App from "./containers/app";
import store from "./store/store";

const app = new App(store);

(document.querySelector("#appContainer") as HTMLElement).appendChild(app);

if (USE_SERVICE_WORKER) {
    navigator.serviceWorker.register("/sw.js")
        // tslint:disable-next-line:no-console
        .then(() => console.log("service worker registered"))
        // tslint:disable-next-line:no-console
        .catch((err: Error) => console.error("service worker registration error", err));
}

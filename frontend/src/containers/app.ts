import { MDCDrawer } from "@material/drawer";
import { MDCList } from "@material/list";
import { MDCSnackbar } from "@material/snackbar";
import { MDCTopAppBar } from "@material/top-app-bar";
import { get } from "idb-keyval";
import { html } from "lit-html";
import { cache } from "lit-html/directives/cache";
import { classMap } from "lit-html/directives/class-map";
import { styleMap } from "lit-html/directives/style-map";
import { Action, Store } from "redux";

import { ActionTypes } from "../actions/actions";
import { State } from "../store/store";
import About from "./about";
import Base from "./base";
import Settings from "./settings";
import Stylizer from "./stylizer";

interface AppSection {
    icon: string;
    route: string;
    title: string;
}

export default class App extends Base {
    private topAppBar: MDCTopAppBar | null;
    private drawer: MDCDrawer | null;
    private drawerList: MDCList | null;
    private sections: AppSection[];
    private about: About;
    private settings: Settings;
    private stylizer: Stylizer;
    private errorSnackbar: MDCSnackbar|null;

    constructor(store: Store<State, Action>) {
        super(store);

        this.topAppBar = null;
        this.drawer = null;
        this.drawerList = null;
        this.errorSnackbar = null;

        this.about = new About(this.store);
        this.settings = new Settings(this.store);
        this.stylizer = new Stylizer(this.store);

        this.sections = [
            {
                icon: "camera",
                route: "/",
                title: "Stylizer",
            },
            {
                icon: "settings",
                route: "/settings",
                title: "Settings",
            },
            {
                icon: "announcement",
                route: "/about",
                title: "About",
            },
        ];
        this.store.dispatch({ type: ActionTypes.CHANGE_CURRENT_SECTION, pathname: window.location.pathname });

        this.initialize();
    }

    public connectedCallback() {
        super.connectedCallback();

        this.topAppBar = MDCTopAppBar.attachTo(this.querySelector(".mdc-top-app-bar") as HTMLElement);
        this.drawer = MDCDrawer.attachTo(this.querySelector(".mdc-drawer") as HTMLElement);
        this.drawerList = (this.drawer as MDCDrawer).list as MDCList;
        this.errorSnackbar = new MDCSnackbar(this.querySelector(".error-snackbar") as HTMLElement);

        this.topAppBar.setScrollTarget(this.querySelector("main") as HTMLElement);
        this.topAppBar.listen("MDCTopAppBar:nav", this.onNav);
        this.drawerList.listen("MDCList:action", this.onDrawerListClick);

        this.errorSnackbar.listen("MDCSnackbar:closed", this.onSnackbarClose);

        window.addEventListener("popstate", this.onPopState);
        window.addEventListener("offline", this.onOffline);
        window.addEventListener("online", this.onOnline);
    }

    public disconnectedCallback() {
        (this.topAppBar as MDCTopAppBar).unlisten("MDCTopAppBar:nav", this.onNav);
        (this.drawerList as MDCList).unlisten("MDCList:action", this.onDrawerListClick);

        (this.errorSnackbar as MDCSnackbar).unlisten("MDCSnackbar:closed", this.onSnackbarClose);

        window.removeEventListener("popstate", this.onPopState);
        window.removeEventListener("offline", this.onOffline);
        window.removeEventListener("online", this.onOnline);

        super.disconnectedCallback();
    }

    protected template = () => {
        const state: State = this.store.getState();
        const background = state.currentSection === 0 ? state.stylizer.image : "";

        // tslint:disable:max-line-length
        return html`
<div id="background">
    <div id="backgroundImage" style=${styleMap(background ? { backgroundImage: `url(${background})` } : {})}></div>
    <div id="foreground" style=${styleMap(background ? { backgroundImage: `url(${background})` } : {})}>
        <aside class="mdc-drawer mdc-drawer--modal mdc-top-app-bar--fixed-adjust">
            <div class="mdc-drawer__content">
                <nav class="mdc-list">
                ${this.sections.map((section, index) => (html`<a href="javascript:void(0)" class="mdc-list-item ${state.currentSection === index ? "mdc-list-item--activated" : "" }" aria-current="page">
                    <i class="material-icons mdc-list-item__graphic" aria-hidden="true">${section.icon}</i>
                    <span class="mdc-list-item__text">${section.title}</span>
                </a>`))}
                </nav>
            </div>
        </aside>
        <div class="mdc-drawer-scrim"></div>
        <div class="mdc-drawer-app-content">
            <header class="mdc-top-app-bar app-bar" id="app-bar" style=${styleMap({
                backgroundColor: state.currentSection === 0 ? ( background ? "#21212166" : "transparent" ) : "#212121",
                color: state.currentSection === 0 ? ( background ? "white" : "#212121" ) : "white",
            })}>
                <div class="mdc-top-app-bar__row">
                    <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
                        <a href="javascript:void(0)" class="mdc-icon-button material-icons mdc-top-app-bar__navigation-icon" style=${styleMap({
                            color: state.currentSection === 0 ? ( background ? "white" : "#212121" ) : "white",
                        })}>menu</a>
                        <span class="mdc-top-app-bar__title" style=${styleMap({ visibility: background ? "hidden" : "visible" })}>${this.sections[state.currentSection].title}</span>
                    </section>
                    <section style=${styleMap({ visibility: background ? "visible" : "hidden" })} class="mdc-top-app-bar__section mdc-top-app-bar__section--align-end">
                        <a href="javascript:void(0)" class="mdc-icon-button material-icons" style=${styleMap({ display: state.networkStatus ? "none" : "flex" })} aria-label="Offline">signal_wifi_off</a>
                        <a href="javascript:void(0)" class=${classMap({"mdc-icon-button": true, "material-icons": true, "inactive": !state.stylizer.is_styled})} aria-label="Undo" @click=${this.onUndo}>undo</a>
                        <a href="javascript:void(0)" class=${classMap({"mdc-icon-button": true, "material-icons": true, "inactive": !state.stylizer.is_styled})} aria-label="Download" @click=${this.onDownload}>file_download</a>
                        <a href="javascript:void(0)" class=${classMap({"mdc-icon-button": true, "material-icons": true})} aria-label="Close" @click=${this.onClose}>close</a>
                    </section>
                </div>
            </header>

            <main class="mdc-top-app-bar--fixed-adjust">
                ${cache(state.currentSection === 2 ? this.about : (state.currentSection === 1 ? this.settings : this.stylizer))}
            </main>
        </div>
    </div>
</div>
<div class="mdc-snackbar error-snackbar">
    <div class="mdc-snackbar__surface">
        <div class="mdc-snackbar__label"
            role="status"
            aria-live="polite"></div>
    </div>
</div>`;
        // tslint:enable:max-line-length
    }

    protected stateChanged = () => {
        const state = this.store.getState();
        if (state.error) {
            (this.errorSnackbar as MDCSnackbar).labelText = state.error;
            (this.errorSnackbar as MDCSnackbar).open();
        }
    }

    private initialize = async () => {
        const maxdim: number = await get("multi_stylization/maxdim");
        this.store.dispatch({ type: ActionTypes.SET_MAXDIM, maxdim: (maxdim ? maxdim : 512) });

        const onDevicePrediction: boolean = await get("multi_stylization/on_device_prediction");
        this.store.dispatch({
            type: ActionTypes.SET_MULTI_STYLIZATION_ON_DEVICE_PREDICTION,
            value: onDevicePrediction,
        });

        const requestURLs: string[] = [
            "/static/models/image_stylization/v1/model.json",
            "/static/models/image_stylization/v1/group1-shard1of1.bin"];

        // tslint:disable-next-line:variable-name
        const cache_ = await caches.open("SERVICE_WORKER_CACHE_NAME");
        const ress = await Promise.all(requestURLs.map((r) => cache_.match(r)));
        const v = ress.every((x) => !!x);
        this.store.dispatch({
            type: ActionTypes.SET_MULTI_STYLIZATION_OFFLINE_MODEL_CACHED_STATUS,
            value: v,
        });
    }

    private onNav = () => {
        (this.drawer as MDCDrawer).open = !(this.drawer as MDCDrawer).open;
    }

    private onDrawerListClick = (e: any) => {
        (this.drawer as MDCDrawer).open = !(this.drawer as MDCDrawer).open;
        const state = this.store.getState();
        if (state.currentSection !== e.detail.index) {
            window.history.pushState({}, "", this.sections[e.detail.index].route);
            this.store.dispatch({
                pathname: this.sections[e.detail.index].route,
                type: ActionTypes.CHANGE_CURRENT_SECTION,
            });
        }
    }

    private onPopState = () => {
        this.store.dispatch({ type: ActionTypes.CHANGE_CURRENT_SECTION, pathname: window.location.pathname });
    }

    private onClose = () => {
        this.store.dispatch({ type: ActionTypes.CLOSE_IMAGE });
    }

    private onUndo = () => {
        this.store.dispatch({ type: ActionTypes.RESET_IMAGE, url: this.store.getState().stylizer.base_image });
    }

    private onDownload = () => {
        const a = document.createElement("a");
        a.href = this.store.getState().stylizer.image as string;
        a.download = "styled.jpg";
        a.click();
    }

    private onOffline = () => {
        this.store.dispatch({ type: ActionTypes.SET_NETWORK_STATUS, status: false });
    }

    private onOnline = () => {
        this.store.dispatch({ type: ActionTypes.SET_NETWORK_STATUS, status: true });
    }

    private onSnackbarClose = () => {
        this.store.dispatch({
            message: null,
            type: ActionTypes.SHOW_ERROR,
        });
    }
}

window.customElements.define("styl-app", App);

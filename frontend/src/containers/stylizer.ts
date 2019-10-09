import { html } from "lit-html";
import { cache } from "lit-html/directives/cache";
import { styleMap } from "lit-html/directives/style-map";
import { Action, Store } from "redux";

import { ActionTypes } from "../actions/actions";
import { State } from "../store/store";
import Base from "./base";
import ImageOpener from "./image_opener";
import StyleSelector from "./style_selector";

export default class Stylizer extends Base {
    private imageOpener: ImageOpener;
    private styleSelector: StyleSelector;

    constructor(store: Store<State, Action>) {
        super(store);

        this.imageOpener = new ImageOpener(store);
        this.styleSelector = new StyleSelector(store);
    }

    public connectedCallback() {
        super.connectedCallback();

        if (this.querySelector(".about")) {
            (this.querySelector(".about") as HTMLAnchorElement).addEventListener("click", () => {
                window.history.pushState({}, "", "/about");
                this.store.dispatch({
                    pathname: "/about",
                    type: ActionTypes.CHANGE_CURRENT_SECTION,
                });
            });
        }
    }

    protected template = () => {
        const state = this.store.getState();
        return html`${cache(state.stylizer.image
? html`
<div class="loading" style=${styleMap({ display: state.stylizer.is_loading ? "flex" : "none" })}>
    <div class="progress-container">
        <div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate">
            <div class="mdc-linear-progress__buffering-dots"></div>
            <div class="mdc-linear-progress__buffer"></div>
            <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
            <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
                <span class="mdc-linear-progress__bar-inner"></span>
            </div>
        </div>
    </div>
</div>
${this.styleSelector}`
: html`
${this.imageOpener}
<a href="javascript:void(0)" class="mdc-typography--body1 about">About</a>
`)}`;
    }
}

window.customElements.define("styl-stylizer", Stylizer);

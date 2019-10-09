import { html, render } from "lit-html";
import { Action, Store, Unsubscribe } from "redux";

import { State } from "../store/store";

export default class Base extends HTMLElement {
    protected store: Store<State, Action>;
    private unsubscribe: Unsubscribe|null;

    constructor(store: Store<State, Action>) {
        super();
        this.store = store;
        this.unsubscribe = null;
    }

    public connectedCallback() {
        this.unsubscribe = this.store.subscribe(() => {
            this.update();
            this.stateChanged();
        });
        this.update();
    }

    public disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    protected template = () => {
        return html``;
    }

    protected stateChanged = () => {}

    private update = () => {
        render(this.template(), this);
    }
}

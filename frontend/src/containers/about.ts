import { MDCList } from "@material/list";
import { html } from "lit-html";
import { Action, Store } from "redux";

import { ActionTypes } from "../actions/actions";
import { State } from "../store/store";
import Base from "./base";

export default class About extends Base {
    private version: string;
    private experiments: Array<{ title: string; description: string; paper: string; github: string; }>;

    constructor(store: Store<State, Action>) {
        super(store);

        this.version = "SERVICE_WORKER_CACHE_NAME";
        this.experiments = [
            {
                description: "Style an image by tuning the weights of 16 different styles.",
                github: "https://github.com/suyash/stylizer/tree/master/tasks/image_stylization",
                paper: "https://arxiv.org/abs/1610.07629",
                title: "Multi Image Stylization",
            },
            {
                description: "Convert an image into comic book style.",
                github: "https://github.com/suyash/stylizer/tree/master/tasks/comixgan",
                paper: "https://arxiv.org/abs/1812.03473",
                title: "Image Comixification",
            },
        ];
    }

    public connectedCallback() {
        super.connectedCallback();
    }

    protected template = () => {
        // tslint:disable:max-line-length
        return html`
<h5 class="mdc-typography--headline5">Stylizer</h5>
<p class="mdc-typography--body1">
    This is a set of experiments around image to image transformation algorithms.
    Currently this contains 2 implementations
</p>
<ul>
    ${this.experiments.map((e) => html`<li>
    <p class="mdc-typography--body1"><span class="title">${e.title}</span>: ${e.description}</p>
    <p class="mdc-typography--body1"><a href="${e.paper}" target="_blank" rel="noopener noreferrer">Paper<i class="material-icons">launch</i></a> <a href="${e.github}" target="_blank" rel="noopener noreferrer">Code<i class="material-icons">launch</i></a></p>
    </li>`)}
</ul>
<p class="mdc-typography--body1">Built By <a href="https://suy.io" target="_blank" rel="noopener noreferrer">Suyash</a>.</p>
<p class="mdc-typography--body1">All the code is open source on <a href="https://github.com/suyash/stylizer" target="_blank" rel="noopener noreferrer">GitHub<i class="material-icons">launch</i></a>.</p>`;
        // tslint:enable:max-line-length
    }
}

window.customElements.define("styl-about", About);

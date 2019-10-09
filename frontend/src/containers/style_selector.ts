import { MDCDialog } from "@material/dialog";
import { MDCSlider } from "@material/slider";
import * as tf from "@tensorflow/tfjs";
import { html } from "lit-html";
import { classMap } from "lit-html/directives/class-map";
import { styleMap } from "lit-html/directives/style-map";
import { Action, Store } from "redux";

import { ActionTypes } from "../actions/actions";
import inference from "../inference/multi_stylization";
import { loadImage } from "../inference/utils";
import { State } from "../store/store";
import Base from "./base";

interface MultiStylizationStyle {
    title: string;
    background: string;
    author: string | null;
    more: string | null;
}

export default class StyleSelector extends Base {
    private multiStylizationStyles: MultiStylizationStyle[];
    private dialog: MDCDialog|null;
    private dialogSlider: MDCSlider|null;
    private aborter: AbortController|null;
    private model: tf.GraphModel|null;

    constructor(store: Store<State, Action>) {
        super(store);

        this.dialog = null;
        this.dialogSlider = null;

        this.aborter = null;
        this.model = null;

        this.multiStylizationStyles = [
            {
                author: "Claude Monet",
                background: "claude_monet__poppy_field_in_argenteuil.jpg",
                more: "https://artsandculture.google.com/asset/poppy-field/xQGTinA-MPxcVg",
                title: "Poppy Field in Argenteuil",
            },
            {
                author: "Edvard Munch",
                background: "edvard_munch__the_scream.jpg",
                more: "https://en.wikipedia.org/wiki/The_Scream",
                title: "The Scream",
            },
            {
                author: "Egon Schiele",
                background: "egon_schiele__edith_with_striped_dress.jpg",
                more: "https://artsandculture.google.com/asset/edith-with-striped-dress-sitting/dQFWl0w8L54eOg",
                title: "Edith with Striped Dress",
            },
            {
                author: "Frederic Edwin Church",
                background: "frederic_edwin_church__eruption_at_cotopaxi.jpg",
                more: "https://www.wikidata.org/wiki/Q20201656",
                title: "Eruption at Cotopaxi",
            },
            {
                author: "Henri de toulouse",
                background: "henri_de_toulouse-lautrec__divan_japonais.jpg",
                more: "https://artsandculture.google.com/asset/divan-japonais/wgF74lDtm62uFg",
                title: "Divan Japonais",
            },
            {
                author: "Hokuasi",
                background: "hokusai__the_great_wave_off_kanagawa.jpg",
                // tslint:disable-next-line:max-line-length
                more: "https://artsandculture.google.com/asset/under-the-wave-off-kanagawa-kanagawa-oki-nami-ura-also-known-as-the-great-wave-from-the-series-thirty-six-views-of-mount-fuji-fugaku-sanj%C5%ABrokkei/BgFNq2kbIcTbFg",
                title: "The Great Wave Off Kanagawa",
            },
            {
                author: "Joseph William Turner",
                background: "joseph_william_turner__the_shipwreck_of_the_minotaur.jpg",
                more: "https://artsandculture.google.com/asset/the-wreck-of-a-transport-ship/sQGKScWwUEhaOw",
                title: "The Shipwreck of the Minotaur",
            },
            {
                author: "Leonid Afremov",
                background: "leonid_afremov__rain_princess.jpg",
                more: "https://afremov.com/rain-princess.html",
                title: "Rain Princess",
            },
            {
                author: "Francis Picabia",
                background: "louvre_udnie.jpg",
                more: "https://en.wikipedia.org/wiki/Mus%C3%A9e_National_d%27Art_Moderne",
                title: "Louvre Udnie",
            },
            {
                author: "Nicolas Poussin",
                background: "nicolas_poussin__landscape_with_a_calm.jpg",
                more: "http://www.getty.edu/legal/copyright.html",
                title: "Landscape with a Calm",
            },
            {
                author: "Pablo Picasso",
                background: "pablo_picasso__la_muse.jpg",
                more: null,
                title: "La Muse",
            },
            {
                author: "Paul Signac",
                background: "paul_signac__cassis_cap_lombard.jpg",
                more: "https://artsandculture.google.com/asset/cassis-cap-lombard-opus-196/_wHc489KOQ5f6Q",
                title: "Cassis Cap Lombard",
            },
            {
                author: "Hubble Space Telescope",
                background: "pillars_of_creation.jpg",
                more: "https://en.wikipedia.org/wiki/Pillars_of_Creation",
                title: "Pillars of Creation",
            },
            {
                author: "Vincent Van Gogh",
                background: "vincent_van_gogh__the_starry_night.jpg",
                more: null,
                title: "The Starry Night",
            },
            {
                author: "Wassily Kandinsky",
                background: "wassily_kandinsky__white_zig_zags.jpg",
                more: "https://artsandculture.google.com/asset/white-zig-zags/QAF7pE1CSuDH8Q",
                title: "White Zig Zags",
            },
            {
                author: "Wolfgang Lettl",
                background: "wolfgang_lettl__the_trial.jpg",
                more: "https://artsandculture.google.com/asset/the-trial/PwETeBk6X_AZsQ",
                title: "The Trial",
            },
        ];
    }

    public connectedCallback() {
        super.connectedCallback();

        for (let i = 0; i < this.multiStylizationStyles.length; i++) {
            const card = this.querySelector(`.style-card-container:nth-child(${i + 1}) .mdc-card`) as HTMLAnchorElement;
            card.addEventListener("click", () => this.onMultiStylizationStyleClicked(i));
        }

        const comixcard = this.querySelector(".comixification-card") as HTMLAnchorElement;
        comixcard.addEventListener("click", () => this.onComixificationStyleClicked());

        this.dialog = new MDCDialog(this.querySelector(".mdc-dialog") as HTMLElement);
        this.dialogSlider = new MDCSlider(this.querySelector(".mdc-dialog .mdc-slider") as HTMLElement);
        this.dialog.listen("MDCDialog:opened", this.onMultiStyleDialogOpened);
        this.dialog.listen("MDCDialog:closed", this.onMultiStyleDialogClosed);
    }

    protected template = () => {
        const state = this.store.getState();

        // tslint:disable:max-line-length
        return html`
<div style=${styleMap({ width: `${(this.multiStylizationStyles.length + 1) * 6.5 + 0.5}rem`, display: "flex" })}>
    <div class="style-collection">
        ${this.multiStylizationStyles.map((mss: MultiStylizationStyle, index: number) => html`
        <div class="style-card-container">
            <a href="javascript:void(0)" class="mdc-card style-card multi-stylization-card">
                <div class="mdc-card__primary-action">
                    <div class="mdc-card__media mdc-card__media--square" style=${styleMap({ backgroundImage: `url(/static/assets/mobile/styles/${mss.background})` })}>
                        <div class="mdc-card__media-content">
                            ${state.stylizer.multi_style.weights[index] > 0
                            ? html`<div class=${classMap({ "mdc-typography--headline5": true, "isset": true })}>${Math.round(state.stylizer.multi_style.weights[index] * 1000) / 10}%</h4>`
                            : html`<div class="mdc-typography--subtitle2">${mss.title}</div>`}
                        </div>
                    </div>
                </div>
            </a>
        </div>`)}
    </div>
    <div class="style-collection">
        <div class="style-card-container">
            <a href="javascript:void(0)" class="mdc-card style-card comixification-card">
                <div class="mdc-card__primary-action">
                    <div class="mdc-card__media mdc-card__media--square" style=${styleMap({ backgroundImage: `url(/static/assets/mobile/comixification/demo.jpg)` })}>
                        <div class="mdc-card__media-content">
                            ${state.stylizer.comixified
                            ? html`<div class=${classMap({ "material-icons": true, "mdc-typography--headline5": true, "isset": true })}>check</h4>`
                            : html`<div class="mdc-typography--subtitle2">Comixify</div>`}
                        </div>
                    </div>
                </div>
            </a>
        </div>
    </div>
</div>
<div class="mdc-dialog" role="alertdialog" aria-modal="true" aria-labelledby="multi-style-dialog-title"
    aria-describedby="multi-style-dialog-content">
    <div class="mdc-dialog__container">
        <div class="mdc-dialog__surface">
            <div class="mdc-dialog__content" id="multi-style-dialog-content">
                <div>
                    <div>
                        <h6 class="mdc-typography--headline6 title">${state.stylizer.multi_style.dialog_index !== null ? this.multiStylizationStyles[state.stylizer.multi_style.dialog_index].title : ""}</h6>
                        <p class="mdc-typography--subtitle2 author">${state.stylizer.multi_style.dialog_index !== null ? this.multiStylizationStyles[state.stylizer.multi_style.dialog_index].author : ""}</p>
                        <a
                            href=${state.stylizer.multi_style.dialog_index !== null ? this.multiStylizationStyles[state.stylizer.multi_style.dialog_index].more : "javascript:void(0)"}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="mdc-typography--subtitle2 more">More<i class="material-icons">launch</i></a>
                    </div>
                    <div class="style-dialog-background" style=${styleMap({ backgroundImage: state.stylizer.multi_style.dialog_index !== null ? `url(/static/assets/mobile/styles/${this.multiStylizationStyles[state.stylizer.multi_style.dialog_index].background})` : "" })}></div>
                </div>
                <div>
                    <div class="slider-pad"></div>
                    <div class="mdc-slider" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100"
                        aria-valuenow="0" aria-label="Select Value">
                        <div class="mdc-slider__track-container">
                            <div class="mdc-slider__track"></div>
                        </div>
                        <div class="mdc-slider__thumb-container">
                            <svg class="mdc-slider__thumb" width="21" height="21">
                                <circle cx="10.5" cy="10.5" r="7.875"></circle>
                            </svg>
                            <div class="mdc-slider__focus-ring"></div>
                        </div>
                    </div>
                    <div class="slider-pad"></div>
                </div>
                <div class="mdc-typography--caption">For best results, make sure all weights add up to 100%</div>
            </div>
            <footer class="mdc-dialog__actions">
                <button type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="yes">
                    <span class="mdc-button__label">Ok</span>
                </button>
                <button type="button" class="mdc-button mdc-dialog__button mdc-dialog__button--default"
                    data-mdc-dialog-action="no">
                    <span class="mdc-button__label">Cancel</span>
                </button>
            </footer>
        </div>
    </div>
    <div class="mdc-dialog__scrim"></div>
</div>`;
        // tslint:enable:max-line-length
    }

    protected stateChanged = () => {
        const state = this.store.getState();
        if (state.stylizer.multi_style.dialog_index !== null) {
            (this.dialog as MDCDialog).open();
        }
    }

    private onMultiStylizationStyleClicked = (index: number) => {
        this.store.dispatch({ type: ActionTypes.SET_MULTI_STYLIZATION_DIALOG_INDEX, index });
    }

    private onMultiStyleDialogOpened = () => {
        (this.dialogSlider as MDCSlider).layout();
        const state = this.store.getState();
        const styleDialogIndex: number = state.stylizer.multi_style.dialog_index as number;
        const styleWeights = state.stylizer.multi_style.weights;
        if (styleWeights[styleDialogIndex] === 0) {
            (this.dialogSlider as MDCSlider).value = 100;
        } else {
            (this.dialogSlider as MDCSlider).value = styleWeights[styleDialogIndex] * 100;
        }
    }

    private onMultiStyleDialogClosed = (e: any) => {
        const index = this.store.getState().stylizer.multi_style.dialog_index;
        this.store.dispatch({ type: ActionTypes.SET_MULTI_STYLIZATION_DIALOG_INDEX, index: null });

        if (e.detail.action === "yes") {
            this.store.dispatch({
                index,
                type: ActionTypes.SET_STYLE_WEIGHT,
                value: (this.dialogSlider as MDCSlider).value / 100,
            });

            this.onMultiStylization();
        }
    }

    private onMultiStylization = async () => {
        const state = this.store.getState();
        if (state.stylizer.multi_style.on_device_prediction) {
            await this.onDeviceMultiStylization();
        } else {
            await this.onOnlineMultiStylization();
        }
    }

    private onOnlineMultiStylization = async () => {
        const state = this.store.getState();

        return await this.onOnlineTransformation("/multi_image_stylization", {
            instances: [
                {
                    image_bytes: { b64: (state.stylizer.base_image as string).substring(23) },
                    style_weights: state.stylizer.multi_style.weights,
                },
            ],
        });
    }

    private onComixificationStyleClicked = async () => {
        const state = this.store.getState();

        this.store.dispatch({ type: ActionTypes.SET_COMIXIFIED, value: true });

        await this.onOnlineTransformation("/image_comixification", {
            instances: [
                {
                    image_bytes: { b64: (state.stylizer.base_image as string).substring(23) },
                },
            ],
        });
    }

    private onOnlineTransformation = async (endpoint: string, body: any) => {
        this.store.dispatch({ type: ActionTypes.SET_LOADING });

        if (this.aborter) {
            this.aborter.abort();
        }

        this.aborter = new AbortController();

        try {
            const res = await fetch(endpoint, {
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                signal: this.aborter.signal,
            });

            this.aborter = null;

            if (res.status !== 200) {
                throw res;
            }

            const url = await res.text();
            this.store.dispatch({ type: ActionTypes.SET_STYLED_IMAGE, url });
        } catch (err) {
            if (err.message && err.message.indexOf("aborted") !== -1) {
                // tslint:disable-next-line:no-console
                console.log("aborted");
            } else {
                // tslint:disable-next-line:no-console
                console.error(err.message);
                this.store.dispatch({ type: ActionTypes.SHOW_ERROR, message: "There was an error. Please try again." });
            }
        }
    }

    private onDeviceMultiStylization = async () => {
        this.store.dispatch({ type: ActionTypes.SET_LOADING });

        const state = this.store.getState();

        try {
            const img = await loadImage(state.stylizer.base_image as string);
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext("2d") as CanvasRenderingContext2D;
            context.drawImage(img, 0, 0, img.width, img.height);

            if (!this.model) {
                this.model = await tf.loadGraphModel("/static/models/image_stylization/v1/model.json");
            }

            const url = await inference(canvas, state.stylizer.multi_style.weights, this.model as tf.GraphModel);
            this.store.dispatch({ type: ActionTypes.SET_STYLED_IMAGE, url });
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.error(err);
            this.store.dispatch({ type: ActionTypes.SHOW_ERROR, message: "There was an error. Please try again." });
        }
    }
}

window.customElements.define("styl-selector", StyleSelector);

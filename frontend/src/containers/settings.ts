import { MDCSlider } from "@material/slider";
import { MDCSwitch } from "@material/switch";
import { set } from "idb-keyval";
import { html } from "lit-html";
import { Action, Store } from "redux";

import { ActionTypes } from "../actions/actions";
import { State } from "../store/store";
import Base from "./base";

export default class Settings extends Base {
    private dimensionSlider: MDCSlider|null;
    private multiStylizationOnDevicePredictionSwitch: MDCSwitch|null;
    private multiStylizationSaveOfflineSwitch: MDCSwitch|null;

    constructor(store: Store<State, Action>) {
        super(store);

        this.dimensionSlider = null;
        this.multiStylizationOnDevicePredictionSwitch = null;
        this.multiStylizationSaveOfflineSwitch = null;
    }

    public connectedCallback() {
        super.connectedCallback();

        this.dimensionSlider = new MDCSlider(this.querySelector(".dimensionSlider") as HTMLElement);
        this.dimensionSlider.value = this.store.getState().stylizer.maxdim;
        this.dimensionSlider.listen("MDCSlider:change", this.onDimensionSliderChange);

        this.multiStylizationOnDevicePredictionSwitch =
            new MDCSwitch(this.querySelector(".on_device_predictions") as HTMLElement);

        this.multiStylizationSaveOfflineSwitch =
            new MDCSwitch(this.querySelector(".save_offline") as HTMLElement);

        this.multiStylizationOnDevicePredictionSwitch.listen("change", this.onSetMultiStylizationOnDevicePrediction);
        this.multiStylizationSaveOfflineSwitch.listen("change", this.onSetMultiStylizationSaveOffline);

        this.initialize();
    }

    // tslint:disable:max-line-length
    protected template = () => html`
<div class="setting slider-setting">
    <div class="title">
        <p class="mdc-typography--body1">Max Dimension</p>
    </div>
    <div class="value">
        <div class="mdc-slider mdc-slider--discrete dimensionSlider" tabindex="0" role="slider" aria-valuemin="256"
            aria-valuemax="1024" aria-valuenow="0" data-step="256" aria-label="Select Value">
            <div class="mdc-slider__track-container">
                <div class="mdc-slider__track"></div>
            </div>
            <div class="mdc-slider__thumb-container">
                <div class="mdc-slider__pin">
                    <span class="mdc-slider__pin-value-marker"></span>
                </div>
                <svg class="mdc-slider__thumb" width="21" height="21">
                    <circle cx="10.5" cy="10.5" r="7.875"></circle>
                </svg>
                <div class="mdc-slider__focus-ring"></div>
            </div>
        </div>
    </div>
</div>
<h6 class="mdc-typography--headline6">Multi Stylization</h6>
<div class="setting switch-setting">
    <div class="title">
        <p class="mdc-typography--body1">On device Predictions</p>
    </div>
    <div class="value">
        <div class="mdc-switch on_device_predictions">
            <div class="mdc-switch__track"></div>
            <div class="mdc-switch__thumb-underlay">
                <div class="mdc-switch__thumb">
                    <input type="checkbox" id="basic-switch" class="mdc-switch__native-control" role="switch">
                </div>
            </div>
        </div>
    </div>
</div>
<div class="setting switch-setting">
    <div class="title">
        <p class="mdc-typography--body1">Save Model Offline</p>
    </div>
    <div class="value">
        <div class="mdc-switch save_offline">
            <div class="mdc-switch__track"></div>
            <div class="mdc-switch__thumb-underlay">
                <div class="mdc-switch__thumb">
                    <input type="checkbox" id="basic-switch" class="mdc-switch__native-control" role="switch">
                </div>
            </div>
        </div>
    </div>
</div>`
    // tslint:enable:max-line-length

    protected stateChanged = () => {
        this.initialize();
    }

    private initialize = () => {
        const state = this.store.getState();
        (this.dimensionSlider as MDCSlider).value = state.stylizer.maxdim;
        (this.multiStylizationOnDevicePredictionSwitch as MDCSwitch).checked
            = state.stylizer.multi_style.on_device_prediction;
        (this.multiStylizationSaveOfflineSwitch as MDCSwitch).checked
            = state.stylizer.multi_style.offline_model_cached;
    }

    private onDimensionSliderChange = async () => {
        const maxdim = (this.dimensionSlider as MDCSlider).value;
        this.store.dispatch({ type: ActionTypes.SET_MAXDIM, maxdim });
        await set("multi_stylization/maxdim", maxdim);
    }

    private onSetMultiStylizationOnDevicePrediction = async () => {
        const value: boolean = (this.multiStylizationOnDevicePredictionSwitch as MDCSwitch).checked;
        this.store.dispatch({ type: ActionTypes.SET_MULTI_STYLIZATION_ON_DEVICE_PREDICTION, value });
        await set("multi_stylization/on_device_prediction", value);
    }

    private onSetMultiStylizationSaveOffline = async () => {
        const sw = this.multiStylizationSaveOfflineSwitch as MDCSwitch;

        sw.disabled = true;
        const cache = await caches.open("SERVICE_WORKER_CACHE_NAME");
        const requestURLs: string[] = [
            "/static/models/image_stylization/v1/model.json",
            "/static/models/image_stylization/v1/group1-shard1of1.bin"];
        if (sw.checked) {
            const responses: Response[] = await Promise.all(requestURLs.map((r) => fetch(r)));
            if (responses[0].status === 200 && responses[1].status === 200) {
                await Promise.all([
                    cache.put(requestURLs[0], responses[0]),
                    cache.put(requestURLs[1], responses[1]),
                ]);

                this.store.dispatch({
                    type: ActionTypes.SET_MULTI_STYLIZATION_OFFLINE_MODEL_CACHED_STATUS,
                    value: true,
                });
            } else {
                this.store.dispatch({
                    message: "There was an error saving the model offline",
                    type: ActionTypes.SHOW_ERROR,
                });

                sw.checked = false;
            }
        } else {
            await Promise.all([
                cache.delete(requestURLs[0]),
                cache.delete(requestURLs[1]),
            ]);

            this.store.dispatch({
                type: ActionTypes.SET_MULTI_STYLIZATION_OFFLINE_MODEL_CACHED_STATUS,
                value: false,
            });

            sw.checked = false;
        }

        sw.disabled = false;
    }
}

window.customElements.define("styl-settings", Settings);

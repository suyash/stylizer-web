import { html } from "lit-html";
import { Action, Store } from "redux";

import { ActionTypes } from "../actions/actions";
import { State } from "../store/store";
import Base from "./base";

export default class ImageOpener extends Base {
    private input: HTMLInputElement|null;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(store: Store<State, Action>) {
        super(store);

        this.input = null;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    }

    protected template = () => html`
<label class="mdc-button mdc-button--raised">
    <input type="file" accept="image/*" style="display: none;" @change=${this.load}>
    <span class="mdc-button__label">Open a File</span>
</label>`

    private load = async (e: Event) => {
        const inp = e.target as HTMLInputElement;
        if (inp.files && inp.files[0]) {
            const url = URL.createObjectURL(inp.files[0]);

            const img = await this.loadImage(url);
            const imgURL = await this.resizeImage(img);

            this.store.dispatch({ type: ActionTypes.OPEN_IMAGE, url: imgURL });
        }

        inp.value = "";
    }

    private loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    // TODO: use OffscreenCanvas if available
    private resizeImage = (img: HTMLImageElement): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const [width, height] = this.resizeImageDimensions([img.width, img.height]);
                this.canvas.width = width;
                this.canvas.height = height;

                this.context.drawImage(img, 0, 0, width, height);

                resolve(this.canvas.toDataURL("image/jpeg"));
            }, 0);
        });
    }

    private resizeImageDimensions([width, height]: [number, number]): [number, number] {
        const maxdim = this.store.getState().stylizer.maxdim;

        if (width < maxdim && height < maxdim) {
            return [width, height];
        }

        const scale = Math.max(width, height) / maxdim;
        return [Math.round(width / scale), Math.round(height / scale)];
    }
}

window.customElements.define("styl-image-opener", ImageOpener);

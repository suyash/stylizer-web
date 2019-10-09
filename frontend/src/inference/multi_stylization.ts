import * as tf from "@tensorflow/tfjs";

export default async function inference(canvas: HTMLCanvasElement, styleWeights: number[], model: tf.GraphModel) {
    const result: tf.Tensor = await tf.tidy(() => {
        const inp: tf.Tensor3D = tf.browser.fromPixels(canvas);
        const out: tf.Tensor[] = model.predict({
            frames: tf.cast(inp.expandDims(0), "float32"),
            style_weights: tf.tensor1d(styleWeights).expandDims(0),
        }) as tf.Tensor[];
        const cans: tf.Tensor = out[64].squeeze();
        return tf.cast(tf.round(cans), "int32");
    });

    await tf.browser.toPixels(result as tf.Tensor3D, canvas);
    result.dispose();

    // tslint:disable-next-line:no-console
    console.log(tf.memory());

    return canvas.toDataURL("image/jpeg");
}

import MIC from "./tools/mic.js";

export default class AudioRecorder {
    #blob;
    #mediaRec;
    #chunks = [];

    async start() {
        await MIC.connect();
        this.#chunks = [];
        this.#mediaRec = new MediaRecorder(MIC.stream);
        this.#mediaRec.ondataavailable = e => this.#chunks.push(e.data);
        this.#mediaRec.start();
    }
    async stop() {
        this.#mediaRec.stop();
        await new Promise(r => this.#mediaRec.onstop = r);
        // const blob = new Blob(this.#chunks, { type: 'audio/ogg; codecs=opus' });
        const blob = new Blob(this.#chunks, { type: 'audio/wav' });
        this.#blob = blob;
        MIC.disconnect();
    }

    export() {
        return this.#blob;
    }
    import(blob) {
        this.#blob = blob;
        // this.audio.src = URL.createObjectURL(blob);
    }

}

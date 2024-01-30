import FS from '../utils/fileSystem.js';
import AREC from '../rec/oga.js';
import FREC from '../rec/freq.js';

const template = document.createElement('template');
template.innerHTML = /*html*/`
<style>
    :host {
        display: flex;
        flex-direction: column;
        gap: 1vmin;
        transition: opacity .3s;
    }
    audio {
        width: 100%;
    }
    audio[src=""],
    audio:not([src]) {
        display: none;
    }
</style>
<div>
    <select name="recId" id="recId"></select>
    <button id="start">START</button>
    <button id="stop" disabled>STOP</button>
</div>
<shit-timeline-visualizer></shit-timeline-visualizer>
<div id="markers">
    <select name="page" id="pageForMarker"></select>
    <button id="addMarker">Add Marker</button>
    or
    <button id="removeMarker">Remove Marker</button>
</div>
<audio controls></audio>
<button id="save" disabled>Save</button>
`;


const timelinePref = 
    [20]
    // [100, 'sigTime', 1]

class RecordingEditor extends HTMLElement {
    #arec;
    #frec;

    #timeline;


    set timeline(timeline) {
        this.#timeline = timeline;
        this.visualizer.draw(timeline);
        this.visualizer.drawIndicator(this.currentPct);
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' })
        // this.setAttribute('tabindex', '0');
        // this.classList.add('window');
        const sh = this.shadowRoot;
        sh.appendChild(template.content.cloneNode(true));

        this.visualizer = sh.querySelector('shit-timeline-visualizer');
        this.audio = sh.querySelector('audio');

        this.audio.ontimeupdate = () => {
            const pct = this.currentPct;

            if (this.audio.paused) playFrame(this.audio);

            this.visualizer.drawIndicator(pct);
            this.visualizer.scrollTo(pct);
        }

        sh.querySelector('#recId').addEventListener('change', (event) => {
            // Do something when the selected option changes
            const selectedOption = event.target.value;
            this.open(selectedOption);
        });

        sh.querySelector('#start').onclick = async () => {
            await this.start();
        }
        sh.querySelector('#stop').onclick = async () => {
            await this.stop();
            this.audio.focus();
        }

        sh.querySelector('#addMarker').onclick = () => {
            const p = sh.querySelector('#pageForMarker');
            const page = parseInt(p.value);
            this.#frec.markers.add(page, this.audio.currentTime * 1000);
            this.timeline = this.#frec.toTimeline(...timelinePref);
            p.selectedIndex = (p.selectedIndex + 1) % p.options.length;
        }
        sh.querySelector('#removeMarker').onclick = () => {
            this.#frec.markers.remove(this.audio.currentTime * 1000);
            this.timeline = this.#frec.toTimeline(...timelinePref);
        }

    }

    set pages(number) {
        const select = this.shadowRoot.querySelector('#pageForMarker');
        select.innerHTML = '';
        for (let i = 0; i <= number; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i === 0 ? 'Silence' : 'Page ' + i;
            select.appendChild(option);
        }
    }

    set recIDs(number) {
        const select = this.shadowRoot.querySelector('#recId');
        select.innerHTML = '';
        for (let i = 0; i < number; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = 'REC#' + (i + 1);
            select.appendChild(option);
        }
    }

        

    async start() {
        this.#arec = new AREC();
        this.#frec = new FREC();

        this.audio.src = '';
        this.visualizer.clear();

        await this.#arec.start();
        await this.#frec.start();

        this.show();
        this.shadowRoot.querySelector('#save').disabled = true;
        this.shadowRoot.querySelector('#stop').disabled = false;
        this.shadowRoot.querySelector('#stop').focus();
        this.shadowRoot.querySelector('#start').disabled = true;
    }
    async stop() {
        await this.#arec.stop();
        await this.#frec.stop();

        this.audio.src = URL.createObjectURL(this.#arec.export());
        this.timeline = this.#frec.toTimeline(...timelinePref);

        this.shadowRoot.querySelector('#save').disabled = false;
        this.shadowRoot.querySelector('#stop').disabled = true;
        this.shadowRoot.querySelector('#start').disabled = false;
        this.shadowRoot.querySelector('#save').onclick = async () => {
            await saveNew(this.#frec.export(), this.#arec.export());
            this.shadowRoot.querySelector('#save').disabled = true;
            this.hide();
        }
    }

    async open(id = 0) {
        const rec = await getRecording(id);
        if (!rec) return;
        this.#arec = undefined;
        // this.#frec = rec.frec;
        this.#frec = new FREC();
        const log = await rec.log.read();
        this.#frec.import(log);


        this.audio.src = URL.createObjectURL(rec.blob);
        this.timeline = this.#frec.toTimeline(...timelinePref);

        this.show();
        this.shadowRoot.querySelector('#save').disabled = false;
        this.shadowRoot.querySelector('#stop').disabled = true;
        this.shadowRoot.querySelector('#start').disabled = false;
        this.shadowRoot.querySelector('#save').onclick = async () => {
            await rec.log.write(this.#frec.export());
        }
    }


    show() {
        this.style.display = 'flex';
    }
    hide() {
        this.style.display = 'none';
    }    


    get currentTime() {
        return this.audio.currentTime;
    }
    get duration() {
        return  this.audio?.duration && this.audio.duration !== Infinity 
              ? this.audio.duration
              : this.#timeline[this.#timeline.length - 1].time / 1000;
    }
    get currentPct() {
        return this.audio.currentTime / this.duration;
    }

}



function playFrame(audio) {
    const newAudio = new Audio();
    newAudio.src = audio.src;
    newAudio.currentTime = audio.currentTime;
    newAudio.play();
    setTimeout(() => {
        newAudio.pause();
    }, 100);
}

async function saveNew(freqLog, audioBlob) {
    // const recDir = FS.getFolder('recordings');
    const recDir = await FS.createFolder('recordings');
    const newRec = await recDir.createFolder(`REC_${Date.now()}`);

    if (!freqLog) return;
    const logFile = await newRec.createFile('freqLog.json');
    await logFile.write(freqLog);

    if (!audioBlob) return;
    const audioFile = await newRec.createFile('audio.wav');
    await audioFile.write(audioBlob);
}

async function getRecording(id) {
    const allRec = FS.getFolder('recordings');
    const recsDirs = allRec.getFolders();
    const rec = {
        // frec: new FREC(),
        log: null,
        blob: null
    }
    const dir = recsDirs[id];

    rec.log = dir.getFile('freqLog.json');
    // const log = await logFile.read();
    // rec.frec.import(log);

    const audioFile = dir.getFile('audio.wav');
    if (!audioFile) return rec;
    const buffer = await audioFile.getBlob();
    rec.blob = new Blob([buffer], { type: 'audio/wav' });

    return rec;
}



customElements.define('shit-recording', RecordingEditor);
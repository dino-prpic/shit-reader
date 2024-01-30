import FS from '../utils/fileSystem.js';
import FREC from '../rec/freq.js';
import trainingSet from '../ai/trainingSet2.js'



const template = document.createElement('template');
template.innerHTML = /*html*/`
<style>
    :host {
        display: flex;
        flex-direction: column;
        gap: 1vmin;
        transition: opacity .3s;
    }
    .progressBar {
        width: 100%;
        height: 20px;
        position: relative;
        border-radius: 10px;
        background-color: #ddd;
    }
    #progress {
        width: 0%;
        height: 100%;
        background-color: lightblue;
        border-radius: 10px;
        position: relative;
        border: 1px solid blue;
        box-sizing: border-box;
    }
    .progressBar > #info {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 5px;
        border-radius: 5px;
        font-size: 12px;
        color: black;
    }
    #graph {
        background-color: #ddd;
        padding: 0;
        overflow: hidden;
        border-radius: 10px;
        height: 40vh;
    }
</style>
<div id="actions">
    iterations: <input type="number" id="iterations" value="2" step="10" min="1">
    error threshold: <input type="number" id="errorThresh" value="0.001" step="0.001" min="0">
    learning rate: <input type="number" id="learningRate" value="0.001" max="1" min="0" step="0.001">
    <button id="train">TRAIN</button>
    <button id="stop">STOP</button>
</div>
<div class="progressBar">
    <div id="progress"></div>
    <span id="info"></span>
</div>
<div id="graph">
    <canvas id="history" width="0" height="0"></canvas>
</div>
`;

const history = []
const worker = new Worker('../js/workers/brainjs_training.js', { type: 'module' })

class TrainingManager extends HTMLElement {
    timelinePref = [100, 'sigTime', 1]
    #netOptions = {
        inputSize: 12800,
        hiddenLayers: [200],
        outputSize: 4,
        activation: 'relu'
    }
    brain
    #trainingSet

    constructor() {
        super();
        this.attachShadow({ mode: 'open' })
        const sh = this.shadowRoot;
        sh.appendChild(template.content.cloneNode(true));

        worker.onerror = (e) => {
            console.log(e)
        }
        worker.onmessage = (e) => {
            const { type, data } = e.data
            console.log(type, data)
            switch (type) {
                case 'start':
                    sh.getElementById('progress').style.width = `0%`
                    sh.getElementById('info').innerText = 'starting training'
                    break;
                case 'log':
                    history.push(data.error)
                    this.#draw()
                    sh.getElementById('progress').style.transition = `width 0.1s`
                    sh.getElementById('progress').style.width = `${data.pct}%`
                    setTimeout(() => {
                        sh.getElementById('progress').style.transition = `width ${data.eta + 5}s linear`
                        sh.getElementById('progress').style.width = `100%`
                    }, 200)
                    sh.getElementById('info').innerText = `${data.iterations} iterations (${data.pct}%) - total: ${history.length} - eta: ${secToHuman(data.eta)}`
                    break;
                    case 'finish':
                        // history.push(-1)
                        FS.createFile('brain.json').then((file) => {
                            file.write(JSON.stringify(data.net))
                        })
                        this.brain = null
                        this.#netOptions = null
                        sh.getElementById('progress').style.transition = `width 0.1s`
                    sh.getElementById('progress').style.width = `100%`
                    sh.getElementById('info').innerText = 'done'
                    break;
            }
        }

        sh.getElementById('train').addEventListener('click', () => {
            this.start()
        })
        sh.getElementById('stop').addEventListener('click', () => {
            this.stop()
        })


    }

    async load() {
        // brain
        const brainFile = FS.getFile('brain.json')
        if (brainFile) {
            const brainString = await brainFile.read()
            this.brain = JSON.parse(brainString)
            console.log('brain loaded')            
            console.log(brainFile)
        }
        console.log(this.brain)

        // training set
        const recs = FS.getFolder('recordings')
        if (recs.length === 0) {
            this.shadowRoot.getElementById('info').innerText = 'no recordings found'
            throw new Error('no recordings found')
        }
        this.shadowRoot.getElementById('info').innerText = `generating training set from ${recs.length} recordings`
        const frecsPromises = recs.map(async (rec) => {
            const freqLog = await rec.getFile('freqLog.json').read()
            const frec = new FREC()
            frec.import(freqLog)
            return frec
        });
    
        const frecs = await Promise.all(frecsPromises)
        // const set = trainingSet(frecs)
        this.#trainingSet = trainingSet(frecs, this.timelinePref)
        console.log('training set generated')
        console.log(this.#trainingSet)
    }

    async start() {
        if (!this.#trainingSet) {
            // await this.load()
            try {
                await this.load()
            } catch (e) {
                return
            }
        }

        const trainingOptions = {
            iterations: parseInt(this.shadowRoot.getElementById('iterations').value),
            learningRate: parseFloat(this.shadowRoot.getElementById('learningRate').value),
            errorThresh: parseFloat(this.shadowRoot.getElementById('errorThresh').value)
        }

        const message = { 
            net: this.brain,
            netOptions: this.#netOptions,
            trainingSet: this.#trainingSet,
            trainingOptions
        }
        console.log(message)

        worker.postMessage({ 
            type: 'start',
            data: message
        })
    }
    stop() {
        worker.postMessage({ type: 'stop' })
    }

    #draw() {
                
        const max = Math.max(...history)
        
        // create canvas
        const canvas = this.shadowRoot.getElementById('history')
        const ctx = canvas.getContext('2d')
        const container = this.shadowRoot.getElementById('graph')
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
    
        const width = canvas.width
        const height = canvas.height
        const xScale = width / (history.length - 1)
        const yScale = height / max
        ctx.clearRect(0, 0, width, height)
    
        // - calculate grid decimals to draw
        let drawDecimals = 0
        while (max < 1 / Math.pow(10, drawDecimals) * 1.5) {
            drawDecimals++
        }
    
        // - draw grid
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        ctx.fillStyle = 'rgba(0,0,0,0.2)'
        ctx.font = `20px sans-serif`
        ctx.beginPath()
        for (let i = 0; i < max; i += 1 / Math.pow(10, drawDecimals)) {
            const y = height - i * yScale
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.fillText(i.toFixed(drawDecimals), 20, y)
        }
        ctx.stroke()
    
    
        // draw history
        ctx.beginPath()
        ctx.moveTo(0, height - history[0] * yScale)
        for (let i = 1; i < history.length; i++) {
            // ctx.lineTo(i * xScale, height - history[i] * yScale)
            if (history[i] === -1) {
                ctx.stroke()
                ctx.beginPath()
                ctx.strokeStyle = 'rgba(0,0,255,0.5)'
                ctx.moveTo(i * xScale - xScale/2, 0)
                ctx.lineTo(i * xScale - xScale/2, height)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(i * xScale, height - history[i - 1] * yScale)
            } else {
                ctx.strokeStyle = 'rgb(255,0,0)'
                ctx.lineTo(i * xScale, height - history[i] * yScale)
            }
        }
        ctx.stroke()
    
    }

}

function secToHuman(sec) {
    // show Xs / Xm / Xh
    if (sec < 60) {
        return `${sec.toFixed(0)}s`
    } else if (sec < 60 * 60) {
        return `${(sec / 60).toFixed(0)}m`
    } else {
        return `${(sec / 60 / 60).toFixed(0)}h`
    }
}


customElements.define('shit-training', TrainingManager);
const template = document.createElement('template');
template.innerHTML = /*html*/`
<style>
    :host {
        overflow: auto;
        background: rgba(0,0,0,0.5);
        border-radius: 2vmin;
    }
    canvas {
        display: block;
        max-height: 50vh;
        max-height: 50dvh;
    }
</style>
<canvas width="0" height="0"></canvas>
`;

class TimelineVisualizer extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const sh = this.shadowRoot;
        sh.appendChild(template.content.cloneNode(true));

        this.canvas = sh.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    spacing = {
        x: 0,
        y: 0
    }

    #saved;

    draw(timeline) {
        this.ctx.canvas.willReadFrequently = true;

        this.canvas.width = timeline.length * (this.spacing.x + 1);
        this.canvas.height = timeline[0].data.length * (this.spacing.y + 1);
        this.ctx.fillStyle = 'rgb(255,0,0)';

        const markers = [];
        for (let x = 0; x < timeline.length; x++) {
            const frame = timeline[x].data;
            for (let y = 0; y < frame.length; y++) {
                this.ctx.globalAlpha = frame[y] / 255;
                this.ctx.fillRect(x * (this.spacing.x + 1), (frame.length - y) * (this.spacing.y + 1), 1, 1);
            }
            if (timeline[x].marker !== undefined) {
                markers.push({
                    x: x * (this.spacing.x + 1),
                    label: timeline[x].marker,
                });
            }
        }
        this.#saved = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // markers
        markers.forEach(marker => {
            const pct = marker.x / this.canvas.width;
            this.drawIndicator(pct, 'yellow', true, marker.label);
        });

    }

    clear() {
        this.canvas.width = 0;
        this.canvas.height = 0;
    }

    drawIndicator(pct, color = 'green', permanent = false, label) {
        this.ctx.putImageData(this.#saved, 0, 0);
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pct * this.canvas.width, 0, 1, this.canvas.height);
        if (label !== undefined) {
            this.ctx.fillRect(pct * this.canvas.width, 60, 30, 20);
            this.ctx.fillStyle = 'rgb(0,0,0)';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(
                label, 
                pct * this.canvas.width + 10, 75);
        }
        if (permanent) {
            this.#saved = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    scrollTo(pct) {
        this.scrollLeft = pct * this.scrollWidth - this.clientWidth / 2;
    }

}

customElements.define('shit-timeline-visualizer', TimelineVisualizer);
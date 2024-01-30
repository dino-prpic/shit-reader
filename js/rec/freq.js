import MIC from "./tools/mic.js";
import markers from "./tools/markers.js";
import timeline from "./tools/timeline.js";

export default class FrequencyRecorder {
    #recording = false;
    log = [];

    async start() {
        await MIC.connect();
        this.log = [];
        this.#recording = true;
        this.#record();

        // listen for marker events
        document.addEventListener('selectedPage', this.markers.add);

    }
    async stop() {
        document.removeEventListener('selectedPage', this.markers.add);
        this.#recording = false;
        MIC.disconnect();
    }

    export() {
        const output = [];
        this.log.forEach(entry => {
            const newEntry = {
                data: Array.from(entry.data),
                time: entry.time
            };
            if (entry.marker !== undefined) newEntry.marker = entry.marker;
            output.push(newEntry);
        });
        return JSON.stringify(output);
    }
    import(log) {
        const input = JSON.parse(log);
        for (let i = 0; i < input.length; i++) {
            const entry = {
                data: new Uint8Array(input[i].data),
                time: input[i].time,
            };
            if (input[i].marker !== undefined) entry.marker = input[i].marker;
            this.log.push(entry);
        }
    }

    

    select(startMS, endMS) {
        // console.log(startMS, endMS);
        const output = new FrequencyRecorder();
        const selection = this.log.filter(d => d.time >= startMS && d.time <= endMS);
        // console.log(selection);
        // for (let i = 0; i < selection.length; i++) {
        //     const entry = {
        //         data: new Uint8Array(selection[i].data),
        //         time: selection[i].time - startMS,
        //     }
        //     if (selection[i].marker !== undefined) entry.marker = selection[i].marker;
        //     output.log.push(entry);
        // }
        output.log = selection;
        return output;
    }

    get markers() {
        return markers(this.log);
    }

    get duration() {
        return this.log[this.log.length - 1].time;
    }

    toTimeline(...args) {
        return timeline(this.log, ...args);
    }

    #record() {
        const startTime = Date.now();

        function getData() {
            try {
                const data = MIC.getByteFrequencyData();
                this.log.push({
                    data: data.slice(0, Math.floor(data.length / 4)),
                    time: Date.now() - startTime,
                });
            } catch (err) {
                this.#recording = false;
            }
            if (this.#recording) requestAnimationFrame(getData.bind(this));
        }
        getData.call(this);

    }
    


}
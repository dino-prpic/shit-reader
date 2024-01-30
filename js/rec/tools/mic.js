import ENV from '../../env.js';

let connected = false,
    stream,
    analyzer,
    users = 0

export default class MIC {

    static async connect() {
        users++; 
        
        if (users !== 1) {
            while (!connected) await new Promise(r => setTimeout(r, 100));
            return;
        }

        const audioctx = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioctx.createAnalyser();
        analyzer.fftSize = ENV.freq.fftSize;

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const microphone = audioctx.createMediaStreamSource(stream);
        microphone.connect(analyzer);
        connected = true;
    }

    static async disconnect() {
        users--; if (users > 0) return;
        users = 0;
        connected = false;
        stream.getTracks().forEach(track => track.stop());
    }

    static get stream() {
        if (users === 0) throw new Error('MIC not connected');
        return stream;
    }

    static getByteFrequencyData() {
        if (users === 0) throw new Error('MIC not connected');
        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        data.slice(0, Math.floor(data.length * ENV.freq.selection));
        return data;
    }

}
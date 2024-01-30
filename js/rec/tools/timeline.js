import TFX from './tfx.js';

export default function timeline(log, fps = 10, timePref = 'time', ...FXargs) {
    console.log(`%cREC.getTimeline(${fps}, ${timePref})`, 
                'background: red; color: white; padding: 2px 4px; border-radius: 5px;');

    if (log.length === 0) throw new Error('No log to get timeline from');
    console.log('log:');
    console.log(log);
    if (timePref !== 'time') {
        TFX(log)[timePref](...FXargs);
    }

    const frameMS = 1000 / fps;
    const frameCount = Math.floor((log[log.length - 1][timePref] || 0) / frameMS);
    const resolution = log[0].data.length;


    const timeline = new Array(frameCount);

    // for each frame
    for (let i = 0; i < frameCount; i++) {
        timeline[i] = {
            data: new Uint8Array(resolution)
        };

        const frameStart = i * frameMS;
        const frameEnd = frameStart + frameMS;
        const frameMid = frameStart + frameMS / 2;

        // get log entries within frame or closest to frame
        let frameLogs = log.filter(d => d[timePref] >= frameStart && d[timePref] < frameEnd);
        if (frameLogs.length < 2) {
            frameLogs = [...log].sort((a, b) => 
                Math.abs(a[timePref] - frameMid) - Math.abs(b[timePref] - frameMid)
            ).slice(0, 2);
        }

        // timeline[i].time = frameLogs[0].time;
        timeline[i].time = timePref === 'time' ? frameStart : frameLogs[0].time;

        // for each frequency bin
        for (let j = 0; j < resolution; j++) {
            const max = Math.max(...frameLogs.map(d => d.data[j]));
            timeline[i].data[j] = max;
        }

    }

    // add markers
    const markers = log.filter(d => d.marker !== undefined);
    for (const markedLog of markers) {
        const frame = Math.min(timeline.length-1, Math.max(0, Math.floor(markedLog[timePref] / frameMS)));
        timeline[frame].marker = markedLog.marker;
    }

    console.log('timeline:');
    console.log(timeline);
    return timeline;
}
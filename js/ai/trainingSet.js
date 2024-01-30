import { invLerp } from '../utils/math.js';

export default function trainingSet (markersCount, timelines) {
    const trainingSet = [];
    for (const timeline of timelines) {
        let lastMarker = 0,
            markerStart = 0,
            markerEnd = 0,
            lastOutput = new Array(markersCount + 1).fill(0);

        for (const frame of timeline) {
            if (frame.marker !== undefined) {
                lastMarker = frame.marker;
                markerStart = frame.time;
                markerEnd = timeline.find(f => 
                    f.time > markerStart && f.marker !== undefined
                )?.time ?? timeline[timeline.length - 1].time;
            }
            const pct = lastMarker === 0 ? 0 : invLerp(markerStart, markerEnd, frame.time);
            const output = [...binaryOutput(markersCount, lastMarker), pct];
            trainingSet.push({
                input: [...lastOutput, ...Array.from(frame.data).map(val => val / 255)],
                output
            });
            lastOutput = output;
        }
    }
    return trainingSet;
}

function binaryOutput(outputSize, ...indices) {
    const output = new Array(outputSize).fill(0);
    for (const index of indices) {
        output[index] = 1;
    }
    return output;
}
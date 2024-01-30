let entries;


function getEntry(timeMS, markerExists = true) {
    if (timeMS === undefined) timeMS = entries[entries.length - 1].time;

    let output = [...entries];
    if (markerExists) {
        output = entries.filter(d => d.marker !== undefined);
    }
    const entry = output.filter(d => d.time <= timeMS).sort((a, b) => 
        Math.abs(a.time - timeMS) - Math.abs(b.time - timeMS)
    )[0];
    if (!entry) return entries[0];
    return entry;
}

function addMarker(label, timeMS) {
    if (typeof label === 'object') label = label.detail;
    console.log(label, timeMS);
    const entry = getEntry(timeMS, false);
    entry.marker = label;
}
function removeMarker(timeMS) {
    const entry = getEntry(timeMS);
    if (!entry) return console.warn('No marker to remove');
    delete entry.marker;
}

function getMarkers() {
    const markers = entries.filter(d => d.marker !== undefined).map(d => ({
        label: d.marker,
        time: d.time,
    }));
    return markers;
};


export default function markers(logEntries) {

    entries = logEntries;
    return {
        get all() {
            return getMarkers();
        },
        get last() {
            return getMarkers().pop();
        },
        add: (label, time) => {
            addMarker(label, time);
        },
        remove: (time) => {
            removeMarker(time);
        }

    }
}
    
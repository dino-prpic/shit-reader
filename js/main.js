import FS from './utils/fileSystem.js';
import DB from './utils/indexedDB.js';
import FREC from './rec/freq.js';

// import train from './ai/training.js';

const ui = {
    menu: {
        record: document.querySelector('#record'),
        openProject: document.querySelector('#openProject'),
        openRecent: document.querySelector('#openRecent'),
        train: document.querySelector('#train'),
    },
    PM: document.querySelector('shit-page-manager'),
    recorder: document.querySelector('shit-recording'),
    training: document.querySelector('shit-training')
}
DB.getRecent().then(async (handle) => {
    if (handle) {
        ui.menu.openRecent.textContent = `OPEN ${handle.name.toUpperCase()}`;
    } else {
        ui.menu.openRecent.disabled = true;
    }
});


// buttons
ui.menu.openProject.addEventListener('click', async () => {
    await FS.open();
    await loadProject();
});
ui.menu.openRecent.addEventListener('click', async () => {
    await FS.openRecent();
    await loadProject();
});
async function loadProject() {
    ui.PM.empty();
    const selection = FS.getFiles('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg');
    for (let i = 0; i < selection.length; i++) {
        const file = selection[i];
        const img = document.createElement('img');
        img.src = await file.getURL();
        ui.PM.appendChild(img);
    }

    ui.recorder.pages = selection.length;
    ui.recorder.recIDs = FS.getFolder('recordings').length;
    await ui.recorder.open()
    
    // ui.training.load()
}

ui.menu.record.addEventListener('click', async () => {
    await ui.recorder.start();
});

ui.menu.train.addEventListener('click', async () => {
    // train();

    const recordings = await getRecordings();

    const worker = new Worker('js/ai/trainingWorker.js', { type: 'module' });
    worker.onmessage = (event) => {
        const d = event.data;
        if (d.type === 'log') {
            console.log(
                `%c${d.content}`, 
                `background: ${d.background}; 
                color: ${d.background === 'none' ? 'black' : 'white'};
                padding: 2px 4px; 
                border-radius: 5px;`
            );
        } else if (d.type === 'finish') {
            saveBrains(d.brains);        
        } else {
            console.log(event);
        }
    }
    worker.postMessage({ 
        iterations: 200,
        timelines: recordings.map(rec => rec.toTimeline()),
    });
})


// keyboard
document.addEventListener('keydown', e => {
    if (e.key == 'ArrowRight' || e.key == ' ') {
        e.preventDefault();
        if (
            e.target.tagName.toLowerCase() === "body" ||
            e.target.tagName.toLowerCase() === "shit-page-manager"
        ) ui.PM.next();
    }
    if (e.key == 'ArrowLeft') {
        e.preventDefault();
        if (
            e.target.tagName.toLowerCase() === "body" ||
            e.target.tagName.toLowerCase() === "shit-page-manager"
        ) ui.PM.previous();
    }
    if (e.key.match(/[0-9]/) && parseInt(e.key)) {
        ui.PM.select(parseInt(e.key) - 1);
    }
});


// touch
let startX, startY;
ui.PM.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});
ui.PM.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
            ui.PM.previous();
        } else {
            ui.PM.next();
        }
    }
});



async function getRecordings() {
    const recordings = [];
    const allRec = FS.getFolder('recordings');
    const recsDirs = allRec.getFolders();
    for (let i = 0; i < recsDirs.length; i++) {
        const dir = recsDirs[i];
        const logFile = dir.getFile('freqLog.json');
        const log = await logFile.read();
        const frec = new FREC();
        frec.import(log);
        recordings.push(frec);
    }
    return recordings;
}

async function saveBrains(brains) {
    const brainsDir = FS.getFolder('brains');
    for (let i = 0; i < brains.length; i++) {
        const brain = brains[i];
        const brainFile = await brainsDir.createFile(`brain_${i}.json`);
        await brainFile.write(JSON.stringify(brain));
    }
}
import ENV from "../env.js";
import Brain from "./network.js";
import createGeneration from "./generation.js";
import FS from "../utils/fileSystem.js";
import FREC from "../rec/freq.js";

export default async function train(iterations=100) {
    fancyLog('TRAINING STARTED', 'blue');
    
    const recordings = await getRecordings();
    const timelines = recordings.map(rec => rec.toTimeline());
    
    let brains = createGeneration();

    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
        fancyLog(`ITERATION ${i+1}/${iterations}`, 'purple');

        let counter = 0;

        for (let t = 0; t < timelines.length; t++) {
            let expected;
            const timeline = timelines[t];
            fancyLog(`TIMELINE ${t+1}/${timelines.length}`, 'green');

            for (let e = 0; e < timeline.length; e++) {
                console.log('of ' + timeline.length + ' entries')
                
                const entry = timeline[e];
                
                if (entry.marker !== undefined) {
                    expected = entry.marker;
                }
                if (expected === undefined) continue;
                
                counter++;

                const inputs = entry.data.map(val => val/255);

                for (let b = 0; b < brains.length; b++) {
                    const brain = brains[b];
                    const outputs = Brain.feedForward(inputs, brain);
                    const selectedOutputs = outputs.slice(0, ENV.ai.choices);
                    const isCorrect = selectedOutputs.indexOf(Math.max(...selectedOutputs)) === expected;
                    if (isCorrect) brain.correctGuesses++;
                }

            }

        }

        brains.sort((a, b) => b.correctGuesses - a.correctGuesses);
        brains = brains.slice(0, ENV.ai.populationSurvivors);
        const successRate = brains[0].correctGuesses/counter;
        console.log(`best success rate: ${(successRate*100).toFixed(2)} %`);

        if (brains[0].correctGuesses === counter) break;
        if (i === iterations-1) break;
        brains = createGeneration(brains, (1-successRate)/10);

        console.log('estimate finish time: ' + new Date(startTime + (Date.now()-startTime)*(iterations/(i+1))).toLocaleString());

    }

    // save best brains
    const brainsDir = FS.getFolder('brains');

    for (let i = 0; i < brains.length; i++) {
        const brain = brains[i];
        const brainFile = await brainsDir.createFile(`brain_${i}.json`);
        await brainFile.write(JSON.stringify(brain));
    }

    fancyLog('TRAINING FINISHED', 'blue');

}



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

function fancyLog(content, color) {
    console.log(
        `%c${content}`, 
        `background: ${color}; 
         color: white; 
         padding: 2px 4px; 
         border-radius: 5px;`
    );
}

import ENV from "../env.js";
import Brain from "./network.js";
import createGeneration from "./generation.js";

self.onmessage = async function (event) {
    const { iterations, timelines } = event.data;
    send('TRAINING STARTED', 'blue');

    let brains = createGeneration();
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
        send(`ITERATION ${i + 1}/${iterations}`, 'purple');
        let counter = 0;

        for (let t = 0; t < timelines.length; t++) {
            let expected;
            const timeline = timelines[t];
            // send(`TIMELINE ${t + 1}/${timelines.length}`, 'green');

            brains.forEach(brain => brain.levels[brain.levels.length-1].outputs.fill(0));

            for (let e = 0; e < timeline.length; e++) {
                const entry = timeline[e];
                if (entry.marker !== undefined) {
                    expected = entry.marker;
                }
                if (expected === undefined) continue;

                counter++;
                const inputs = entry.data.map(val => val / 255);

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
        brains.forEach(brain => brain.successRate = brain.correctGuesses / counter);

        send(`Success rates: ${brains.map(brain => (brain.successRate * 100).toFixed(2) + '%').join(', ')}`);
        
        if (brains[0].correctGuesses === counter) break;
        if (i === iterations - 1) break;
        brains = createGeneration(brains);
        
        const finishTime = new Date(startTime + (Date.now() - startTime) * (iterations / (i + 1))).toLocaleString();
        send(`ETA: ${finishTime}`, 'gray');

    }

    send('TRAINING FINISHED', 'blue');
    self.postMessage({ type: 'finish', brains });
};

function send(content, background='none') {
    self.postMessage({ type: 'log', content, background });
}
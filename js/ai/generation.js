import ENV from '../env.js';
import Brain from './network.js';

const populationSize = ENV.ai.populationSize;

export default function generation (parents = []) {

    console.log('creating generation from ' + parents.length + ' parents');

    if (parents.length === 0) {
        const output = [];
        for (let i = 0; i < populationSize; i++) {
            output.push(new Brain(
                ENV.ai.inputNeurons, 
                ...ENV.ai.hiddenLayers, 
                ENV.ai.outputNeurons
            ));
        }
        return output;
    }

    parents.forEach(brain => brain.correctGuesses = 0);

    const children = new Array(populationSize - parents.length);
    for (let i = 0; i < children.length; i++) {
        const child = JSON.parse(JSON.stringify(parents[i % parents.length]));
        Brain.mutate(child);
        children[i] = child;
    }

    return [...parents, ...children];

}
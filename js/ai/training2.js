import NeuralNetwork from "./networkReLU.js";

const defaultSettings = {
    // networkStructure: [261, 50, 5],

    learningRate: 0.005,
    maxIterations: 500,
    minError: 0.005,
};

export default function pretrainNeuralNetwork(network, trainingSet, newSettings = {}) {
    const history = [];

    const settings = Object.assign({}, defaultSettings, newSettings);
    const { learningRate, maxIterations, minError } = settings;
    // const { networkStructure, learningRate, maxIterations, minError } = settings;
    // const outputSize = networkStructure[networkStructure.length - 1];

    // const network = new NeuralNetwork(...networkStructure);

    // Train the neural network using backpropagation and adaptive mutation
    let iteration = 0;
    let error = Infinity;

    while (iteration < maxIterations && error > minError) {
        error = 0;
        trainingSet.sort(() => Math.random() - 0.5);

        for (const example of trainingSet) {
            
            // Forward pass
            const outputs = NeuralNetwork.feedForward(example.input, network);

            // Backward pass
            NeuralNetwork.backpropagate(example.output, learningRate, network);
            
            // Calculate error
            // for (let k = 0; k < outputSize; k++) {
            for (let k = 0; k < example.output.length; k++) {
                let deltaK = example.output[k] - outputs[k];
                error += deltaK * deltaK;
                // error += Math.abs(deltaK);
            }
        }
        if (error !== error) {
            console.log('NaN');
            break;
            // error = Infinity;
        }
        error /= trainingSet.length;

        console.log(`Iteration: ${iteration} | Set: ${trainingSet.length} | Error: ${error}`);
        history.push(error);
        iteration++;
    }

    // Return the trained neural network
    return history;
}
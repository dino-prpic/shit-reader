import { relu, reluDerivative, lerp } from "../utils/math.js";

export default class NeuralNetwork {
    constructor(...neuronCounts) {
        this.generation = 0;
        this.correctGuesses = 0;
        this.successRate = 0;
        this.structure = neuronCounts;

        this.levels = [];
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            this.levels.push(new Level(
                neuronCounts[i], neuronCounts[i + 1]
            ));
        }
    }

    static feedForward(givenInputs, network) {
        const inputs = [...givenInputs, ...network.levels[network.levels.length - 1].outputs];
        let outputs = Level.feedForward(inputs, network.levels[0], relu);
        for (let i = 1; i < network.levels.length; i++) {
            outputs = Level.feedForward(outputs, network.levels[i], relu);
        }
        return outputs;
    }

    static backpropagate(expectedOutputs, learningRate, network) {
        // Calculate error for the output layer
        const outputLayer = network.levels[network.levels.length - 1];
        const outputError = new Array(outputLayer.outputs.length);
        for (let i = 0; i < outputLayer.outputs.length; i++) {
            outputError[i] = expectedOutputs[i] - outputLayer.outputs[i];
        }

        // Calculate delta for the output layer
        let outputDelta = new Array(outputLayer.outputs.length);
        for (let i = 0; i < outputLayer.outputs.length; i++) {
            outputDelta[i] = outputError[i] * reluDerivative(outputLayer.inputs[i]);
        }

        // Calculate delta for hidden layers
        for (let i = network.levels.length - 2; i >= 0; i--) {
            const currentLayer = network.levels[i];
            const nextLayer = network.levels[i + 1];

            const currentDelta = new Array(currentLayer.outputs.length);
            for (let j = 0; j < currentLayer.outputs.length; j++) {
                let error = 0;
                for (let k = 0; k < nextLayer.outputs.length; k++) {
                    error += nextLayer.weights[j][k] * outputDelta[k];
                }
                currentDelta[j] = reluDerivative(currentLayer.inputs[j]) * error;
            }

            outputDelta = currentDelta;
        }

        // Update the weights and biases of the network
        for (let i = 0; i < network.levels.length; i++) {
            const currentLayer = network.levels[i];
            const previousLayer = i > 0 ? network.levels[i - 1] : null;

            for (let j = 0; j < currentLayer.outputs.length; j++) {
                for (let k = 0; k < currentLayer.inputs.length; k++) {
                    const delta = previousLayer ? previousLayer.outputs[k] * outputDelta[j] : outputDelta[j];
                    currentLayer.weights[k][j] += learningRate * delta;
                }
            }
        }
    }

    static mutate(network, amount = 1) {
        network.generation++;

        network.levels.forEach(level => {
            for (let i = 0; i < level.biases.length; i++) {
                level.biases[i] = lerp(
                    level.biases[i],
                    Math.random() * 2 - 1,
                    amount
                )
            }
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random() * 2 - 1,
                        amount
                    )
                }
            }
        });
    }

}

class Level {

    constructor(inputCount, outputCount) {
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount).fill(0);
        this.biases = new Array(outputCount);

        this.weights = [];
        for (let i = 0; i < inputCount; i++) {
            this.weights[i] = new Array(outputCount);
        }

        Level.#randomize(this);
    }

    static #randomize(level) {
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        }

        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = Math.random() * 2 - 1;
        }
    }

    static feedForward(givenInputs, level, activationFunction) {
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = givenInputs[i];
        }

        for (let i = 0; i < level.outputs.length; i++) {
            let sum = 0;
            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j] * level.weights[j][i];
            }
            level.outputs[i] = activationFunction(sum + level.biases[i]);
        }

        return level.outputs;
    }

}
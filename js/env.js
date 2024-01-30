const ENV = {
    freq: {
        fftSize: 2048,
        selection: 0.25,
        timeline: [50, 'sigtime', 5]
    },
    ai: {
        hiddenLayers: [128, 64],
        selfFeedingNeurons: 50,
        choices: 4,
        populationSize: 1000,
        populationSurvivors: 70
    }
};






Object.defineProperty(ENV.freq, 'bins', {
    get: function() {
        return Math.floor(ENV.freq.fftSize / 2 * ENV.freq.selection);
    }
});
Object.defineProperty(ENV.ai, 'outputNeurons', {
    get: function() {
        return ENV.ai.choices + ENV.ai.selfFeedingNeurons
    }
});
Object.defineProperty(ENV.ai, 'inputNeurons', {
    get: function() {
        return ENV.freq.bins + ENV.ai.outputNeurons;
    }
});

Object.freeze(ENV);
export default ENV;
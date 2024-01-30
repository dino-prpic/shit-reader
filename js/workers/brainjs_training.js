import '../ai/brain.js'

let trainingInProgress = false,
    stop = false,
    net,
    trainingSet,
    trainingOptions


self.onmessage = (event) => {
    const { type, data } = event.data
    switch (type) {
        case 'start':

            if (data.net) {
                net = new brain.NeuralNetwork()
                net.fromJSON(data.net)
                console.log('net loaded')
            } else if (data.netOptions) {
                net = new brain.NeuralNetwork(data.netOptions)
                console.log('net created')
            } else {
                console.log('net reused')
            }


            if (data.trainingSet) 
                trainingSet = data.trainingSet
            if (data.trainingOptions) 
                trainingOptions = data.trainingOptions
    

            if (trainingInProgress || !net || !trainingSet || !trainingOptions) {
                send('error', 'Training not started')
                break
            }
            trainingInProgress = true
            train()
            break
        case 'stop':
            if (trainingInProgress) {
                stop = true
            }
            break
    }
}

function train () {

    if (stop) {
        trainingInProgress = false
        stop = false
        return
    }

    send('start')
    console.log('trainingSet length:',trainingSet.length)
    const iterations = trainingOptions.iterations
    const start = Date.now()

    trainingOptions.log = (data) => {
        data.pct = Math.round(data.iterations / iterations * 100)
        data.eta = Math.round((Date.now() - start) / data.iterations * (iterations - data.iterations) / 1000)
        send('log', data)
    }
    trainingOptions.logPeriod = 1

    net.train(trainingSet, trainingOptions)

    send('finish', { net: net.toJSON() })
    setTimeout(() => {
        train()
    }, 1000)
}

function send ( type, data ) {
    self.postMessage({ type, data })
}



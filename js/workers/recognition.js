import '../ai/brain.js'

let net

self.onmessage = (event) => {
    const { type, data } = event.data
    switch (type) {
        case 'net':
            net = new brain.NeuralNetwork()
            net.fromJSON(data)
            console.log('net loaded:')
            break;
        case 'recognize':
            console.log(data)
            const input = data.map(d => 
                Array.from(d.data).map(v => v / 255)
            ).flat()
            console.log(input)
            const output = net.run(input)
            send('recognized', output)
            break;
    }
}

function send(type, data) {
    self.postMessage({ type, data })
}
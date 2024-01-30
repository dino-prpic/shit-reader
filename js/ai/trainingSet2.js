export default function trainingSet (frecs, { 
    markersCount = 4, 
    timelineArgs = [50, 'sigTime', 2], 
    step = 100
} = {})
{
    const Tset = []
    console.log(frecs)

    frecs.forEach(frec => {

        const duration = frec.duration
        console.log('FREC')

        for (let i = 500; i < duration - step; i += step) {
            
            console.log('creating frame timeline')
            
            const selection = frec.select(0, i)
            const timeline = selection.toTimeline(...timelineArgs)
            const marker = selection.markers.last.label
            
            const matrix = timeline.map(frame => frame.data)
            const flattened = []
            matrix.forEach(row => row.forEach(col => flattened.push(col / 255)))
            
            const newItem = {}
            newItem.input = flattened
            newItem.output = binaryOutput(markersCount, marker - 1)

            Tset.push(newItem)

        }
        
    });

    return Tset;

}





function binaryOutput(outputSize, ...indices) {
    const output = new Array(outputSize).fill(0);
    for (const index of indices) {
        if (index < 0) continue;
        output[index] = 1;
    }
    return output;
}

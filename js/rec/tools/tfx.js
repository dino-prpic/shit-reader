import { sigmoid } from "../../utils/math.js";

// all functions squish the log into 1 second (1000ms)
const newDuration = 1000; 

export default function TFX(log) {
    return {

        relTime: () => {
            const oldDuration = log[log.length - 1].time;
            const multiplier = newDuration / oldDuration;
            for (let i = 0; i < log.length; i++) {
                log[i].relTime = log[i].time * multiplier;
            }
        },

        sigTime: (focusSec = 1, cleanUp = false) => {
            const oldDuration = log[log.length - 1].time;
            let multiplier;
            for (let i = 0; i < log.length; i++) {
                let sigTime =
                    sigmoid(
                        (oldDuration - log[i].time) 
                      / (1000 * focusSec)
                    )
                  - 0.5;
                if (i === 0) multiplier = newDuration / sigTime;
                sigTime = newDuration - sigTime * multiplier;

                if (cleanUp && sigTime === 0) {
                    console.log('cleaning up');
                    log.splice(i, 1); i--; continue;
                }

                log[i].sigTime = sigTime;
            }
        },

    };
}
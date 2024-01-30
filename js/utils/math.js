export function lerp(A, B, t) {
    return A + (B - A) * t;
}
export function invLerp(A, B, C) {
    return (C - A) / (B - A);
}


export function relu(x) {
    return Math.max(0, x);
}
// export function reluDerivative(x) {
//     return x > 0 ? 1 : 0;
// }
export function reluDerivative(x, alpha = 0.001) {
    return x > 0 ? 1 : alpha;
}


export function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}






export function quart(x) {
    return Math.pow(1 - x, 6);
}

export function circ(x) {
    return 1 - Math.sqrt(1 - Math.pow(x, 2));
}

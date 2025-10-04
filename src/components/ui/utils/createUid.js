// Counter for deterministic ID generation
let uidCounter = 0

const createUID = (len = 10) => {
    // Use counter instead of random generation for SSR compatibility
    uidCounter++
    return `uid${uidCounter}`
}

export default createUID

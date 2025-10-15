// Simple in-memory token storage for testing
// In production, you should store these in a database

const tokenStorage = new Map()

export const storeGoogleDriveToken = (userId, tokens) => {
    tokenStorage.set(userId, tokens)
}

export const getGoogleDriveToken = (userId) => {
    return tokenStorage.get(userId)
}

export const removeGoogleDriveToken = (userId) => {
    tokenStorage.delete(userId)
}

// For development/testing purposes only
export const getAllTokens = () => {
    return Object.fromEntries(tokenStorage)
}

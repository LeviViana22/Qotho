// Helper functions for Google Drive authentication

/**
 * Get Google Drive tokens from localStorage (client-side)
 */
export const getGoogleDriveTokens = () => {
    if (typeof window === 'undefined') return null
    
    try {
        const storedTokens = localStorage.getItem('googleDriveTokens')
        if (storedTokens) {
            return JSON.parse(storedTokens)
        }
    } catch (error) {
        console.error('Error parsing stored Google Drive tokens:', error)
        localStorage.removeItem('googleDriveTokens')
    }
    return null
}

/**
 * Store Google Drive tokens in localStorage (client-side)
 */
export const storeGoogleDriveTokens = (tokens) => {
    if (typeof window === 'undefined') return
    
    try {
        localStorage.setItem('googleDriveTokens', JSON.stringify(tokens))
    } catch (error) {
        console.error('Error storing Google Drive tokens:', error)
    }
}

/**
 * Remove Google Drive tokens from localStorage (client-side)
 */
export const removeGoogleDriveTokens = () => {
    if (typeof window === 'undefined') return
    
    try {
        localStorage.removeItem('googleDriveTokens')
    } catch (error) {
        console.error('Error removing Google Drive tokens:', error)
    }
}

/**
 * Check if tokens are expired
 */
export const areTokensExpired = (tokens) => {
    if (!tokens || !tokens.expiry_date) return true
    return tokens.expiry_date <= Date.now()
}

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = () => {
    const tokens = getGoogleDriveTokens()
    if (tokens && tokens.access_token && !areTokensExpired(tokens)) {
        return `Bearer ${tokens.access_token}`
    }
    return null
}

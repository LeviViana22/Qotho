/**
 * Truncates text to a specified length and adds ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 25) => {
    if (!text || typeof text !== 'string') return text
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

/**
 * Truncates file names specifically for file manager
 * @param {string} fileName - The file name to truncate
 * @param {number} maxLength - Maximum length (default: 25)
 * @returns {string} - Truncated file name
 */
export const truncateFileName = (fileName, maxLength = 25) => {
    return truncateText(fileName, maxLength)
}

/**
 * Truncates folder names for breadcrumb navigation
 * @param {string} folderName - The folder name to truncate
 * @param {number} maxLength - Maximum length (default: 20)
 * @returns {string} - Truncated folder name
 */
export const truncateFolderName = (folderName, maxLength = 20) => {
    return truncateText(folderName, maxLength)
}

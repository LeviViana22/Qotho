// Format folder size display
export const formatFolderSize = (size, isFolder, isLoading = false) => {
    if (!isFolder) {
        return formatFileSize(size)
    }
    
    if (isLoading) {
        return 'Calculating...'
    }
    
    // Remove "Empty folder" text - just show 0 B
    
    return formatFileSize(size)
}

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Get folder size description
export const getFolderSizeDescription = (size, isFolder) => {
    if (!isFolder) {
        return formatFileSize(size)
    }
    
    if (size === 0) {
        return 'This folder is empty'
    }
    
    return `Contains ${formatFileSize(size)} of files`
}

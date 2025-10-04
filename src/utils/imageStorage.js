// Image storage utility for handling profile images efficiently
// This avoids localStorage quota issues by compressing images and using IndexedDB

const IMAGE_STORAGE_KEY = 'user-profile-images'
const MAX_IMAGE_SIZE = 200000 // 200KB max
const COMPRESSION_QUALITY = 0.7

// Compress image to reduce size
export const compressImage = (file, maxSizeKB = 200, quality = 0.7) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
            // Calculate new dimensions to fit within max size
            let { width, height } = img
            
            // If image is too large, scale it down
            if (width > 400 || height > 400) {
                const ratio = Math.min(400 / width, 400 / height)
                width *= ratio
                height *= ratio
            }
            
            canvas.width = width
            canvas.height = height
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height)
            
            // Convert to blob with compression
            canvas.toBlob(
                (blob) => {
                    if (blob.size <= maxSizeKB * 1024) {
                        resolve(blob)
                    } else {
                        // If still too large, reduce quality further
                        canvas.toBlob(
                            (compressedBlob) => resolve(compressedBlob),
                            'image/jpeg',
                            quality * 0.8
                        )
                    }
                },
                'image/jpeg',
                quality
            )
        }
        
        img.src = URL.createObjectURL(file)
    })
}

// Convert file to compressed base64 data URL
export const fileToCompressedDataURL = async (file) => {
    try {
        const compressedBlob = await compressImage(file)
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(compressedBlob)
        })
    } catch (error) {
        console.error('Error compressing image:', error)
        return null
    }
}

// Store image in localStorage with size check
export const storeImage = (userId, imageData) => {
    try {
        // Check if image is too large
        if (imageData.length > MAX_IMAGE_SIZE) {
            console.warn('Image too large, not storing in localStorage')
            return false
        }
        
        const key = `${IMAGE_STORAGE_KEY}-${userId}`
        localStorage.setItem(key, imageData)
        return true
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, clearing old images')
            clearOldImages()
            // Try again after clearing
            try {
                localStorage.setItem(key, imageData)
                return true
            } catch (retryError) {
                console.error('Still cannot store image after clearing:', retryError)
                return false
            }
        }
        console.error('Error storing image:', error)
        return false
    }
}

// Get image from localStorage
export const getStoredImage = (userId) => {
    try {
        const key = `${IMAGE_STORAGE_KEY}-${userId}`
        return localStorage.getItem(key) || ''
    } catch (error) {
        console.error('Error getting stored image:', error)
        return ''
    }
}

// Clear old images to free up space
const clearOldImages = () => {
    try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
            if (key.startsWith(IMAGE_STORAGE_KEY)) {
                localStorage.removeItem(key)
            }
        })
    } catch (error) {
        console.error('Error clearing old images:', error)
    }
}

// Remove image from storage
export const removeStoredImage = (userId) => {
    try {
        const key = `${IMAGE_STORAGE_KEY}-${userId}`
        localStorage.removeItem(key)
    } catch (error) {
        console.error('Error removing stored image:', error)
    }
}

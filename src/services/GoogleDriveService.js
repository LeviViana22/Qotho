import { google } from 'googleapis'

class GoogleDriveService {
    constructor() {
        // Ensure we have a proper redirect URI
        const redirectUri = process.env.NEXTAUTH_URL 
            ? `${process.env.NEXTAUTH_URL}/api/auth/google-drive/callback`
            : 'http://localhost:3000/api/auth/google-drive/callback'

        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_AUTH_CLIENT_ID,
            process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_AUTH_CLIENT_SECRET,
            redirectUri
        )
        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client })
    }

    // Set access token for authenticated user
    setAccessToken(accessToken) {
        this.oauth2Client.setCredentials({ access_token: accessToken })
    }

    // Get authorization URL for OAuth flow
    getAuthUrl(usePopup = false) {
        const scopes = [
            'https://www.googleapis.com/auth/drive'
        ]

        // Always use the same callback URL (the one that's already registered)
        const redirectUri = process.env.NEXTAUTH_URL 
            ? `${process.env.NEXTAUTH_URL}/api/auth/google-drive/callback`
            : 'http://localhost:3000/api/auth/google-drive/callback'

        const authUrlOptions = {
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            redirect_uri: redirectUri
        }

        // Add state parameter for popup detection
        if (usePopup) {
            authUrlOptions.state = 'popup'
        }

        return this.oauth2Client.generateAuthUrl(authUrlOptions)
    }

    // Exchange authorization code for tokens
    async exchangeCodeForTokens(code, redirectUri) {
        try {
            const { tokens } = await this.oauth2Client.getToken({
                code: code,
                redirect_uri: redirectUri
            })
            
            // Set the credentials for future use
            this.oauth2Client.setCredentials(tokens)
            
            return tokens
        } catch (error) {
            console.error('Error exchanging code for tokens:', error)
            throw error
        }
    }

    // Get files and folders from Google Drive
    async getFiles(parentId = 'root') {
        try {
            const response = await this.drive.files.list({
                q: `'${parentId}' in parents and trashed=false`,
                fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, thumbnailLink)',
                orderBy: 'folder,name'
            })

            const files = response.data.files.map(file => ({
                id: file.id,
                name: file.name,
                fileType: this.getFileType(file.mimeType),
                srcUrl: file.thumbnailLink || '',
                size: parseInt(file.size) || 0,
                author: {
                    name: 'Google Drive User',
                    email: '',
                    img: '/img/avatars/thumb-1.jpg'
                },
                activities: [{
                    userName: 'Google Drive User',
                    userImg: '/img/avatars/thumb-1.jpg',
                    actionType: 'CREATE',
                    timestamp: Math.floor(new Date(file.createdTime).getTime() / 1000)
                }],
                permissions: [{
                    userName: 'Google Drive User',
                    userImg: '/img/avatars/thumb-1.jpg',
                    role: 'owner'
                }],
                uploadDate: Math.floor(new Date(file.createdTime).getTime() / 1000),
                recent: this.isRecent(file.modifiedTime),
                webViewLink: file.webViewLink,
                mimeType: file.mimeType,
                parents: file.parents
            }))

            return files
        } catch (error) {
            console.error('Error fetching files from Google Drive:', error)
            throw error
        }
    }

    // Get folder hierarchy for breadcrumb navigation
    async getFolderHierarchy(folderId) {
        const hierarchy = []
        let currentId = folderId

        while (currentId && currentId !== 'root') {
            try {
                const response = await this.drive.files.get({
                    fileId: currentId,
                    fields: 'id, name, parents'
                })

                hierarchy.unshift({
                    id: response.data.id,
                    label: response.data.name
                })

                currentId = response.data.parents?.[0]
            } catch (error) {
                console.error('Error getting folder hierarchy:', error)
                break
            }
        }

        return hierarchy
    }

    // Upload file to Google Drive
    async uploadFile(file, parentId = 'root') {
        try {
            console.log('GoogleDriveService.uploadFile called with:', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                parentId: parentId,
                fileConstructor: file.constructor.name,
                fileKeys: Object.keys(file),
                hasStream: typeof file.stream === 'function',
                hasArrayBuffer: typeof file.arrayBuffer === 'function'
            })

            const fileMetadata = {
                name: file.name,
                parents: [parentId]
            }

            console.log('Calling Google Drive API with metadata:', fileMetadata)

            // Create a temporary file path approach for the Google APIs client library
            // This is the most reliable way to handle File objects with the client library
            const fs = await import('fs')
            const path = await import('path')
            const os = await import('os')
            
            // Create a temporary file
            const tempDir = os.tmpdir()
            // Extract just the filename from the full path to avoid directory issues
            const fileName = path.basename(file.name)
            const tempFileName = `upload_${Date.now()}_${fileName}`
            const tempFilePath = path.join(tempDir, tempFileName)
            
            try {
                // Convert File to Buffer and write to temp file
                let fileBuffer
                if (typeof file.arrayBuffer === 'function') {
                    const buffer = await file.arrayBuffer()
                    fileBuffer = Buffer.from(buffer)
                } else if (typeof file.stream === 'function') {
                    const webStream = file.stream()
                    const chunks = []
                    const reader = webStream.getReader()
                    
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        chunks.push(value)
                    }
                    
                    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
                    const combinedBuffer = new Uint8Array(totalLength)
                    let offset = 0
                    
                    for (const chunk of chunks) {
                        combinedBuffer.set(chunk, offset)
                        offset += chunk.length
                    }
                    
                    fileBuffer = Buffer.from(combinedBuffer)
                } else {
                    throw new Error('Unsupported file object type')
                }

                // Write buffer to temporary file
                fs.writeFileSync(tempFilePath, fileBuffer)
                console.log(`File written to temp path: ${tempFilePath}, size: ${fileBuffer.length} bytes`)

                // Use the temporary file with Google Drive API
                const response = await this.drive.files.create({
                    resource: fileMetadata,
                    media: {
                        mimeType: file.type || 'application/octet-stream',
                        body: fs.createReadStream(tempFilePath)
                    },
                    fields: 'id, name, mimeType, size, createdTime, webViewLink'
                })

                console.log('Google Drive API response:', response.data)
                return response.data
                
            } finally {
                // Clean up temporary file
                try {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath)
                        console.log(`Cleaned up temp file: ${tempFilePath}`)
                    }
                } catch (cleanupError) {
                    console.warn('Failed to clean up temp file:', cleanupError)
                }
            }
        } catch (error) {
            console.error('Error uploading file to Google Drive:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                response: error.response?.data
            })
            throw error
        }
    }

    // Delete file from Google Drive
    async deleteFile(fileId) {
        try {
            await this.drive.files.delete({
                fileId: fileId
            })
            return true
        } catch (error) {
            console.error('Error deleting file from Google Drive:', error)
            throw error
        }
    }

    // Rename file in Google Drive
    async renameFile(fileId, newName) {
        try {
            const response = await this.drive.files.update({
                fileId: fileId,
                resource: {
                    name: newName
                },
                fields: 'id, name'
            })
            return response.data
        } catch (error) {
            console.error('Error renaming file in Google Drive:', error)
            throw error
        }
    }

    // Create folder in Google Drive
    async createFolder(name, parentId = 'root') {
        try {
            const fileMetadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId]
            }

            const response = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id, name, mimeType'
            })

            return response.data
        } catch (error) {
            console.error('Error creating folder in Google Drive:', error)
            throw error
        }
    }

    // Download file from Google Drive
    async downloadFile(fileId) {
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            })
            return response.data
        } catch (error) {
            console.error('Error downloading file from Google Drive:', error)
            throw error
        }
    }

    // Get file download URL
    async getDownloadUrl(fileId) {
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'webContentLink, mimeType, name, capabilities, thumbnailLink'
            })
            return response.data.webContentLink
        } catch (error) {
            console.error('Error getting download URL:', error)
            throw error
        }
    }

    // Get file metadata including thumbnail
    async getFileMetadata(fileId) {
        try {
            console.log(`Getting metadata for file: ${fileId}`)
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, capabilities, thumbnailLink'
            })
            return response.data
        } catch (error) {
            console.error('Error getting file metadata:', error)
            throw error
        }
    }

    // Download file content directly
    async downloadFile(fileId) {
        try {
            console.log(`Downloading file with ID: ${fileId}`)
            
            // First get file metadata to determine the type
            const fileInfo = await this.drive.files.get({
                fileId: fileId,
                fields: 'mimeType, name, capabilities, webContentLink'
            })
            
            const fileData = fileInfo.data
            console.log('File info:', {
                name: fileData.name,
                mimeType: fileData.mimeType,
                canDownload: fileData.capabilities?.canDownload,
                hasWebContentLink: !!fileData.webContentLink
            })
            
            // Check if user can download the file
            if (fileData.capabilities && !fileData.capabilities.canDownload) {
                throw new Error('User does not have permission to download this file')
            }
            
            // For Google Workspace documents, use export
            if (fileData.mimeType && fileData.mimeType.startsWith('application/vnd.google-apps.')) {
                console.log('Exporting Google Workspace document')
                
                // Determine the best export format based on document type
                let exportMimeType = 'application/pdf'
                let fileExtension = '.pdf'
                
                if (fileData.mimeType === 'application/vnd.google-apps.document') {
                    exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    fileExtension = '.docx'
                } else if (fileData.mimeType === 'application/vnd.google-apps.spreadsheet') {
                    exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    fileExtension = '.xlsx'
                } else if (fileData.mimeType === 'application/vnd.google-apps.presentation') {
                    exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    fileExtension = '.pptx'
                }
                
                const response = await this.drive.files.export({
                    fileId: fileId,
                    mimeType: exportMimeType
                })
                
                // Convert response data to Buffer
                let fileBuffer
                if (Buffer.isBuffer(response.data)) {
                    fileBuffer = response.data
                } else if (typeof response.data === 'string') {
                    fileBuffer = Buffer.from(response.data, 'utf8')
                } else {
                    // Handle stream or other data types
                    fileBuffer = Buffer.from(JSON.stringify(response.data), 'utf8')
                }
                
                return {
                    data: fileBuffer,
                    mimeType: exportMimeType,
                    fileName: fileData.name + fileExtension
                }
            } else {
                // For blob files, use get with alt=media
                console.log('Downloading blob file')
                const response = await this.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                })
                
                // Convert response data to Buffer
                let fileBuffer
                if (Buffer.isBuffer(response.data)) {
                    fileBuffer = response.data
                } else if (typeof response.data === 'string') {
                    fileBuffer = Buffer.from(response.data, 'utf8')
                } else {
                    // Handle stream or other data types
                    fileBuffer = Buffer.from(JSON.stringify(response.data), 'utf8')
                }
                
                return {
                    data: fileBuffer,
                    mimeType: fileData.mimeType,
                    fileName: fileData.name
                }
            }
        } catch (error) {
            console.error('Error downloading file:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                response: error.response?.data
            })
            throw error
        }
    }

    // Get file permissions
    async getFilePermissions(fileId) {
        try {
            console.log(`Getting permissions for file: ${fileId}`)
            const response = await this.drive.permissions.list({
                fileId: fileId,
                fields: 'permissions(id,type,role,emailAddress,displayName,photoLink)'
            })
            return response.data.permissions || []
        } catch (error) {
            console.error('Error getting file permissions:', error)
            throw error
        }
    }

    // Share file with user
    async shareFile(fileId, email, role = 'reader') {
        try {
            console.log(`Sharing file ${fileId} with ${email} as ${role}`)
            const response = await this.drive.permissions.create({
                fileId: fileId,
                resource: {
                    role: role,
                    type: 'user',
                    emailAddress: email
                }
            })
            console.log('File shared successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('Error sharing file:', error)
            throw error
        }
    }

    // Update file permission
    async updateFilePermission(fileId, permissionId, role) {
        try {
            console.log(`Updating permission ${permissionId} for file ${fileId} to role ${role}`)
            const response = await this.drive.permissions.update({
                fileId: fileId,
                permissionId: permissionId,
                resource: {
                    role: role
                }
            })
            return response.data
        } catch (error) {
            console.error('Error updating file permission:', error)
            throw error
        }
    }

    // Delete file permission
    async deleteFilePermission(fileId, permissionId) {
        try {
            console.log(`Deleting permission ${permissionId} for file ${fileId}`)
            await this.drive.permissions.delete({
                fileId: fileId,
                permissionId: permissionId
            })
            return { success: true }
        } catch (error) {
            console.error('Error deleting file permission:', error)
            throw error
        }
    }

    // Create a new folder
    async createFolder(name, parentId = 'root') {
        try {
            console.log(`Creating folder: ${name} in parent: ${parentId}`)
            const response = await this.drive.files.create({
                resource: {
                    name: name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentId]
                },
                fields: 'id, name, mimeType, createdTime, webViewLink'
            })
            console.log('Folder created successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('Error creating folder:', error)
            throw error
        }
    }

    // Move file to a different folder
    async moveFile(fileId, targetFolderId) {
        try {
            console.log(`Moving file ${fileId} to folder ${targetFolderId}`)
            
            // First, get the current parents of the file
            const file = await this.drive.files.get({
                fileId: fileId,
                fields: 'parents'
            })
            
            const previousParents = file.data.parents.join(',')
            
            // Move the file to the new folder
            const response = await this.drive.files.update({
                fileId: fileId,
                addParents: targetFolderId,
                removeParents: previousParents,
                fields: 'id, parents'
            })
            
            console.log('File moved successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('Error moving file:', error)
            throw error
        }
    }

    // Helper method to determine file type from MIME type
    getFileType(mimeType) {
        if (mimeType === 'application/vnd.google-apps.folder') {
            return 'directory'
        }
        
        const mimeToType = {
            'application/pdf': 'pdf',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xls',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
            'image/jpeg': 'jpeg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'application/vnd.google-apps.document': 'doc',
            'application/vnd.google-apps.spreadsheet': 'xls',
            'application/vnd.google-apps.presentation': 'ppt',
            'application/vnd.google-apps.drawing': 'figma'
        }

        return mimeToType[mimeType] || 'unknown'
    }

    // Helper method to check if file is recent (modified within last 7 days)
    isRecent(modifiedTime) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return new Date(modifiedTime) > sevenDaysAgo
    }

    // Calculate folder size recursively with caching
    async calculateFolderSize(folderId, maxDepth = 3, currentDepth = 0) {
        try {
            console.log(`Calculating folder size for ${folderId} at depth ${currentDepth}`)
            
            // Prevent infinite recursion
            if (currentDepth >= maxDepth) {
                console.log(`Max depth reached for folder ${folderId}`)
                return 0
            }

            let totalSize = 0
            let nextPageToken = null
            let totalFilesProcessed = 0

            do {
                console.log(`Fetching files for folder ${folderId}, pageToken: ${nextPageToken}`)
                
                const response = await this.drive.files.list({
                    q: `'${folderId}' in parents and trashed=false`,
                    fields: 'files(id, name, mimeType, size, parents), nextPageToken',
                    pageSize: 100,
                    pageToken: nextPageToken
                })

                const files = response.data.files || []
                console.log(`Found ${files.length} files in folder ${folderId}`)
                
                // Log progress for large folders
                if (files.length > 100) {
                    console.log(`Processing large folder ${folderId} with ${files.length} files...`)
                }
                
                for (const file of files) {
                    totalFilesProcessed++
                    
                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                        console.log(`Found subfolder: ${file.name} (${file.id})`)
                        // Recursively calculate subfolder size
                        const subfolderSize = await this.calculateFolderSize(
                            file.id, 
                            maxDepth, 
                            currentDepth + 1
                        )
                        totalSize += subfolderSize
                    } else {
                        // Add file size (Google Workspace files have no size, so they're 0)
                        const fileSize = parseInt(file.size) || 0
                        totalSize += fileSize
                        
                        // Only log individual files for small folders to avoid spam
                        if (files.length <= 50) {
                            console.log(`File ${file.name}: ${fileSize} bytes`)
                        }
                    }
                    
                    // Log progress for large folders every 1000 files
                    if (totalFilesProcessed % 1000 === 0) {
                        console.log(`Processed ${totalFilesProcessed} files in folder ${folderId}, current size: ${totalSize} bytes`)
                    }
                }

                nextPageToken = response.data.nextPageToken
            } while (nextPageToken)

            console.log(`Total size for folder ${folderId}: ${totalSize} bytes (${totalFilesProcessed} files processed)`)
            return totalSize
        } catch (error) {
            console.error(`Error calculating folder size for ${folderId}:`, error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                status: error.status
            })
            return 0
        }
    }

    // Get folder size with caching
    async getFolderSize(folderId) {
        try {
            // Check cache first
            const cacheKey = `folder_size_${folderId}`
            const cached = this.getCachedSize(cacheKey)
            if (cached !== null) {
                console.log(`Using cached size for folder ${folderId}: ${cached} bytes`)
                return cached
            }

            console.log(`Calculating size for folder ${folderId} (not cached)`)
            
            // Add timeout to prevent hanging (increased to 2 minutes for large folders)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Folder size calculation timeout')), 300000) // 5 minutes
            })
            
            const sizePromise = this.calculateFolderSize(folderId)
            
            // Race between calculation and timeout
            const size = await Promise.race([sizePromise, timeoutPromise])
            
            // Cache the result for 5 minutes
            this.setCachedSize(cacheKey, size, 5 * 60 * 1000)
            
            console.log(`Cached size for folder ${folderId}: ${size} bytes`)
            return size
        } catch (error) {
            console.error('Error getting folder size:', error)
            if (error.message === 'Folder size calculation timeout') {
                console.log('Folder size calculation timed out, returning 0')
            }
            return 0
        }
    }

    // Simple in-memory cache for folder sizes
    sizeCache = new Map()

    getCachedSize(key) {
        const cached = this.sizeCache.get(key)
        if (cached && cached.expiry > Date.now()) {
            return cached.value
        }
        if (cached) {
            this.sizeCache.delete(key)
        }
        return null
    }

    setCachedSize(key, value, ttl) {
        this.sizeCache.set(key, {
            value,
            expiry: Date.now() + ttl
        })
    }

    // Clear size cache
    clearSizeCache() {
        this.sizeCache.clear()
    }
}

export default new GoogleDriveService()

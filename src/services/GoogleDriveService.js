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
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.metadata'
        ]

        // Ensure we have a proper redirect URI
        const redirectUri = process.env.NEXTAUTH_URL 
            ? `${process.env.NEXTAUTH_URL}/api/auth/google-drive/callback`
            : 'http://localhost:3000/api/auth/google-drive/callback'

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            redirect_uri: redirectUri
        })
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
            const fileMetadata = {
                name: file.name,
                parents: [parentId]
            }

            const media = {
                mimeType: file.type,
                body: file
            }

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name, mimeType, size, createdTime, webViewLink'
            })

            return response.data
        } catch (error) {
            console.error('Error uploading file to Google Drive:', error)
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
                fields: 'webContentLink'
            })
            return response.data.webContentLink
        } catch (error) {
            console.error('Error getting download URL:', error)
            throw error
        }
    }

    // Share file with user
    async shareFile(fileId, email, role = 'reader') {
        try {
            const response = await this.drive.permissions.create({
                fileId: fileId,
                resource: {
                    role: role,
                    type: 'user',
                    emailAddress: email
                }
            })
            return response.data
        } catch (error) {
            console.error('Error sharing file:', error)
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
}

export default new GoogleDriveService()

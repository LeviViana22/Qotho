import { NextResponse } from 'next/server'
import GoogleDriveService from '@/services/GoogleDriveService'

// Helper function to handle folder upload with proper structure
async function handleFolderUpload(files, rootParentId) {
    const uploadedFiles = []
    const folderMap = new Map() // Maps folder paths to their Google Drive folder IDs
    
    // First, analyze all files to understand the folder structure
    const folderStructure = new Map()
    
    console.log('Analyzing files for folder structure:')
    for (const file of files) {
        console.log(`File: ${file.name}, webkitRelativePath: ${file.webkitRelativePath}`)
        
        if (file.webkitRelativePath) {
            const pathParts = file.webkitRelativePath.split('/')
            const fileName = pathParts.pop() // Remove filename, keep folder path
            
            console.log(`Path parts: ${JSON.stringify(pathParts)}, fileName: ${fileName}`)
            
            if (pathParts.length > 1) {
                // Remove the main folder name (first part) since we're already inside it
                const relativePath = pathParts.slice(1).join('/')
                console.log(`Relative path: ${relativePath}`)
                if (!folderStructure.has(relativePath)) {
                    folderStructure.set(relativePath, [])
                }
                folderStructure.get(relativePath).push({ file, fileName })
            } else {
                // File in root of the uploaded folder (inside the main folder)
                console.log(`File in root of main folder`)
                if (!folderStructure.has('')) {
                    folderStructure.set('', [])
                }
                folderStructure.get('').push({ file, fileName })
            }
        } else {
            console.log(`No webkitRelativePath for file: ${file.name}`)
        }
    }
    
    console.log('Folder structure detected:', Array.from(folderStructure.keys()))
    
    // Create folders recursively
    const createFoldersRecursively = async (folderPath, parentId) => {
        if (folderPath === '') {
            return parentId // Root folder
        }
        
        if (folderMap.has(folderPath)) {
            return folderMap.get(folderPath)
        }
        
        const pathParts = folderPath.split('/')
        const currentFolderName = pathParts[pathParts.length - 1]
        const parentPath = pathParts.slice(0, -1).join('/')
        
        // Create parent folder first
        const parentFolderId = await createFoldersRecursively(parentPath, parentId)
        
        // Create current folder
        console.log(`Creating folder: ${currentFolderName} in parent: ${parentFolderId}`)
        const createdFolder = await GoogleDriveService.createFolder(currentFolderName, parentFolderId)
        folderMap.set(folderPath, createdFolder.id)
        
        console.log(`Created folder: ${createdFolder.name} (ID: ${createdFolder.id})`)
        uploadedFiles.push(createdFolder)
        
        return createdFolder.id
    }
    
    // Create all folders first
    for (const folderPath of folderStructure.keys()) {
        await createFoldersRecursively(folderPath, rootParentId)
    }
    
    // Now upload files to their respective folders
    for (const [folderPath, fileList] of folderStructure.entries()) {
        const targetFolderId = folderPath === '' ? rootParentId : folderMap.get(folderPath)
        
        for (const { file, fileName } of fileList) {
            try {
                console.log(`Uploading file: ${fileName} to folder: ${folderPath || 'root'}`)
                console.log(`Target folder ID: ${targetFolderId}`)
                
                // Validate file before upload
                if (!file.name || file.size === 0) {
                    console.warn(`Skipping invalid file: ${fileName}`)
                    continue
                }
                
                const uploadedFile = await GoogleDriveService.uploadFile(file, targetFolderId)
                console.log(`Successfully uploaded: ${uploadedFile.name} (ID: ${uploadedFile.id})`)
                uploadedFiles.push(uploadedFile)
            } catch (error) {
                console.error(`Error uploading file ${fileName}:`, error)
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    status: error.status,
                    response: error.response?.data,
                    stack: error.stack
                })
                // Continue with other files even if one fails
            }
        }
    }
    
    return { uploadedFiles }
}

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No Google Drive access token' }, { status: 401 })
        }
        
        const accessToken = authHeader.replace('Bearer ', '')
        console.log('Setting access token for upload:', accessToken.substring(0, 20) + '...')

        GoogleDriveService.setAccessToken(accessToken)

        const formData = await request.formData()
        const files = formData.getAll('file')
        const parentId = formData.get('parentId') || 'root'
        const isFolderUpload = formData.get('isFolderUpload') === 'true'
        const filePathsData = formData.get('filePaths')

        console.log('Upload request received:')
        console.log(`Files count: ${files.length}`)
        console.log(`Is folder upload: ${isFolderUpload}`)
        console.log(`Parent ID: ${parentId}`)
        
        // Parse file paths information
        let filePaths = []
        if (isFolderUpload && filePathsData) {
            try {
                filePaths = JSON.parse(filePathsData)
                console.log('File paths data:', filePaths)
            } catch (error) {
                console.error('Error parsing file paths:', error)
            }
        }
        
        if (isFolderUpload) {
            console.log('Files details for folder upload:')
            files.forEach((file, index) => {
                const pathInfo = filePaths[index] || {}
                console.log(`File ${index}: name=${file.name}, webkitRelativePath=${pathInfo.webkitRelativePath}, size=${file.size}`)
                // Restore webkitRelativePath to the file object
                if (pathInfo.webkitRelativePath) {
                    file.webkitRelativePath = pathInfo.webkitRelativePath
                }
            })
        }

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 })
        }

        const uploadedFiles = []

        if (isFolderUpload && files.length > 0) {
            // First, create the main folder (the one that was selected)
            const firstFile = files[0]
            let mainFolderId = parentId
            
            if (firstFile.webkitRelativePath) {
                const mainFolderName = firstFile.webkitRelativePath.split('/')[0]
                console.log(`Creating main folder: ${mainFolderName}`)
                
                try {
                    const createdMainFolder = await GoogleDriveService.createFolder(mainFolderName, parentId)
                    mainFolderId = createdMainFolder.id
                    console.log(`Created main folder: ${createdMainFolder.name} (ID: ${createdMainFolder.id})`)
                    uploadedFiles.push(createdMainFolder)
                } catch (error) {
                    console.error(`Error creating main folder ${mainFolderName}:`, error)
                    return NextResponse.json({ error: 'Failed to create main folder' }, { status: 500 })
                }
            }
            
            // Handle folder upload with proper structure inside the main folder
            const result = await handleFolderUpload(files, mainFolderId)
            uploadedFiles.push(...result.uploadedFiles)
        } else {
            // Handle individual file uploads
            for (const file of files) {
                try {
                    console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`)
                    console.log(`Parent ID: ${parentId}`)
                    
                    // Validate file before upload
                    if (!file.name || file.size === 0) {
                        console.warn(`Skipping invalid file: ${file.name}`)
                        continue
                    }
                    
                    const uploadedFile = await GoogleDriveService.uploadFile(file, parentId)
                    console.log(`Successfully uploaded: ${uploadedFile.name} (ID: ${uploadedFile.id})`)
                    uploadedFiles.push(uploadedFile)
                } catch (error) {
                    console.error(`Error uploading file ${file.name}:`, error)
                    console.error('Error details:', {
                        message: error.message,
                        code: error.code,
                        status: error.status,
                        response: error.response?.data,
                        stack: error.stack
                    })
                    // Continue with other files even if one fails
                }
            }
        }
        
        if (uploadedFiles.length === 0) {
            return NextResponse.json({ error: 'Failed to upload any files' }, { status: 500 })
        }
        
        return NextResponse.json({ 
            success: true, 
            files: uploadedFiles,
            uploaded: uploadedFiles.length,
            total: files.length
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        console.error('Upload error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            response: error.response?.data,
            stack: error.stack
        })
        return NextResponse.json({ 
            error: 'Failed to upload file',
            details: error.message 
        }, { status: 500 })
    }
}

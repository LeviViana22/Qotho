import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No Google Drive access token' }, { status: 401 })
        }
        
        const accessToken = authHeader.replace('Bearer ', '')
        GoogleDriveService.setAccessToken(accessToken)

        const { fileIds, targetFolderId } = await request.json()

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
        }

        if (!targetFolderId) {
            return NextResponse.json({ error: 'Target folder ID is required' }, { status: 400 })
        }

        const movedFiles = []
        
        // Move each file
        for (const fileId of fileIds) {
            try {
                console.log(`Moving file ${fileId} to folder ${targetFolderId}`)
                const movedFile = await GoogleDriveService.moveFile(fileId, targetFolderId)
                movedFiles.push(movedFile)
            } catch (error) {
                console.error(`Error moving file ${fileId}:`, error)
                // Continue with other files even if one fails
            }
        }
        
        if (movedFiles.length === 0) {
            return NextResponse.json({ error: 'Failed to move any files' }, { status: 500 })
        }
        
        return NextResponse.json({ 
            success: true, 
            movedFiles: movedFiles,
            moved: movedFiles.length,
            total: fileIds.length
        })
    } catch (error) {
        console.error('Error moving files:', error)
        return NextResponse.json({ error: 'Failed to move files' }, { status: 500 })
    }
}

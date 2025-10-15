import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { getGoogleDriveToken } = await import('@/lib/googleDriveTokens')
        const tokens = getGoogleDriveToken(session.user?.id)
        const accessToken = tokens?.access_token
        
        if (!accessToken) {
            return NextResponse.json({ error: 'No Google Drive access token' }, { status: 401 })
        }

        GoogleDriveService.setAccessToken(accessToken)

        const formData = await request.formData()
        const file = formData.get('file')
        const parentId = formData.get('parentId') || 'root'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const uploadedFile = await GoogleDriveService.uploadFile(file, parentId)
        
        return NextResponse.json({ 
            success: true, 
            file: uploadedFile 
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
}

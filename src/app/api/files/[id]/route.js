import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function DELETE(request, { params }) {
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

        const { id } = params
        await GoogleDriveService.deleteFile(id)
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }
}

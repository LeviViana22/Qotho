import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function PATCH(request, { params }) {
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
        const { name } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const renamedFile = await GoogleDriveService.renameFile(id, name)
        
        return NextResponse.json({ 
            success: true, 
            file: renamedFile 
        })
    } catch (error) {
        console.error('Error renaming file:', error)
        return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 })
    }
}

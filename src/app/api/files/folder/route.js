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

        const { name, parentId = 'root' } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
        }

        const folder = await GoogleDriveService.createFolder(name, parentId)
        
        return NextResponse.json({ 
            success: true, 
            folder: folder 
        })
    } catch (error) {
        console.error('Error creating folder:', error)
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }
}

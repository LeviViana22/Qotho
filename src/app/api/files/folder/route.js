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

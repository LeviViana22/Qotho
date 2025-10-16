import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function GET(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const parentId = searchParams.get('id') || 'root'

        // Get access token from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No Google Drive access token' }, { status: 401 })
        }
        
        const accessToken = authHeader.replace('Bearer ', '')

        GoogleDriveService.setAccessToken(accessToken)

        // Get files from Google Drive
        const files = await GoogleDriveService.getFiles(parentId)
        
        // Get folder hierarchy for breadcrumb navigation
        const directory = parentId !== 'root' 
            ? await GoogleDriveService.getFolderHierarchy(parentId)
            : []

        const resp = {
            list: files,
            directory: directory,
        }

        return NextResponse.json(resp)
    } catch (error) {
        console.error('Error fetching files:', error)
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }
}

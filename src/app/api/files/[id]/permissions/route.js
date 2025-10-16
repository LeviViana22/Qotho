import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function GET(request, { params }) {
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

        // Await params for Next.js 15 compatibility
        const { id } = await params
        console.log('Getting permissions for file:', id)
        
        if (!id) {
            return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
        }
        
        try {
            const permissions = await GoogleDriveService.getFilePermissions(id)
            console.log('Permissions received:', permissions.length, 'permissions')
            
            return NextResponse.json({ permissions })
        } catch (error) {
            console.error('Error getting permissions:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                response: error.response?.data
            })
            return NextResponse.json({ error: 'Failed to get permissions' }, { status: 500 })
        }
    } catch (error) {
        console.error('Error getting permissions:', error)
        return NextResponse.json({ error: 'Failed to get permissions' }, { status: 500 })
    }
}

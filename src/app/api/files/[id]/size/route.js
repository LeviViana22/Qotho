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

        const { id } = await params
        console.log('Getting folder size for:', id)
        
        // Validate folder ID
        if (!id || id === 'undefined') {
            return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 })
        }
        
        const size = await GoogleDriveService.getFolderSize(id)
        console.log('Folder size calculated:', size)
        
        return NextResponse.json({ size })
    } catch (error) {
        console.error('Error getting folder size:', error)
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            stack: error.stack
        })
        
        // Return more specific error information
        const errorMessage = error.message || 'Failed to get folder size'
        return NextResponse.json({ 
            error: errorMessage,
            details: error.code || 'Unknown error'
        }, { status: 500 })
    }
}

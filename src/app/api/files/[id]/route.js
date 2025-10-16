import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function DELETE(request, { params }) {
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

        const { id } = params
        await GoogleDriveService.deleteFile(id)
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }
}

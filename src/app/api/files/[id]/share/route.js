import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function POST(request, { params }) {
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
        const { email, role = 'reader' } = await request.json()
        
        if (!id) {
            return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
        }

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const shareResult = await GoogleDriveService.shareFile(id, email, role)
        
        return NextResponse.json({ 
            success: true, 
            share: shareResult 
        })
    } catch (error) {
        console.error('Error sharing file:', error)
        return NextResponse.json({ error: 'Failed to share file' }, { status: 500 })
    }
}

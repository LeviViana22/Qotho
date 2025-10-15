import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function POST(request, { params }) {
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
        const { email, role = 'reader' } = await request.json()

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

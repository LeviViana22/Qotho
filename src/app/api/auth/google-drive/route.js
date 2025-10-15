import { NextResponse } from 'next/server'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function GET() {
    try {
        const authUrl = GoogleDriveService.getAuthUrl()
        
        return NextResponse.json({ authUrl })
    } catch (error) {
        console.error('Error generating Google Drive auth URL:', error)
        return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
    }
}

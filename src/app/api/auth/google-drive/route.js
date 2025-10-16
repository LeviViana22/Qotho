import { NextResponse } from 'next/server'
import GoogleDriveService from '@/services/GoogleDriveService'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const usePopup = searchParams.get('popup') === 'true'
        
        const authUrl = GoogleDriveService.getAuthUrl(usePopup)
        return NextResponse.json({ authUrl })
    } catch (error) {
        console.error('Error generating Google Drive auth URL:', error)
        return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
    }
}

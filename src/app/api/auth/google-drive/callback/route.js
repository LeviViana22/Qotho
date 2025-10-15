import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { auth } from '@/auth'

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
            console.error('Google OAuth error:', error)
            return NextResponse.redirect(new URL('/file-manager?error=auth_failed', request.url))
        }

        if (!code) {
            return NextResponse.redirect(new URL('/file-manager?error=no_code', request.url))
        }

        // Ensure we have a proper redirect URI
        const redirectUri = process.env.NEXTAUTH_URL 
            ? `${process.env.NEXTAUTH_URL}/api/auth/google-drive/callback`
            : 'http://localhost:3000/api/auth/google-drive/callback'

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_AUTH_CLIENT_ID,
            process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_AUTH_CLIENT_SECRET,
            redirectUri
        )

        const { tokens } = await oauth2Client.getToken(code)
        
        // Store tokens (in production, store in database)
        // For now, we'll use a simple in-memory storage
        const session = await auth()
        if (session?.user?.id) {
            const { storeGoogleDriveToken } = await import('@/lib/googleDriveTokens')
            storeGoogleDriveToken(session.user.id, tokens)
        }
        
        return NextResponse.redirect(new URL('/file-manager?success=auth_success', request.url))
    } catch (error) {
        console.error('Error handling Google Drive callback:', error)
        return NextResponse.redirect(new URL('/file-manager?error=callback_failed', request.url))
    }
}

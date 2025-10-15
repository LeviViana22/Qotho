import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const config = {
            clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_AUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_AUTH_CLIENT_SECRET,
            nextAuthUrl: process.env.NEXTAUTH_URL,
            redirectUri: process.env.NEXTAUTH_URL 
                ? `${process.env.NEXTAUTH_URL}/api/auth/google-drive/callback`
                : 'http://localhost:3000/api/auth/google-drive/callback'
        }

        return NextResponse.json({
            config,
            hasClientId: !!config.clientId,
            hasClientSecret: !!config.clientSecret,
            hasNextAuthUrl: !!config.nextAuthUrl,
            redirectUri: config.redirectUri
        })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

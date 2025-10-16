import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { auth } from '@/auth'

export async function GET(request) {
    try {
        console.log('Google Drive callback received:', request.url)
        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const state = searchParams.get('state')

        console.log('Callback - Code:', code)
        console.log('Callback - Error:', error)
        console.log('Callback - State:', state)

        // Check if this is a popup request (we'll use a custom state parameter)
        const isPopup = state === 'popup'

        if (error) {
            console.error('Google OAuth error:', error)
            if (isPopup) {
                return new NextResponse(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Authentication Error</title>
                    </head>
                    <body>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'GOOGLE_DRIVE_AUTH_ERROR',
                                    error: '${error}'
                                }, window.location.origin)
                            }
                            window.close()
                        </script>
                        <h1>Authentication Error</h1>
                        <p>Error: ${error}</p>
                        <p>This window will close automatically.</p>
                    </body>
                    </html>
                `, {
                    headers: { 'Content-Type': 'text/html' }
                })
            }
            return NextResponse.redirect(new URL('/file-manager?error=auth_failed', request.url))
        }

        if (!code) {
            console.error('No authorization code received')
            if (isPopup) {
                return new NextResponse(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Authentication Error</title>
                    </head>
                    <body>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'GOOGLE_DRIVE_AUTH_ERROR',
                                    error: 'No authorization code received'
                                }, window.location.origin)
                            }
                            window.close()
                        </script>
                        <h1>Authentication Error</h1>
                        <p>No authorization code received</p>
                        <p>This window will close automatically.</p>
                    </body>
                    </html>
                `, {
                    headers: { 'Content-Type': 'text/html' }
                })
            }
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

        console.log('Exchanging code for tokens...')
        const { tokens } = await oauth2Client.getToken(code)
        console.log('Tokens received:', !!tokens.access_token)
        
        // Store tokens in a temporary way that can be retrieved by the frontend
        const tokenData = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date
        }
        
        if (isPopup) {
            // For popup, return HTML that stores tokens and communicates with parent
            const encodedTokens = Buffer.from(JSON.stringify(tokenData)).toString('base64')
            
            return new NextResponse(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 50px;
                            background: #f5f5f5;
                        }
                        .success {
                            background: white;
                            padding: 30px;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            max-width: 400px;
                            margin: 0 auto;
                        }
                        .spinner {
                            border: 3px solid #f3f3f3;
                            border-top: 3px solid #3498db;
                            border-radius: 50%;
                            width: 30px;
                            height: 30px;
                            animation: spin 1s linear infinite;
                            margin: 20px auto;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <div class="success">
                        <h2>✅ Authentication Successful!</h2>
                        <p>Storing your Google Drive access...</p>
                        <div class="spinner"></div>
                        <p><small>This window will close automatically.</small></p>
                    </div>
                    <script>
                        try {
                            // Store tokens in localStorage
                            const tokens = JSON.parse(atob('${encodedTokens}'))
                            localStorage.setItem('googleDriveTokens', JSON.stringify(tokens))
                            console.log('Tokens stored in popup localStorage')
                            
                            // Send success message to parent window
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'GOOGLE_DRIVE_AUTH_SUCCESS',
                                    tokens: tokens
                                }, window.location.origin)
                                console.log('Success message sent to parent window')
                            }
                            
                            // Close the popup after a short delay
                            setTimeout(() => {
                                window.close()
                            }, 2000)
                        } catch (error) {
                            console.error('Error storing tokens:', error)
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'GOOGLE_DRIVE_AUTH_ERROR',
                                    error: 'Failed to store tokens: ' + error.message
                                }, window.location.origin)
                            }
                            setTimeout(() => {
                                window.close()
                            }, 3000)
                        }
                    </script>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            })
        } else {
            // For regular flow, redirect with tokens in URL
            const encodedTokens = Buffer.from(JSON.stringify(tokenData)).toString('base64')
            console.log('Redirecting to file-manager with tokens...')
            
            return NextResponse.redirect(new URL(`/file-manager?success=auth_success&tokens=${encodedTokens}`, request.url))
        }
    } catch (error) {
        console.error('Error handling Google Drive callback:', error)
        return NextResponse.redirect(new URL('/file-manager?error=callback_failed', request.url))
    }
}

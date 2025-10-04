import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getUserById } from '@/lib/user'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-key')

export async function GET(request) {
    try {
        // Check for NextAuth session token cookie
        const sessionToken = request.cookies.get('authjs.session-token')?.value || 
                           request.cookies.get('__Secure-authjs.session-token')?.value

        if (!sessionToken) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        try {
            const { payload } = await jwtVerify(sessionToken, secret)
            
            // Get fresh user data from database
            const user = await getUserById(payload.id)
            if (!user) {
                return NextResponse.json({ user: null }, { status: 200 })
            }

            // Check if user is blocked
            if (user.status === 'blocked') {
                return NextResponse.json({ user: null }, { status: 200 })
            }

            return NextResponse.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    title: user.title,
                    personalInfo: user.personalInfo,
                    lastOnline: user.lastOnline,
                    authority: [user.role], // Add authority for navigation
                }
            }, { status: 200 })
        } catch (jwtError) {
            // Invalid token
            return NextResponse.json({ user: null }, { status: 200 })
        }
    } catch (error) {
        console.error('Session error:', error)
        return NextResponse.json({ user: null }, { status: 200 })
    }
}


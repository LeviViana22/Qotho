import { NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, updateLastOnline } from '@/lib/user'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-key')

export async function POST(request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const user = await getUserByEmail(email)
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        if (!user.password) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        const isValidPassword = await verifyPassword(password, user.password)
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            return NextResponse.json(
                { error: 'Usuário inativo, por favor entre em contato com o administrador!' },
                { status: 403 }
            )
        }

        // Update last online
        const updatedUser = await updateLastOnline(user.id)

        // Create JWT token
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            firstName: user.firstName,
            lastName: user.lastName,
            title: user.title,
            personalInfo: user.personalInfo,
            lastOnline: updatedUser.lastOnline,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(secret)

        // Set HTTP-only cookie
        const response = NextResponse.json(
            { 
                message: 'Login successful',
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
                    lastOnline: updatedUser.lastOnline,
                }
            },
            { status: 200 }
        )

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}


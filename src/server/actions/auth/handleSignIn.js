'use server'
import { getUserByEmail, verifyPassword, updateLastOnline } from '@/lib/user'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import appConfig from '@/configs/app.config'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-key')

export const onSignInWithCredentials = async (
    { email, password },
    callbackUrl,
) => {
    try {
        if (!email || !password) {
            return { error: 'Email and password are required' }
        }

        const user = await getUserByEmail(email)
        if (!user) {
            return { error: 'Invalid credentials!' }
        }

        if (!user.password) {
            return { error: 'Invalid credentials!' }
        }

        const isValidPassword = await verifyPassword(password, user.password)
        if (!isValidPassword) {
            return { error: 'Invalid credentials!' }
        }

        // Update last online
        await updateLastOnline(user.id)

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
            lastOnline: user.lastOnline,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(secret)

        // Set HTTP-only cookie
        const cookieStore = await cookies()
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        })

        // Redirect to callback URL or authenticated entry path
        redirect(callbackUrl || appConfig.authenticatedEntryPath)
    } catch (error) {
        console.error('Sign in error:', error)
        return { error: 'Something went wrong!' }
    }
}

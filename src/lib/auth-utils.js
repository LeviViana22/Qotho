import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/user'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-key')

export async function getServerSession() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value

        if (!token) {
            return null
        }

        const { payload } = await jwtVerify(token, secret)
        
        // Get fresh user data from database
        const user = await getUserById(payload.id)
        if (!user) {
            return null
        }

        return {
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
            }
        }
    } catch (error) {
        console.error('Session verification error:', error)
        return null
    }
}

export async function requireAuth() {
    const session = await getServerSession()
    if (!session) {
        throw new Error('Authentication required')
    }
    return session
}

export async function requireAdmin() {
    const session = await requireAuth()
    if (session.user.role !== 'admin') {
        throw new Error('Admin access required')
    }
    return session
}


import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { getUserByEmail, verifyPassword, updateLastOnline } from '@/lib/user'

const providers = [
    Credentials({
        name: 'credentials',
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
            const { email, password } = credentials
            
            if (!email || !password) {
                return null
            }

            const user = await getUserByEmail(email)
            if (!user) {
                return null
            }

            if (!user.password) {
                return null
            }

            const isValidPassword = await verifyPassword(password, user.password)
            if (!isValidPassword) {
                return null
            }

            // Check if user is blocked
            if (user.status === 'blocked') {
                return null // NextAuth will treat this as invalid credentials
            }

            // Note: updateLastOnline removed to avoid edge runtime issues
            // Last online will be updated when user makes API calls instead

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            }
        },
    })
]

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers,
    callbacks: {
        async session({ session, token }) {
            if (token) {
                // Check if user is blocked
                if (token.status === 'blocked') {
                    return null
                }
                
                session.user.id = token.id
                session.user.role = token.role
                session.user.status = token.status
                // Add authority field for routing system
                session.user.authority = [token.role]
            }
            return session
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.status = user.status
            }
            
            // Note: updateLastOnline removed from JWT callback to avoid edge runtime issues
            // Last online will be updated when user makes API calls instead
            
            return token
        },
    },
    pages: {
        signIn: '/sign-in',
        error: '/sign-in',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET,
})

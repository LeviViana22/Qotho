import { NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/user'

export async function POST(request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const user = await getUserByEmail(email)
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            return NextResponse.json(
                { error: 'Usuário inativo, por favor entre em contato com o administrador!' },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { message: 'User is active' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Check user status error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

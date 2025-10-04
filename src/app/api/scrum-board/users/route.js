import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllUsers } from '@/lib/user'

export async function GET() {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Allow any authenticated user to get users for scrum board
        // (we can add more restrictions later if needed)
        const users = await getAllUsers()
        
        // Remove password from response and map image to img
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user
            return {
                ...safeUser,
                img: safeUser.image || safeUser.img || '', // Map image to img for frontend
            }
        })

        return NextResponse.json({ users: safeUsers })
    } catch (error) {
        console.error('Error fetching scrum board users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

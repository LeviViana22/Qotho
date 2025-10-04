import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateUser as updateUserDB, getUserById as getUserByIdDB } from '@/lib/user'

// GET /api/users/[id] - Get user by ID
export async function GET(request, { params }) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const user = await getUserByIdDB(id)
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Remove password from response and map image to img
        const { password, ...userWithoutPassword } = user
        return NextResponse.json({ 
            user: {
                ...userWithoutPassword,
                img: userWithoutPassword.image || userWithoutPassword.img || '', // Map image to img for frontend
            }
        })
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/users/[id] - Update user
export async function PUT(request, { params }) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        // Check if user is updating their own profile or is admin
        if (session.user.id !== id && session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Remove sensitive fields that shouldn't be updated via this endpoint
        const { password, id: userId, ...updateData } = body

        const updatedUser = await updateUserDB(id, updateData)
        
        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update last online timestamp
        try {
            const { updateLastOnline } = await import('@/lib/user')
            await updateLastOnline(id)
        } catch (error) {
            console.error('Error updating last online:', error)
            // Don't fail the request if last online update fails
        }

        // Remove password from response and map image to img
        const { password: _, ...userWithoutPassword } = updatedUser
        return NextResponse.json({ 
            success: true, 
            user: {
                ...userWithoutPassword,
                img: userWithoutPassword.image || userWithoutPassword.img || '', // Map image to img for frontend
            }
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
    }
}

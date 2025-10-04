import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserById, updateUser, verifyPassword } from '@/lib/user'

// PUT /api/users/[id]/password - Update user password
export async function PUT(request, { params }) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { currentPassword, newPassword } = body

        // Check if user is updating their own password or if user is admin
        if (session.user.id !== id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Validate required fields
        if (!newPassword) {
            return NextResponse.json({ 
                error: 'New password is required' 
            }, { status: 400 })
        }

        // Current password is only required when user is updating their own password
        if (session.user.id === id && !currentPassword) {
            return NextResponse.json({ 
                error: 'Current password is required when updating your own password' 
            }, { status: 400 })
        }

        // Get user from database
        const user = await getUserById(id)
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify current password only if user is updating their own password
        if (session.user.id === id) {
            if (!user.password) {
                console.log('User has no password set:', id)
                return NextResponse.json({ 
                    error: 'User has no password set' 
                }, { status: 400 })
            }

            console.log('Verifying password for user:', id)
            console.log('Current password provided:', !!currentPassword)
            console.log('Current password length:', currentPassword?.length)
            console.log('User password hash exists:', !!user.password)
            console.log('User password hash length:', user.password?.length)
            console.log('User password hash starts with $2:', user.password?.startsWith('$2'))
            
            const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
            console.log('Password verification result:', isCurrentPasswordValid)
            
            if (!isCurrentPasswordValid) {
                console.log('Password verification failed - returning error')
                return NextResponse.json({ 
                    error: 'Senha atual incorreta' 
                }, { status: 400 })
            }
        } else {
            // Admin is changing another user's password - no current password verification needed
            console.log('Admin changing password for user:', id)
        }

        // Update password
        console.log('Updating password for user:', id)
        const updatedUser = await updateUser(id, { password: newPassword })
        
        if (!updatedUser) {
            console.log('Failed to update password for user:', id)
            return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
        }
        
        console.log('Password updated successfully for user:', id)

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser
        return NextResponse.json({ 
            success: true, 
            message: 'Password updated successfully' 
        })
    } catch (error) {
        console.error('Error updating password:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

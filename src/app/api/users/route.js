import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createUser } from '@/lib/user'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admin can get all users
        if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { getAllUsers } = await import('@/lib/user')
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
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admin can create users
        if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { 
            firstName, 
            lastName, 
            name, 
            email, 
            password, 
            img, 
            personalInfo, 
            role = 'user', 
            status = 'active', 
            title = '' 
        } = body

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ 
                error: 'Missing required fields: firstName, lastName, email, password' 
            }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user data
        const userData = {
            firstName,
            lastName,
            name: name || `${firstName} ${lastName}`,
            email,
            password: hashedPassword,
            image: img || '', // Map img to image for Prisma
            personalInfo: personalInfo || {},
            role,
            status,
            title,
        }

        // Create user in database
        const newUser = await createUser(userData)
        
        // Remove password from response and map image to img
        const { password: _, ...safeUser } = newUser

        return NextResponse.json({ 
            success: true, 
            user: {
                ...safeUser,
                img: safeUser.image || safeUser.img || '', // Map image to img for frontend
            },
            message: 'User created successfully' 
        })
    } catch (error) {
        console.error('Error creating user:', error)
        
        // Handle duplicate email error
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return NextResponse.json({ 
                error: 'Email already exists' 
            }, { status: 409 })
        }
        
        return NextResponse.json({ 
            error: 'Internal server error' 
        }, { status: 500 })
    }
}
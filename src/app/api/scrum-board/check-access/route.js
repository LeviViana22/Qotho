import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get scrum board members from database
        const boardData = await prisma.scrumBoardData.findFirst({
            where: { key: 'boardMembers' }
        })

        const members = boardData ? JSON.parse(boardData.value) : []
        
        // Check if current user has access to scrum board
        // Admins always have access, regular users need to be in the members list
        const isAdmin = session.user.role === 'admin'
        const hasAccess = isAdmin || members.some(member => member.id === session.user.id)
        
        return NextResponse.json({ hasAccess, members })
    } catch (error) {
        console.error('Error checking scrum board access:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

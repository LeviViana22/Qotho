import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Get scrum board members for Registro Civil
        const scrumBoardMembers = await prisma.scrumBoardMember.findMany({
            where: {
                projectType: 'registro-civil'
            },
            include: {
                user: true
            }
        })

        const members = scrumBoardMembers.map(member => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            img: member.user.image || '',
            role: member.role
        }))

        return NextResponse.json({ members })
    } catch (error) {
        console.error('Error fetching registro civil members:', error)
        return NextResponse.json({ members: [] }, { status: 500 })
    }
}
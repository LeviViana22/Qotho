import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get board members from database
        let members = []
        try {
            const boardData = await prisma.scrumBoardData.findFirst({
                where: { key: 'boardMembers' }
            })
            console.log('API: Raw board data from database:', boardData)
            members = boardData ? JSON.parse(boardData.value) : []
            console.log('API: Parsed members from database:', members)
        } catch (dbError) {
            console.error('Database error fetching members:', dbError)
            return NextResponse.json({ error: 'Failed to fetch members from database' }, { status: 500 })
        }

        return NextResponse.json({ members })
    } catch (error) {
        console.error('Error fetching board members:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { members } = await request.json()
        console.log('API: Received members to save:', members)

        // Update board members in database
        try {
            const result = await prisma.scrumBoardData.upsert({
                where: { key: 'boardMembers' },
                update: { value: JSON.stringify(members) },
                create: { 
                    key: 'boardMembers', 
                    value: JSON.stringify(members) 
                }
            })
            console.log('API: Successfully saved members to database:', result)
        } catch (dbError) {
            console.error('Database error saving members:', dbError)
            return NextResponse.json({ error: 'Failed to save members to database' }, { status: 500 })
        }

        return NextResponse.json({ success: true, members })
    } catch (error) {
        console.error('Error updating board members:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


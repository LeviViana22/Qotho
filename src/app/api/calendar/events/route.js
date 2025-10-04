import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/calendar/events - Get all calendar events
export async function GET() {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const events = await prisma.calendarEvent.findMany({
            orderBy: {
                start: 'asc'
            }
        })

        // Transform events to match the frontend format
        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start.toISOString(),
            end: event.end ? event.end.toISOString() : undefined,
            eventTime: event.eventTime,
            eventColor: event.eventColor,
            groupId: event.groupId,
            description: event.description,
            allDay: event.allDay
        }))

        return NextResponse.json(formattedEvents)
    } catch (error) {
        console.error('Error fetching calendar events:', error)
        return NextResponse.json(
            { error: 'Failed to fetch calendar events' },
            { status: 500 }
        )
    }
}

// POST /api/calendar/events - Create a new calendar event
export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, start, end, eventTime, eventColor, groupId, description, allDay } = body

        if (!title || !start) {
            return NextResponse.json(
                { error: 'Title and start date are required' },
                { status: 400 }
            )
        }

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                start: new Date(start),
                end: end ? new Date(end) : null,
                eventTime: eventTime || null,
                eventColor: eventColor || 'blue',
                groupId: groupId || null,
                description: description || null,
                allDay: allDay || false,
                userId: session.user.id
            }
        })

        // Return formatted event
        const formattedEvent = {
            id: event.id,
            title: event.title,
            start: event.start.toISOString(),
            end: event.end ? event.end.toISOString() : undefined,
            eventTime: event.eventTime,
            eventColor: event.eventColor,
            groupId: event.groupId,
            description: event.description,
            allDay: event.allDay
        }

        return NextResponse.json(formattedEvent, { status: 201 })
    } catch (error) {
        console.error('Error creating calendar event:', error)
        return NextResponse.json(
            { error: 'Failed to create calendar event' },
            { status: 500 }
        )
    }
}

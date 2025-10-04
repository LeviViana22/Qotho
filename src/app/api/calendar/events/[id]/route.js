import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/calendar/events/[id] - Update a calendar event
export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { title, start, end, eventTime, eventColor, groupId, description, allDay } = body

        if (!title || !start) {
            return NextResponse.json(
                { error: 'Title and start date are required' },
                { status: 400 }
            )
        }

        // Check if event exists
        const existingEvent = await prisma.calendarEvent.findUnique({
            where: { id }
        })

        if (!existingEvent) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        const event = await prisma.calendarEvent.update({
            where: { id },
            data: {
                title,
                start: new Date(start),
                end: end ? new Date(end) : null,
                eventTime: eventTime || null,
                eventColor: eventColor || 'blue',
                groupId: groupId || null,
                description: description || null,
                allDay: allDay || false
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

        return NextResponse.json(formattedEvent)
    } catch (error) {
        console.error('Error updating calendar event:', error)
        return NextResponse.json(
            { error: 'Failed to update calendar event' },
            { status: 500 }
        )
    }
}

// DELETE /api/calendar/events/[id] - Delete a calendar event
export async function DELETE(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Check if event exists
        const existingEvent = await prisma.calendarEvent.findUnique({
            where: { id }
        })

        if (!existingEvent) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        await prisma.calendarEvent.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Event deleted successfully' })
    } catch (error) {
        console.error('Error deleting calendar event:', error)
        return NextResponse.json(
            { error: 'Failed to delete calendar event' },
            { status: 500 }
        )
    }
}

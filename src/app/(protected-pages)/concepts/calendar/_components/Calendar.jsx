'use client'
import { useState } from 'react'
import CalendarView from '@/components/shared/CalendarView'
import Container from '@/components/shared/Container'
import EventDialog from './EventDialog'
import { useCalendar } from '../_store/calendarStore'
import cloneDeep from 'lodash/cloneDeep'
import dayjs from 'dayjs'

const Calendar = () => {
    const [dialogOpen, setDialogOpen] = useState(false)

    const [selectedCell, setSelectedCell] = useState({
        type: '',
    })

    const events = useCalendar((state) => state.data)
    const createEvent = useCalendar((state) => state.createEvent)
    const updateEvent = useCalendar((state) => state.updateEvent)
    const updateEventLocal = useCalendar((state) => state.updateEventLocal)
    const deleteEvent = useCalendar((state) => state.deleteEvent)
    const loading = useCalendar((state) => state.loading)
    const error = useCalendar((state) => state.error)

    const handleCellSelect = (event) => {
        const { start, end } = event
        setSelectedCell({
            type: 'NEW',
            start: dayjs(start).format(),
            end: dayjs(end).format(),
        })
        setDialogOpen(true)
    }

    const handleEventClick = (arg) => {
        const { start, end, id, title, extendedProps } = arg.event

        setSelectedCell({
            type: 'EDIT',
            eventColor: extendedProps.eventColor,
            title,
            start: start ? dayjs(start).toISOString() : undefined,
            end: end ? dayjs(end).toISOString() : undefined,
            id,
        })
        setDialogOpen(true)
    }

    const handleEventChange = async (arg) => {
        const { id, extendedProps, start, end, title } = arg.event
        
        // Update locally first for smooth UI
        updateEventLocal(id, {
            start: dayjs(start).format(),
            end: dayjs(end).format(),
            title,
            eventColor: extendedProps.eventColor,
        })
        
        // Then update in database
        try {
            await updateEvent(id, {
                start: dayjs(start).format(),
                end: dayjs(end).format(),
                title,
                eventColor: extendedProps.eventColor,
            })
        } catch (error) {
            console.error('Failed to update event:', error)
            // Optionally revert local changes or show error message
        }
    }

    const handleSubmit = async (data, type) => {
        try {
            if (type === 'NEW') {
                await createEvent(data)
            } else if (type === 'EDIT') {
                await updateEvent(data.id, data)
            }
        } catch (error) {
            console.error('Failed to save event:', error)
            // Optionally show error message to user
        }
    }

    const handleDeleteEvent = async (eventId) => {
        try {
            await deleteEvent(eventId)
        } catch (error) {
            console.error('Failed to delete event:', error)
            // Optionally show error message to user
        }
    }

    if (loading && events.length === 0) {
        return (
            <Container className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Carregando eventos...</p>
                </div>
            </Container>
        )
    }

    if (error) {
        return (
            <Container className="h-full flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p>Erro ao carregar eventos: {error}</p>
                </div>
            </Container>
        )
    }

    // Transform events to include eventTime as extendedProps
    const transformedEvents = events.map(event => ({
        ...event,
        extendedProps: {
            eventColor: event.eventColor,
            eventTime: event.eventTime
        }
    }))

    return (
        <Container className="h-full">
            <CalendarView
                editable
                selectable
                events={transformedEvents}
                eventClick={handleEventClick}
                select={handleCellSelect}
                eventDrop={handleEventChange}
                locale="pt-BR"
            />
            <EventDialog
                open={dialogOpen}
                selected={selectedCell}
                submit={handleSubmit}
                onDelete={handleDeleteEvent}
                onDialogOpen={setDialogOpen}
            />
        </Container>
    )
}

export default Calendar

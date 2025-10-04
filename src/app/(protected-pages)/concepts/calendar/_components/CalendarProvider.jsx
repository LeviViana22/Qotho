'use client'
import { useEffect } from 'react'
import { useCalendar } from '../_store/calendarStore'

const CalendarProvider = ({ children }) => {
    const loadEvents = useCalendar((state) => state.loadEvents)
    const initialLoading = useCalendar((state) => state.initialLoading)

    useEffect(() => {
        loadEvents()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <>{children}</>
}

export default CalendarProvider

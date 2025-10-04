import { create } from 'zustand'

const initialState = {
    data: [],
    initialLoading: true,
    loading: false,
    error: null,
}

export const useCalendar = create((set, get) => ({
    ...initialState,
    
    setData: (data) => set(() => ({ data })),
    setInitialLoading: (initialLoading) => set(() => ({ initialLoading })),
    setLoading: (loading) => set(() => ({ loading })),
    setError: (error) => set(() => ({ error })),
    
    // Load events from database
    loadEvents: async () => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/calendar/events')
            if (!response.ok) {
                throw new Error('Failed to fetch events')
            }
            const events = await response.json()
            set({ data: events, loading: false, initialLoading: false })
        } catch (error) {
            console.error('Error loading events:', error)
            set({ error: error.message, loading: false, initialLoading: false })
        }
    },
    
    // Create new event
    createEvent: async (eventData) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create event')
            }
            
            const newEvent = await response.json()
            const currentData = get().data
            set({ 
                data: [...currentData, newEvent], 
                loading: false 
            })
            return newEvent
        } catch (error) {
            console.error('Error creating event:', error)
            set({ error: error.message, loading: false })
            throw error
        }
    },
    
    // Update existing event
    updateEvent: async (eventId, eventData) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/calendar/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update event')
            }
            
            const updatedEvent = await response.json()
            const currentData = get().data
            const newData = currentData.map(event => 
                event.id === eventId ? updatedEvent : event
            )
            set({ 
                data: newData, 
                loading: false 
            })
            return updatedEvent
        } catch (error) {
            console.error('Error updating event:', error)
            set({ error: error.message, loading: false })
            throw error
        }
    },
    
    // Delete event
    deleteEvent: async (eventId) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/calendar/events/${eventId}`, {
                method: 'DELETE',
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete event')
            }
            
            const currentData = get().data
            const newData = currentData.filter(event => event.id !== eventId)
            set({ 
                data: newData, 
                loading: false 
            })
        } catch (error) {
            console.error('Error deleting event:', error)
            set({ error: error.message, loading: false })
            throw error
        }
    },
    
    // Update event in local state (for drag & drop)
    updateEventLocal: (eventId, updates) => {
        const currentData = get().data
        const newData = currentData.map(event => 
            event.id === eventId ? { ...event, ...updates } : event
        )
        set({ data: newData })
    },
}))

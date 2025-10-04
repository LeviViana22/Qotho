import { create } from 'zustand'

const initialState = {
    currentView: 'profile',
}

export const useUserEditStore = create((set) => ({
    ...initialState,
    setCurrentView: (payload) => set(() => ({ currentView: payload })),
}))

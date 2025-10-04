import { create } from 'zustand'

const initialState = {
    currentView: 'profile',
    formData: {
        profile: {},
        security: {},
    },
}

export const useUserFormStore = create((set) => ({
    ...initialState,
    setCurrentView: (payload) => set(() => ({ currentView: payload })),
    setFormData: (section, data) => set((state) => ({
        formData: {
            ...state.formData,
            [section]: { ...state.formData[section], ...data }
        }
    })),
    getFormData: () => {
        const state = useUserFormStore.getState()
        return state.formData
    },
    clearFormData: () => set(() => ({ formData: { profile: {}, security: {} } })),
}))


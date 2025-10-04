import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
    persist(
        (set, get) => ({
            // Current user data
            currentUser: null,
            isLoading: false,

            // All users list
            users: [],

            // Actions
            setCurrentUser: (user) => set(() => ({ currentUser: user })),
            
            setUsers: (users) => set(() => ({ users })),
            
            updateCurrentUser: (userData) => {
                set((state) => ({
                    currentUser: state.currentUser ? { ...state.currentUser, ...userData } : null,
                }))
            },

            // Load users from API
            loadUsers: async () => {
                set({ isLoading: true })
                try {
                    console.log('UserStore: Loading users from API...')
                    // Try scrum board API first (less restrictive)
                    let response = await fetch('/api/scrum-board/users')
                    console.log('UserStore: Scrum board API response status:', response.status)
                    
                    // If scrum board API fails, try the admin API
                    if (!response.ok) {
                        console.log('UserStore: Scrum board API failed, trying admin API...')
                        response = await fetch('/api/users')
                        console.log('UserStore: Admin API response status:', response.status)
                    }
                    
                    if (!response.ok) {
                        const errorText = await response.text()
                        console.error('UserStore: API error:', errorText)
                        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`)
                    }
                    const data = await response.json()
                    console.log('UserStore: API response data:', data)
                    
                    // Map Prisma 'image' field to Zustand 'img' field for all users
                    const mappedUsers = data.users.map(user => ({
                        ...user,
                        img: user.image || user.img || '', // Map image to img for Zustand
                    }))
                    
                    console.log('UserStore: Mapped users:', mappedUsers)
                    set({ users: mappedUsers })
                } catch (error) {
                    console.error('Error loading users:', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            // Create new user via API
            addUser: async (userData) => {
                try {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(userData),
                    })

                    if (!response.ok) {
                        let errorMessage = 'Failed to create user'
                        try {
                            const errorData = await response.json()
                            errorMessage = errorData.error || errorData.message || errorMessage
                        } catch (parseError) {
                            console.error('Error parsing error response:', parseError)
                            errorMessage = `HTTP ${response.status}: ${response.statusText}`
                        }
                        throw new Error(errorMessage)
                    }

                    const data = await response.json()
                    
                    // Map Prisma 'image' field to Zustand 'img' field
                    const mappedUser = {
                        ...data.user,
                        img: data.user.image || data.user.img || '', // Map image to img for Zustand
                    }
                    
                    // Add to local state
                    set((state) => ({
                        users: [...state.users, mappedUser],
                    }))
                    
                    return { success: true, user: data.user }
                } catch (error) {
                    console.error('Error creating user:', error)
                    return { success: false, error: error.message }
                }
            },

            // Update user via API
            updateUser: async (userId, userData) => {
                try {
                    // Map img to image for API
                    const apiData = {
                        ...userData,
                        image: userData.img || userData.image || '', // Map img to image for API
                    }
                    // Remove img field to avoid confusion
                    delete apiData.img
                    
                    const response = await fetch(`/api/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(apiData),
                    })

                    if (!response.ok) {
                        let errorMessage = 'Failed to update user'
                        try {
                            const errorData = await response.json()
                            errorMessage = errorData.error || errorData.message || errorMessage
                        } catch (parseError) {
                            console.error('Error parsing error response:', parseError)
                            errorMessage = `HTTP ${response.status}: ${response.statusText}`
                        }
                        throw new Error(errorMessage)
                    }

                    const data = await response.json()
                    
                    // Map Prisma 'image' field to Zustand 'img' field
                    const mappedUser = {
                        ...data.user,
                        img: data.user.image || data.user.img || '', // Map image to img for Zustand
                    }
                    
                    // Update local state immediately for UI responsiveness
                    set((state) => ({
                        users: state.users.map((user) =>
                            user.id === userId ? { ...user, ...mappedUser } : user,
                        ),
                        currentUser:
                            state.currentUser?.id === userId
                                ? { ...state.currentUser, ...mappedUser }
                                : state.currentUser,
                    }))
                    
                    return { success: true, user: data.user }
                } catch (error) {
                    console.error('Error updating user:', error)
                    return { success: false, error: error.message }
                }
            },

            // Get user by ID from local state
            getUserById: (userId) => {
                const state = get()
                return state.users.find((user) => user.id === userId)
            },

            // Get all users from local state
            getAllUsers: () => {
                const state = get()
                return state.users
            },

            // Sync with API
            syncUsers: async () => {
                await get().loadUsers()
            },

            // Update user image in store (local only, no API call)
            updateUserImage: (userId, imageData) => {
                set((state) => ({
                    users: state.users.map(user => 
                        user.id === userId ? { ...user, img: imageData } : user
                    ),
                    currentUser: state.currentUser?.id === userId 
                        ? { ...state.currentUser, img: imageData } 
                        : state.currentUser
                }))
            },

            // Remove user image from store (local only, no API call)
            removeUserImage: (userId) => {
                set((state) => ({
                    users: state.users.map(user => 
                        user.id === userId ? { ...user, img: '' } : user
                    ),
                    currentUser: state.currentUser?.id === userId 
                        ? { ...state.currentUser, img: '' } 
                        : state.currentUser
                }))
            },

            // Clean up old localStorage images (call this when uploading new images)
            cleanupOldImages: () => {
                if (typeof window !== 'undefined') {
                    try {
                        const keys = Object.keys(localStorage)
                        keys.forEach(key => {
                            if (key.startsWith('user-profile-images-')) {
                                localStorage.removeItem(key)
                            }
                        })
                        console.log('Cleaned up old localStorage images')
                    } catch (error) {
                        console.error('Error cleaning up old images:', error)
                    }
                }
            },

        }),
        {
            name: 'user-store', // unique name for localStorage key
            partialize: (state) => ({ 
                currentUser: state.currentUser,
            }),
        }
    )
)

export default useUserStore

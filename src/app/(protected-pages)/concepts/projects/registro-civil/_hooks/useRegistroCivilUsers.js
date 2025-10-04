import { useEffect, useState } from 'react'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import { useRegistroCivilStore } from '../_store/registroCivilStore'
import { useStoredUserImages } from '@/hooks/useStoredUserImages'

export const useRegistroCivilUsers = () => {
    const [isInitialized, setIsInitialized] = useState(false)
    
    // Get real users from the user store
    const { users, loadUsers, isLoading } = useUserStore()
    const isHydrated = useUserStoreHydrated()
    
    // Load users if not available
    useEffect(() => {
        if (isHydrated && (!users || users.length === 0) && !isLoading) {
            console.log('useRegistroCivilUsers: Loading users from API')
            loadUsers()
        }
    }, [isHydrated, users, loadUsers, isLoading])
    
    // Load stored images for users
    const usersWithImages = useStoredUserImages(users)
    
    // Get store functions
    const { forceUpdateMembers } = useRegistroCivilStore()
    
    useEffect(() => {
        if (isHydrated && usersWithImages && usersWithImages.length > 0 && !isInitialized) {
            console.log('useRegistroCivilUsers: Initializing with real users:', usersWithImages)
            
            // Force update registro civil store with real users (with images)
            forceUpdateMembers(usersWithImages)
            setIsInitialized(true)
        }
    }, [isHydrated, usersWithImages, isInitialized, forceUpdateMembers])

    // Debug: Log whenever users change
    useEffect(() => {
        console.log('useRegistroCivilUsers: Users state changed:', {
            users: users?.length || 0,
            usersWithImages: usersWithImages?.length || 0,
            isHydrated,
            isInitialized
        })
    }, [users, usersWithImages, isHydrated, isInitialized])
    
    // Debug: Log the final state
    useEffect(() => {
        console.log('useRegistroCivilUsers: Final state:', {
            users: users?.length || 0,
            usersWithImages: usersWithImages?.length || 0,
            isHydrated,
            isInitialized,
            hasUsers: usersWithImages && usersWithImages.length > 0,
            isLoading
        })
    }, [users, usersWithImages, isHydrated, isInitialized, isLoading])

    return {
        users: usersWithImages,
        isHydrated,
        isInitialized,
        hasUsers: usersWithImages && usersWithImages.length > 0,
        isLoading
    }
}


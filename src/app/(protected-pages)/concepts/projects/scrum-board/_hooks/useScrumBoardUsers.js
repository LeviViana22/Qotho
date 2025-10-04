import { useEffect, useState } from 'react'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useProjectStore } from '../../_store/projectStore'
import { useStoredUserImages } from '@/hooks/useStoredUserImages'

export const useScrumBoardUsers = () => {
    const [isInitialized, setIsInitialized] = useState(false)
    
    // Get real users from the user store
    const { users, loadUsers, isLoading } = useUserStore()
    const isHydrated = useUserStoreHydrated()
    
    // Load users if not available
    useEffect(() => {
        if (isHydrated && (!users || users.length === 0) && !isLoading) {
            console.log('useScrumBoardUsers: Loading users from API')
            loadUsers()
        }
    }, [isHydrated, users, loadUsers, isLoading])
    
    // Load stored images for users
    const usersWithImages = useStoredUserImages(users)
    
    // Get store functions
    const { updateAllMembers, updateBoardMembers, forceUpdateMembers } = useScrumBoardStore()
    const { syncWithUserStore } = useProjectStore()
    
    useEffect(() => {
        if (isHydrated && usersWithImages && usersWithImages.length > 0 && !isInitialized) {
            console.log('useScrumBoardUsers: Initializing with real users:', usersWithImages)
            
            // Force update scrum board store with real users (with images)
            forceUpdateMembers(usersWithImages)
            
            // Sync with project store
            syncWithUserStore(usersWithImages)
            
            setIsInitialized(true)
        }
    }, [isHydrated, usersWithImages, isInitialized, forceUpdateMembers, syncWithUserStore])
    
    // Force update whenever users change (for dynamic updates)
    useEffect(() => {
        if (isHydrated && usersWithImages && usersWithImages.length > 0 && isInitialized) {
            console.log('useScrumBoardUsers: Updating with new users:', usersWithImages)
            
            // Always force update with latest users (with images)
            forceUpdateMembers(usersWithImages)
            syncWithUserStore(usersWithImages)
        }
    }, [usersWithImages, isHydrated, isInitialized, forceUpdateMembers, syncWithUserStore])
    
    // Debug: Log whenever users change
    useEffect(() => {
        console.log('useScrumBoardUsers: Users state changed:', {
            users: users?.length || 0,
            usersWithImages: usersWithImages?.length || 0,
            isHydrated,
            isInitialized
        })
    }, [users, usersWithImages, isHydrated, isInitialized])
    
    // Debug: Log the final state
    useEffect(() => {
        console.log('useScrumBoardUsers: Final state:', {
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

'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import useUserStore from '@/stores/userStore'

const UserStoreSync = () => {
    const { data: session, status } = useSession()
    const { setCurrentUser, currentUser, loadUsers, users } = useUserStore()

    useEffect(() => {
        if (status === 'loading') return // Still loading

        if (session?.user) {
            // Load users if not already loaded
            if (users.length === 0) {
                loadUsers()
            }
            
            // Convert NextAuth session to user store format
            const userData = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: session.user.role,
                status: session.user.status,
                authority: session.user.authority || [session.user.role],
                firstName: '',
                lastName: '',
                title: '',
                personalInfo: {},
                lastOnline: 0,
                img: '',
            }

            // Only update if the user data has changed
            if (!currentUser || currentUser.id !== userData.id) {
                setCurrentUser(userData)
            }
        } else if (status === 'unauthenticated') {
            // Clear user data if not authenticated
            if (currentUser) {
                setCurrentUser(null)
            }
        }
    }, [session, status, currentUser, users.length])

    // Update current user with full data when users are loaded
    useEffect(() => {
        if (session?.user && users.length > 0 && currentUser) {
            const fullUserData = users.find(user => user.id === session.user.id)
            if (fullUserData && (!currentUser.img || currentUser.img === '')) {
                setCurrentUser(fullUserData)
            }
        }
    }, [users, session?.user, currentUser])

    return null // This component doesn't render anything
}

export default UserStoreSync

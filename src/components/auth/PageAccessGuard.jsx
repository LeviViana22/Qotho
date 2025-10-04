'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasPageAccess } from '@/utils/pageAccess'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import isBrowser from '@/utils/isBrowser'

/**
 * Page Access Guard Component
 * Protects pages based on user role permissions
 */
const PageAccessGuard = ({ 
    children, 
    requiredPage, 
    fallbackPath = '/access-denied',
    loadingComponent = null 
}) => {
    const router = useRouter()
    const { currentUser } = useUserStore()
    const isHydrated = useUserStoreHydrated()

    useEffect(() => {
        // Only check access after hydration is complete (in browser)
        if (isBrowser && isHydrated) {
            if (!currentUser) {
                // User not logged in, redirect to sign-in
                router.push('/sign-in')
                return
            }

            if (!hasPageAccess(currentUser.role, requiredPage)) {
                // User doesn't have access to this page
                router.push(fallbackPath)
                return
            }
        }
    }, [currentUser, isHydrated, requiredPage, fallbackPath, router])

    // Show loading component while hydrating
    if (isBrowser && !isHydrated) {
        return loadingComponent || (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Carregando...</div>
            </div>
        )
    }

    // Don't render children until we're sure user has access
    if (isBrowser && isHydrated && currentUser && !hasPageAccess(currentUser.role, requiredPage)) {
        return null
    }

    return children
}

export default PageAccessGuard

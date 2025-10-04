import { useEffect, useState } from 'react'
import useUserStore from '@/stores/userStore'
import isBrowser from '@/utils/isBrowser'

export const useUserStoreHydrated = () => {
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        // Only run hydration logic in the browser
        if (!isBrowser) return

        // Check if the store has been hydrated from localStorage
        const unsubscribe = useUserStore.persist?.onFinishHydration(() => {
            setIsHydrated(true)
            console.log('Store hydration completed')
        })

        // If already hydrated, set immediately
        if (useUserStore.persist?.hasHydrated()) {
            setIsHydrated(true)
        }

        return unsubscribe
    }, [])

    // Also check on every render to catch edge cases (only in browser)
    if (isBrowser && !isHydrated && useUserStore.persist?.hasHydrated()) {
        setIsHydrated(true)
    }

    // On server-side, always return true to prevent hydration mismatches
    return isBrowser ? isHydrated : true
}

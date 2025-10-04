import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useUserStore from '@/stores/userStore'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

export const useScrumBoardAccess = () => {
    const [hasAccess, setHasAccess] = useState(true) // HARDCODED BYPASS - Always true
    const [members, setMembers] = useState([])
    const [isLoading, setIsLoading] = useState(false) // HARDCODED BYPASS - No loading
    const { currentUser } = useUserStore()
    const router = useRouter()

    useEffect(() => {
        // HARDCODED BYPASS - Always grant access
        console.log('ScrumBoardAccess: HARDCODED BYPASS - Always granting access')
        setHasAccess(true)
        setIsLoading(false)
    }, [currentUser, router])

    return {
        hasAccess,
        members,
        isLoading,
        isAdmin: true // HARDCODED BYPASS - Always admin
    }
}

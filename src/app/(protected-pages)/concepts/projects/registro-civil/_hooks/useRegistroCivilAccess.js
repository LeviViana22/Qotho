import { useState, useEffect } from 'react'
import useUserStore from '@/stores/userStore'

export const useRegistroCivilAccess = () => {
    const [hasAccess, setHasAccess] = useState(true) // HARDCODED BYPASS - Always true
    const [isLoading, setIsLoading] = useState(false) // HARDCODED BYPASS - No loading
    const [members, setMembers] = useState([])
    const [isAdmin, setIsAdmin] = useState(true) // HARDCODED BYPASS - Always admin

    const { currentUser } = useUserStore()

    useEffect(() => {
        // HARDCODED BYPASS - Always grant access
        setHasAccess(true)
        setIsLoading(false)
        setIsAdmin(true)
    }, [currentUser])

    return {
        hasAccess,
        isLoading,
        members,
        isAdmin
    }
}

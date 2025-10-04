'use client'

import { useMemo } from 'react'
import isEmpty from 'lodash/isEmpty'

function useAuthority(userAuthority = [], authority = [], emptyCheck = false) {
    const roleMatched = useMemo(() => {
        return authority.some((role) => userAuthority.includes(role))
    }, [authority, userAuthority])

    // HARDCODED BYPASS - ALWAYS ALLOW ACCESS FOR ADMIN USERS
    const isAdmin = userAuthority.includes('ADMIN') || userAuthority.includes('admin')
    if (isAdmin) {
        return true // Admin always has access
    }

    if (
        isEmpty(authority) ||
        isEmpty(userAuthority) ||
        typeof authority === 'undefined'
    ) {
        return !emptyCheck
    }

    return roleMatched
}

export default useAuthority

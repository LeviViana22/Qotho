'use client'
import { useEffect } from 'react'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import isBrowser from '@/utils/isBrowser'

const RolesPermissionsProvider = ({
    children,
    roleList,
    userList,
    role,
    status,
}) => {
    const setRoleList = useRolePermissionsStore((state) => state.setRoleList)
    const setInitialLoading = useRolePermissionsStore(
        (state) => state.setInitialLoading,
    )
    const setUserList = useRolePermissionsStore((state) => state.setUserList)
    const setFilterData = useRolePermissionsStore(
        (state) => state.setFilterData,
    )
    const filterData = useRolePermissionsStore((state) => state.filterData)
    
    // Get users from Zustand store
    const zustandUsers = useUserStore((state) => state.users)
    const isHydrated = useUserStoreHydrated()

    useEffect(() => {
        setRoleList(roleList)
        
        // Always use Zustand users if available, otherwise use server data
        if (zustandUsers.length > 0) {
            setUserList(zustandUsers)
        } else {
            setUserList(userList)
        }

        if (role) {
            setFilterData({ ...filterData, role })
        }

        if (status) {
            setFilterData({ ...filterData, status })
        }

        setInitialLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleList, zustandUsers, isHydrated])

    // Sync role permissions store with Zustand changes
    useEffect(() => {
        if (zustandUsers.length > 0) {
            setUserList(zustandUsers)
        }
    }, [zustandUsers, setUserList])

    return <>{children}</>
}

export default RolesPermissionsProvider

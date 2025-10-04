'use client'
import { useEffect } from 'react'
import { useProjectListStore } from '../_store/projectListStore'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'

const ProjectListProvider = ({ children, projectList, projectMembers }) => {
    const setProjectList = useProjectListStore((state) => state.setProjectList)
    const setMembers = useProjectListStore((state) => state.setMembers)
    
    // Get real users from the user store
    const { users } = useUserStore()
    const isHydrated = useUserStoreHydrated()

    useEffect(() => {
        setProjectList(projectList)
        
        // Use real users if available, otherwise fall back to server data
        const membersToUse = isHydrated && users && users.length > 0 
            ? users 
            : projectMembers.allMembers
            
        setMembers(
            membersToUse.map((item) => ({
                value: item.id,
                label: item.name,
                img: item.img,
            })),
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated, users])

    return <>{children}</>
}

export default ProjectListProvider

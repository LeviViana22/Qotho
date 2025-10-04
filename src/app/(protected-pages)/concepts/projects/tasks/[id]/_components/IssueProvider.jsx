'use client'
import { useEffect } from 'react'
import { useIssueStore } from '../_store/issueStore'
import { getCurrentProjectData } from '@/utils/getCurrentProjectData'

const IssueProvider = ({ issueData, memberList, children }) => {
    const updateIssueData = useIssueStore((state) => state.updateIssueData)

    const setInitialLoading = useIssueStore((state) => state.setInitialLoading)
    const setMembers = useIssueStore((state) => state.setMembers)

    useEffect(() => {
        // Only proceed if we have valid issueData
        if (!issueData || Object.keys(issueData).length === 0) {
            setInitialLoading(false)
            return
        }
        
        // Get the current project data (which might have been updated)
        const currentProjectData = getCurrentProjectData(issueData.projectId || issueData.id)
        
        // Use current data if available, otherwise use the original issueData
        const dataToUse = currentProjectData || issueData
        
        updateIssueData(dataToUse)
        if (memberList && memberList.participantMembers) {
            setMembers(memberList.participantMembers)
        }

        setInitialLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [issueData])

    // Listen for localStorage changes to refresh data
    useEffect(() => {
        const handleStorageChange = () => {
            // Only proceed if we have valid issueData
            if (!issueData || Object.keys(issueData).length === 0) {
                return
            }
            
            const currentProjectData = getCurrentProjectData(issueData.projectId || issueData.id)
            if (currentProjectData) {
                updateIssueData(currentProjectData)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        
        // Also listen for custom events (for same-tab updates)
        window.addEventListener('scrumboardDataChanged', handleStorageChange)
        
        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('scrumboardDataChanged', handleStorageChange)
        }
    }, [issueData?.projectId, issueData?.id, updateIssueData])

    return <>{children}</>
}

export default IssueProvider

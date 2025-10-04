'use client'

import { useState, useEffect } from 'react'
import Tag from '@/components/ui/Tag'
import { useIssueStore } from '../_store/issueStore'
import useUserStore from '@/stores/userStore'
import { createActivityEntry, addActivityToProject, ACTIVITY_TYPES } from '@/utils/activityUtils'

const IssueHeader = () => {
    const { issueData, updateIssueData } = useIssueStore()
    const { currentUser } = useUserStore()
    
    // Local state for immediate UI updates (same pattern as other fields)
    const [localIssueData, setLocalIssueData] = useState(issueData)
    const [titleInputValue, setTitleInputValue] = useState('')
    
    // Initialize local state when component first loads and when issueData changes
    useEffect(() => {
        if (issueData && Object.keys(issueData).length > 0) {
            setLocalIssueData(issueData)
        }
    }, [issueData]) // Listen for changes to issueData from the store
    
    // Sync title input value with local state
    useEffect(() => {
        setTitleInputValue(localIssueData?.name || localIssueData?.title || '')
    }, [localIssueData?.name, localIssueData?.title])

    const handleTitleChange = (value) => {
        if (!localIssueData) return
        
        const oldValue = localIssueData.name || localIssueData.title || ''
        const newValue = value.trim()
        
        console.log('IssueHeader: handleTitleChange called', { oldValue, newValue, localIssueData })
        
        // Update local state immediately for UI feedback
        setLocalIssueData(prev => ({
            ...prev,
            name: newValue
        }))
        
        // Update the global store
        const updatedData = {
            ...localIssueData,
            name: newValue
        }
        updateIssueData(updatedData)
        
        // Update localStorage to sync with other views
        try {
            const storedData = localStorage.getItem('scrumboardData')
            if (storedData) {
                const scrumboardData = JSON.parse(storedData)
                
                // Find and update the project in all boards
                for (const boardName in scrumboardData) {
                    const board = scrumboardData[boardName]
                    const projectIndex = board.findIndex(project => 
                        project.projectId === localIssueData.projectId || 
                        project.id === localIssueData.projectId ||
                        project.projectId === localIssueData.id ||
                        project.id === localIssueData.id
                    )
                    
                    if (projectIndex !== -1) {
                        scrumboardData[boardName][projectIndex] = {
                            ...scrumboardData[boardName][projectIndex],
                            name: newValue,
                            title: newValue // Also update title for compatibility
                        }
                    }
                }
                
                localStorage.setItem('scrumboardData', JSON.stringify(scrumboardData))
                console.log('IssueHeader: Updated localStorage with new name', newValue)
            }
        } catch (error) {
            console.error('IssueHeader: Error updating localStorage', error)
        }
        
        // Log activity if value actually changed
        if (oldValue !== newValue) {
            const activityEntry = createActivityEntry(
                ACTIVITY_TYPES.PROJECT_UPDATED,
                `atualizou o nome do projeto de "${oldValue || 'vazio'}" para "${newValue || 'vazio'}"`,
                currentUser
            )
            addActivityToProject(localIssueData.projectId || localIssueData.id, activityEntry)
        }
        
        // Dispatch event to sync with other views
        window.dispatchEvent(new Event('scrumboardDataChanged'))
    }

    return (
        <div className="flex flex-col gap-2">
            <div>
                <Tag>{localIssueData?.projectId || localIssueData?.ticketId || 'Loading...'}</Tag>
            </div>
            <input
                className="h3 font-bold outline-hidden bg-transparent"
                value={titleInputValue}
                onChange={(e) => setTitleInputValue(e.target.value)}
                onBlur={(e) => handleTitleChange(e.target.value)}
            />
        </div>
    )
}

export default IssueHeader

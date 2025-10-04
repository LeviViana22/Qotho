'use client'
import { useState, useRef, useEffect } from 'react'
import { useScrumBoardUsers } from '../_hooks/useScrumBoardUsers'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useFieldConfigStore } from '../_store/fieldConfigStore'
import useUserStore from '@/stores/userStore'
import Drawer from '@/components/ui/Drawer'
import DatePicker from '@/components/ui/DatePicker'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import Tag from '@/components/ui/Tag'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Radio from '@/components/ui/Radio'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import TimeInput from '@/components/ui/TimeInput'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import Tooltip from '@/components/ui/Tooltip'
import Timeline from '@/components/ui/Timeline'
import { ActivityAvatar, ActivityEvent } from '@/components/view/Activity'
import Tabs from '@/components/ui/Tabs'
import Card from '@/components/ui/Card'
import classNames from '@/utils/classNames'
import dayjs from 'dayjs'
import ReactHtmlParser from 'html-react-parser'
import {
    TbCircle,
    TbUser,
    TbClock,
    TbCheck,
    TbCircleCheck,
    TbCircleCheckFilled,
    TbX,
    TbPlus,
    TbClipboardCheck,
    TbClipboardText,
    TbBuilding,
    TbReportMoney,
    TbCalendar,
    TbCheckupList,
    TbMail,
    TbList,
    TbToggleLeft,
    TbNotes,
    TbCalendarTime,
    TbPaperclip,
    TbDownload,
    TbEdit,
    TbTrash,
} from 'react-icons/tb'
import { createActivityEntry, addActivityToProject, ACTIVITY_TYPES } from '@/utils/activityUtils'
import isEmpty from 'lodash/isEmpty'
import { createDynamicColorMappings } from '../utils/boardColors'

// IssueField component - exact copy from the original issue page
const IssueField = (props) => {
    const { title, icon, children, titleHtml } = props

    return (
        <div className="flex items-center mb-2">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                <span className="text-lg">{icon}</span>
                {titleHtml ? (
                    <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
                ) : (
                    <span>{title}</span>
                )}
            </div>
            {children}
        </div>
    )
}

// AddMoreMember component
const AddMoreMember = () => {
    return (
        <Tooltip title="Add More" wrapperClass="flex">
            <Button
                icon={<TbPlus />}
                customColorClass={() =>
                    'border-2 border-dashed hover:ring-0 h-[30px] w-[30px] text-sm'
                }
                size="sm"
                shape="circle"
            />
        </Tooltip>
    )
}

const ProjectDetailsDrawer = ({ isOpen, onClose, projectData }) => {
    const commentInput = useRef(null)
    const fileInputRef = useRef(null)
    const [localIssueData, setLocalIssueData] = useState(projectData)
    const [titleInputValue, setTitleInputValue] = useState('')
    const [localComments, setLocalComments] = useState([])
    const [localAttachments, setLocalAttachments] = useState([])
    const [editingCommentId, setEditingCommentId] = useState(null)
    const [editingCommentText, setEditingCommentText] = useState('')
    const [focusedField, setFocusedField] = useState(null)
    const [originalFieldValues, setOriginalFieldValues] = useState({})
    const [originalTitleValue, setOriginalTitleValue] = useState('')
    const [isTitleFocused, setIsTitleFocused] = useState(false)
    const [titleChangeTimeout, setTitleChangeTimeout] = useState(null)
    
    const { currentUser } = useUserStore()
    const { users: memberList } = useScrumBoardUsers()
    const { updateColumns, updateFinalizedColumns, columns, finalizedColumns } = useScrumBoardStore()
    const { fieldConfig, getActiveFields } = useFieldConfigStore()

    // Get active fields from the store
    const activeFields = getActiveFields()

    // Initialize local state when project data changes
    useEffect(() => {
        if (projectData && Object.keys(projectData).length > 0) {
            setLocalIssueData(projectData)
            setLocalComments(projectData.comments || [])
            setLocalAttachments(projectData.attachments || [])
        }
    }, [projectData])

    // Fetch fresh data from database when drawer opens
    useEffect(() => {
        if (isOpen && projectData?.id) {
            const fetchFreshData = async () => {
                try {
                    const response = await fetch(`/api/projects/${projectData.id}`)
                    if (response.ok) {
                        const freshData = await response.json()
                        setLocalIssueData(freshData)
                        setLocalComments(freshData.comments || [])
                        setLocalAttachments(freshData.attachments || [])
                    }
                } catch (error) {
                    console.error('Error fetching fresh project data:', error)
                }
            }
            
            fetchFreshData()
        }
    }, [isOpen, projectData?.id])

    // Sync title input value with local state
    useEffect(() => {
        const titleValue = localIssueData?.name || localIssueData?.title || ''
        setTitleInputValue(titleValue)
        setOriginalTitleValue(titleValue)
    }, [localIssueData?.name, localIssueData?.title])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (titleChangeTimeout) {
                clearTimeout(titleChangeTimeout)
            }
        }
    }, [titleChangeTimeout])


    const createUID = (length) => {
        return Math.random().toString(36).substring(2, length + 2)
    }

    const saveToDatabase = async (updatedData) => {
        try {
            const response = await fetch(`/api/projects/${localIssueData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData)
            })
            
            if (!response.ok) {
                throw new Error('Failed to save to database')
            }
        } catch (error) {
            console.error('Error saving to database:', error)
        }
    }

    const handleFieldChange = (fieldName, newValue, fieldLabel) => {
        if (!localIssueData) return
        
        const oldValue = localIssueData[fieldName] || ''
        const updatedData = { ...localIssueData, [fieldName]: newValue }
        
        // Add activity entry for field change
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            field: fieldLabel || fieldName,
            oldValue: oldValue,
            newValue: newValue,
            projectId: localIssueData.projectId || localIssueData.id,
        }, currentUser)
        
        const updatedDataWithActivity = addActivityToProject(updatedData, activityEntry)
        
        // Update local state
        setLocalIssueData(updatedDataWithActivity)
        
        // Update UI
        const updatedColumns = { ...columns }
        const updatedFinalizedColumns = { ...finalizedColumns }
        
        // Find and update the project in regular columns
        for (const boardName in updatedColumns) {
            const board = updatedColumns[boardName]
            const projectIndex = board.findIndex(project => project.id === localIssueData.id)
            if (projectIndex !== -1) {
                updatedColumns[boardName][projectIndex] = updatedDataWithActivity
                updateColumns(updatedColumns)
                break
            }
        }
        
        // Find and update the project in finalized columns
        for (const boardName in updatedFinalizedColumns) {
            const board = updatedFinalizedColumns[boardName]
            const projectIndex = board.findIndex(project => project.id === localIssueData.id)
            if (projectIndex !== -1) {
                updatedFinalizedColumns[boardName][projectIndex] = updatedDataWithActivity
                updateFinalizedColumns(updatedFinalizedColumns)
                break
            }
        }
        
        // Save to database with activity
        saveToDatabase(updatedDataWithActivity)
    }

    const saveToAllViews = async (newData) => {
        try {
            // Update local state immediately for UI feedback
            const updatedData = { ...localIssueData, ...newData }
            setLocalIssueData(updatedData)
            
            // Update the project in the scrum board columns (Zustand store)
            const updatedColumns = { ...columns }
            const updatedFinalizedColumns = { ...finalizedColumns }
            
            // Find and update the project in regular columns
            for (const boardName in updatedColumns) {
                const board = updatedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                
                if (projectIndex !== -1) {
                    updatedColumns[boardName][projectIndex] = updatedData
                    updateColumns(updatedColumns)
                    break
                }
            }
            
            // Find and update the project in finalized columns
            for (const boardName in updatedFinalizedColumns) {
                const board = updatedFinalizedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                
                if (projectIndex !== -1) {
                    updatedFinalizedColumns[boardName][projectIndex] = updatedData
                    updateFinalizedColumns(updatedFinalizedColumns)
                    break
                }
            }
            
            // Save individual project to database
            try {
                const response = await fetch(`/api/projects/${localIssueData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData)
                })
                
                if (!response.ok) {
                    throw new Error('Failed to save to database')
                }
                
            } catch (error) {
                console.error('Error saving to database:', error)
            }
            
        } catch (error) {
            console.error('Error saving to all views:', error)
        }
    }

    const handleTitleChange = (value) => {
        if (!localIssueData) return
        
        const newValue = value.trim().toUpperCase()
        
        // Store original value on first change if not already stored
        if (!isTitleFocused) {
            console.log('First change detected, storing original value:', localIssueData?.name || localIssueData?.title || '')
            setOriginalTitleValue(localIssueData?.name || localIssueData?.title || '')
            setIsTitleFocused(true)
        }
        
        // Always update the local state for UI feedback
        const updatedData = {
            ...localIssueData,
            name: newValue,
            title: newValue
        }
        setLocalIssueData(updatedData)
        
        // Update the UI immediately without logging
        const updatedColumns = { ...columns }
        const updatedFinalizedColumns = { ...finalizedColumns }
        
        // Find and update the project in regular columns
        for (const boardName in updatedColumns) {
            const board = updatedColumns[boardName]
            const projectIndex = board.findIndex(project => project.id === localIssueData.id)
            if (projectIndex !== -1) {
                updatedColumns[boardName][projectIndex] = updatedData
                updateColumns(updatedColumns)
                break
            }
        }
        
        // Find and update the project in finalized columns
        for (const boardName in updatedFinalizedColumns) {
            const board = updatedFinalizedColumns[boardName]
            const projectIndex = board.findIndex(project => project.id === localIssueData.id)
            if (projectIndex !== -1) {
                updatedFinalizedColumns[boardName][projectIndex] = updatedData
                updateFinalizedColumns(updatedFinalizedColumns)
                break
            }
        }
        
        // Save to database immediately (without activity logging)
        saveToDatabase(updatedData)
        
        // Clear existing timeout
        if (titleChangeTimeout) {
            clearTimeout(titleChangeTimeout)
        }
        
        // Set a new timeout to check for changes after user stops typing
        const timeout = setTimeout(() => {
            if (isTitleFocused) {
                console.log('Timeout triggered - checking for title changes')
                const currentValue = titleInputValue.trim().toUpperCase()
                const originalValue = originalTitleValue.trim().toUpperCase()
                
                console.log('Timeout comparing - current:', currentValue, 'original:', originalValue)
                
                if (currentValue !== originalValue) {
                    console.log('Timeout detected change - logging activity')
                    handleTitleBlur(currentValue)
                }
            }
        }, 2000) // 2 seconds after user stops typing
        
        setTitleChangeTimeout(timeout)
    }

    const handleTitleFocus = () => {
        console.log('Title field focused')
        // Original value will be stored on first change in handleTitleChange
    }

    const handleTitleBlur = (value) => {
        console.log('Title field blurred, value:', value)
        setIsTitleFocused(false)
        
        if (!localIssueData) return
        
        const newValue = value.trim().toUpperCase()
        const oldValue = originalTitleValue.trim().toUpperCase()
        
        console.log('Comparing values - old:', oldValue, 'new:', newValue)
        
        // Only log if there was an actual change
        if (oldValue !== newValue) {
            console.log('Title changed, logging activity')
            
            // Create activity entry
            const activityEntry = {
                type: 'field_update',
                action: 'changed',
                user: currentUser?.name || 'Unknown User',
                details: `Changed project name from "${oldValue || 'empty'}" to "${newValue || 'empty'}"`
            }
            
            // Update the original value for next comparison
            setOriginalTitleValue(newValue)
            
            // Add activity to the current data and save
            const currentData = localIssueData
            const currentActivity = currentData.activity || []
            const newActivity = [
                ...currentActivity,
                {
                    id: createUID(8),
                    type: activityEntry.type,
                    action: activityEntry.action,
                    user: activityEntry.user,
                    timestamp: new Date().toISOString(),
                    details: activityEntry.details
                }
            ]
            
            const updatedDataWithActivity = {
                ...currentData,
                activity: newActivity
            }
            
            // Update local state
            setLocalIssueData(updatedDataWithActivity)
            
            // Update UI
            const updatedColumns = { ...columns }
            const updatedFinalizedColumns = { ...finalizedColumns }
            
            // Find and update the project in regular columns
            for (const boardName in updatedColumns) {
                const board = updatedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedColumns[boardName][projectIndex] = updatedDataWithActivity
                    updateColumns(updatedColumns)
                    break
                }
            }
            
            // Find and update the project in finalized columns
            for (const boardName in updatedFinalizedColumns) {
                const board = updatedFinalizedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedFinalizedColumns[boardName][projectIndex] = updatedDataWithActivity
                    updateFinalizedColumns(updatedFinalizedColumns)
                    break
                }
            }
            
            // Save to database with activity
            saveToDatabase(updatedDataWithActivity)
        } else {
            console.log('No change detected, not logging')
        }
    }


    const submitComment = () => {
        const commentText = commentInput.current?.value?.trim()
        if (commentText) {
            const newComment = {
                id: createUID(8),
                message: commentText,
                name: currentUser?.name || 'Unknown',
                src: currentUser?.img || '',
                date: new Date().toISOString()
            }
            
            const updatedComments = [...localComments, newComment]
            setLocalComments(updatedComments)
            
            const newData = {
                ...localIssueData,
                comments: updatedComments
            }
            
            // Add activity entry for comment
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.COMMENT, {
                comment: commentText,
                projectId: newData.projectId || newData.id,
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(newData, activityEntry)
            
            // Update local state
            setLocalIssueData(updatedDataWithActivity)
            
            // Update UI
            const updatedColumns = { ...columns }
            const updatedFinalizedColumns = { ...finalizedColumns }
            
            // Find and update the project in regular columns
            for (const boardName in updatedColumns) {
                const board = updatedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedColumns[boardName][projectIndex] = updatedDataWithActivity
                    updateColumns(updatedColumns)
                    break
                }
            }
            
            // Find and update the project in finalized columns
            for (const boardName in updatedFinalizedColumns) {
                const board = updatedFinalizedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedFinalizedColumns[boardName][projectIndex] = updatedDataWithActivity
                    updateFinalizedColumns(updatedFinalizedColumns)
                    break
                }
            }
            
            // Save to database with activity
            saveToDatabase(updatedDataWithActivity)
            
            // Clear the input
            if (commentInput.current) {
                commentInput.current.value = ''
            }
        }
    }

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id)
        setEditingCommentText(comment.message)
    }

    const handleSaveEdit = () => {
        if (editingCommentText.trim()) {
            const updatedComments = localComments.map(c =>
                c.id === editingCommentId ? { ...c, message: editingCommentText.trim() } : c
            )
            setLocalComments(updatedComments)
            
            const newData = {
                ...localIssueData,
                comments: updatedComments
            }
            
            // Add activity entry for editing comment
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.COMMENT, {
                comment: editingCommentText.trim(),
                projectId: newData.projectId || newData.id,
                action: 'edited'
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(newData, activityEntry)
            
            // Use saveToAllViews to handle UI updates and database saving
            saveToAllViews(updatedDataWithActivity)
            
            setEditingCommentId(null)
            setEditingCommentText('')
        }
    }

    const handleCancelEdit = () => {
        setEditingCommentId(null)
        setEditingCommentText('')
    }

    const handleRemoveComment = (commentId) => {
        const commentToRemove = localComments.find(c => c.id === commentId)
        const updatedComments = localComments.filter(c => c.id !== commentId)
        setLocalComments(updatedComments)
        
        const newData = {
            ...localIssueData,
            comments: updatedComments
        }
        
        // Add activity entry for removing comment
        if (commentToRemove) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.COMMENT, {
                comment: commentToRemove.message,
                projectId: newData.projectId || newData.id,
                action: 'removed'
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(newData, activityEntry)
            
            // Use saveToAllViews to handle UI updates and database saving
            saveToAllViews(updatedDataWithActivity)
        } else {
            // If no comment found, just save without activity
            saveToAllViews(newData)
        }
    }

    const handleAddAttachment = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files)
        if (files.length > 0) {
            const newAttachments = files.map(file => ({
                id: createUID(8),
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
                createdAt: new Date().toISOString()
            }))
            
            const updatedAttachments = [...localAttachments, ...newAttachments]
            setLocalAttachments(updatedAttachments)
            
            const newData = {
                ...localIssueData,
                attachments: updatedAttachments
            }
            saveToAllViews(newData)
        }
    }

    const handleRemoveAttachment = (attachmentId) => {
        const updatedAttachments = localAttachments.filter(a => a.id !== attachmentId)
        setLocalAttachments(updatedAttachments)
        
        const newData = {
            ...localIssueData,
            attachments: updatedAttachments
        }
        saveToAllViews(newData)
    }

    const handleDownloadAttachment = (attachment) => {
        const link = document.createElement('a')
        link.href = attachment.url
        link.download = attachment.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const onAddMemberClick = async (memberId) => {
        const newMember = memberList.find((member) => member.id === memberId)
        
        if (newMember && localIssueData) {
            const oldMembers = localIssueData.members || []
            const newMembers = [...oldMembers, newMember]
            const newIssueData = { ...localIssueData, members: newMembers }
            setLocalIssueData(newIssueData)
            
            // Add activity entry for field update
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: newIssueData.projectId || newIssueData.id,
                field: 'atendente',
                oldValue: oldMembers.map(m => m.name).join(', ') || 'Nenhum',
                newValue: newMembers.map(m => m.name).join(', '),
            }, currentUser)
            const updatedIssueData = addActivityToProject(newIssueData, activityEntry)
            setLocalIssueData(updatedIssueData)
            
            // Update store state immediately to prevent UI revert
            const updatedColumns = { ...columns }
            const updatedFinalizedColumns = { ...finalizedColumns }
            
            // Find and update the project in regular columns
            for (const boardName in updatedColumns) {
                const board = updatedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedColumns[boardName][projectIndex] = updatedIssueData
                    updateColumns(updatedColumns)
                    break
                }
            }
            
            // Find and update the project in finalized columns
            for (const boardName in updatedFinalizedColumns) {
                const board = updatedFinalizedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedFinalizedColumns[boardName][projectIndex] = updatedIssueData
                    updateFinalizedColumns(updatedFinalizedColumns)
                    break
                }
            }
            
            // Debounce the save to prevent too many rapid saves
            if (window.projectAtendenteTimeout) {
                clearTimeout(window.projectAtendenteTimeout)
            }
            window.projectAtendenteTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/projects/${localIssueData.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedIssueData)
                    })
                    
                    if (!response.ok) {
                        throw new Error('Failed to save to database')
                    }
                } catch (error) {
                    console.error('Error saving atendente to database:', error)
                }
            }, 500)
        }
    }

    const onRemoveMemberClick = async (memberToRemove) => {
        if (localIssueData) {
            const oldMembers = localIssueData.members || []
            const newMembers = localIssueData.members?.filter(member => member.id !== memberToRemove.id) || []
            const newIssueData = { 
                ...localIssueData, 
                members: newMembers
            }
            setLocalIssueData(newIssueData)
            
            // Add activity entry for field update
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: newIssueData.projectId || newIssueData.id,
                field: 'atendente',
                oldValue: oldMembers.map(m => m.name).join(', ') || 'Nenhum',
                newValue: newMembers.map(m => m.name).join(', ') || 'Nenhum',
            }, currentUser)
            const updatedIssueData = addActivityToProject(newIssueData, activityEntry)
            setLocalIssueData(updatedIssueData)
            
            // Update store state immediately to prevent UI revert
            const updatedColumns = { ...columns }
            const updatedFinalizedColumns = { ...finalizedColumns }
            
            // Find and update the project in regular columns
            for (const boardName in updatedColumns) {
                const board = updatedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedColumns[boardName][projectIndex] = updatedIssueData
                    updateColumns(updatedColumns)
                    break
                }
            }
            
            // Find and update the project in finalized columns
            for (const boardName in updatedFinalizedColumns) {
                const board = updatedFinalizedColumns[boardName]
                const projectIndex = board.findIndex(project => project.id === localIssueData.id)
                if (projectIndex !== -1) {
                    updatedFinalizedColumns[boardName][projectIndex] = updatedIssueData
                    updateFinalizedColumns(updatedFinalizedColumns)
                    break
                }
            }
            
            // Debounce the save to prevent too many rapid saves
            if (window.projectAtendenteTimeout) {
                clearTimeout(window.projectAtendenteTimeout)
            }
            window.projectAtendenteTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/projects/${localIssueData.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedIssueData)
                    })
                    
                    if (!response.ok) {
                        throw new Error('Failed to save to database')
                    }
                } catch (error) {
                    console.error('Error saving atendente to database:', error)
                }
            }, 500)
        }
    }

    if (!localIssueData) return null

    return (
        <>
            <style jsx global>{`
                .project-details-drawer .drawer-content {
                    left: 2rem !important;
                    right: 2rem !important;
                    width: auto !important;
                    border-radius: 1rem 1rem 0 0 !important;
                }
                
                /* Prevent text selection on drawer */
                .project-details-drawer {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                
                /* Allow text selection inside input fields */
                .project-details-drawer input,
                .project-details-drawer textarea {
                    -webkit-user-select: text;
                    -moz-user-select: text;
                    -ms-user-select: text;
                    user-select: text;
                }
            `}</style>
            
            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                placement="bottom"
                height={900}
                className="mb-0 project-details-drawer"
                onRequestClose={onClose}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" onClick={onClose}>
                            Fechar
                        </Button>
                    </div>
                }
            >
                <div className="relative h-full">
                    {/* White Grid with Main Content (original full size) */}
                    <div className="relative h-full">
                        <div className="xl:w-2/3 h-full flex flex-col">
                            <div className="px-6 flex-1 flex flex-col">
                                {/* Issue Header */}
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <Tag>{localIssueData?.projectId || localIssueData?.ticketId || 'Loading...'}</Tag>
                                    </div>
                                    <input
                                        className="h3 font-bold outline-hidden bg-transparent"
                                        value={titleInputValue}
                                        onChange={(e) => {
                                            setTitleInputValue(e.target.value)
                                            handleTitleChange(e.target.value)
                                        }}
                                        onFocus={handleTitleFocus}
                                        onBlur={(e) => handleTitleBlur(e.target.value)}
                                        placeholder="Enter project name..."
                                    />
                                </div>
                                
                                {/* Issue Body */}
                                <div className="mt-8">
                                    {/* Fixed Fields */}
                                    <div className="mb-1">
                                        <IssueField title="Atendente" icon={<TbUser />}>
                                            <div className="flex items-center gap-1">
                                                <UsersAvatarGroup
                                                    className="gap-1"
                                                    avatarProps={{
                                                        className: 'cursor-pointer',
                                                    }}
                                                    avatarGroupProps={{ maxCount: 4 }}
                                                    chained={false}
                                                    users={localIssueData.members || []}
                                                    onAvatarClick={onRemoveMemberClick}
                                                />
                                                {memberList.length !== localIssueData.members?.length && (
                                                    <Dropdown renderTitle={<AddMoreMember />}>
                                                        {memberList.map((member) =>
                                                            !localIssueData.members?.some((m) => m.id === member.id) && (
                                                                <Dropdown.Item
                                                                    key={member.name}
                                                                    eventKey={member.id}
                                                                    onSelect={onAddMemberClick}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center">
                                                                            <Avatar
                                                                                shape="circle"
                                                                                size={22}
                                                                                src={member.img}
                                                                            />
                                                                            <span className="ml-2 rtl:mr-2">
                                                                                {member.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </Dropdown.Item>
                                                            ),
                                                        )}
                                                    </Dropdown>
                                                )}
                                            </div>
                                        </IssueField>
                                    </div>

                                    {/* Dynamic Fields */}
                                    {activeFields.map((field) => {
                                        const fieldValue = localIssueData[field.fieldName] || ''
                                        
                                        // Debug: Log field data for dropdown fields
                                        if (field.tipo.toLowerCase() === 'dropdown') {
                                            console.log('Dropdown field debug:', {
                                                fieldName: field.fieldName,
                                                fieldValue,
                                                options: field.options,
                                                fieldData: field
                                            })
                                        }
                                        
                                        const getFieldIcon = () => {
                                            switch (field.tipo.toLowerCase()) {
                                                case 'data':
                                                case 'date':
                                                    return <TbCalendar />
                                                case 'checkbox':
                                                    return <TbCheckupList />
                                                case 'dropdown':
                                                    return <TbClipboardText />
                                                case 'radio':
                                                    return <TbCircle />
                                                case 'multiselect':
                                                case 'seleção múltipla':
                                                    return <TbList />
                                                case 'switch':
                                                case 'interruptor':
                                                    return <TbToggleLeft />
                                                case 'email':
                                                    return <TbMail />
                                                case 'hora':
                                                case 'time':
                                                    return <TbClock />
                                                case 'data e hora':
                                                case 'datetime':
                                                    return <TbCalendarTime />
                                                default:
                                                    return <TbClipboardText />
                                            }
                                        }

                                        const renderFieldContent = () => {
                                            switch (field.tipo.toLowerCase()) {
                                                case 'text':
                                                case 'email':
                                                case 'number':
                                                    return (
                                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                            focusedField === field.fieldName ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}>
                                                            <span className="font-semibold pointer-events-none">{fieldValue}</span>
                                                            <Input
                                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                                                style={{ caretColor: 'black' }}
                                                                value={fieldValue}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.toUpperCase();
                                                                    handleFieldChange(field.fieldName, value, field.label)
                                                                }}
                                                                onFocus={() => setFocusedField(field.fieldName)}
                                                                onBlur={() => setFocusedField(null)}
                                                            />
                                                        </div>
                                                    )
                                                
                                                case 'date':
                                                    return (
                                                        <div className="w-[295px]">
                                                            <DatePicker
                                                                value={fieldValue ? new Date(fieldValue) : null}
                                                                onChange={(date) => {
                                                                    handleFieldChange(field.fieldName, date, field.label)
                                                                }}
                                                                inputFormat="DD/MM/YYYY"
                                                            />
                                                        </div>
                                                    )
                                                
                                                case 'dropdown':
                                                    return (
                                                        <div className="w-[295px]">
                                                            <Dropdown
                                                                className="w-full h-full"
                                                                toggleClassName="flex px-3 cursor-pointer rounded-xl min-h-[46px] focus:outline-none outline-none shadow-none focus:shadow-none"
                                                                placement="bottom-start"
                                                                renderTitle={
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                            fieldValue ? (() => {
                                                                                const selectedOption = field.options?.find(opt => opt.value === fieldValue)
                                                                                if (selectedOption?.color) {
                                                                                    // Map color names to Tailwind classes
                                                                                    const colorMap = {
                                                                                        'lightyellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                                                                        'yellow': 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100',
                                                                                        'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                                                                                        'lightcoral': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                                                                                        'lightpink': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
                                                                                        'pink': 'bg-pink-200 text-pink-900 dark:bg-pink-800 dark:text-pink-100',
                                                                                        'lightblue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                                                                                        'blue': 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
                                                                                        'lightgreen': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                                                                        'green': 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
                                                                                        'lightgray': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                                                                                        'gray': 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100'
                                                                                    }
                                                                                    return colorMap[selectedOption.color] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                                }
                                                                                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                            })() : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                        }`}>
                                                                            {fieldValue || 'Selecionar'}
                                                                        </span>
                                                                    </div>
                                                                }
                                                            >
                                                                {field.options?.map((option) => (
                                                                    <Dropdown.Item
                                                                        key={option.value}
                                                                        eventKey={option.value}
                                                                        onSelect={() => handleFieldChange(field.fieldName, option.value, field.label)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <div 
                                                                                className="w-3 h-3 rounded-full border border-gray-300"
                                                                                style={{ backgroundColor: option.color || 'lightblue' }}
                                                                            />
                                                                            {option.label}
                                                                        </div>
                                                                    </Dropdown.Item>
                                                                ))}
                                                            </Dropdown>
                                                        </div>
                                                    )
                                                
                                                case 'checkbox':
                                                    return (
                                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                                            focusedField === field.fieldName ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}>
                                                            <Checkbox
                                                                checked={fieldValue === 'true' || fieldValue === true}
                                                                onChange={(checked) => {
                                                                    handleFieldChange(field.fieldName, checked, field.label)
                                                                }}
                                                            />
                                                        </div>
                                                    )
                                                
                                                default:
                                                    return (
                                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                            focusedField === field.fieldName ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}>
                                                            <span className="font-semibold pointer-events-none">{fieldValue}</span>
                                                            <Input
                                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                                                style={{ caretColor: 'black' }}
                                                                value={fieldValue}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.toUpperCase();
                                                                    handleFieldChange(field.fieldName, value, field.label)
                                                                }}
                                                                onFocus={() => setFocusedField(field.fieldName)}
                                                                onBlur={() => setFocusedField(null)}
                                                            />
                                                        </div>
                                                    )
                                            }
                                        }

                                        return (
                                            <div key={field.id} className="mb-1">
                                                <IssueField title={field.nome} icon={getFieldIcon()}>
                                                    {renderFieldContent()}
                                                </IssueField>
                                            </div>
                                        )
                                    })}

                                </div>
                                
                                {/* Issue Footer */}
                                <div className="mt-4 flex-1 flex flex-col">
                                    <Tabs className="mt-2 flex-1 flex flex-col" defaultValue="comments">
                                        <Tabs.TabList>
                                            <Tabs.TabNav value="comments">Comentários</Tabs.TabNav>
                                            <Tabs.TabNav value="attachments">Anexos</Tabs.TabNav>
                                        </Tabs.TabList>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <Tabs.TabContent value="comments" className="flex-1 flex flex-col">
                                                <div className="w-full">
                                                    {localComments && localComments?.length > 0 && (
                                                        <>
                                                            {localComments.map((comment) => (
                                                                <div key={comment.id} className="mb-3 flex">
                                                                    <div className="mt-2">
                                                                        <Avatar shape="circle" src={comment.src} />
                                                                    </div>
                                                                    <div className="ml-2 rtl:mr-2 p-3 rounded-sm w-100">
                                                                        <div className="flex items-center mb-2">
                                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                                {comment.name}
                                                                            </span>
                                                                            <span className="mx-1"> | </span>
                                                                            <span>
                                                                                {dayjs(comment.date).format('DD MMMM YYYY')}
                                                                            </span>
                                                                            {comment.name === currentUser?.name && (
                                                                                <div className="flex items-center gap-1 ml-2">
                                                                                    <Tooltip title="Editar comentário">
                                                                                        <Button
                                                                                            variant="plain"
                                                                                            size="xs"
                                                                                            icon={<TbEdit />}
                                                                                            onClick={() => handleEditComment(comment)}
                                                                                        />
                                                                                    </Tooltip>
                                                                                    <Tooltip title="Remover comentário">
                                                                                        <Button
                                                                                            variant="plain"
                                                                                            size="xs"
                                                                                            icon={<TbTrash />}
                                                                                            onClick={() => handleRemoveComment(comment.id)}
                                                                                        />
                                                                                    </Tooltip>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            {editingCommentId === comment.id ? (
                                                                                <div className="space-y-2">
                                                                                    <Input
                                                                                        value={editingCommentText}
                                                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                                                        textArea
                                                                                        placeholder="Editar comentário"
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <Button
                                                                                            size="xs"
                                                                                            icon={<TbCheck />}
                                                                                            onClick={handleSaveEdit}
                                                                                            variant="solid"
                                                                                        >
                                                                                            Salvar
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="xs"
                                                                                            icon={<TbX />}
                                                                                            onClick={handleCancelEdit}
                                                                                            variant="plain"
                                                                                        >
                                                                                            Cancelar
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                ReactHtmlParser(comment.message || '')
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                    <div className="mb-3 flex gap-2">
                                                        <Avatar shape="circle" src={currentUser?.img || ''} />
                                                        <div className="w-full relative">
                                                            <Input ref={commentInput} textArea placeholder="Comente algo" />
                                                            <div className="absolute bottom-4 right-4">
                                                                <div
                                                                    className="cursor-pointer font-semibold text-primary"
                                                                    onClick={() => submitComment()}
                                                                >
                                                                    Enviar
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Tabs.TabContent>
                                            <Tabs.TabContent value="attachments" className="flex-1 flex flex-col">
                                                {(localAttachments && localAttachments.length > 0) ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                                        {localAttachments.map((file) => (
                                                            <Card
                                                                key={file.id}
                                                                bodyClass="px-3 pt-3 pb-1"
                                                                className="bg-gray-100 dark:bg-gray-700 shadow-none"
                                                                bordered={false}
                                                            >
                                                                {file.name.toLowerCase().endsWith('.pdf') ? (
                                                                    <div className="flex items-center justify-center h-32 bg-gray-200 dark:bg-gray-600 rounded-lg">
                                                                        <div className="text-center">
                                                                            <div className="text-4xl text-red-500 mb-2">📄</div>
                                                                            <div className="text-sm text-gray-600 dark:text-gray-300">PDF</div>
                                                                        </div>
                                                                    </div>
                                                                ) : file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                                    <img
                                                                        className="max-w-full rounded-lg"
                                                                        src={file.url}
                                                                        alt={file.name}
                                                                        style={{ maxHeight: '128px', objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-32 bg-gray-200 dark:bg-gray-600 rounded-lg">
                                                                        <div className="text-center">
                                                                            <div className="text-4xl text-blue-500 mb-2">📎</div>
                                                                            <div className="text-sm text-gray-600 dark:text-gray-300">Arquivo</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="mt-2">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                        {file.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {(file.size / 1024).toFixed(1)} KB
                                                                    </div>
                                                                    <div className="flex gap-1 mt-2">
                                                                        <Button
                                                                            size="xs"
                                                                            variant="plain"
                                                                            icon={<TbDownload />}
                                                                            onClick={() => handleDownloadAttachment(file)}
                                                                        />
                                                                        <Button
                                                                            size="xs"
                                                                            variant="plain"
                                                                            icon={<TbTrash />}
                                                                            onClick={() => handleRemoveAttachment(file.id)}
                                                                            className="text-red-500 hover:text-red-700"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">
                                                        Nenhum anexo ainda
                                                    </div>
                                                )}
                                                <div className="mt-4">
                                                    <Button
                                                        size="sm"
                                                        icon={<TbPlus />}
                                                        onClick={handleAddAttachment}
                                                    >
                                                        Adicionar Anexo
                                                    </Button>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </div>
                                            </Tabs.TabContent>
                                        </div>
                                    </Tabs>
                                </div>
                            </div>
                        </div>
                        <div className="xl:absolute xl:top-0 xl:right-0 xl:w-1/3 xl:h-full">
                            {/* Issue Activity */}
                            <div className="lg:px-6 h-full flex flex-col">
                                <h5 className="mb-4 flex-shrink-0">Activity</h5>
                                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-gray-400 hover:scrollbar-track-transparent">
                                    <Timeline>
                                        {isEmpty(localIssueData.activity) ? (
                                            <Timeline.Item>No Activities</Timeline.Item>
                                        ) : (
                                            localIssueData.activity.map((event, index) => (
                                                <Timeline.Item
                                                    key={event.type + index}
                                                    media={<ActivityAvatar data={event} />}
                                                >
                                                    <div className="mt-1">
                                                        <ActivityEvent compact data={event} />
                                                    </div>
                                                </Timeline.Item>
                                            ))
                                        )}
                                    </Timeline>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Drawer>
        </>
    )
}

export default ProjectDetailsDrawer

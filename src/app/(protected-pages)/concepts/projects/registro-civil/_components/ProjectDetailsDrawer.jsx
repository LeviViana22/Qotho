'use client'
import { useState, useRef, useEffect } from 'react'
import { useRegistroCivilUsers } from '../_hooks/useRegistroCivilUsers'
import { useRegistroCivilAccess } from '../_hooks/useRegistroCivilAccess'
import { useRegistroCivilStore } from '../_store/registroCivilStore'
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
import NoMedia from '@/assets/svg/NoMedia'

// IssueField component - exact copy from the original issue page
const IssueField = (props) => {
    const { title, icon, children, titleHtml } = props

    return (
        <div className="flex items-center mb-2">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] max-w-[150px]">
                <span className="text-lg flex-shrink-0">{icon}</span>
                {titleHtml ? (
                    <span dangerouslySetInnerHTML={{ __html: titleHtml }} className="break-words" />
                ) : (
                    <span className="break-words">{title}</span>
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
    const [newPendingItem, setNewPendingItem] = useState('')
    
    const { currentUser } = useUserStore()
    const { users: allUsers, isLoading } = useRegistroCivilUsers()
    
    // Get current user with image data from registro civil users
    const currentUserWithImage = allUsers?.find(user => user.id === currentUser?.id) || currentUser
    const { updateColumns, updateFinalizedColumns, columns, finalizedColumns, moveProjectToFinalized, moveProjectToRegular } = useRegistroCivilStore()
    const { members: accessMembers } = useRegistroCivilAccess()
    const { fieldConfig, getActiveFields } = useFieldConfigStore()

    // Get active fields from the store, excluding pendencias since we render it manually
    const activeFields = getActiveFields().filter(field => field.fieldName !== 'pendencias')

    // Create member list for atendente field: only real users from database
    const getAtendenteMemberList = () => {
        // Use only real users from database - no fallback to mock data
        const realUsers = allUsers && allUsers.length > 0 ? allUsers : []
        
        // Filter out only specific mock users by name, not by email domain
        // This allows real users with @hotmail.com emails to be included
        const filteredUsers = realUsers.filter(user => {
            // Only exclude users with specific mock names, not email domains
            const isMockUser = user.name?.includes('Angelina Gotelli') ||
                              user.name?.includes('Jeremiah Minsk') ||
                              user.name?.includes('Max Alexander')
            return !isMockUser
        })
        
        
        // Add existing atendente members who are not in filtered users (but only if they're not mock)
        const memberList = [...filteredUsers]
        if (localIssueData?.members && Array.isArray(localIssueData.members)) {
            const existingMemberIds = new Set(filteredUsers.map(member => member.id))
            localIssueData.members.forEach(member => {
                if (!existingMemberIds.has(member.id)) {
                    // Only add if it's not mock data (by name only)
                    const isMockMember = member.name?.includes('Angelina Gotelli') ||
                                        member.name?.includes('Jeremiah Minsk') ||
                                        member.name?.includes('Max Alexander')
                    if (!isMockMember) {
                        memberList.push(member)
                    }
                }
            })
        }
        
        return memberList
    }
    
    const memberList = getAtendenteMemberList()
    
    // Check if project is in finalized state
    const isProjectFinalized = () => {
        if (!localIssueData?.id) return false
        
        // Check if project exists in any finalized board
        for (const boardName in finalizedColumns) {
            const board = finalizedColumns[boardName]
            if (board.some(project => project.id === localIssueData.id)) {
                return true
            }
        }
        return false
    }
    
    // Get the current board name where the project is located
    const getCurrentBoardName = () => {
        if (!localIssueData?.id) return null
        
        // Check regular boards first
        for (const boardName in columns) {
            const board = columns[boardName]
            if (board.some(project => project.id === localIssueData.id)) {
                return boardName
            }
        }
        
        // Check finalized boards
        for (const boardName in finalizedColumns) {
            const board = finalizedColumns[boardName]
            if (board.some(project => project.id === localIssueData.id)) {
                return boardName
            }
        }
        return null
    }

    // Initialize local state when project data changes
    useEffect(() => {
        if (projectData && Object.keys(projectData).length > 0) {
            const convertedData = convertDateStringsToObjects(projectData)
            setLocalIssueData(convertedData)
            setLocalComments(convertedData.comments || [])
            setLocalAttachments(convertedData.attachments || [])
        }
    }, [projectData])

    // Convert date strings back to Date objects for UI components
    const convertDateStringsToObjects = (data) => {
        if (!data) return data
        
        const convertedData = { ...data }
        
        // Convert known date fields
        const dateFields = ['dueDate', 'entryDate', 'envioEscritura']
        dateFields.forEach(field => {
            if (convertedData[field] && typeof convertedData[field] === 'string') {
                convertedData[field] = new Date(convertedData[field])
            }
        })
        
        // Convert dynamic field configuration dates and merge with main data
        if (convertedData.fieldConfiguration) {
            try {
                const fieldConfig = JSON.parse(convertedData.fieldConfiguration)
                Object.keys(fieldConfig).forEach(key => {
                    // Don't convert dynamic fields to Date objects here - let the UI components handle it
                    // Just merge dynamic fields into the main data object for easy access
                    convertedData[key] = fieldConfig[key]
                })
            } catch (error) {
                console.log('Error parsing fieldConfiguration:', error)
            }
        }
        
        return convertedData
    }

    // Fetch fresh data from database when drawer opens
    useEffect(() => {
        if (isOpen && projectData?.id) {
            const fetchFreshData = async () => {
                try {
                    const response = await fetch(`/api/projects/registro-civil/${projectData.id}`)
                    if (response.ok) {
                        const freshData = await response.json()
                        const convertedData = convertDateStringsToObjects(freshData)
                        setLocalIssueData(convertedData)
                        setLocalComments(convertedData.comments || [])
                        setLocalAttachments(convertedData.attachments || [])
                    }
                } catch (error) {
                    console.error('Error fetching fresh project data:', error)
                }
            }
            
            fetchFreshData()
        }
    }, [isOpen, projectData?.id])

    // Sync title input value with local state (only when projectData changes)
    useEffect(() => {
        const titleValue = localIssueData?.name || localIssueData?.title || ''
        setTitleInputValue(titleValue)
        setOriginalTitleValue(titleValue)
    }, [projectData])

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


    // Format data for database storage - separate known fields from dynamic fields
    const formatDataForDatabase = (data) => {
        const knownFields = [
            'id', 'projectId', 'name', 'description', 'status', 'boardOrder',
            'members', 'labels', 'attachments', 'comments', 'activity',
            'dueDate', 'assignedTo', 'label', 'pendingItems', 'createdAt', 'updatedAt'
        ]
        
        const dbData = {}
        const fieldConfiguration = {}
        
        // Separate known fields from dynamic fields
        Object.keys(data).forEach(key => {
            if (knownFields.includes(key)) {
                dbData[key] = data[key]
            } else {
                // This is a dynamic field, add to fieldConfiguration
                fieldConfiguration[key] = data[key]
            }
        })
        
        // Add fieldConfiguration as JSON string
        dbData.fieldConfiguration = JSON.stringify(fieldConfiguration)
        
        return dbData
    }

    const saveToDatabase = async (updatedData) => {
        try {
            const formattedData = formatDataForDatabase(updatedData)
            const response = await fetch(`/api/projects/registro-civil/${localIssueData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData)
            })
            
            if (!response.ok) {
                throw new Error('Failed to save to database')
            }
        } catch (error) {
            console.error('Error saving to database:', error)
        }
    }

    // Handle text field change (for immediate UI updates only, no logging)
    const handleTextFieldChange = (fieldName, newValue) => {
        // Convert Date objects to strings for database storage
        const formatValueForStorage = (value) => {
            if (value instanceof Date) {
                return value.toISOString() // Store as ISO string for database
            }
            return value
        }
        
        const updatedData = { ...localIssueData, [fieldName]: formatValueForStorage(newValue) }
        
        // Update local state immediately for UI response
        setLocalIssueData(updatedData)
        
        // Update UI stores immediately
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
        
        // Debounce the save to prevent too many rapid saves
        if (window[`save${fieldName}Timeout`]) {
            clearTimeout(window[`save${fieldName}Timeout`]);
        }
        window[`save${fieldName}Timeout`] = setTimeout(() => {
            // Save to database
            saveToDatabase(updatedData)
        }, 500); // Wait 500ms before saving
    }

    // Handle field focus to store original value
    const handleFieldFocus = (fieldName) => {
        setFocusedField(fieldName)
        // Store the original value when field gets focus
        setOriginalFieldValues(prev => ({
            ...prev,
            [fieldName]: localIssueData[fieldName] || ''
        }))
    }

    // Handle field blur with logging (only when field loses focus and value changed)
    const handleFieldBlur = (fieldName, fieldLabel) => {
        setFocusedField(null)
        
        if (!localIssueData) return
        
        const oldValue = originalFieldValues[fieldName] || ''
        const newValue = localIssueData[fieldName] || ''
        
        // Only log if the value actually changed from the original
        if (oldValue !== newValue) {
            
            // Convert values for activity logging
            const formatValueForActivity = (value, fieldName) => {
                if (value instanceof Date) {
                    return dayjs(value).format('DD/MM/YYYY')
                }
                
                // Handle checkbox values
                if (typeof value === 'boolean' || value === 'true' || value === 'false') {
                    return value === true || value === 'true' ? 'Sim' : 'Não'
                }
                
                return value
            }
            
            // Convert Date objects to strings for database storage
            const formatValueForStorage = (value) => {
                if (value instanceof Date) {
                    return value.toISOString() // Store as ISO string for database
                }
                return value
            }
            
            // Add activity entry for field change
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                field: fieldLabel || fieldName,
                oldValue: formatValueForActivity(oldValue, fieldName),
                newValue: formatValueForActivity(newValue, fieldName) || 'vazio',
                projectId: localIssueData.projectId || localIssueData.id,
            }, currentUser)
            
            const updatedDataWithActivity = addActivityToProject(localIssueData, activityEntry)
            
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
            // Even if no change, still save the current state to database
            saveToDatabase(localIssueData)
        }
    }

    // Handle field change with logging (for non-text fields like dropdowns, checkboxes)
    const handleFieldChange = (fieldName, newValue, fieldLabel) => {
        if (!localIssueData) return
        
        const oldValue = localIssueData[fieldName] || ''
        
        // Convert Date objects to strings for database storage
        const formatValueForStorage = (value) => {
            if (value instanceof Date) {
                return value.toISOString() // Store as ISO string for database
            }
            return value
        }
        
        // Convert values for activity logging
        const formatValueForActivity = (value, fieldName) => {
            if (value instanceof Date) {
                return dayjs(value).format('DD/MM/YYYY')
            }
            
            // Handle checkbox values
            if (typeof value === 'boolean' || value === 'true' || value === 'false') {
                return value === true || value === 'true' ? 'Sim' : 'Não'
            }
            
            return value
        }
        
        const updatedData = { ...localIssueData, [fieldName]: formatValueForStorage(newValue) }
        
        // Add activity entry for field change
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            field: fieldLabel || fieldName,
            oldValue: formatValueForActivity(oldValue, fieldName),
            newValue: formatValueForActivity(newValue, fieldName),
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

    // Pendências functionality
    const addPendingItem = () => {
        if (newPendingItem.trim()) {
            const newItem = {
                id: createUID(10),
                text: newPendingItem.trim().toUpperCase(),
                completed: false,
                createdAt: new Date()
            }
            const currentPendingItems = localIssueData.pendingItems || []
            const updatedPendingItems = [...currentPendingItems, newItem]
            
            const updatedData = { ...localIssueData, pendingItems: updatedPendingItems }
            setLocalIssueData(updatedData)
            
            // Add activity entry for adding pending item
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.ADD_PENDING_ITEM, {
                projectId: updatedData.projectId || updatedData.id,
                text: newItem.text,
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(updatedData, activityEntry)
            
            // Save to database and update stores
            saveToAllViews(updatedDataWithActivity)
            
            setNewPendingItem('')
        }
    }

    const togglePendingItem = (itemId) => {
        const item = (localIssueData.pendingItems || []).find(item => item.id === itemId)
        const currentPendingItems = localIssueData.pendingItems || []
        const updatedPendingItems = currentPendingItems.map(item => 
            item.id === itemId 
                ? { ...item, completed: !item.completed }
                : item
        )
        
        const updatedData = { ...localIssueData, pendingItems: updatedPendingItems }
        setLocalIssueData(updatedData)
        
        // Add activity entry for toggling pending item
        if (item) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.TOGGLE_PENDING_ITEM, {
                projectId: updatedData.projectId || updatedData.id,
                text: item.text,
                completed: !item.completed,
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(updatedData, activityEntry)
            
            // Save to database and update stores
            saveToAllViews(updatedDataWithActivity)
        } else {
            // Save to database and update stores
            saveToAllViews(updatedData)
        }
    }

    const removePendingItem = (itemId) => {
        const item = (localIssueData.pendingItems || []).find(item => item.id === itemId)
        const currentPendingItems = localIssueData.pendingItems || []
        const updatedPendingItems = currentPendingItems.filter(item => item.id !== itemId)
        
        const updatedData = { ...localIssueData, pendingItems: updatedPendingItems }
        setLocalIssueData(updatedData)
        
        // Add activity entry for removing pending item
        if (item) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.REMOVE_PENDING_ITEM, {
                projectId: updatedData.projectId || updatedData.id,
                text: item.text,
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(updatedData, activityEntry)
            
            // Save to database and update stores
            saveToAllViews(updatedDataWithActivity)
        } else {
            // Save to database and update stores
            saveToAllViews(updatedData)
        }
    }

    const handlePendingKeyPress = (e) => {
        if (e.key === 'Enter') {
            addPendingItem()
        }
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
                const formattedData = formatDataForDatabase(updatedData)
                const response = await fetch(`/api/projects/registro-civil/${localIssueData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formattedData)
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
                const currentValue = titleInputValue.trim().toUpperCase()
                const originalValue = originalTitleValue.trim().toUpperCase()
                
                if (currentValue !== originalValue) {
                    handleTitleBlur(currentValue)
                }
            }
        }, 2000) // 2 seconds after user stops typing
        
        setTitleChangeTimeout(timeout)
    }

    const handleTitleFocus = () => {
        // Original value will be stored on first change in handleTitleChange
    }

    const handleTitleBlur = (value) => {
        setIsTitleFocused(false)
        
        if (!localIssueData) return
        
        const newValue = value.trim().toUpperCase()
        const oldValue = originalTitleValue.trim().toUpperCase()
        
        // Only log if there was an actual change
        if (oldValue !== newValue) {
            
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
            
            const updatedComments = [...(Array.isArray(localComments) ? localComments : []), newComment]
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
            const updatedComments = (Array.isArray(localComments) ? localComments : []).map(c =>
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
        const commentToRemove = (Array.isArray(localComments) ? localComments : []).find(c => c.id === commentId)
        const updatedComments = (Array.isArray(localComments) ? localComments : []).filter(c => c.id !== commentId)
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
            
            const updatedAttachments = [...(Array.isArray(localAttachments) ? localAttachments : []), ...newAttachments]
            setLocalAttachments(updatedAttachments)
            
            const newData = {
                ...localIssueData,
                attachments: updatedAttachments
            }
            
            // Add activity entry for adding files
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.ADD_FILES_TO_TICKET, {
                projectId: newData.projectId || newData.id,
                files: newAttachments,
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(newData, activityEntry)
            
            saveToAllViews(updatedDataWithActivity)
        }
    }

    const handleRemoveAttachment = (attachmentId) => {
        const attachmentToRemove = (Array.isArray(localAttachments) ? localAttachments : []).find(a => a.id === attachmentId)
        const updatedAttachments = (Array.isArray(localAttachments) ? localAttachments : []).filter(a => a.id !== attachmentId)
        setLocalAttachments(updatedAttachments)
        
        const newData = {
            ...localIssueData,
            attachments: updatedAttachments
        }
        
        // Add activity entry for removing attachment
        if (attachmentToRemove) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.ADD_FILES_TO_TICKET, {
                projectId: newData.projectId || newData.id,
                files: [attachmentToRemove],
                action: 'removed'
            }, currentUser)
            const updatedDataWithActivity = addActivityToProject(newData, activityEntry)
            
            saveToAllViews(updatedDataWithActivity)
        } else {
            saveToAllViews(newData)
        }
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
        const newMember = allUsers?.find((member) => member.id === memberId)
        
        if (newMember && localIssueData) {
            const oldMembers = Array.isArray(localIssueData.members) 
                ? localIssueData.members 
                : (typeof localIssueData.members === 'string' 
                    ? JSON.parse(localIssueData.members || '[]') 
                    : [])
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
                    const formattedData = formatDataForDatabase(updatedIssueData)
                    
                    const response = await fetch(`/api/projects/registro-civil/${localIssueData.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formattedData)
                    })
                    
                    if (!response.ok) {
                        const errorText = await response.text()
                        console.error('API Error Response:', response.status, errorText)
                        throw new Error(`Failed to save to database: ${response.status} - ${errorText}`)
                    }
                    
                } catch (error) {
                    console.error('Error saving atendente to database:', error)
                }
            }, 500)
        }
    }

    const onRemoveMemberClick = async (memberToRemove) => {
        if (localIssueData) {
            const oldMembers = Array.isArray(localIssueData.members) 
                ? localIssueData.members 
                : (typeof localIssueData.members === 'string' 
                    ? JSON.parse(localIssueData.members || '[]') 
                    : [])
            const newMembers = oldMembers.filter(member => member.id !== memberToRemove.id)
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
                    const formattedData = formatDataForDatabase(updatedIssueData)
                    
                    const response = await fetch(`/api/projects/registro-civil/${localIssueData.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formattedData)
                    })
                    
                    if (!response.ok) {
                        const errorText = await response.text()
                        console.error('API Error Response:', response.status, errorText)
                        throw new Error(`Failed to save to database: ${response.status} - ${errorText}`)
                    }
                    
                } catch (error) {
                    console.error('Error saving atendente to database:', error)
                }
            }, 500)
        }
    }

    // Handle project completion
    const handleCompleteProject = async () => {
        if (!localIssueData?.id) return
        
        try {
            // Add activity entry for project completion
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.PROJECT_COMPLETED, {
                projectId: localIssueData.projectId || localIssueData.id,
            }, currentUserWithImage)
            const updatedDataWithActivity = addActivityToProject(localIssueData, activityEntry)
            
            // Update status and completedAt for the project
            const projectWithStatus = {
                ...updatedDataWithActivity,
                status: 'Concluídas',
                completedAt: new Date().toISOString()
            }
            
            // Save full project data to database first
            await saveToDatabase(projectWithStatus)
            
            // Then move project to "Concluídas" board in UI
            moveProjectToFinalized(projectWithStatus, 'Concluídas')
            
            // Update local state
            setLocalIssueData(projectWithStatus)
            
        } catch (error) {
            console.error('Error completing project:', error)
        }
    }

    // Handle project cancellation
    const handleCancelProject = async () => {
        if (!localIssueData?.id) return
        
        try {
            // Add activity entry for project cancellation
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.PROJECT_CANCELLED, {
                projectId: localIssueData.projectId || localIssueData.id,
            }, currentUserWithImage)
            const updatedDataWithActivity = addActivityToProject(localIssueData, activityEntry)
            
            // Update status for the project
            const projectWithStatus = {
                ...updatedDataWithActivity,
                status: 'Canceladas',
                completedAt: new Date().toISOString()
            }
            
            // Save full project data to database first
            await saveToDatabase(projectWithStatus)
            
            // Then move project to "Canceladas" board in UI
            moveProjectToFinalized(projectWithStatus, 'Canceladas')
            
            // Update local state
            setLocalIssueData(projectWithStatus)
            
        } catch (error) {
            console.error('Error cancelling project:', error)
        }
    }

    // Handle project restoration
    const handleRestoreProject = async () => {
        if (!localIssueData?.id) return
        
        try {
            // Add activity entry for project restoration
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.PROJECT_RESTORED, {
                projectId: localIssueData.projectId || localIssueData.id,
            }, currentUserWithImage)
            const updatedDataWithActivity = addActivityToProject(localIssueData, activityEntry)
            
            // Get the first regular board name
            const firstRegularBoard = Object.keys(columns)[0]
            if (firstRegularBoard) {
                // Update status and remove completedAt for the project
                const projectWithStatus = {
                    ...updatedDataWithActivity,
                    status: firstRegularBoard,
                    completedAt: null
                }
                
                // Save full project data to database first
                await saveToDatabase(projectWithStatus)
                
                // Then move project back to first regular board in UI
                moveProjectToRegular(projectWithStatus, firstRegularBoard)
                
                // Update local state
                setLocalIssueData(projectWithStatus)
            }
            
        } catch (error) {
            console.error('Error restoring project:', error)
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
                
                /* Remove DatePicker default styling */
                .project-details-drawer .date-picker-container,
                .project-details-drawer .date-picker-container *,
                .project-details-drawer .date-picker-container input,
                .project-details-drawer .date-picker-container .date-picker-input,
                .project-details-drawer .date-picker-container .react-datepicker-wrapper,
                .project-details-drawer .date-picker-container .react-datepicker__input-container,
                .project-details-drawer .date-picker-container .react-datepicker__input-container input {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    outline: none !important;
                    background-color: transparent !important;
                }
                
                /* Target any div with background that might be from DatePicker */
                .project-details-drawer .date-picker-container > div {
                    background: transparent !important;
                    background-color: transparent !important;
                }
                
                /* Date field text styling to match other fields */
                .project-details-drawer .date-field-text {
                    color: #6b7280 !important; /* gray-500 */
                    font-weight: 600 !important; /* semibold to match other fields */
                }
                
                .dark .project-details-drawer .date-field-text {
                    color: #9ca3af !important; /* gray-400 for dark mode */
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
                    <div className="flex justify-end gap-2 w-full">
                        {isProjectFinalized() ? (
                            <Button 
                                size="sm" 
                                variant="solid"
                                onClick={handleRestoreProject}
                                className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
                            >
                                Restaurar
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    size="sm" 
                                    onClick={handleCompleteProject}
                                    className="bg-green-500 hover:bg-green-600 text-white hover:text-white"
                                >
                                    Concluir
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleCancelProject}
                                    className="bg-red-500 hover:bg-red-600 text-white hover:text-white"
                                >
                                    Cancelar
                                </Button>
                            </>
                        )}
                        <Button 
                            size="sm" 
                            variant="solid"
                            onClick={onClose}
                            className="bg-gray-800 hover:bg-gray-900 text-white hover:text-white"
                        >
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
                                    {/* Dynamic Fields - Two Column Grid */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {/* Left Column - Atendente + 7 dynamic fields (8 total) */}
                                        <div className="flex flex-col">
                                            {/* Atendente field - First field in left column */}
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
                                                            users={Array.isArray(localIssueData.members) 
                                                                ? localIssueData.members 
                                                                : (typeof localIssueData.members === 'string' 
                                                                    ? JSON.parse(localIssueData.members || '[]') 
                                                                    : [])}
                                                            onAvatarClick={onRemoveMemberClick}
                                                        />
                                                        <Dropdown
                                                            renderTitle={
                                                                <Button
                                                                    icon={<TbPlus />}
                                                                    customColorClass={() =>
                                                                        'border-2 border-dashed hover:ring-0 h-[30px] w-[30px] text-sm'
                                                                    }
                                                                    size="sm"
                                                                    shape="circle"
                                                                    type="button"
                                                                />
                                                            }
                                                            placement="bottom"
                                                        >
                                                            {(allUsers || []).map((member) => {
                                                                const members = Array.isArray(localIssueData.members) 
                                                                    ? localIssueData.members 
                                                                    : (typeof localIssueData.members === 'string' 
                                                                        ? JSON.parse(localIssueData.members || '[]') 
                                                                        : [])
                                                                const isSelected = members.some((m) => m.id === member.id)
                                                                return (
                                                                    <Dropdown.Item
                                                                        key={member.id}
                                                                        eventKey={member.id}
                                                                        onSelect={() => {
                                                                            if (isSelected) {
                                                                                onRemoveMemberClick(member)
                                                                            } else {
                                                                                onAddMemberClick(member.id)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center">
                                                                            <Avatar
                                                                                shape="circle"
                                                                                size={22}
                                                                                src={member.img}
                                                                            />
                                                                            <span className="ml-2 rtl:mr-2">
                                                                                {member.name}
                                                                            </span>
                                                                            {isSelected && (
                                                                                <span className="ml-auto text-green-500">✓</span>
                                                                            )}
                                                                        </div>
                                                                    </Dropdown.Item>
                                                                )
                                                            })}
                                                        </Dropdown>
                                                    </div>
                                                </IssueField>
                                            </div>

                                            {/* 7 more dynamic fields */}
                                            {activeFields.slice(0, 7).map((field) => {
                                        const fieldValue = localIssueData[field.fieldName] || ''
                                        
                                        
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
                                                                    handleTextFieldChange(field.fieldName, value)
                                                                }}
                                                                onFocus={() => handleFieldFocus(field.fieldName)}
                                                                onBlur={() => handleFieldBlur(field.fieldName, field.nome)}
                                                            />
                                                        </div>
                                                    )
                                                
                                                case 'date':
                                                    return (
                                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                            focusedField === field.fieldName ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}>
                                                            <span className="font-semibold pointer-events-none date-field-text">
                                                                {fieldValue ? dayjs(fieldValue).format('DD/MM/YYYY') : ''}
                                                            </span>
                                                            <DatePicker
                                                                value={fieldValue ? new Date(fieldValue) : null}
                                                                onChange={(date) => {
                                                                    handleFieldChange(field.fieldName, date, field.nome)
                                                                }}
                                                                onFocus={() => handleFieldFocus(field.fieldName)}
                                                                onBlur={() => handleFieldBlur(field.fieldName, field.nome)}
                                                                inputFormat="DD/MM/YYYY"
                                                                className="date-picker-container absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 focus:outline-none opacity-0"
                                                                inputClassName="bg-transparent border-none focus:ring-0 focus:outline-none shadow-none opacity-0"
                                                                style={{ caretColor: 'transparent' }}
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
                                                                        onSelect={() => handleFieldChange(field.fieldName, option.value, field.nome)}
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
                                                                    handleFieldChange(field.fieldName, checked, field.nome)
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
                                                                    handleTextFieldChange(field.fieldName, value)
                                                                }}
                                                                onFocus={() => handleFieldFocus(field.fieldName)}
                                                                onBlur={() => handleFieldBlur(field.fieldName, field.nome)}
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

                                        {/* Right Column - Dynamic fields 8 and onwards */}
                                        <div className="flex flex-col">
                                            {activeFields.slice(7).map((field) => {
                                                const fieldValue = localIssueData[field.fieldName] || ''
                                                
                                                
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
                                                                            handleTextFieldChange(field.fieldName, value)
                                                                        }}
                                                                        onFocus={() => handleFieldFocus(field.fieldName)}
                                                                        onBlur={() => handleFieldBlur(field.fieldName, field.nome)}
                                                                    />
                                                                </div>
                                                            )
                                                        
                                                        case 'date':
                                                            return (
                                                                <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                                    focusedField === field.fieldName ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                }`}>
                                                                    <span className="font-semibold pointer-events-none date-field-text">
                                                                        {fieldValue ? dayjs(fieldValue).format('DD/MM/YYYY') : ''}
                                                                    </span>
                                                                    <DatePicker
                                                                        value={fieldValue ? new Date(fieldValue) : null}
                                                                        onChange={(date) => {
                                                                            handleFieldChange(field.fieldName, date, field.nome)
                                                                        }}
                                                                        onFocus={() => handleFieldFocus(field.fieldName)}
                                                                        onBlur={() => handleFieldBlur(field.fieldName, field.nome)}
                                                                        inputFormat="DD/MM/YYYY"
                                                                        className="date-picker-container absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 focus:outline-none opacity-0"
                                                                        inputClassName="bg-transparent border-none focus:ring-0 focus:outline-none shadow-none opacity-0"
                                                                        style={{ caretColor: 'transparent' }}
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
                                                                                onSelect={() => handleFieldChange(field.fieldName, option.value, field.nome)}
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
                                                                            handleFieldChange(field.fieldName, checked, field.nome)
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
                                                                            handleTextFieldChange(field.fieldName, value)
                                                                        }}
                                                                        onFocus={() => handleFieldFocus(field.fieldName)}
                                                                        onBlur={() => handleFieldBlur(field.fieldName, field.nome)}
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
                                            
                                            {/* Pendências Field - Last field in the second column */}
                                            <div className="mb-1">
                                                <div className="flex items-start">
                                                    <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] max-w-[150px]">
                                                        <span className="text-lg flex-shrink-0"><TbCircleCheck /></span>
                                                        <span className="break-words">Pendências:</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="text"
                                                                placeholder=""
                                                                value={newPendingItem}
                                                                onChange={(e) => setNewPendingItem(e.target.value.toUpperCase())}
                                                                onKeyPress={handlePendingKeyPress}
                                                                className="w-[295px]"
                                                                style={{ textTransform: 'uppercase' }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="solid"
                                                                onClick={addPendingItem}
                                                                disabled={!newPendingItem.trim()}
                                                            >
                                                                Adicionar
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Pending items list */}
                                                        {(() => {
                                                            const pendingItems = Array.isArray(localIssueData.pendingItems) 
                                                                ? localIssueData.pendingItems 
                                                                : (typeof localIssueData.pendingItems === 'string' 
                                                                    ? JSON.parse(localIssueData.pendingItems || '[]') 
                                                                    : [])
                                                            return (pendingItems && pendingItems.length > 0) && (
                                                                <div className="flex flex-col gap-2 mt-2">
                                                                    {pendingItems.map((item) => (
                                                                    <div key={item.id} className="flex items-center gap-2 group">
                                                                        <button
                                                                            className="text-2xl cursor-pointer"
                                                                            onClick={() => togglePendingItem(item.id)}
                                                                        >
                                                                            {item.completed ? (
                                                                                <TbCircleCheckFilled className="text-primary" />
                                                                            ) : (
                                                                                <TbCircleCheck className="hover:text-primary" />
                                                                            )}
                                                                        </button>
                                                                        <span
                                                                            className={`flex-1 max-w-[400px] ${
                                                                                item.completed 
                                                                                    ? 'line-through opacity-50 text-gray-500' 
                                                                                    : 'text-gray-900 dark:text-gray-100'
                                                                            }`}
                                                                        >
                                                                            {item.text}
                                                                        </span>
                                                                        <button
                                                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                                                            onClick={() => removePendingItem(item.id)}
                                                                        >
                                                                            <TbX />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                                
                                {/* Issue Footer */}
                                <div className="mt-0.01 flex-1 flex flex-col">
                                    <Tabs className="mt-2 flex-1 flex flex-col" defaultValue="comments">
                                        <Tabs.TabList>
                                            <Tabs.TabNav value="comments">Comentários</Tabs.TabNav>
                                            <Tabs.TabNav value="attachments">Anexos</Tabs.TabNav>
                                        </Tabs.TabList>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <Tabs.TabContent value="comments" className="flex-1 flex flex-col">
                                                <div className="w-full">
                                                    {localComments && Array.isArray(localComments) && localComments.length > 0 && (
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
                                                {(localAttachments && Array.isArray(localAttachments) && localAttachments.length > 0) ? (
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
                                                    <div className="flex flex-col gap-2 items-center justify-center">
                                                        <NoMedia height={150} width={150} />
                                                        <p className="font-semibold">Sem anexos</p>
                                                    </div>
                                                )}
                                                <div className="mt-4 flex justify-center">
                                                    <Button
                                                        icon={<TbPlus />}
                                                        onClick={handleAddAttachment}
                                                        variant="solid"
                                                        size="sm"
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
                                        {(() => {
                                            const activity = Array.isArray(localIssueData.activity) 
                                                ? localIssueData.activity 
                                                : (typeof localIssueData.activity === 'string' 
                                                    ? JSON.parse(localIssueData.activity || '[]') 
                                                    : [])
                                            return isEmpty(activity) ? (
                                                <Timeline.Item>No Activities</Timeline.Item>
                                            ) : (
                                                activity.map((event, index) => (
                                                <Timeline.Item
                                                    key={event.type + index}
                                                    media={<ActivityAvatar data={event} />}
                                                >
                                                    <div className="mt-1">
                                                        <ActivityEvent compact data={event} />
                                                    </div>
                                                </Timeline.Item>
                                            ))
                                            )
                                        })()}
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

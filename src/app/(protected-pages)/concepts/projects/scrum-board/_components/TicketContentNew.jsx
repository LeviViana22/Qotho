'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useTasksStore } from '../../tasks/_store/tasksStore'
import { useProjectStore } from '../../_store/projectStore'
import { useFieldConfigStore } from '../_store/fieldConfigStore'
import { useScrumBoardUsers } from '../_hooks/useScrumBoardUsers'
import useUserStore from '@/stores/userStore'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import Checkbox from '@/components/ui/Checkbox'
import Radio from '@/components/ui/Radio'
import Switcher from '@/components/ui/Switcher'
import TimeInput from '@/components/ui/TimeInput'
import Dropdown from '@/components/ui/Dropdown'
import CloseButton from '@/components/ui/CloseButton'
import Tag from '@/components/ui/Tag'
import Tabs from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import ScrollBar from '@/components/ui/ScrollBar'
import NoMedia from '@/assets/svg/NoMedia'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import dayjs from 'dayjs'
import cloneDeep from 'lodash/cloneDeep'
import { TbPlus, TbX, TbDownload, TbTrash, TbCircleCheck, TbCircleCheckFilled, TbExternalLink, TbArrowRight, TbEdit, TbCheck } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { createActivityEntry, addActivityToProject, ACTIVITY_TYPES } from '@/utils/activityUtils'
import { useStoredUserImages } from '@/hooks/useStoredUserImages'

import isEmpty from 'lodash/isEmpty'
import { createUID, taskLabelColors, labelList } from '../utils'
import { createDynamicColorMappings } from '../utils/boardColors'

// Configure dayjs for Portuguese locale
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const { TabNav, TabList, TabContent } = Tabs

const tipoOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'DIVERSAS', label: 'DIVERSAS' },
]

const custasOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'CLIENTE', label: 'CLIENTE' },
]

const createCommentObject = (message, currentUser) => {
    return {
        id: createUID(10),
        name: currentUser?.name || 'Usuário',
        src: currentUser?.img || '',
        message: message,
        date: new Date(),
    }
}

const createAttachmentObject = (file) => {
    return {
        id: createUID(10),
        name: file.name,
        size: `${Math.round(file.size / 1000)} kb`,
        src: URL.createObjectURL(file),
        file: file,
    }
}

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

const SmartField = ({ fieldName, label, value, type = 'text', options = [], isDate = false, isBoolean = false, 
                    editingField, editValues, setEditValues, saveEdit, cancelEdit }) => {
    const isEditMode = editingField === fieldName || editingField === 'all'
    const hasValue = value && (typeof value === 'string' ? value.trim() !== '' : value !== null && value !== undefined)
    const inputRef = useRef(null)
    
    // Create a stable onChange handler
    const handleInputChange = useCallback((e) => {
        const newValue = e.target.value
        setEditValues(prev => {
            const updated = { ...prev, [fieldName]: newValue }
            return updated
        })
    }, [fieldName, setEditValues])

    useEffect(() => {
        if (isEditMode && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditMode])

    if (isEditMode) {
        return (
            <div className="flex items-center min-h-[30px]">
                <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[200px]">
                    {label}:
                </div>
                <div className="flex items-center gap-2">
                    {type === 'select' ? (
                        <Select
                            options={options}
                            clearable={true}
                            placeholder=""
                            className="min-w-[150px]"
                            value={options.find(option => option.value === editValues[fieldName])}
                            onChange={(option) => {
                                setEditValues(prev => ({ ...prev, [fieldName]: option ? option.value : '' }))
                            }}
                        />
                    ) : isDate ? (
                        <DatePicker
                            className="w-[150px]"
                            value={editValues[fieldName] ? new Date(editValues[fieldName]) : null}
                            onChange={(date) => {
                                setEditValues(prev => ({ ...prev, [fieldName]: date ? date.toISOString() : '' }))
                            }}
                        />
                    ) : isBoolean ? (
                        <div className="flex items-center gap-2">
                            <Radio
                                checked={editValues[fieldName] === true}
                                onChange={() => setEditValues(prev => ({ ...prev, [fieldName]: true }))}
                            />
                            <span>Sim</span>
                            <Radio
                                checked={editValues[fieldName] === false}
                                onChange={() => setEditValues(prev => ({ ...prev, [fieldName]: false }))}
                            />
                            <span>Não</span>
                        </div>
                    ) : (
                        <Input
                            ref={inputRef}
                            className="min-w-[150px]"
                            value={editValues[fieldName] || ''}
                            onChange={handleInputChange}
                        />
                    )}
                    <Button
                        size="sm"
                        icon={<TbCheck />}
                        onClick={saveEdit}
                        className="mr-1"
                    />
                    <Button
                        size="sm"
                        icon={<TbX />}
                        onClick={cancelEdit}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center min-h-[30px]">
            <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[200px]">
                {label}:
            </div>
            <div className="flex items-center gap-2">
                <span>
                    {isBoolean ? (value ? 'Sim' : 'Não') : 
                     isDate && value ? dayjs(value).format('DD/MM/YYYY') : 
                     (typeof value === 'string' ? value.toUpperCase() : value) || '-'}
                </span>
            </div>
        </div>
    )
}

const TicketContent = ({ onTicketClose, tasksUpdateColumns, scrumBoardUpdateColumns }) => {
    const router = useRouter()
    const scrumBoardStore = useScrumBoardStore()
    const tasksStore = useTasksStore()
    const { updateProjectInScrumBoard } = useProjectStore()
    const { fieldConfigs, loadFieldConfigs } = useFieldConfigStore()
    const { scrumBoardUsers, loadScrumBoardUsers } = useScrumBoardUsers()
    const { user } = useUserStore()
    const { storedUserImages } = useStoredUserImages()

    // State
    const [loading, setLoading] = useState(false)
    const [ticketData, setTicketData] = useState(null)
    const [titleInputValue, setTitleInputValue] = useState('')
    const [editingField, setEditingField] = useState(null)
    const [editValues, setEditValues] = useState({})
    const [focusedField, setFocusedField] = useState(null)
    const [newComment, setNewComment] = useState('')
    const [editingComment, setEditingComment] = useState(null)
    const [editingCommentText, setEditingCommentText] = useState('')
    const [newPendingItem, setNewPendingItem] = useState('')
    const [localComments, setLocalComments] = useState([])
    const [isUpdating, setIsUpdating] = useState(false)

    // Refs
    const fileInputRef = useRef(null)

    // Get current ticket data from store
    const { selectedTicket, selectedBoard } = scrumBoardStore
    const currentBoard = selectedBoard
    const ticketId = selectedTicket?.id

    // Load field configurations on mount
    useEffect(() => {
        loadFieldConfigs()
        loadScrumBoardUsers()
    }, [loadFieldConfigs, loadScrumBoardUsers])

    // Load ticket data when component mounts or ticket changes
    useEffect(() => {
        if (ticketId) {
            getTicketDetail()
        }
    }, [ticketId])

    // Get ticket detail from database
    const getTicketDetail = async () => {
        if (!ticketId || isUpdating) return
        
        setLoading(true)
        try {
            const response = await fetch(`/api/projects/${ticketId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch project')
            }
            
            const project = await response.json()
            setTicketData(project)
            setTitleInputValue(project.name || '')
            setLocalComments(project.comments || [])
            
            console.log('Project loaded from database:', project)
        } catch (error) {
            console.error('Error loading project:', error)
        } finally {
            setLoading(false)
        }
    }

    // Save project to database
    const saveProjectToDatabase = async (updatedData, activityEntry = null) => {
        if (!ticketId) return

        try {
            const response = await fetch(`/api/projects/${ticketId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            })
            
            if (!response.ok) {
                throw new Error('Failed to save project to database')
            }
            
            console.log('Project saved to database successfully')
            
            // Update local state
            setTicketData(updatedData)
            
            // Update Zustand store
            const currentState = useScrumBoardStore.getState()
            const currentScrumboardData = { ...currentState.columns }
            
            // Find and update the project in the current data
            for (const boardName in currentScrumboardData) {
                const board = currentScrumboardData[boardName]
                const projectIndex = board.findIndex(p => p.id === ticketId || p.projectId === ticketId)
                if (projectIndex !== -1) {
                    currentScrumboardData[boardName][projectIndex] = updatedData
                    break
                }
            }
            
            scrumBoardUpdateColumns(currentScrumboardData)
            
        } catch (error) {
            console.error('Error saving project to database:', error)
        }
    }

    // Handle title change
    const handleTitleChange = async (value) => {
        if (!ticketId || !value.trim()) return

        const oldValue = ticketData?.name || 'vazio'
        const newValue = value.trim().toUpperCase()
        
        if (oldValue === newValue) return

        const updatedData = {
            ...ticketData,
            name: newValue
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.FIELD_UPDATED,
            `Nome do projeto alterado de "${oldValue}" para "${newValue}"`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
    }

    // Handle external link click
    const handleExternalLinkClick = () => {
        if (ticketData?.projectId) {
            router.push(`/concepts/projects/${ticketData.projectId}`)
        }
    }

    // Handle member addition
    const onAddMemberClick = async (id) => {
        if (!ticketId) return

        const memberToAdd = scrumBoardUsers.find(user => user.id === id)
        if (!memberToAdd) return

        const currentMembers = ticketData?.members || []
        if (currentMembers.some(member => member.id === id)) return

        const newMember = {
            id: memberToAdd.id,
            name: memberToAdd.name,
            src: memberToAdd.img || ''
        }

        const updatedData = {
            ...ticketData,
            members: [...currentMembers, newMember]
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.MEMBER_ADDED,
            `Membro "${memberToAdd.name}" adicionado ao projeto`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
    }

    // Handle member removal
    const onRemoveMemberClick = async (memberToRemove) => {
        if (!ticketId) return

        const currentMembers = ticketData?.members || []
        const updatedMembers = currentMembers.filter(member => member.id !== memberToRemove.id)

        const updatedData = {
            ...ticketData,
            members: updatedMembers
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.MEMBER_REMOVED,
            `Membro "${memberToRemove.name}" removido do projeto`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
    }

    // Handle file attachment
    const handleAddAttachment = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files)
        if (files.length === 0) return

        const newAttachments = files.map(file => createAttachmentObject(file))
        const currentAttachments = ticketData?.attachments || []

        const updatedData = {
            ...ticketData,
            attachments: [...currentAttachments, ...newAttachments]
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.ATTACHMENT_ADDED,
            `${files.length} anexo(s) adicionado(s)`,
            user
        )

        saveProjectToDatabase(updatedData, activityEntry)
    }

    const handleRemoveAttachment = (attachmentId) => {
        const currentAttachments = ticketData?.attachments || []
        const attachmentToRemove = currentAttachments.find(att => att.id === attachmentId)
        
        if (!attachmentToRemove) return

        const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId)
        const updatedData = {
            ...ticketData,
            attachments: updatedAttachments
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.ATTACHMENT_REMOVED,
            `Anexo "${attachmentToRemove.name}" removido`,
            user
        )

        saveProjectToDatabase(updatedData, activityEntry)
    }

    const handleDownloadAttachment = (attachment) => {
        const link = document.createElement('a')
        link.href = attachment.src
        link.download = attachment.name
        link.click()
    }

    // Handle comment submission
    const submitComment = () => {
        if (!newComment.trim() || !ticketId) return

        const comment = createCommentObject(newComment, user)
        const currentComments = ticketData?.comments || []

        const updatedData = {
            ...ticketData,
            comments: [...currentComments, comment]
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.COMMENT_ADDED,
            `Comentário adicionado: "${newComment}"`,
            user
        )

        saveProjectToDatabase(updatedData, activityEntry)
        setNewComment('')
    }

    // Handle comment editing
    const handleEditComment = (commentId, currentText) => {
        setEditingComment(commentId)
        setEditingCommentText(currentText)
    }

    const handleSaveEdit = () => {
        if (!editingComment || !editingCommentText.trim()) return

        const currentComments = ticketData?.comments || []
        const updatedComments = currentComments.map(comment => 
            comment.id === editingComment 
                ? { ...comment, message: editingCommentText.trim() }
                : comment
        )

        const updatedData = {
            ...ticketData,
            comments: updatedComments
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.COMMENT_UPDATED,
            `Comentário editado`,
            user
        )

        saveProjectToDatabase(updatedData, activityEntry)
        setEditingComment(null)
        setEditingCommentText('')
    }

    const handleCancelEdit = () => {
        setEditingComment(null)
        setEditingCommentText('')
    }

    const handleRemoveComment = (commentId) => {
        const currentComments = ticketData?.comments || []
        const commentToRemove = currentComments.find(comment => comment.id === commentId)
        
        if (!commentToRemove) return

        const updatedComments = currentComments.filter(comment => comment.id !== commentId)
        const updatedData = {
            ...ticketData,
            comments: updatedComments
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.COMMENT_REMOVED,
            `Comentário removido`,
            user
        )

        saveProjectToDatabase(updatedData, activityEntry)
    }

    // Handle field editing
    const startEditing = (fieldName, currentValue) => {
        setEditingField(fieldName)
        setEditValues({ [fieldName]: currentValue || '' })
    }

    const saveEdit = async () => {
        if (!editingField || !ticketId) return

        const fieldName = editingField
        const newValue = editValues[fieldName]
        const oldValue = ticketData?.[fieldName] || 'vazio'

        if (oldValue === newValue) {
            setEditingField(null)
            setEditValues({})
            return
        }

        const updatedData = {
            ...ticketData,
            [fieldName]: newValue
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.FIELD_UPDATED,
            `Campo "${fieldName}" alterado de "${oldValue}" para "${newValue}"`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
        setEditingField(null)
        setEditValues({})
    }

    const cancelEdit = () => {
        setEditingField(null)
        setEditValues({})
    }

    // Handle pending items
    const addPendingItem = async () => {
        if (!newPendingItem.trim() || !ticketId) return

        const newItem = {
            id: createUID(10),
            text: newPendingItem.trim(),
            completed: false
        }

        const currentPendingItems = ticketData?.pendingItems || []
        const updatedData = {
            ...ticketData,
            pendingItems: [...currentPendingItems, newItem]
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.PENDING_ITEM_ADDED,
            `Item de pendência adicionado: "${newPendingItem}"`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
        setNewPendingItem('')
    }

    const togglePendingItem = async (itemId) => {
        const currentPendingItems = ticketData?.pendingItems || []
        const item = currentPendingItems.find(item => item.id === itemId)
        if (!item) return

        const updatedItems = currentPendingItems.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
        )

        const updatedData = {
            ...ticketData,
            pendingItems: updatedItems
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.PENDING_ITEM_UPDATED,
            `Item de pendência "${item.text}" ${item.completed ? 'desmarcado' : 'marcado'}`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
    }

    const removePendingItem = async (itemId) => {
        const currentPendingItems = ticketData?.pendingItems || []
        const item = currentPendingItems.find(item => item.id === itemId)
        if (!item) return

        const updatedItems = currentPendingItems.filter(item => item.id !== itemId)
        const updatedData = {
            ...ticketData,
            pendingItems: updatedItems
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.PENDING_ITEM_REMOVED,
            `Item de pendência "${item.text}" removido`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
    }

    const handlePendingKeyPress = (e) => {
        if (e.key === 'Enter') {
            addPendingItem()
        }
    }

    // Handle ticket movement
    const moveTicketToBoard = async (targetBoard) => {
        if (!ticketId || !targetBoard) return

        const updatedData = {
            ...ticketData,
            status: targetBoard
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.STATUS_CHANGED,
            `Projeto movido para "${targetBoard}"`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
        
        // Update store
        scrumBoardStore.setSelectedBoard(targetBoard)
    }

    // Handle ticket cancellation
    const handleCancelTicket = async () => {
        if (!ticketId) return

        const updatedData = {
            ...ticketData,
            status: 'Canceladas',
            completedAt: new Date().toISOString()
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.STATUS_CHANGED,
            `Projeto cancelado`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
        scrumBoardStore.setSelectedBoard('Canceladas')
    }

    // Handle ticket conclusion
    const handleConcludeTicket = async () => {
        if (!ticketId) return

        const updatedData = {
            ...ticketData,
            status: 'Concluídas',
            completedAt: new Date().toISOString()
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.STATUS_CHANGED,
            `Projeto concluído`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
        scrumBoardStore.setSelectedBoard('Concluídas')
    }

    // Handle ticket restoration
    const handleRestoreTicket = async () => {
        if (!ticketId) return

        const updatedData = {
            ...ticketData,
            status: 'Triagem de Documentos',
            completedAt: null
        }

        // Create activity entry
        const activityEntry = createActivityEntry(
            ACTIVITY_TYPES.STATUS_CHANGED,
            `Projeto restaurado para "Triagem de Documentos"`,
            user
        )

        await saveProjectToDatabase(updatedData, activityEntry)
        scrumBoardStore.setSelectedBoard('Triagem de Documentos')
    }

    // Handle ticket close
    const handleTicketClose = () => {
        onTicketClose?.()
    }

    // Get board order for movement
    const { ordered } = scrumBoardStore
    const currentBoardIndex = currentBoard ? ordered.indexOf(currentBoard) : -1
    const canMoveTicketNext = currentBoardIndex < ordered.length - 1

    // Render project field based on field configuration
    const renderProjectField = (fieldConfig) => {
        const fieldName = fieldConfig.name
        const fieldValue = ticketData?.[fieldName] || ''
        const fieldType = fieldConfig.type
        const fieldOptions = fieldConfig.options || []

        // Handle different field types
        if (fieldType === 'text' || fieldType === 'textarea') {
            return (
                <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700" style={{ width: '295px' }}>
                    <span className="font-semibold pointer-events-none">
                        {fieldValue}
                    </span>
                    <Input
                        className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                        style={{ caretColor: 'black', textTransform: 'uppercase' }}
                        value={fieldValue}
                        onChange={(e) => {
                            const value = e.target.value.toUpperCase()
                            const newTicketData = { ...ticketData, [fieldName]: value }
                            setTicketData(newTicketData)
                        }}
                        onFocus={(e) => {
                            e.target.select()
                            setFocusedField(fieldName)
                        }}
                        onBlur={() => {
                            setFocusedField(null)
                            if (fieldValue !== ticketData?.[fieldName]) {
                                saveProjectToDatabase({ ...ticketData, [fieldName]: fieldValue })
                            }
                        }}
                    />
                </div>
            )
        }

        if (fieldType === 'number') {
            return (
                <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700" style={{ width: '295px' }}>
                    <span className="font-semibold pointer-events-none">
                        {fieldValue}
                    </span>
                    <Input
                        className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                        style={{ caretColor: 'black' }}
                        value={fieldValue}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '')
                            const newTicketData = { ...ticketData, [fieldName]: value }
                            setTicketData(newTicketData)
                        }}
                        onFocus={(e) => {
                            e.target.select()
                            setFocusedField(fieldName)
                        }}
                        onBlur={() => {
                            setFocusedField(null)
                            if (fieldValue !== ticketData?.[fieldName]) {
                                saveProjectToDatabase({ ...ticketData, [fieldName]: fieldValue })
                            }
                        }}
                    />
                </div>
            )
        }

        if (fieldType === 'date') {
            return (
                <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700" style={{ width: '295px' }}>
                    <span className="font-semibold">
                        {fieldValue ? 
                            dayjs(fieldValue).format('DD/MM/YYYY') : 
                            ''
                        }
                    </span>
                    <DatePicker
                        className="opacity-0 cursor-pointer absolute"
                        value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                        inputtable={false}
                        inputPrefix={null}
                        inputSuffix={null}
                        clearable={false}
                        onChange={(date) => {
                            const newTicketData = { ...ticketData, [fieldName]: date.toISOString() }
                            setTicketData(newTicketData)
                            saveProjectToDatabase(newTicketData)
                        }}
                    />
                </div>
            )
        }

        if (fieldType === 'select') {
            return (
                <div className="w-[295px]">
                    <Dropdown
                        className="w-full"
                        placement="bottom-start"
                        onFocus={() => setFocusedField(fieldName)}
                        onBlur={() => setFocusedField(null)}
                        toggleClassName="hover:bg-gray-100 dark:hover:bg-gray-700 flex px-3 focus:bg-gray-100 cursor-pointer rounded-xl min-h-[46px]"
                        renderTitle={
                            <div className="inline-flex items-center gap-1">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    fieldValue === 'ALPHA' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                                    fieldValue === 'DIVERSAS' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                    'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                    {fieldValue || 'Selecionar'}
                                </span>
                            </div>
                        }
                        renderToggle={
                            <div className="flex items-center gap-1">
                                <span className="font-semibold">
                                    {fieldValue || 'Selecionar'}
                                </span>
                            </div>
                        }
                    >
                        {fieldOptions.map((option) => (
                            <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => {
                                    const newTicketData = { ...ticketData, [fieldName]: option.value }
                                    setTicketData(newTicketData)
                                    saveProjectToDatabase(newTicketData)
                                }}
                            >
                                {option.label}
                            </div>
                        ))}
                    </Dropdown>
                </div>
            )
        }

        if (fieldType === 'boolean') {
            return (
                <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700" style={{ width: '295px' }}>
                    <span className="font-semibold">
                        {fieldValue ? 'Sim' : 'Não'}
                    </span>
                    <Switcher
                        checked={fieldValue}
                        onChange={(checked) => {
                            const newTicketData = { ...ticketData, [fieldName]: checked }
                            setTicketData(newTicketData)
                            saveProjectToDatabase(newTicketData)
                        }}
                    />
                </div>
            )
        }

        // Default fallback
        return (
            <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700" style={{ width: '295px' }}>
                <span className="font-semibold">
                    {fieldValue || '-'}
                </span>
            </div>
        )
    }

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <Spinner size={40} />
                </div>
            ) : !ticketData ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <p>Ticket not found</p>
                </div>
            ) : (
                <>
                    <div className="flex gap-2 mb-10">
                        <div className="w-full">
                            <div className="flex justify-between items-center">
                                <div className="flex-1 mr-4">
                                    <input
                                        className="text-lg font-bold outline-hidden bg-transparent w-full"
                                        value={titleInputValue}
                                        onChange={(e) => setTitleInputValue(e.target.value)}
                                        onBlur={(e) => handleTitleChange(e.target.value)}
                                        placeholder="Nome do projeto"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Only show move options if NOT in a finalized board */}
                                    {currentBoard !== 'Concluídas' && currentBoard !== 'Canceladas' ? (
                                        <div className="flex items-center">
                                            <Dropdown
                                                className="w-full"
                                                placement="bottom-end"
                                                renderTitle={
                                                    <Button
                                                        variant="solid"
                                                        size="sm"
                                                        className="mr-2 rtl:ml-2"
                                                    >
                                                        Mover
                                                    </Button>
                                                }
                                            >
                                                {ordered.map((board) => (
                                                    <div
                                                        key={board}
                                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                        onClick={() => moveTicketToBoard(board)}
                                                    >
                                                        {board}
                                                    </div>
                                                ))}
                                            </Dropdown>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="solid"
                                            onClick={handleRestoreTicket}
                                            className="mr-2 rtl:ml-2"
                                            style={{ backgroundColor: '#d1fae5', color: '#059669' }}
                                        >
                                            Restaurar
                                        </Button>
                                    )}
                                    
                                    <Button
                                        variant="solid"
                                        onClick={handleTicketClose}
                                        className="mr-2 rtl:ml-2"
                                    >
                                        Fechar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ScrollBar className="h-[calc(100vh-200px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Project Details */}
                            <div className="space-y-6">
                                {/* Project ID */}
                                <div className="flex items-center min-h-[30px]">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[200px]">
                                        ID do Projeto:
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                            {ticketData?.projectId || 'PJ-' + ticketData?.id?.slice(-6)}
                                        </span>
                                    </div>
                                </div>

                                {/* Dynamic Fields */}
                                {fieldConfigs.map((fieldConfig) => (
                                    <div key={fieldConfig.id}>
                                        {renderProjectField(fieldConfig)}
                                    </div>
                                ))}

                                {/* Members Section */}
                                <div className="flex items-center min-h-[30px]">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[200px]">
                                        Membros:
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UsersAvatarGroup
                                            users={ticketData?.members || []}
                                            onRemove={onRemoveMemberClick}
                                        />
                                        <Dropdown
                                            className="w-full"
                                            placement="bottom-start"
                                            renderTitle={<AddMoreMember />}
                                        >
                                            {scrumBoardUsers
                                                .filter(user => !(ticketData?.members || []).some(member => member.id === user.id))
                                                .map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                                        onClick={() => onAddMemberClick(user.id)}
                                                    >
                                                        <Avatar
                                                            size="sm"
                                                            src={user.img}
                                                            alt={user.name}
                                                        />
                                                        <span>{user.name}</span>
                                                    </div>
                                                ))}
                                        </Dropdown>
                                    </div>
                                </div>

                                {/* Pending Items */}
                                {ticketData?.pendingItems && ticketData.pendingItems.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                            Pendências:
                                        </div>
                                        <div className="space-y-2">
                                            {ticketData.pendingItems.map((item) => (
                                                <div key={item.id} className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={item.completed}
                                                        onChange={() => togglePendingItem(item.id)}
                                                    />
                                                    <span className={item.completed ? 'line-through text-gray-500' : ''}>
                                                        {item.text}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        icon={<TbX />}
                                                        onClick={() => removePendingItem(item.id)}
                                                        className="ml-auto"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={newPendingItem}
                                                onChange={(e) => setNewPendingItem(e.target.value)}
                                                onKeyPress={handlePendingKeyPress}
                                                placeholder="Adicionar pendência"
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={addPendingItem}
                                                disabled={!newPendingItem.trim()}
                                                size="sm"
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Comments and Attachments */}
                            <div className="space-y-6">
                                {/* Tabs */}
                                <Tabs className="mt-6" defaultValue="comments">
                                    <TabList>
                                        <TabNav value="comments">Comentários</TabNav>
                                        <TabNav value="attachments">Anexos</TabNav>
                                    </TabList>
                                    <div className="p-4">
                                        <TabContent value="comments">
                                            <div className="w-full">
                                                {localComments &&
                                                    localComments?.length >
                                                        0 && (
                                                        <>
                                                            {localComments.map((comment) => (
                                                                <div
                                                                    key={comment.id}
                                                                    className="flex gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                                >
                                                                    <Avatar
                                                                        size="sm"
                                                                        src={comment.src}
                                                                        alt={comment.name}
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-semibold text-sm">
                                                                                {comment.name}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {dayjs(comment.date).format('DD/MM/YYYY HH:mm')}
                                                                            </span>
                                                                        </div>
                                                                        {editingComment === comment.id ? (
                                                                            <div className="space-y-2">
                                                                                <Input
                                                                                    value={editingCommentText}
                                                                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                                                                    className="w-full"
                                                                                />
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={handleSaveEdit}
                                                                                        disabled={!editingCommentText.trim()}
                                                                                    >
                                                                                        Salvar
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="plain"
                                                                                        onClick={handleCancelEdit}
                                                                                    >
                                                                                        Cancelar
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-start justify-between">
                                                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                                    {comment.message}
                                                                                </p>
                                                                                <div className="flex gap-1 ml-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        icon={<TbEdit />}
                                                                                        onClick={() => handleEditComment(comment.id, comment.message)}
                                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                    />
                                                                                    <Button
                                                                                        size="sm"
                                                                                        icon={<TbTrash />}
                                                                                        onClick={() => handleRemoveComment(comment.id)}
                                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                <div className="space-y-2">
                                                    <Input
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder="Adicionar comentário..."
                                                        className="w-full"
                                                    />
                                                    <Button
                                                        onClick={submitComment}
                                                        disabled={!newComment.trim()}
                                                        size="sm"
                                                    >
                                                        Adicionar Comentário
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabContent>
                                        <TabContent value="attachments">
                                            {(ticketData.attachments && ticketData.attachments.length > 0) ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                                    {(ticketData.attachments || []).map((file) => (
                                                        <Card
                                                            key={file.id}
                                                            className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                                                            onClick={() => handleDownloadAttachment(file)}
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                                                    <TbDownload className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">
                                                                        {file.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {file.size}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    icon={<TbDownload />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDownloadAttachment(file)
                                                                    }}
                                                                    className="flex-1"
                                                                >
                                                                    Download
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    icon={<TbTrash />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleRemoveAttachment(file.id)
                                                                    }}
                                                                    className="text-red-500"
                                                                />
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <NoMedia className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                                    <p className="text-gray-500">Nenhum anexo</p>
                                                </div>
                                            )}
                                            <div className="mt-4">
                                                <Button
                                                    icon={<TbPlus />}
                                                    onClick={handleAddAttachment}
                                                    variant="solid"
                                                    size="sm"
                                                >
                                                    Adicionar Anexo
                                                </Button>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </TabContent>
                                    </div>
                                </Tabs>

                                {/* Action buttons */}
                                <div className="text-right mt-4 mb-10">
                                    {editingField ? (
                                        <>
                                            <Button
                                                variant="plain"
                                                onClick={cancelEdit}
                                                className="mr-2 rtl:ml-2"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                variant="solid"
                                                onClick={saveEdit}
                                            >
                                                Salvar
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            {/* External link button - bottom left */}
                                            {ticketData?.projectId && (
                                                <Button
                                                    variant="plain"
                                                    icon={<TbExternalLink />}
                                                    onClick={handleExternalLinkClick}
                                                    className="mr-auto float-left"
                                                    size="sm"
                                                >
                                                    Ver Projeto
                                                </Button>
                                            )}
                                            
                                            {/* Show Concluir and Cancelar buttons only for "Registradas e/ou Prontas pra Entrega" status */}
                                            {currentBoard === 'Registradas e/ou Prontas pra Entrega' && (
                                                <>
                                                    <Button
                                                        variant="solid"
                                                        onClick={handleCancelTicket}
                                                        className="mr-2 rtl:ml-2"
                                                        style={{ backgroundColor: '#fecaca', color: '#dc2626' }}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        variant="solid"
                                                        onClick={handleConcludeTicket}
                                                        className="mr-2 rtl:ml-2"
                                                        style={{ backgroundColor: '#d1fae5', color: '#059669' }}
                                                    >
                                                        Concluir
                                                    </Button>
                                                </>
                                            )}
                                            
                                            <Button
                                                variant="solid"
                                                onClick={handleTicketClose}
                                                className="mr-2 rtl:ml-2"
                                            >
                                                Fechar
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollBar>
                </>
            )}
        </>
    )
}

export default TicketContent

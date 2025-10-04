'use client'
import { useState, useRef } from 'react'
import Card from '@/components/ui/Card'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import IconText from '@/components/shared/IconText'
import Dropdown from '@/components/ui/Dropdown'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { TbPaperclip, TbMessageCircle, TbExternalLink, TbTrash } from 'react-icons/tb'
import { useRegistroCivilStore } from '../_store/registroCivilStore'
import { useFieldConfigStore } from '../_store/fieldConfigStore'
import { useRouter } from 'next/navigation'
import useUserStore from '@/stores/userStore'
import { createDynamicColorMappingsFromDB } from '../utils/boardColors'
import { useBoardColors } from '../_contexts/BoardColorsContext'
import { useMemo } from 'react'

const BoardCard = (props) => {
    const { openDialog, updateDialogView, setSelectedTicketId, setSelectedBoard, deleteTicket, openProjectDetailsDrawer, columns } =
        useRegistroCivilStore()
    const { fieldConfig } = useFieldConfigStore()
    const router = useRouter()
    const { currentUser } = useUserStore()
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)
    const isDeletingRef = useRef(false)

    const { data, ref, listId, ...rest } = props

    const { id, name, comments, attachments, members, projectId } = data
    
    // Ensure array fields are always arrays
    const safeMembers = Array.isArray(members) ? members : []
    const safeComments = Array.isArray(comments) ? comments : []
    const safeAttachments = Array.isArray(attachments) ? attachments : []

    // Get board colors from database
    const { boardColors } = useBoardColors()

    // Get dynamic shadow color for the board using database colors (memoized)
    const shadowClass = useMemo(() => {
        const boardShadowColors = createDynamicColorMappingsFromDB(columns, boardColors, 'cardShadow')
        return boardShadowColors[listId] || 'shadow-gray-300'
    }, [columns, boardColors, listId])

    // Get fields that are visible in the board
    const visibleFields = fieldConfig.filter(field => field.visivelNoQuadro && field.ativo)

    // Parse fieldConfiguration and merge with main data (same logic as ProjectDetailsDrawer)
    const getFieldValue = (field) => {
        // First check if the field exists directly on the data object
        if (data[field.fieldName] !== undefined) {
            return data[field.fieldName]
        }
        
        // If not, check in fieldConfiguration
        if (data.fieldConfiguration && typeof data.fieldConfiguration === 'string' && data.fieldConfiguration.trim() !== '') {
            try {
                const fieldConfig = JSON.parse(data.fieldConfiguration)
                return fieldConfig[field.fieldName]
            } catch (error) {
                console.log('Error parsing fieldConfiguration in BoardCard:', error)
            }
        }
        
        return null
    }

    // Helper function to format field values
    const formatFieldValue = (field, value) => {
        if (!value) return null
        
        switch (field.tipo.toLowerCase()) {
            case 'date':
                // Handle both Date objects and ISO strings
                if (value instanceof Date) {
                    return value.toLocaleDateString('pt-BR')
                } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                    return new Date(value).toLocaleDateString('pt-BR')
                }
                return value
            case 'checkbox':
                return value ? 'Sim' : 'Não'
            case 'dropdown':
                // Find the option label for the value
                const option = field.options?.find(opt => opt.value === value)
                return option ? option.label : value
            default:
                return value
        }
    }

    const onCardClick = () => {
        // Don't open drawer if delete dialog is open or if deletion is in progress
        if (confirmDeleteDialog || isDeletingRef.current) {
            return
        }
        // Open project details drawer instead of the old dialog
        openProjectDetailsDrawer(data)
    }

    const handleExternalLinkClick = (e) => {
        e.stopPropagation() // Prevent card click
        if (projectId) {
            router.push(`/concepts/projects/tasks/${projectId}`)
        }
    }

    const handleDeleteClick = (e) => {
        e.stopPropagation() // Prevent card click
        setConfirmDeleteDialog(true)
    }

    const onConfirmDeleteClose = () => {
        setConfirmDeleteDialog(false)
    }

    const onDelete = async () => {
        try {
            isDeletingRef.current = true
            await deleteTicket(id, currentUser)
            setConfirmDeleteDialog(false)
            // Keep the deletion flag for a bit longer to prevent any delayed clicks
            setTimeout(() => {
                isDeletingRef.current = false
            }, 500)
        } catch (error) {
            console.error('Error deleting ticket:', error)
            isDeletingRef.current = false
        }
    }

    return (
        <Card
            ref={ref}
            clickable
            className={`rounded-lg mb-4 border-0 shadow-lg ${shadowClass} relative`}
            bodyClass="p-4"
            onClick={() => onCardClick()}
            {...rest}
        >
            <div className="mb-2 font-bold heading-text text-sm truncate">{name?.toUpperCase()}</div>
            
            {/* Project details - dynamic fields marked as visible in board */}
            <div className="mb-3 space-y-1">
                {visibleFields.map((field) => {
                    const fieldValue = getFieldValue(field)
                    const formattedValue = formatFieldValue(field, fieldValue)
                    
                    if (!formattedValue) return null
                    
                    return (
                        <div key={field.id} className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-bold">{field.nome}:</span> 
                            <span className="truncate block">{formattedValue}</span>
                        </div>
                    )
                })}
            </div>
            
            <div className="flex items-center justify-between mt-3">
                <UsersAvatarGroup avatarProps={{ size: 25 }} users={safeMembers} />
                <div className="flex items-center gap-2">
                    {safeComments.length > 0 && (
                        <IconText
                            className="font-semibold gap-1"
                            icon={<TbMessageCircle className="text-base" />}
                        >
                            {safeComments.length}
                        </IconText>
                    )}
                    {safeAttachments.length > 0 && (
                        <IconText
                            icon={<TbPaperclip />}
                            className="text-base gap-1"
                        >
                            {safeAttachments.length}
                        </IconText>
                    )}
                    <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                            placement="bottom-end"
                            renderTitle={<EllipsisButton />}
                        >
                            <Dropdown.Item
                                eventKey="deleteTicket"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteClick(e)
                                }}
                            >
                                <span className="text-lg">
                                    <TbTrash />
                                </span>
                                <span>Deletar</span>
                            </Dropdown.Item>
                        </Dropdown>
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={confirmDeleteDialog}
                type="danger"
                title="Deletar Projeto"
                onClose={onConfirmDeleteClose}
                onRequestClose={onConfirmDeleteClose}
                onCancel={onConfirmDeleteClose}
                onConfirm={onDelete}
            >
                <p>Tem certeza que deseja deletar o projeto <strong>{name}</strong>? Esta ação não pode ser desfeita.</p>
            </ConfirmDialog>
        </Card>
    )
}

export default BoardCard


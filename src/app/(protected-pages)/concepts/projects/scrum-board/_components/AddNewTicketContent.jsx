'use client'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import Checkbox from '@/components/ui/Checkbox'
import Radio from '@/components/ui/Radio'
import Switcher from '@/components/ui/Switcher'
import TimeInput from '@/components/ui/TimeInput'
import Tabs from '@/components/ui/Tabs'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import CloseButton from '@/components/ui/CloseButton'
import ScrollBar from '@/components/ui/ScrollBar'
import Card from '@/components/ui/Card'
import Tooltip from '@/components/ui/Tooltip'
import NoMedia from '@/assets/svg/NoMedia'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useProjectStore } from '../../_store/projectStore'
import { useScrumBoardUsers } from '../_hooks/useScrumBoardUsers'
import { useScrumBoardAccess } from '../_hooks/useScrumBoardAccess'
import { useFieldConfigStore } from '../_store/fieldConfigStore'
import useUserStore from '@/stores/userStore'
import sleep from '@/utils/sleep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import cloneDeep from 'lodash/cloneDeep'
import { createCardObject, createUID, generateProjectId } from '../utils'
import { TbPlus, TbX, TbDownload, TbTrash, TbCircleCheck, TbCircleCheckFilled } from 'react-icons/tb'
import dayjs from 'dayjs'
import { useState, useRef } from 'react'

const { TabNav, TabList, TabContent } = Tabs

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

// Dynamic validation schema based on field configuration
const createValidationSchema = (fieldConfig) => {
    const baseSchema = {
        title: z.string().optional(),
    assignedTo: z.string().optional(),
    }
    
    // Add dynamic fields based on configuration
    fieldConfig.forEach(field => {
        const { fieldName, tipo, obrigatorio } = field
        
        // Create base validation based on field type
        let fieldSchema
        
        switch (tipo.toLowerCase()) {
            case 'checkbox':
                fieldSchema = z.boolean()
                break
            case 'radio':
                fieldSchema = z.string()
                break
            case 'textarea':
            case 'área de texto':
                fieldSchema = z.string()
                break
            case 'email':
                fieldSchema = z.string().email('Endereço de email inválido')
                break
            case 'multiselect':
            case 'seleção múltipla':
                // Handle both array of strings and array of objects from Select component
                fieldSchema = z.array(z.union([
                    z.string(),
                    z.object({ value: z.string(), label: z.string() })
                ]))
                break
            case 'switch':
            case 'interruptor':
                fieldSchema = z.boolean()
                break
            case 'hora':
            case 'time':
                fieldSchema = z.date().nullable()
                break
            case 'data e hora':
            case 'datetime':
                fieldSchema = z.date().nullable()
                break
            case 'data':
            case 'date':
                fieldSchema = z.date().nullable()
                break
            case 'número':
            case 'number':
                fieldSchema = z.union([z.string(), z.number()])
                break
            default:
                fieldSchema = z.string()
                break
        }
        
        // Apply required validation if field is marked as obrigatorio
        if (obrigatorio) {
            switch (tipo.toLowerCase()) {
                case 'checkbox':
                    baseSchema[fieldName] = fieldSchema.refine(val => val === true, {
                        message: 'Campo obrigatório'
                    })
                    break
                case 'multiselect':
                case 'seleção múltipla':
                    baseSchema[fieldName] = fieldSchema.refine(val => val && val.length > 0, {
                        message: 'Campo obrigatório'
                    })
                    break
                case 'hora':
                case 'time':
                case 'data e hora':
                case 'datetime':
                case 'data':
                case 'date':
                    baseSchema[fieldName] = fieldSchema.refine(val => val !== null && val !== undefined, {
                        message: 'Campo obrigatório'
                    })
                    break
                default:
                    baseSchema[fieldName] = fieldSchema.refine(val => val && val.toString().trim() !== '', {
                        message: 'Campo obrigatório'
                    })
                    break
            }
        } else {
            // Optional fields
            switch (tipo.toLowerCase()) {
                case 'checkbox':
                    baseSchema[fieldName] = fieldSchema.default(false)
                    break
                case 'multiselect':
                case 'seleção múltipla':
                    baseSchema[fieldName] = fieldSchema.optional()
                    break
                case 'hora':
                case 'time':
                case 'data e hora':
                case 'datetime':
                case 'data':
                case 'date':
                    baseSchema[fieldName] = fieldSchema.optional()
                    break
                case 'email':
                    baseSchema[fieldName] = fieldSchema.optional().or(z.literal(''))
                    break
                default:
                    baseSchema[fieldName] = fieldSchema.optional()
                    break
            }
        }
    })
    
    return z.object(baseSchema)
}

const tipoOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'DIVERSAS', label: 'DIVERSAS' },
]

const custasOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'CLIENTE', label: 'CLIENTE' },
]



const AddNewTicketContent = () => {
    const { columns, board, closeDialog, updateColumns, setSelectedBoard } =
        useScrumBoardStore()
    
    // Get real users from the dedicated hook
    const { users, hasUsers } = useScrumBoardUsers()
    
    // Get access members (active board members)
    const { members: accessMembers } = useScrumBoardAccess()
    
    // Get members from project store as fallback
    const { allMembers } = useProjectStore()
    
    // Get current user for comments
    const { currentUser } = useUserStore()
    
    // Get field configuration
    const { fieldConfig, getActiveFields } = useFieldConfigStore()
    const activeFields = getActiveFields()
    
    // Debug logging
    console.log('AddNewTicketContent - Debug Info:', {
        users: users?.length || 0,
        hasUsers,
        accessMembers: accessMembers?.length || 0,
        allMembers: allMembers?.length || 0,
        finalUsers: accessMembers || allMembers
    })
    
    // Debug field configuration
    console.log('AddNewTicketContent - Field Config:', fieldConfig)
    const eProtocoloField = fieldConfig.find(field => field.fieldName === 'eProtocolo')
    console.log('AddNewTicketContent - E-protocolo field:', eProtocoloField)

    const [comments, setComments] = useState([])
    const [attachments, setAttachments] = useState([])
    const [pendingItems, setPendingItems] = useState([])
    const [newPendingItem, setNewPendingItem] = useState('')
    const [selectedMembers, setSelectedMembers] = useState([])

    const commentInput = useRef(null)
    const fileInputRef = useRef(null)
    const pendingInputRef = useRef(null)

    // Create dynamic default values based on field configuration
    const createDefaultValues = (fieldConfig) => {
        const defaults = {
            title: '',
            assignedTo: '',
        }
        
        fieldConfig.forEach(field => {
            const { fieldName, tipo } = field
            
            switch (tipo.toLowerCase()) {
                case 'checkbox':
                    defaults[fieldName] = false
                    break
                case 'radio':
                    defaults[fieldName] = ''
                    break
                case 'textarea':
                case 'área de texto':
                    defaults[fieldName] = ''
                    break
                case 'email':
                    defaults[fieldName] = ''
                    break
                case 'multiselect':
                case 'seleção múltipla':
                    defaults[fieldName] = []
                    break
                case 'switch':
                case 'interruptor':
                    defaults[fieldName] = false
                    break
                case 'hora':
                case 'time':
                    defaults[fieldName] = null
                    break
                case 'data e hora':
                case 'datetime':
                    defaults[fieldName] = null
                    break
                case 'data':
                case 'date':
                    defaults[fieldName] = null
                    break
                default:
                    defaults[fieldName] = ''
                    break
            }
        })
        
        return defaults
    }

    const {
        control,
        formState: { errors },
        handleSubmit,
        watch,
        setValue,
    } = useForm({
        defaultValues: createDefaultValues(activeFields),
        resolver: zodResolver(createValidationSchema(activeFields)),
    })



    const submitComment = () => {
        if (commentInput.current && commentInput.current.value.trim()) {
            const message = commentInput.current.value
            const comment = createCommentObject(message, currentUser)
            setComments([...comments, comment])
            commentInput.current.value = ''
        }
    }

    const handleAddAttachment = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event) => {
        const files = event.target.files
        if (files && files.length > 0) {
            const newAttachments = Array.from(files).map(file => createAttachmentObject(file))
            setAttachments([...attachments, ...newAttachments])
        }
        // Reset the input value so the same file can be selected again
        event.target.value = ''
    }

    const handleRemoveAttachment = (attachmentId) => {
        setAttachments(attachments.filter(attachment => attachment.id !== attachmentId))
    }

    const handleDownloadAttachment = (attachment) => {
        const link = document.createElement('a')
        link.href = attachment.src
        link.download = attachment.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const addPendingItem = () => {
        if (newPendingItem.trim()) {
            const newItem = {
                id: createUID(10),
                text: newPendingItem.trim(),
                completed: false,
                createdAt: new Date()
            }
            setPendingItems([...pendingItems, newItem])
            setNewPendingItem('')
        }
    }

    const togglePendingItem = (itemId) => {
        setPendingItems(pendingItems.map(item => 
            item.id === itemId 
                ? { ...item, completed: !item.completed }
                : item
        ))
    }

    const removePendingItem = (itemId) => {
        setPendingItems(pendingItems.filter(item => item.id !== itemId))
    }

    const handlePendingKeyPress = (e) => {
        if (e.key === 'Enter') {
            addPendingItem()
        }
    }

    const handleAddMember = (member) => {
        if (!selectedMembers.find(m => m.id === member.id)) {
            setSelectedMembers([...selectedMembers, member])
        }
    }

    const handleRemoveMember = (memberId) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== memberId))
    }

    // Dynamic field renderer based on configuration
    const renderField = (fieldConfig) => {
        const { nome, tipo, obrigatorio, fieldName } = fieldConfig
        
        // Skip special fields that are handled separately
        if (fieldName === 'title' || fieldName === 'assignedTo' || fieldName === 'pendingItems') {
            return null
        }

        const fieldLabel = nome.includes('?') ? nome : nome + ':'
        const isMultiLine = nome.includes('Matrícula') || nome.includes('Registro')

        // Special handling for text fields with validation
        if (tipo.toLowerCase() === 'texto' || tipo.toLowerCase() === 'text') {
    return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                            </div>
                    <div className="flex flex-col">
                            <Controller
                            name={fieldName}
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                    className="w-[295px]"
                                    invalid={Boolean(errors[fieldName])}
                                    style={{ textTransform: 'uppercase' }}
                                        {...field}
                                    />
                                )}
                            />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                            </div>
                            )}
                        </div>
                    </div>
            )
        }

        // Special handling for number fields with validation
        if (tipo.toLowerCase() === 'número' || tipo.toLowerCase() === 'number') {
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    autoComplete="off"
                                    className="w-[295px]"
                                    invalid={Boolean(errors[fieldName])}
                                    style={{
                                        width: '295px',
                                        backgroundColor: errors[fieldName] ? '#fef2f2' : undefined,
                                    }}
                                    onFocus={(e) => {
                                        if (errors[fieldName]) {
                                            e.target.style.backgroundColor = 'white'
                                        }
                                        field.onFocus?.(e)
                                    }}
                                    onBlur={(e) => {
                                        if (errors[fieldName]) {
                                            e.target.style.backgroundColor = '#fef2f2'
                                        }
                                        field.onBlur?.(e)
                                    }}
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for checkbox fields with validation
        if (tipo.toLowerCase() === 'checkbox') {
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <div 
                                    className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700 ${errors[fieldName] ? 'bg-red-50' : ''}`}
                                    style={{
                                        backgroundColor: errors[fieldName] ? '#fef2f2' : undefined
                                    }}
                                >
                                    <Checkbox
                                        checked={field.value}
                                        onChange={field.onChange}
                                        onFocus={(e) => {
                                            if (errors[fieldName]) {
                                                e.target.closest('div').style.backgroundColor = 'white'
                                            }
                                            field.onFocus?.(e)
                                        }}
                                        onBlur={(e) => {
                                            if (errors[fieldName]) {
                                                e.target.closest('div').style.backgroundColor = '#fef2f2'
                                            }
                                            field.onBlur?.(e)
                                        }}
                                    />
                                </div>
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for radio fields with validation
        if (tipo.toLowerCase() === 'radio') {
            const radioOptions = fieldConfig.options || []
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <div 
                                    className={`w-[0px] ${errors[fieldName] ? 'bg-red-50' : ''}`}
                                    style={{
                                        backgroundColor: errors[fieldName] ? '#fef2f2' : undefined
                                    }}
                                >
                                    <Radio.Group 
                                        value={field.value} 
                                        onChange={field.onChange}
                                        onFocus={(e) => {
                                            if (errors[fieldName]) {
                                                e.target.closest('div').style.backgroundColor = 'white'
                                            }
                                            field.onFocus?.(e)
                                        }}
                                        onBlur={(e) => {
                                            if (errors[fieldName]) {
                                                e.target.closest('div').style.backgroundColor = '#fef2f2'
                                            }
                                            field.onBlur?.(e)
                                        }}
                                    >
                                        {radioOptions.map((option) => (
                                            <Radio
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </Radio>
                                        ))}
                                    </Radio.Group>
                                </div>
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                    </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for hour fields with validation
        if (tipo.toLowerCase() === 'hora' || tipo.toLowerCase() === 'time') {
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <div 
                                    style={{
                                        '--tw-ring-width': '0px !important',
                                        '--tw-ring-color': 'transparent !important',
                                        '--tw-ring-opacity': '0 !important',
                                        '--tw-ring-offset-width': '0px !important',
                                        '--tw-ring-offset-color': 'transparent !important'
                                    }}
                                >
                                <TimeInput
                                    className="w-[295px]"
                                    style={{
                                        backgroundColor: errors[fieldName] ? '#fef2f2' : undefined,
                                        borderRadius: '12px'
                                    }}
                                    {...field}
                                />
                                </div>
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                    </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for datetime fields with validation
        if (tipo.toLowerCase() === 'data e hora' || tipo.toLowerCase() === 'datetime') {
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <div 
                                    style={{
                                        '--tw-ring-width': '0px !important',
                                        '--tw-ring-color': 'transparent !important',
                                        '--tw-ring-opacity': '0 !important',
                                        '--tw-ring-offset-width': '0px !important',
                                        '--tw-ring-offset-color': 'transparent !important'
                                    }}
                                >
                                {(() => {
                                    const { DateTimepicker } = DatePicker
                                    return (
                                        <DateTimepicker
                                            inputFormat="DD/MM/YYYY HH:mm"
                                            clearable={true}
                                            className={`w-[295px] ${errors[fieldName] ? '[&_input]:bg-red-50 [&_input]: [&_input]:focus:bg-white [&_input]:focus:border-red-500 [&_input]:focus:ring-2 [&_input]:focus:ring-red-500 [&_input]:focus:ring-opacity-50 [&_input]:focus:outline-none [&_input]:outline-none [&_input]:shadow-none [&_input]:focus:shadow-none' : ''}`}
                                            {...field}
                                            style={{
                                                backgroundColor: errors[fieldName] ? '#fef2f2' : undefined,
                                                borderRadius: '12px'
                                            }}
                                            {...field}
                                        />
                                    )
                                })()}
                                </div>
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for email fields with validation
        if (tipo.toLowerCase() === 'email') {
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="email"
                                    autoComplete="off"
                                    placeholder=""
                                    className="w-[295px]"
                                    invalid={Boolean(errors[fieldName])}
                                    style={{
                                        width: '295px',
                                        backgroundColor: errors[fieldName] ? '#fef2f2' : undefined
                                    }}
                                    onFocus={(e) => {
                                        if (errors[fieldName]) {
                                            e.target.style.backgroundColor = 'white'
                                        }
                                        field.onFocus?.(e)
                                    }}
                                    onBlur={(e) => {
                                        if (errors[fieldName]) {
                                            e.target.style.backgroundColor = '#fef2f2'
                                        }
                                        field.onBlur?.(e)
                                    }}
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                    </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for multiselect fields with validation
        if (tipo.toLowerCase() === 'multiselect' || tipo.toLowerCase() === 'seleção múltipla') {
            const multiselectOptions = fieldConfig.options || []
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <div 
                                    className="w-[295px] rounded-xl"
                                >
                                <Select
                                        isMulti
                                        instanceId={`multiselect-${fieldName}`}
                                    placeholder=""
                                        className="w-[295px]"
                                        options={multiselectOptions}
                                        styles={{
                                            control: (provided, state) => ({
                                                ...provided,
                                                backgroundColor: errors[fieldName] ? '#fef2f2' : '#f9fafb',
                                                borderRadius: '10px',
                                                minHeight: '46px',
                                                border: 'none',
                                                boxShadow: 'none',
                                            })
                                        }}
                                        {...field}
                                    />
                                </div>
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                    </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for date fields with validation
        if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <div 
                                    style={{
                                        '--tw-ring-width': '0px !important',
                                        '--tw-ring-color': 'transparent !important',
                                        '--tw-ring-opacity': '0 !important',
                                        '--tw-ring-offset-width': '0px !important',
                                        '--tw-ring-offset-color': 'transparent !important'
                                    }}
                                >
                                <DatePicker
                                    inputFormat="DD/MM/YYYY"
                                    clearable={true}
                                        className={`w-[295px] ${errors[fieldName] ? '[&_input]:bg-red-50 [&_input]: [&_input]:focus:bg-white [&_input]:focus:border-red-500 [&_input]:focus:ring-2 [&_input]:focus:ring-red-500 [&_input]:focus:ring-opacity-50 [&_input]:focus:outline-none [&_input]:outline-none [&_input]:shadow-none [&_input]:focus:shadow-none' : ''}`}
                                    {...field}
                                />
                                </div>
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                    </div>
                        )}
                    </div>
                </div>
            )
        }

        // Special handling for dropdown fields with validation
        if (tipo.toLowerCase() === 'dropdown') {
            const options = fieldConfig.options || []
            return (
                <div key={fieldName} className="flex items-center min-h-[30px]">
                    <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                        {isMultiLine ? nome.replace(' ', '\n') : nome}:
                        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                    <div className="flex flex-col">
                        <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                                <div 
                                    ref={(el) => {
                                        if (el && errors[fieldName]) {
                                            el.style.backgroundColor = '#fef2f2'
                                        }
                                    }}
                                    className={`w-[295px] rounded-xl ${errors[fieldName] ? '[&_input]:bg-red-50 [&_input]: [&_input]:focus:bg-white [&_input]:focus:border-red-500 [&_input]:focus:ring-2 [&_input]:focus:ring-red-500 [&_input]:focus:ring-opacity-50 [&_input]:focus:outline-none [&_input]:outline-none [&_input]:shadow-none [&_input]:focus:shadow-none' : ''}`}
                                    style={{
                                        backgroundColor: errors[fieldName] ? '#fef2f2' : undefined
                                    }}
                                >
                                    <Dropdown
                                        className="w-full h-full"
                                        toggleClassName="flex px-3 cursor-pointer rounded-xl min-h-[46px] focus:outline-none outline-none shadow-none focus:shadow-none"
                                        placement="bottom-start"
                                        renderTitle={
                                            <div className="inline-flex items-center gap-1">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    fieldName === 'tipo' 
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                    {field.value || 'Selecionar'}
                                                </span>
                    </div>
                                        }
                                    >
                                        {options.map((option) => (
                                            <Dropdown.Item
                                                key={option.value}
                                                eventKey={option.value}
                                                onSelect={() => field.onChange(option.value)}
                                            >
                                                {option.label}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown>
                        </div>
                            )}
                        />
                        {errors[fieldName] && (
                            <div className="text-red-500 text-sm mt-1 font-bold">
                                {errors[fieldName].message}
                    </div>
                        )}
                    </div>
                </div>
            )
        }

        return (
            <div key={fieldName} className="flex items-center min-h-[30px]">
                <div className={`font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] ${isMultiLine ? 'leading-tight' : ''}`}>
                    {isMultiLine ? nome.replace(' ', '\n') : nome}:
                    {obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <Controller
                    name={fieldName}
                            control={control}
                    render={({ field }) => {
                        switch (tipo.toLowerCase()) {
                            case 'número':
                            case 'number':
                                return (
                                <Input
                                        type="number"
                                    autoComplete="off"
                                        className="w-[295px]"
                                    {...field}
                                />
                                )
                            case 'checkbox':
                                return (
                                    <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Checkbox
                                    checked={field.value}
                                    onChange={field.onChange}
                        />
                    </div>
                                )
                            case 'radio':
                                const radioOptions = fieldConfig.options || []
                                return (
                                    <div className="w-[295px]">
                                        <Radio.Group 
                                            value={field.value} 
                                            onChange={field.onChange}
                                        >
                                            {radioOptions.map((option) => (
                                                <Radio
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </Radio>
                                            ))}
                                        </Radio.Group>
                        </div>
                                )
                            case 'textarea':
                            case 'área de texto':
                                return (
                                    <Input
                                        textArea
                                    placeholder=""
                                        className="w-[295px]"
                                    {...field}
                                />
                                )
                            case 'email':
                                return (
                                <Input
                                        type="email"
                                    autoComplete="off"
                                        placeholder=""
                                        className="w-[295px]"
                                    {...field}
                                />
                                )
                            case 'multiselect':
                            case 'seleção múltipla':
                                const multiselectOptions = fieldConfig.options || []
                                return (
                                    <Select
                                        isMulti
                                        instanceId={`multiselect-${fieldName}`}
                                        placeholder=""
                                        className="w-[295px]"
                                        options={multiselectOptions}
                                        {...field}
                                    />
                                )
                            case 'switch':
                            case 'interruptor':
                                return (
                                    <Switcher
                                        className="w-[20px]"
                                    {...field}
                                />
                                )
                            case 'hora':
                            case 'time':
                                return (
                                    <TimeInput
                                        className="w-[295px]"
                                    {...field}
                                />
                                )
                            case 'data e hora':
                            case 'datetime':
                                const { DateTimepicker } = DatePicker
                                return (
                                    <DateTimepicker
                                        placeholder=""
                                        className="w-[295px]"
                                        {...field}
                                    />
                                )
                            default:
                                return (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                        className="w-[295px]"
                                    {...field}
                                />
                                )
                        }
                    }}
                        />
                {errors[fieldName] && (
                    <div className="text-red-500 text-sm mt-1 ml-[200px]">{errors[fieldName].message}</div>
                )}
                    </div>
        )
    }

    const onFormSubmit = async (formData) => {
        try {
            console.log('Form submitted with data:', formData)
            console.log('Form errors:', errors)
            console.log('Form is valid:', Object.keys(errors).length === 0)
            console.log('All form errors:', JSON.stringify(errors, null, 2))
            
            // Check if there are any validation errors - use formState.isValid instead
            if (Object.keys(errors).length > 0) {
                console.log('Form has validation errors, preventing submission')
                console.log('Validation errors:', errors)
                return
            }
            
            const data = columns
            const newCard = createCardObject()
            
            // Generate project ID
            newCard.projectId = generateProjectId(columns)
            
            newCard.name = formData.title ? formData.title : 'Untitled Task'
            newCard.assignedTo = formData.assignedTo || ''
            newCard.members = selectedMembers // Add selected members to the card
            
            // Dynamically assign field values based on configuration
            activeFields.forEach(field => {
                const { fieldName, tipo } = field
                const value = formData[fieldName]
                
                switch (tipo.toLowerCase()) {
                    case 'data':
                    case 'date':
                        newCard[fieldName] = value ? value.toISOString() : null
                        break
                    case 'checkbox':
                        newCard[fieldName] = value || false
                        break
                    case 'radio':
                        newCard[fieldName] = value || ''
                        break
                    case 'textarea':
                    case 'área de texto':
                        newCard[fieldName] = value || ''
                        break
                    case 'email':
                        newCard[fieldName] = value || ''
                        break
                    case 'multiselect':
                    case 'seleção múltipla':
                        // Extract values from Select component's array of objects
                        newCard[fieldName] = value ? value.map(item => item.value || item) : []
                        break
                    case 'switch':
                    case 'interruptor':
                        newCard[fieldName] = value || false
                        break
                    case 'hora':
                    case 'time':
                        newCard[fieldName] = value ? value.toISOString() : null
                        break
                    case 'data e hora':
                    case 'datetime':
                        newCard[fieldName] = value ? value.toISOString() : null
                        break
                    default:
                        newCard[fieldName] = value || ''
                        break
                }
            })
            newCard.comments = comments
            newCard.attachments = attachments
            newCard.pendingItems = pendingItems
            
            // Save the current field configuration snapshot for this project
            newCard.fieldConfiguration = activeFields

            console.log('New card created:', newCard)

            const newData = cloneDeep(data)
            // Add to the first board (Triagem de Documentos)
            const firstBoardKey = Object.keys(newData)[0]
            console.log('Adding to board:', firstBoardKey)
            
            // Set the correct status for the project based on the board it's being added to
            newCard.status = firstBoardKey
            
            newData[firstBoardKey].push(newCard)
            updateColumns(newData)
            
            // Save individual project to backend
            try {
                // Format the data for the database (similar to registro-civil)
                const projectData = {
                    id: newCard.id, // Ensure id is included
                    name: newCard.name,
                    description: newCard.description || '',
                    status: newCard.status,
                    projectId: newCard.projectId || newCard.id,
                    boardOrder: newCard.boardOrder || 0,
                    members: JSON.stringify(newCard.members || []),
                    labels: JSON.stringify(newCard.labels || []),
                    attachments: JSON.stringify(newCard.attachments || []),
                    comments: JSON.stringify(newCard.comments || []),
                    activity: JSON.stringify(newCard.activity || []),
                    pendingItems: JSON.stringify(newCard.pendingItems || []),
                    fieldConfiguration: JSON.stringify(newCard.fieldConfiguration || []),
                    dueDate: newCard.dueDate,
                    assignedTo: newCard.assignedTo,
                    label: newCard.label,
                    projectType: 'scrum-board', // Set project type for scrum board projects
                    // Add all dynamic fields
                    ...Object.keys(newCard).reduce((acc, key) => {
                        if (!['id', 'name', 'description', 'status', 'projectId', 'boardOrder', 'members', 'labels', 'attachments', 'comments', 'activity', 'pendingItems', 'fieldConfiguration', 'dueDate', 'assignedTo', 'label', 'createdAt'].includes(key)) {
                            acc[key] = newCard[key]
                        }
                        return acc
                    }, {})
                }

                console.log('Creating project with data:', projectData)
                
                const response = await fetch('/api/projects/scrum-board/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(projectData),
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    throw new Error(`Failed to create project in database: ${errorData.error || 'Unknown error'}`);
                }
                
                const createdProject = await response.json();
                console.log('New ticket created and saved to backend successfully:', createdProject.id);
                
                // Refresh data from database to get all boards
                try {
                    const refreshResponse = await fetch('/api/projects/scrum-board');
                    if (refreshResponse.ok) {
                        const refreshedData = await refreshResponse.json();
                        console.log('Refreshed data from database:', refreshedData);
                        
                        // Separate regular boards from finalized boards
                        const regularBoards = {};
                        const finalizedBoards = {};
                        
                        Object.keys(refreshedData).forEach(boardName => {
                            if (boardName === 'Concluídas' || boardName === 'Canceladas') {
                                finalizedBoards[boardName] = refreshedData[boardName];
                            } else {
                                regularBoards[boardName] = refreshedData[boardName];
                            }
                        });
                        
                        // Update regular boards
                        updateColumns(regularBoards);
                        
                        // Update finalized boards if they exist
                        if (Object.keys(finalizedBoards).length > 0) {
                            const { updateFinalizedColumns } = useScrumBoardStore.getState();
                            updateFinalizedColumns(finalizedBoards);
                        }
                    }
                } catch (refreshError) {
                    console.error('Error refreshing data from database:', refreshError);
                }
            } catch (error) {
                console.error('Error saving new ticket to backend:', error);
            }
            
            closeDialog()
            await sleep(1000)
            setSelectedBoard('')
        } catch (error) {
            console.error('Error in form submission:', error)
        }
    }

    return (
        <Form onSubmit={handleSubmit(onFormSubmit)}>
            <div>
                
                {/* Header */}
                <div className="flex gap-2 mb-10">
                    <div className="w-full">
                        <div className="flex justify-between">
                        <Controller
                                name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                        placeholder="Nome do Projeto"
                                        className="text-xl font-bold border-0 p-0 bg-transparent focus:ring-0 focus:border-0"
                                    {...field}
                                />
                            )}
                        />
                            {errors.title && (
                                <span className="text-red-500 text-sm mt-1">{errors.title.message}</span>
                            )}
                    </div>
                        </div>
                    </div>

                {/* Content */}
                <ScrollBar className="max-h-[600px] overflow-y-auto">
                    <div className="flex flex-col gap-6">
                    {/* Atendente */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[200px]">
                            Atendente:
                        </div>
                        <div className="flex items-center gap-1">
                            <UsersAvatarGroup avatarProps={{ size: 25 }} users={selectedMembers} />
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
                                       {(users || []).map((member) => {
                                           const isSelected = selectedMembers.find(m => m.id === member.id)
                                           return (
                                    <Dropdown.Item
                                        key={member.id}
                                        eventKey={member.id}
                                                   onSelect={() => {
                                                       if (isSelected) {
                                                           handleRemoveMember(member.id)
                                                       } else {
                                                           handleAddMember(member)
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
                    </div>

                    {/* Dynamic Fields from Configuration */}
                    {activeFields.map(renderField)}

                    {/* Pendências */}
                    <div className="flex flex-col">
                        <div className="flex items-center min-h-[30px]">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[200px]">
                                Pendências:
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl text-gray-400">
                                    <TbCircleCheck />
                                </div>
                                <Input
                                    ref={pendingInputRef}
                                    type="text"
                                    placeholder="Adicionar nova pendência..."
                                    value={newPendingItem}
                                    onChange={(e) => setNewPendingItem(e.target.value)}
                                    onKeyPress={handlePendingKeyPress}
                                    className="w-[295px]"
                                    style={{ textTransform: 'uppercase' }}
                                />
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        addPendingItem()
                                    }}
                                    disabled={!newPendingItem.trim()}
                                    type="button"
                                >
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                        
                        {/* Pending items list */}
                        {pendingItems.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2 ml-[150px]">
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
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs className="mt-6" defaultValue="comments">
                    <TabList>
                        <TabNav value="comments">Comentários</TabNav>
                        <TabNav value="attachments">Anexos</TabNav>
                    </TabList>
                    <div className="p-4">
                        <TabContent value="comments">
                            <div className="w-full">
                                {comments && comments.length > 0 && (
                                    <>
                                        {comments.map((comment) => (
                                            <div
                                                key={comment.id}
                                                className="mb-3 flex"
                                            >
                                                <div className="mt-2">
                                                    <Avatar
                                                        shape="circle"
                                                        src={comment.src}
                                                    />
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
                                                    </div>
                                                    <p className="mb-0">
                                                        {comment.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                <div className="mb-3 flex gap-2">
                                    <Avatar
                                        shape="circle"
                                        src={currentUser?.img || ''}
                                    />
                                    <div className="w-full relative">
                                        <Input
                                            ref={commentInput}
                                            textArea
                                            placeholder="Comente algo"
                                        />
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
                        </TabContent>
                        <TabContent value="attachments">
                            {attachments && attachments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                    {attachments.map((file) => {
                                        const isImage = file.file.type.startsWith('image/')
                                        const isPDF = file.file.type === 'application/pdf'
                                        
                                        return (
                                            <Card
                                                key={file.id}
                                                bodyClass="px-3 pt-3 pb-1"
                                                className="bg-gray-100 dark:bg-gray-700 shadow-none"
                                                bordered={false}
                                            >
                                                {isImage ? (
                                                    <img
                                                        className="max-w-full rounded-lg"
                                                        alt={file.name}
                                                        src={file.src}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-32 bg-gray-200 dark:bg-gray-600 rounded-lg">
                                                        {isPDF ? (
                                                            <div className="text-center">
                                                                <div className="text-4xl text-red-500 mb-2">📄</div>
                                                                <div className="text-sm text-gray-600 dark:text-gray-300">PDF</div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <div className="text-4xl text-gray-500 mb-2">📎</div>
                                                                <div className="text-sm text-gray-600 dark:text-gray-300">Arquivo</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="mt-1 flex justify-between items-center">
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {file.name}
                                                        </div>
                                                        <span className="text-xs">
                                                            {file.size}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Tooltip title="Download">
                                                            <Button
                                                                variant="plain"
                                                                size="xs"
                                                                icon={<TbDownload />}
                                                                onClick={() => handleDownloadAttachment(file)}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <Button
                                                                variant="plain"
                                                                size="xs"
                                                                icon={<TbTrash />}
                                                                onClick={() => handleRemoveAttachment(file.id)}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
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
                <div className="text-right mt-4">
                    <Button
                        variant="plain"
                        onClick={closeDialog}
                        className="mr-2 rtl:ml-2"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        type="submit"
                    >
                        Adicionar
                    </Button>
                </div>
                </ScrollBar>
            </div>
        </Form>
    )
}

export default AddNewTicketContent

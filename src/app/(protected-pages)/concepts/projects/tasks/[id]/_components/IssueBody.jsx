'use client'
import { useState, useRef, useEffect } from 'react'
import { useIssueStore } from '../_store/issueStore'
import { useScrumBoardUsers } from '../../../scrum-board/_hooks/useScrumBoardUsers'
import { useProjectStore } from '../../../_store/projectStore'
import { useBoardColors } from '../../../scrum-board/_contexts/BoardColorsContext'
import { useFieldConfigStore } from '../../../scrum-board/_store/fieldConfigStore'
import useUserStore from '@/stores/userStore'
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
import RichTextEditor from '@/components/shared/RichTextEditor'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import Tooltip from '@/components/ui/Tooltip'
import IssueField from './IssueField'
import IssueFieldDropdown from './IssueFieldDropdown'
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
} from 'react-icons/tb'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { createActivityEntry, addActivityToProject, ACTIVITY_TYPES } from '@/utils/activityUtils'

// Board colors and names are now dynamic from database





// AddMoreMember component (exact copy from kanban dialog)
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

const IssueBody = () => {
    const descriptionInput = useRef(null)

    const { issueData, updateIssueData } = useIssueStore()
    
    // Local state for immediate UI updates (same pattern as kanban dialog)
    const [localIssueData, setLocalIssueData] = useState(issueData)
    
    // Initialize local state when component first loads (same pattern as kanban dialog)
    useEffect(() => {
        if (issueData && Object.keys(issueData).length > 0) {
            const processedData = {
                ...issueData,
                // Ensure empreendimento is uppercased on initial load
                empreendimento: typeof issueData.empreendimento === 'string' ? issueData.empreendimento.toUpperCase() : issueData.empreendimento
            }
            setLocalIssueData(processedData)
        }
    }, []) // Only run once on mount
    
    // Sync E-protocolo input value with local state
    useEffect(() => {
        setEProtocoloInputValue(localIssueData?.eProtocolo || '')
    }, [localIssueData?.eProtocolo])
    
    // Sync Empreendimento input value with local state
    useEffect(() => {
        const value = localIssueData?.empreendimento || ''
        setEmpreendimentoInputValue(typeof value === 'string' ? value.toUpperCase() : value)
    }, [localIssueData?.empreendimento])
    
    // Sync Vencimento Matrícula input value with local state
    useEffect(() => {
        setVencimentoMatriculaInputValue(localIssueData?.vencimentoMatricula || [])
    }, [localIssueData?.vencimentoMatricula])
    
    // Sync Envio ITBI/Escritura input value with local state
    useEffect(() => {
        setEnvioITBIEscrituraInputValue(localIssueData?.envioITBIEscritura || '')
    }, [localIssueData?.envioITBIEscritura])
    
    // Sync Escritura Pago input value with local state
    useEffect(() => {
        setEscrituraPagoInputValue(localIssueData?.escrituraPago || false)
    }, [localIssueData?.escrituraPago])
    
    // Sync Minuta Aprovada input value with local state
    useEffect(() => {
        setMinutaAprovadaInputValue(localIssueData?.minutaAprovada || false)
    }, [localIssueData?.minutaAprovada])
    
    // Sync Data Envio para Registro input value with local state
    useEffect(() => {
        setDataEnvioRegistroInputValue(localIssueData?.dataEnvioRegistro || '')
    }, [localIssueData?.dataEnvioRegistro])
    
    // Sync Ordem input value with local state
    useEffect(() => {
        setOrdemInputValue(localIssueData?.ordem || '')
    }, [localIssueData?.ordem])
    
    // Sync Unidade input value with local state
    useEffect(() => {
        setUnidadeInputValue(localIssueData?.unidade || '')
    }, [localIssueData?.unidade])
    
    // Sync Natureza input value with local state
    useEffect(() => {
        setNaturezaInputValue(localIssueData?.natureza || '')
    }, [localIssueData?.natureza])
    
    // Sync Código de Validação ITBI input value with local state
    useEffect(() => {
        setCodigoValidacaoITBIInputValue(localIssueData?.codigoValidacaoITBI || '')
    }, [localIssueData?.codigoValidacaoITBI])
    
    // Sync ITBI Pago input value with local state
    useEffect(() => {
        setItbiPagoInputValue(localIssueData?.itbiPago || false)
    }, [localIssueData?.itbiPago])
    
    // Sync Envio Minuta input value with local state
    useEffect(() => {
        setEnvioMinutaInputValue(localIssueData?.envioMinuta || '')
    }, [localIssueData?.envioMinuta])
    
    // Sync Data Lavratura input value with local state
    useEffect(() => {
        setDataLavraturaInputValue(localIssueData?.dataLavratura || '')
    }, [localIssueData?.dataLavratura])
    
    // Sync Status ONR input value with local state
    useEffect(() => {
        setStatusONRInputValue(localIssueData?.statusONR || '')
    }, [localIssueData?.statusONR])
    
    
    // Get real users from the dedicated hook (same as kanban)
    const { users, hasUsers } = useScrumBoardUsers()
    
    // Get members from project store as fallback (same as kanban)
    const { allMembers } = useProjectStore()
    
    // Get current user for activity logging
    const { currentUser } = useUserStore()
    
    // Get field configuration
    const { fieldConfig } = useFieldConfigStore()
    
    // Get board colors and scrum board data
    const { boardColors } = useBoardColors()
    const { scrumBoardData } = useProjectStore()
    
    // Get available boards from scrum board data
    const availableBoards = scrumBoardData ? Object.keys(scrumBoardData) : []
    
    // Get board color class dynamically
    const getBoardColorClass = (boardName) => {
        const color = boardColors[boardName] || 'gray'
        const colorMap = {
            'gray': 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
            'purple': 'bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100',
            'blue': 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100',
            'yellow': 'bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100',
            'pink': 'bg-pink-100 dark:bg-pink-800 text-pink-900 dark:text-pink-100',
            'indigo': 'bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100',
            'green': 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100',
            'orange': 'bg-orange-100 dark:bg-orange-800 text-orange-900 dark:text-orange-100',
            'red': 'bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-100',
        }
        return colorMap[color] || 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
    }
    
    // Use the exact same logic as kanban dialog
    const memberList = hasUsers ? users : (allMembers.length > 0 ? allMembers : [])
    
    // No need for selectedMembers state - using issueData.members directly like kanban dialog

    // Debug logging
    console.log('IssueBody - Debug Info:', {
        users: users?.length || 0,
        hasUsers,
        allMembers: allMembers?.length || 0,
        memberList: memberList?.length || 0,
        issueMembers: issueData.members?.length || 0,
        assignees: issueData.assignees?.length || 0
    })

    // Early return if issueData is not available yet
    if (!issueData || Object.keys(issueData).length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <p>Loading project data...</p>
            </div>
        )
    }

    const [editDescription, setEditDescription] = useState(false)
    const [ordemInputValue, setOrdemInputValue] = useState(issueData?.ordem || '')
    const [eProtocoloInputValue, setEProtocoloInputValue] = useState(issueData?.eProtocolo || '')
    const [empreendimentoInputValue, setEmpreendimentoInputValue] = useState(issueData?.empreendimento || '')
    const [unidadeInputValue, setUnidadeInputValue] = useState(issueData?.unidade || '')
    const [custasInputValue, setCustasInputValue] = useState(issueData?.custas || '')
    const [naturezaInputValue, setNaturezaInputValue] = useState(issueData?.natureza || '')
    const [vencimentoMatriculaInputValue, setVencimentoMatriculaInputValue] = useState(issueData?.vencimentoMatricula || [])
    const [codigoValidacaoITBIInputValue, setCodigoValidacaoITBIInputValue] = useState(issueData?.codigoValidacaoITBI || '')
    const [envioITBIEscrituraInputValue, setEnvioITBIEscrituraInputValue] = useState(issueData?.envioITBIEscritura || '')
    const [itbiPagoInputValue, setItbiPagoInputValue] = useState(issueData?.itbiPago || false)
    const [escrituraPagoInputValue, setEscrituraPagoInputValue] = useState(issueData?.escrituraPago || false)
    const [envioMinutaInputValue, setEnvioMinutaInputValue] = useState(issueData?.envioMinuta || '')
    const [minutaAprovadaInputValue, setMinutaAprovadaInputValue] = useState(issueData?.minutaAprovada || false)
    const [dataLavraturaInputValue, setDataLavraturaInputValue] = useState(issueData?.dataLavratura || '')
    const [dataEnvioRegistroInputValue, setDataEnvioRegistroInputValue] = useState(issueData?.dataEnvioRegistro || '')
    const [statusONRInputValue, setStatusONRInputValue] = useState(issueData?.statusONR || '')
    const [newPendingItem, setNewPendingItem] = useState('')
    const [focusedField, setFocusedField] = useState(null)
    const [originalFieldValues, setOriginalFieldValues] = useState({})

    // Sync local state with issueData (excluding fields that use local state pattern)
    useEffect(() => {
        // setOrdemInputValue(issueData?.ordem || '') // Using local state pattern
        // setEProtocoloInputValue(issueData?.eProtocolo || '') // Using local state pattern
        // setEmpreendimentoInputValue(issueData?.empreendimento || '') // Using local state pattern
        // setUnidadeInputValue(issueData?.unidade || '') // Using local state pattern
        // setCustasInputValue(issueData?.custas || '') // Using local state pattern (dropdown)
        // setNaturezaInputValue(issueData?.natureza || '') // Using local state pattern
        // setVencimentoMatriculaInputValue(issueData?.vencimentoMatricula || '') // Using local state pattern
        // setCodigoValidacaoITBIInputValue(issueData?.codigoValidacaoITBI || '') // Using local state pattern
        // setEnvioITBIEscrituraInputValue(issueData?.envioITBIEscritura || '') // Using local state pattern
        // setItbiPagoInputValue(issueData?.itbiPago || false) // Using local state pattern
        // setEscrituraPagoInputValue(issueData?.escrituraPago || false) // Using local state pattern
        // setEnvioMinutaInputValue(issueData?.envioMinuta || '') // Using local state pattern
        // setMinutaAprovadaInputValue(issueData?.minutaAprovada || false) // Using local state pattern
        // setDataLavraturaInputValue(issueData?.dataLavratura || '') // Using local state pattern
        // setDataEnvioRegistroInputValue(issueData?.dataEnvioRegistro || '') // Using local state pattern
        // setStatusONRInputValue(issueData?.statusONR || '') // Using local state pattern
    }, [])

    // Sync eProtocoloInputValue with localIssueData.eProtocolo to fix the reload issue
    useEffect(() => {
        if (localIssueData?.eProtocolo !== undefined) {
            setEProtocoloInputValue(localIssueData.eProtocolo || '')
        }
    }, [localIssueData?.eProtocolo])

    const createNewData = () => {
        return { ...issueData }
    }

    // Helper function to get the E-protocolo field configuration for this specific project
    const getEProtocoloFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'eProtocolo')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'eProtocolo')
    }

    // Helper function to get the Data de Entrada field configuration for this specific project
    const getEntryDateFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'entryDate')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'entryDate')
    }

    // Helper function to get the Empreendimento field configuration for this specific project
    const getEmpreendimentoFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'empreendimento')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'empreendimento')
    }

    // Helper function to get the Custas field configuration for this specific project
    const getCustasFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'custas')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'custas')
    }

    // Helper function to get the Vencimento Matrícula field configuration for this specific project
    const getVencimentoMatriculaFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'vencimentoMatricula')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'vencimentoMatricula')
    }

    // Helper function to get the Envio ITBI/Escritura field configuration for this specific project
    const getEnvioITBIEscrituraFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'envioITBIEscritura')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'envioITBIEscritura')
    }

    // Helper function to get the Escritura Pago field configuration for this specific project
    const getEscrituraPagoFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'escrituraPago')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'escrituraPago')
    }

    // Helper function to get the Minuta Aprovada field configuration for this specific project
    const getMinutaAprovadaFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'minutaAprovada')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'minutaAprovada')
    }

    // Helper function to get the Data Envio para Registro field configuration for this specific project
    const getDataEnvioRegistroFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'dataEnvioRegistro')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'dataEnvioRegistro')
    }

    // Helper function to get the Tipo field configuration for this specific project
    const getTipoFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'tipo')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'tipo')
    }

    // Helper function to get the Ordem field configuration for this specific project
    const getOrdemFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'ordem')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'ordem')
    }

    // Helper function to get the Unidade field configuration for this specific project
    const getUnidadeFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'unidade')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'unidade')
    }

    // Helper function to get the Natureza field configuration for this specific project
    const getNaturezaFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'natureza')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'natureza')
    }

    // Helper function to get the Código de Validação ITBI field configuration for this specific project
    const getCodigoValidacaoITBIFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'codigoValidacaoITBI')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'codigoValidacaoITBI')
    }

    // Helper function to get the ITBI Pago field configuration for this specific project
    const getItbiPagoFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'itbiPago')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'itbiPago')
    }

    // Helper function to get the Envio Minuta field configuration for this specific project
    const getEnvioMinutaFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'envioMinuta')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'envioMinuta')
    }

    // Helper function to get the Data Lavratura field configuration for this specific project
    const getDataLavraturaFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'dataLavratura')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'dataLavratura')
    }

    // Helper function to get the Status ONR field configuration for this specific project
    const getStatusONRFieldConfig = () => {
        if (issueData && issueData.fieldConfiguration) {
            // Use the field configuration that was saved when this project was created
            return issueData.fieldConfiguration.find(field => field.fieldName === 'statusONR')
        }
        // Fallback to current field configuration for projects created before this feature
        return fieldConfig.find(field => field.fieldName === 'statusONR')
    }

    const saveToAllViews = (newData) => {
        // Set flag to prevent event handler from running
        window.isIssuePageUpdating = true;
        
        // Save to localStorage for persistence across all views
        try {
            const { scrumboardData } = require('@/mock/data/projectsData');
            let currentScrumboardData = scrumboardData;
            
            try {
                const storedData = localStorage.getItem('scrumboardData');
                if (storedData) {
                    currentScrumboardData = JSON.parse(storedData);
                }
            } catch (error) {
                console.log('Using original mock data');
            }

            // Find and update the project in the current data
            console.log('Issue page: Looking for project with id:', newData.id, 'or projectId:', newData.projectId);
            for (const boardName in currentScrumboardData) {
                const board = currentScrumboardData[boardName];
                const projectIndex = board.findIndex(p => p.id === newData.id || p.projectId === newData.projectId);
                console.log('Issue page: Checking board:', boardName, 'found project at index:', projectIndex);
                if (projectIndex !== -1) {
                    // Update only the specific fields that changed to reduce data size
                    const existingProject = currentScrumboardData[boardName][projectIndex];
                    console.log('Issue page: Existing project members:', existingProject.members);
                    console.log('Issue page: New data members:', newData.members);
                    
                    const updatedProject = {
                        ...existingProject,
                        // Only update the fields that actually changed
                        ...(newData.name && { name: newData.name }),
                        ...(newData.description && { description: newData.description }),
                        ...(newData.status && { status: newData.status }),
                        ...(newData.tipo && { tipo: newData.tipo }),
                        ...(newData.ordem && { ordem: newData.ordem }),
                        ...(newData.eProtocolo !== undefined && { eProtocolo: newData.eProtocolo }),
                        ...(newData.empreendimento !== undefined && { empreendimento: newData.empreendimento }),
                        ...(newData.unidade && { unidade: newData.unidade }),
                        ...(newData.custas && { custas: newData.custas }),
                        ...(newData.natureza && { natureza: newData.natureza }),
                        ...(newData.vencimentoMatricula !== undefined && { vencimentoMatricula: newData.vencimentoMatricula }),
                        ...(newData.codigoValidacaoITBI && { codigoValidacaoITBI: newData.codigoValidacaoITBI }),
                        ...(newData.envioITBIEscritura !== undefined && { envioITBIEscritura: newData.envioITBIEscritura }),
                        ...(newData.itbiPago !== undefined && { itbiPago: newData.itbiPago }),
                        ...(newData.escrituraPago !== undefined && { escrituraPago: newData.escrituraPago }),
                        ...(newData.envioMinuta && { envioMinuta: newData.envioMinuta }),
                        ...(newData.minutaAprovada !== undefined && { minutaAprovada: newData.minutaAprovada }),
                        ...(newData.dataLavratura && { dataLavratura: newData.dataLavratura }),
                        ...(newData.dataEnvioRegistro && { dataEnvioRegistro: newData.dataEnvioRegistro }),
                        ...(newData.statusONR && { statusONR: newData.statusONR }),
                        ...(newData.pendingItems && { pendingItems: newData.pendingItems }),
                        ...(newData.dueDate && { dueDate: newData.dueDate }),
                        ...(newData.entryDate !== undefined && { entryDate: newData.entryDate }),
                        ...(newData.members && { members: newData.members }),
                        ...(newData.comments && { comments: newData.comments }),
                        ...(newData.attachments && { attachments: newData.attachments }),
                        // Preserve activity array if it exists in newData
                        ...(newData.activity && { activity: newData.activity }),
                    };
                    
                    console.log('Issue page: Updated project members:', updatedProject.members);
                    
                    // Handle entryDate specifically - if it's provided in newData, use it
                    if (newData.entryDate !== undefined) {
                        updatedProject.entryDate = newData.entryDate;
                        console.log('Issue page: Set entryDate to:', newData.entryDate);
                    }
                    
                    currentScrumboardData[boardName][projectIndex] = updatedProject;
                    console.log('Issue page: Updated project:', updatedProject);
                    
                    // Save to localStorage with better error handling
                    try {
                        // Check localStorage size before saving
                        const dataToSave = JSON.stringify(currentScrumboardData);
                        const dataSize = new Blob([dataToSave]).size;
                        const maxSize = 4 * 1024 * 1024; // 4MB limit
                        
                        if (dataSize > maxSize) {
                            console.warn('Data size too large, clearing localStorage first');
                            localStorage.clear();
                        }
                        
                        localStorage.setItem('scrumboardData', dataToSave);
                        
                        // Dispatch custom event to notify other components
                        const event = new Event('scrumboardDataChanged');
                        window.dispatchEvent(event);
                        
                        // Also dispatch ticketDataChanged event for kanban dialog updates
                        const ticketEvent = new CustomEvent('ticketDataChanged', {
                            detail: { newData: currentScrumboardData }
                        });
                        window.dispatchEvent(ticketEvent);
                        
                        // Try to save to backend
                        try {
                            const ProjectDataService = require('@/services/ProjectDataService').default;
                            ProjectDataService.saveScrumboardData(currentScrumboardData);
                            console.log('Project updated and saved to all views');
                        } catch (error) {
                            console.log('Project updated (saved to localStorage)');
                        }
                        
                    } catch (localStorageError) {
                        console.error('localStorage quota exceeded or error:', localStorageError);
                        // If localStorage fails, just dispatch the event
                        try {
                            window.dispatchEvent(new Event('scrumboardDataChanged'));
                            console.log('Event dispatched without localStorage save');
                        } catch (eventError) {
                            console.error('Failed to dispatch event:', eventError);
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error saving to all views:', error);
        } finally {
            // Always reset the flag after a short delay to allow other components to process the event
            setTimeout(() => {
                window.isIssuePageUpdating = false;
                console.log('Issue page: Reset isIssuePageUpdating flag');
            }, 100);
        }
    }



    const handleChangeStatusClick = async (value) => {
        const oldStatus = localIssueData.status
        const newData = { ...localIssueData, status: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        // Add activity entry for status change with current user
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_STATUS, {
            projectId: newData.projectId || newData.id,
            oldStatus,
            newStatus: value,
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Move project to the new board in the scrumboard data
        try {
            // Import the mock data directly
            const { scrumboardData } = await import('@/mock/data/projectsData');
            
            // Get current data from localStorage or use original mock data
            let currentScrumboardData = scrumboardData;
            try {
                const storedData = localStorage.getItem('scrumboardData');
                if (storedData) {
                    currentScrumboardData = JSON.parse(storedData);
                }
            } catch (error) {
                console.log('Using original mock data');
            }
            
            // Find the project in the current board and remove it
            let projectToMove = null;
            let currentBoard = null;
            
            for (const boardName in currentScrumboardData) {
                const board = currentScrumboardData[boardName];
                const projectIndex = board.findIndex(p => p.id === newData.id || p.projectId === newData.projectId);
                if (projectIndex !== -1) {
                    projectToMove = board[projectIndex];
                    currentBoard = boardName;
                    board.splice(projectIndex, 1);
                    break;
                }
            }
            
            if (projectToMove && currentBoard !== value) {
                // Add the project to the new board
                if (!currentScrumboardData[value]) {
                    currentScrumboardData[value] = [];
                }
                currentScrumboardData[value].push(updatedData);
                
                // Save to localStorage for persistence
                localStorage.setItem('scrumboardData', JSON.stringify(currentScrumboardData));
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('scrumboardDataChanged'));
                
                // Try to save to backend if available
                try {
                    const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                    await ProjectDataService.saveScrumboardData(currentScrumboardData);
                    console.log(`Project moved from ${currentBoard} to ${value} and saved to backend`);
                } catch (backendError) {
                    console.log(`Project moved from ${currentBoard} to ${value} (saved to localStorage)`);
                }
            }
        } catch (error) {
            console.error('Error moving project between boards:', error);
        }
    }



    // Exact same functions as kanban dialog
    const onAddMemberClick = async (id) => {
        console.log('Adding member with id:', id)
        console.log('Available memberList:', memberList)
        const newMember = memberList.find((member) => member.id === id)
        console.log('Found member:', newMember)
        
        if (newMember && localIssueData) {
            const oldMembers = localIssueData.members || []
            const newIssueData = { ...localIssueData, members: [newMember] }
            setLocalIssueData(newIssueData)
            
            console.log('Issue page: Atendente changed to:', newMember.name)
            
            // Add activity entry for field update
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: newIssueData.projectId || newIssueData.id,
                field: 'atendente',
                oldValue: oldMembers.map(m => m.name).join(', ') || 'Nenhum',
                newValue: newMember.name,
            }, currentUser)
            const updatedIssueData = addActivityToProject(newIssueData, activityEntry)
            setLocalIssueData(updatedIssueData)
            
            // Update store state immediately to prevent UI revert
            updateIssueData(updatedIssueData)
            
            // Debounce the save to prevent too many rapid saves (same pattern as other fields)
            if (window.issueAtendenteTimeout) {
                clearTimeout(window.issueAtendenteTimeout);
            }
            window.issueAtendenteTimeout = setTimeout(async () => {
                try {
                    const { scrumboardData } = await import('@/mock/data/projectsData');
                    let currentScrumboardData = scrumboardData;
                    try {
                        const storedData = localStorage.getItem('scrumboardData');
                        if (storedData) { currentScrumboardData = JSON.parse(storedData); }
                    } catch (error) { console.log('Using original mock data'); }
                    
                    // Find the project in any board
                    let projectFound = false;
                    for (const boardName in currentScrumboardData) {
                        if (currentScrumboardData[boardName]) {
                            const projectIndex = currentScrumboardData[boardName].findIndex(p => p.id === localIssueData.id || p.projectId === localIssueData.projectId);
                            if (projectIndex !== -1) {
                                currentScrumboardData[boardName][projectIndex] = {
                                    ...currentScrumboardData[boardName][projectIndex],
                                    members: [newMember],
                                    activity: updatedIssueData.activity || []
                                };
                                projectFound = true;
                                break;
                            }
                        }
                    }
                    
                    if (projectFound) {
                        localStorage.setItem('scrumboardData', JSON.stringify(currentScrumboardData));
                        window.dispatchEvent(new Event('scrumboardDataChanged'));
                        console.log('Issue page: scrumboardDataChanged event dispatched for atendente');
                        try {
                            const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                            await ProjectDataService.saveScrumboardData(currentScrumboardData);
                        } catch (error) { console.log('Backend save failed, but localStorage updated'); }
                    }
                } catch (localStorageError) {
                    console.error('localStorage quota exceeded or error:', localStorageError);
                    try {
                        localStorage.clear();
                        localStorage.setItem('scrumboardData', JSON.stringify(currentScrumboardData));
                    } catch (clearError) {
                        console.error('Failed to clear localStorage:', clearError);
                    }
                }
            }, 500); // Wait 500ms before saving
        }
    }

    const onRemoveMemberClick = async (memberToRemove) => {
        console.log('Removing member:', memberToRemove)
        
        if (localIssueData) {
            const oldMembers = localIssueData.members || []
            const newMembers = localIssueData.members?.filter(member => member.id !== memberToRemove.id) || []
            const newIssueData = { 
                ...localIssueData, 
                members: newMembers
            }
            setLocalIssueData(newIssueData)
            
            console.log('Issue page: Atendente removed:', memberToRemove.name)
            
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
            updateIssueData(updatedIssueData)
            
            // Debounce the save to prevent too many rapid saves (same pattern as other fields)
            if (window.issueAtendenteTimeout) {
                clearTimeout(window.issueAtendenteTimeout);
            }
            window.issueAtendenteTimeout = setTimeout(async () => {
                try {
                    const { scrumboardData } = await import('@/mock/data/projectsData');
                    let currentScrumboardData = scrumboardData;
                    try {
                        const storedData = localStorage.getItem('scrumboardData');
                        if (storedData) { currentScrumboardData = JSON.parse(storedData); }
                    } catch (error) { console.log('Using original mock data'); }
                    
                    // Find the project in any board
                    let projectFound = false;
                    for (const boardName in currentScrumboardData) {
                        if (currentScrumboardData[boardName]) {
                            const projectIndex = currentScrumboardData[boardName].findIndex(p => p.id === localIssueData.id || p.projectId === localIssueData.projectId);
                            if (projectIndex !== -1) {
                                currentScrumboardData[boardName][projectIndex] = {
                                    ...currentScrumboardData[boardName][projectIndex],
                                    members: newMembers,
                                    activity: updatedIssueData.activity || []
                                };
                                projectFound = true;
                                break;
                            }
                        }
                    }
                    
                    if (projectFound) {
                        localStorage.setItem('scrumboardData', JSON.stringify(currentScrumboardData));
                        window.dispatchEvent(new Event('scrumboardDataChanged'));
                        console.log('Issue page: scrumboardDataChanged event dispatched for atendente removal');
                        try {
                            const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                            await ProjectDataService.saveScrumboardData(currentScrumboardData);
                        } catch (error) { console.log('Backend save failed, but localStorage updated'); }
                    }
                } catch (localStorageError) {
                    console.error('localStorage quota exceeded or error:', localStorageError);
                    try {
                        localStorage.clear();
                        localStorage.setItem('scrumboardData', JSON.stringify(currentScrumboardData));
                    } catch (clearError) {
                        console.error('Failed to clear localStorage:', clearError);
                    }
                }
            }, 500); // Wait 500ms before saving
        }
    }

    const handleDueDateChange = (date) => {
        const newData = createNewData()
        // Use ISO date string for consistency with kanban and tasks pages
        newData.entryDate = date ? date.toISOString() : null // Primary field for consistency
        newData.dueDate = date ? date.toISOString() : null // Keep for backward compatibility
        updateIssueData(newData)
        
        console.log('Issue page: Date changed to:', date ? date.toISOString() : null);
        
        // Clear localStorage periodically to prevent quota issues
        try {
            const keysToKeep = ['scrumboardData'];
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {
                        // Ignore errors when removing keys
                    }
                }
            });
        } catch (error) {
            console.log('Error clearing localStorage:', error);
        }
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveTimeout) {
            clearTimeout(window.saveTimeout);
        }
        window.saveTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleEntryDateChange = (date) => {
        const oldValue = localIssueData.entryDate ? dayjs(localIssueData.entryDate).format('DD/MM/YYYY') : 'vazio';
        const newData = { ...localIssueData, entryDate: date ? date.toISOString() : null }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Entry date changed to:', date ? date.toISOString() : null);
        console.log('Issue page: newData object:', newData);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'entryDate',
            oldValue,
            newValue: date ? dayjs(date).format('DD/MM/YYYY') : 'vazio',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveEntryDateTimeout) {
            clearTimeout(window.saveEntryDateTimeout);
        }
        window.saveEntryDateTimeout = setTimeout(() => {
            console.log('Issue page: About to call saveToAllViews with:', updatedData);
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleTipoChange = (value) => {
        const oldValue = localIssueData.tipo || 'vazio';
        const newData = { ...localIssueData, tipo: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Tipo changed to:', value);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'tipo',
            oldValue,
            newValue: value,
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveTipoTimeout) {
            clearTimeout(window.saveTipoTimeout);
        }
        window.saveTipoTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleOrdemChange = (value) => {
        const newData = { ...localIssueData, ordem: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Ordem changed to:', value);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveOrdemTimeout) {
            clearTimeout(window.saveOrdemTimeout);
        }
        window.saveOrdemTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleOrdemBlur = () => {
        const originalValue = originalFieldValues.ordem || 'vazio';
        const newValue = ordemInputValue;
        
        if (originalValue !== newValue) {
            console.log('Ordem activity logging:', { originalValue, newValue });
            // Add activity entry for field update
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'ordem',
                oldValue: originalValue,
                newValue: newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleEProtocoloChange = (value) => {
        console.log('E-protocolo change debug:', { value, eProtocoloInputValue });
        const oldValue = localIssueData.eProtocolo || 'vazio';
        const newData = { ...localIssueData, eProtocolo: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: E-protocolo changed to:', value);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'eProtocolo',
            oldValue: oldValue && oldValue !== 'vazio' ? dayjs(oldValue).format('DD/MM/YYYY') : oldValue,
            newValue: value ? dayjs(value).format('DD/MM/YYYY') : value,
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveEProtocoloTimeout) {
            clearTimeout(window.saveEProtocoloTimeout);
        }
        window.saveEProtocoloTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleEProtocoloBlur = () => {
        const originalValue = originalFieldValues.eProtocolo || 'vazio';
        const newValue = eProtocoloInputValue;
        
        console.log('E-protocolo blur debug:', { originalValue, newValue, eProtocoloInputValue });
        
        if (originalValue !== newValue) {
            console.log('E-protocolo activity logging:', { originalValue, newValue });
            // Add activity entry for field update
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'eProtocolo',
                oldValue: originalValue && originalValue !== 'vazio' ? dayjs(originalValue).format('DD/MM/YYYY') : originalValue,
                newValue: newValue && newValue !== 'vazio' ? dayjs(newValue).format('DD/MM/YYYY') : newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleCustasBlur = () => {
        const originalValue = originalFieldValues.custas || 'vazio';
        const newValue = localIssueData.custas || '';
        
        console.log('Custas blur debug:', { originalValue, newValue });
        
        if (originalValue !== newValue) {
            console.log('Custas activity logging:', { originalValue, newValue });
            // Add activity entry for field update
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'custas',
                oldValue: originalValue,
                newValue: newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleEmpreendimentoChange = (value) => {
        console.log('handleEmpreendimentoChange called with:', value, 'type:', typeof value)
        const newData = { ...localIssueData, empreendimento: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Empreendimento changed to:', value);
        console.log('Issue page: New data empreendimento:', newData.empreendimento);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveEmpreendimentoTimeout) {
            clearTimeout(window.saveEmpreendimentoTimeout);
        }
        window.saveEmpreendimentoTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            console.log('Saving empreendimento to all views:', newData.empreendimento)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleEmpreendimentoBlur = () => {
        const originalValue = originalFieldValues.empreendimento || 'vazio';
        const newValue = typeof empreendimentoInputValue === 'string' ? empreendimentoInputValue.toUpperCase() : empreendimentoInputValue;
        
        if (originalValue !== newValue) {
            console.log('Empreendimento activity logging:', { originalValue, newValue });
            // Add activity entry for field update
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'empreendimento',
                oldValue: originalValue,
                newValue: newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleUnidadeChange = (value) => {
        const newData = { ...localIssueData, unidade: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Unidade changed to:', value);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveUnidadeTimeout) {
            clearTimeout(window.saveUnidadeTimeout);
        }
        window.saveUnidadeTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleUnidadeBlur = () => {
        const originalValue = originalFieldValues.unidade || 'vazio';
        const newValue = unidadeInputValue;
        if (originalValue !== newValue) {
            console.log('Unidade activity logging:', { originalValue, newValue });
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'unidade',
                oldValue: originalValue,
                newValue: newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleCustasChange = (value) => {
        const newData = { ...localIssueData, custas: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Custas changed to:', value);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveCustasTimeout) {
            clearTimeout(window.saveCustasTimeout);
        }
        window.saveCustasTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }


    const handleNaturezaChange = (value) => {
        const newData = { ...localIssueData, natureza: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Natureza changed to:', value);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveNaturezaTimeout) {
            clearTimeout(window.saveNaturezaTimeout);
        }
        window.saveNaturezaTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleNaturezaBlur = () => {
        const originalValue = originalFieldValues.natureza || 'vazio';
        const newValue = naturezaInputValue;
        if (originalValue !== newValue) {
            console.log('Natureza activity logging:', { originalValue, newValue });
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'natureza',
                oldValue: originalValue,
                newValue: newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleVencimentoMatriculaChange = (value) => {
        const newData = { ...localIssueData, vencimentoMatricula: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Vencimento Matrícula changed to:', value);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveVencimentoMatriculaTimeout) {
            clearTimeout(window.saveVencimentoMatriculaTimeout);
        }
        window.saveVencimentoMatriculaTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleVencimentoMatriculaBlur = () => {
        setFocusedField(null)
        
        // Log the change if there was one
        const originalValue = originalFieldValues.vencimentoMatricula
        const currentValue = localIssueData.vencimentoMatricula
        
        if (originalValue !== currentValue) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'vencimentoMatricula',
                oldValue: Array.isArray(originalValue) ? originalValue.join(', ') : (originalValue || 'vazio'),
                newValue: Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue || 'vazio'),
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleCodigoValidacaoITBIChange = (value) => {
        const newData = { ...localIssueData, codigoValidacaoITBI: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Código de Validação ITBI changed to:', value);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveCodigoValidacaoITBITimeout) {
            clearTimeout(window.saveCodigoValidacaoITBITimeout);
        }
        window.saveCodigoValidacaoITBITimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleCodigoValidacaoITBIBlur = () => {
        const originalValue = originalFieldValues.codigoValidacaoITBI || 'vazio';
        const newValue = codigoValidacaoITBIInputValue;
        if (originalValue !== newValue) {
            console.log('Código de Validação ITBI activity logging:', { originalValue, newValue });
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'codigoValidacaoITBI',
                oldValue: originalValue,
                newValue: newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    const handleEnvioITBIEscrituraChange = (date) => {
        const oldValue = localIssueData.envioITBIEscritura ? dayjs(localIssueData.envioITBIEscritura).format('DD/MM/YYYY') : 'vazio';
        const newData = { ...localIssueData, envioITBIEscritura: date ? dayjs(date).toISOString() : null }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Envio ITBI/Escritura changed to:', date);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'envioITBIEscritura',
            oldValue,
            newValue: date ? dayjs(date).format('DD/MM/YYYY') : 'vazio',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveEnvioITBIEscrituraTimeout) {
            clearTimeout(window.saveEnvioITBIEscrituraTimeout);
        }
        window.saveEnvioITBIEscrituraTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleItbiPagoChange = (value) => {
        const oldValue = localIssueData.itbiPago || false;
        const newData = { ...localIssueData, itbiPago: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: ITBI Pago? changed to:', value);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'itbiPago',
            oldValue: oldValue ? 'Sim' : 'Não',
            newValue: value ? 'Sim' : 'Não',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveItbiPagoTimeout) {
            clearTimeout(window.saveItbiPagoTimeout);
        }
        window.saveItbiPagoTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleEscrituraPagoChange = (value) => {
        const oldValue = localIssueData.escrituraPago || false;
        const newData = { ...localIssueData, escrituraPago: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Escritura Pago? changed to:', value);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'escrituraPago',
            oldValue: oldValue ? 'Sim' : 'Não',
            newValue: value ? 'Sim' : 'Não',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveEscrituraPagoTimeout) {
            clearTimeout(window.saveEscrituraPagoTimeout);
        }
        window.saveEscrituraPagoTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleEnvioMinutaChange = (date) => {
        const oldValue = localIssueData.envioMinuta ? dayjs(localIssueData.envioMinuta).format('DD/MM/YYYY') : 'vazio';
        const newData = { ...localIssueData, envioMinuta: date ? dayjs(date).toISOString() : null }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Envio Minuta changed to:', date);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'envioMinuta',
            oldValue,
            newValue: date ? dayjs(date).format('DD/MM/YYYY') : 'vazio',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveEnvioMinutaTimeout) {
            clearTimeout(window.saveEnvioMinutaTimeout);
        }
        window.saveEnvioMinutaTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleMinutaAprovadaChange = (value) => {
        const oldValue = localIssueData.minutaAprovada || false;
        const newData = { ...localIssueData, minutaAprovada: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Minuta Aprovada? changed to:', value);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'minutaAprovada',
            oldValue: oldValue ? 'Sim' : 'Não',
            newValue: value ? 'Sim' : 'Não',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveMinutaAprovadaTimeout) {
            clearTimeout(window.saveMinutaAprovadaTimeout);
        }
        window.saveMinutaAprovadaTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleDataLavraturaChange = (date) => {
        const oldValue = localIssueData.dataLavratura ? dayjs(localIssueData.dataLavratura).format('DD/MM/YYYY') : 'vazio';
        const newData = { ...localIssueData, dataLavratura: date ? dayjs(date).toISOString() : null }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Data Lavratura changed to:', date);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'dataLavratura',
            oldValue,
            newValue: date ? dayjs(date).format('DD/MM/YYYY') : 'vazio',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveDataLavraturaTimeout) {
            clearTimeout(window.saveDataLavraturaTimeout);
        }
        window.saveDataLavraturaTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleDataEnvioRegistroChange = (date) => {
        const oldValue = localIssueData.dataEnvioRegistro ? dayjs(localIssueData.dataEnvioRegistro).format('DD/MM/YYYY') : 'vazio';
        const newData = { ...localIssueData, dataEnvioRegistro: date ? dayjs(date).toISOString() : null }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Data Envio para Registro changed to:', date);
        
        // Add activity entry for field update
        const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
            projectId: newData.projectId || newData.id,
            field: 'dataEnvioRegistro',
            oldValue,
            newValue: date ? dayjs(date).format('DD/MM/YYYY') : 'vazio',
        }, currentUser)
        const updatedData = addActivityToProject(newData, activityEntry)
        
        // Update local state with activity
        setLocalIssueData(updatedData)
        
        // Update store state
        updateIssueData(updatedData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveDataEnvioRegistroTimeout) {
            clearTimeout(window.saveDataEnvioRegistroTimeout);
        }
        window.saveDataEnvioRegistroTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        }, 500); // Wait 500ms before saving
    }

    const handleStatusONRChange = (value) => {
        const newData = { ...localIssueData, statusONR: value }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        console.log('Issue page: Status ONR changed to:', value);
        
        // Update store state
        updateIssueData(newData)
        
        // Debounce the save to prevent too many rapid saves
        if (window.saveStatusONRTimeout) {
            clearTimeout(window.saveStatusONRTimeout);
        }
        window.saveStatusONRTimeout = setTimeout(() => {
            // Save to all views (kanban and tasks)
            saveToAllViews(newData)
        }, 500); // Wait 500ms before saving
    }

    const handleStatusONRBlur = () => {
        const originalValue = originalFieldValues.statusONR || 'vazio';
        const newValue = statusONRInputValue;
        if (originalValue !== newValue) {
            console.log('Status ONR activity logging:', { originalValue, newValue });
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_FIELD, {
                projectId: localIssueData.projectId || localIssueData.id,
                field: 'statusONR',
                oldValue: originalValue,
                newValue: newValue || 'vazio',
            }, currentUser)
            const updatedData = addActivityToProject(localIssueData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            saveToAllViews(updatedData)
        }
    }

    // Counter for deterministic ID generation
    let issueBodyUidCounter = 0
    
    const createUID = (length) => {
        issueBodyUidCounter++
        return `issue${issueBodyUidCounter}`
    }

    const addPendingItem = () => {
        console.log('Issue page: addPendingItem called with:', newPendingItem);
        if (newPendingItem.trim()) {
            const newItem = {
                id: createUID(10),
                text: newPendingItem.trim().toUpperCase(),
                completed: false,
                createdAt: new Date()
            }
            console.log('Issue page: Created new item:', newItem);
            
            const currentPendingItems = localIssueData.pendingItems || [];
            console.log('Issue page: Current pending items:', currentPendingItems);
            
            const updatedPendingItems = [...currentPendingItems, newItem]
            console.log('Issue page: Updated pending items:', updatedPendingItems);
            
            const newData = { ...localIssueData, pendingItems: updatedPendingItems }
            console.log('Issue page: New data with pending items:', newData);
            
            // Update local state immediately for UI response (same pattern as member field)
            setLocalIssueData(newData)
            
            // Add activity entry for adding pending item
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.ADD_PENDING_ITEM, {
                projectId: newData.projectId || newData.id,
                text: newItem.text,
            }, currentUser)
            const updatedData = addActivityToProject(newData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            
            setNewPendingItem('')
            
            console.log('Issue page: Added pending item:', newItem);
            
            // Save to all views (kanban and tasks) immediately
            saveToAllViews(updatedData)
        } else {
            console.log('Issue page: newPendingItem is empty or only whitespace');
        }
    }

    const togglePendingItem = (itemId) => {
        const item = (localIssueData.pendingItems || []).find(item => item.id === itemId)
        const updatedPendingItems = (localIssueData.pendingItems || []).map(item => 
            item.id === itemId 
                ? { ...item, completed: !item.completed }
                : item
        )
        
        const newData = { ...localIssueData, pendingItems: updatedPendingItems }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        // Add activity entry for toggling pending item
        if (item) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.TOGGLE_PENDING_ITEM, {
                projectId: newData.projectId || newData.id,
                text: item.text,
                completed: !item.completed,
            }, currentUser)
            const updatedData = addActivityToProject(newData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            
            // Save to all views (kanban and tasks) immediately
            saveToAllViews(updatedData)
        } else {
            // Update store state
            updateIssueData(newData)
            
            // Save to all views (kanban and tasks) immediately
            saveToAllViews(newData)
        }
    }

    const removePendingItem = (itemId) => {
        const item = (localIssueData.pendingItems || []).find(item => item.id === itemId)
        const updatedPendingItems = (localIssueData.pendingItems || []).filter(item => item.id !== itemId)
        
        const newData = { ...localIssueData, pendingItems: updatedPendingItems }
        
        // Update local state immediately for UI response (same pattern as member field)
        setLocalIssueData(newData)
        
        // Add activity entry for removing pending item
        if (item) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.REMOVE_PENDING_ITEM, {
                projectId: newData.projectId || newData.id,
                text: item.text,
            }, currentUser)
            const updatedData = addActivityToProject(newData, activityEntry)
            
            // Update local state with activity
            setLocalIssueData(updatedData)
            
            // Update store state
            updateIssueData(updatedData)
            
            // Save to all views (kanban and tasks) immediately
            saveToAllViews(updatedData)
        } else {
            // Update store state
            updateIssueData(newData)
            
            // Save to all views (kanban and tasks) immediately
            saveToAllViews(newData)
        }
        
        console.log('Issue page: Removed pending item:', itemId);
    }

    const handlePendingKeyPress = (e) => {
        if (e.key === 'Enter') {
            addPendingItem()
        }
    }

    const handleDescriptionChange = (value) => {
        const newData = createNewData()
        newData.description = value
        updateIssueData(newData)
    }

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                },
                orderedList: {
                    keepMarks: true,
                },
            }),
        ],
        editorProps: {
            attributes: {
                class: 'm-2 focus:outline-hidden',
            },
        },
        content: issueData.description,
        onUpdate({ editor }) {
            handleDescriptionChange(editor.getHTML())
        },
    })

    const handleDescriptionClick = () => {
        setEditDescription(true)
        editor?.chain().focus()
    }

    return (
        <div>
            <div className="grid grid-cols-1 xl:grid-cols-2">
                <div className="flex flex-col">
                    <div className="mb-2">
                    <IssueFieldDropdown
                        title="Status"
                            icon={<TbClipboardCheck />}
                            width="w-[60px]"
                        dropdownTrigger={
                                <div className="w-[270px]">
                            <Tag
                                        className={getBoardColorClass(localIssueData.status)}
                            >
                                        {localIssueData.status}
                            </Tag>
                                </div>
                        }
                    >
                        {availableBoards.map((board) => (
                            <Dropdown.Item
                                key={board}
                                eventKey={board}
                                    active={board === localIssueData.status}
                                onSelect={handleChangeStatusClick}
                            >
                                <div className="flex items-center relative">
                                        <Tag className={getBoardColorClass(board)}>
                                        {board}
                                    </Tag>
                                </div>
                            </Dropdown.Item>
                        ))}
                    </IssueFieldDropdown>
                    </div>
                    <div className="mb-2">
                        <IssueField 
                        title="Atendente" 
                        icon={<TbUser />}>
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
                                {memberList.length !==
                                    localIssueData.members?.length && (
                                    <Dropdown
                                        renderTitle={<AddMoreMember />}
                                    >
                                        {memberList.map(
                                            (member) =>
                                                !localIssueData.members?.some(
                                                    (m) =>
                                                        m.id === member.id,
                                                ) && (
                                        <Dropdown.Item
                                                        key={member.name}
                                            eventKey={member.id}
                                                        onSelect={
                                                            onAddMemberClick
                                                        }
                                                    >
                                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Avatar
                                                    shape="circle"
                                                                    size={
                                                                        22
                                                                    }
                                                                    src={
                                                                        member.img
                                                                    }
                                                />
                                                <span className="ml-2 rtl:mr-2">
                                                                    {
                                                                        member.name
                                                                    }
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
                     <div className="mb-1">
                        {(() => {
                            const eProtocoloConfig = getEProtocoloFieldConfig()
                            if (!eProtocoloConfig) {
                                // Fallback to original hardcoded field if no configuration found
                                return (
                                    <IssueField title="E-protocolo" icon={<TbClipboardText />}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold pointer-events-none">{eProtocoloInputValue}</span>
                            <Input
                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                style={{ caretColor: 'black' }}
                                value={eProtocoloInputValue}
                                onChange={(e) => {
                                                    const value = e.target.value.toUpperCase();
                                    setEProtocoloInputValue(value);
                                    handleEProtocoloChange(value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                    setFocusedField('eProtocolo');
                                    setOriginalFieldValues(prev => ({
                                        ...prev,
                                                        eProtocolo: localIssueData.eProtocolo || ''
                                    }));
                                }}
                                onBlur={() => {
                                    setFocusedField(null);
                                    handleEProtocoloBlur();
                                }}
                            />
                        </div>
                    </IssueField>
                                )
                            }

                            const { nome, tipo } = eProtocoloConfig
                            const fieldValue = eProtocoloInputValue || ''

                            // Get the appropriate icon based on field type
                            const getFieldIcon = () => {
                                switch (tipo.toLowerCase()) {
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

                            switch (tipo.toLowerCase()) {
                                case 'checkbox':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <Checkbox
                                                    checked={fieldValue === 'true' || fieldValue === true}
                                                    onChange={(checked) => {
                                                        setEProtocoloInputValue(checked)
                                                        handleEProtocoloChange(checked)
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'radio':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <Radio.Group
                                                    value={fieldValue}
                                                    onChange={(value) => {
                                                        setEProtocoloInputValue(value)
                                                        handleEProtocoloChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                    className="flex flex-wrap gap-2"
                                                >
                                                    {eProtocoloConfig.options?.map((option) => (
                                                        <Radio
                                                            key={option.value}
                                                            value={option.value}
                                                            className="flex items-center"
                                                        >
                                                            {option.label}
                                                        </Radio>
                                                    ))}
                                                </Radio.Group>
                                            </div>
                                        </IssueField>
                                    )
                                case 'multiselect':
                                case 'seleção múltipla':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className="w-[295px]">
                                                <Select
                                                    isMulti
                                                    instanceId={`multiselect-eProtocolo`}
                                                    placeholder=""
                                                    className="w-full"
                                                    options={eProtocoloConfig.options || []}
                                                    value={Array.isArray(fieldValue) ? fieldValue.map(val => 
                                                        typeof val === 'string' ? { value: val, label: val } : val
                                                    ) : []}
                                                    onChange={(selectedOptions) => {
                                                        const values = selectedOptions ? selectedOptions.map(option => option.value || option) : []
                                                        setEProtocoloInputValue(values)
                                                        handleEProtocoloChange(values)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || []
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'switch':
                                case 'interruptor':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <Switcher
                                                    checked={fieldValue === 'true' || fieldValue === true}
                                                    onChange={(checked) => {
                                                        setEProtocoloInputValue(checked)
                                                        handleEProtocoloChange(checked)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || false
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'email':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className={`font-semibold pointer-events-none ${focusedField === 'eProtocolo' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                                <Input
                                                    type="email"
                                                    className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                    style={{ 
                                                        caretColor: 'black',
                                                        color: focusedField === 'eProtocolo' ? 'black' : 'transparent'
                                                    }}
                                                    value={fieldValue}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setEProtocoloInputValue(value)
                                                        handleEProtocoloChange(value)
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select()
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'data':
                                case 'date':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className="font-semibold">
                                                    {fieldValue ? 
                                                        dayjs(fieldValue).format('DD/MM/YYYY') : 
                                                        ''
                                                    }
                                                </span>
                                                <DatePicker
                                                    className="opacity-0 cursor-pointer absolute"
                                                    placeholder=""
                                                    value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                    onChange={(date) => {
                                                        const value = date.toISOString()
                                                        setEProtocoloInputValue(value)
                                                        handleEProtocoloChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'hora':
                                case 'time':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className="font-semibold">
                                                    {fieldValue ? 
                                                        dayjs(fieldValue).format('HH:mm') : 
                                                        ''
                                                    }
                                                </span>
                                                <TimeInput
                                                    className="opacity-0 cursor-pointer absolute"
                                                    value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                    onChange={(date) => {
                                                        const value = date.toISOString()
                                                        setEProtocoloInputValue(value)
                                                        handleEProtocoloChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'data e hora':
                                case 'datetime':
                                    const { DateTimepicker } = DatePicker
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className="font-semibold">
                                                    {fieldValue ? 
                                                        dayjs(fieldValue).format('DD/MM/YYYY HH:mm') : 
                                                        ''
                                                    }
                                                </span>
                                                <DateTimepicker
                                                    className="opacity-0 cursor-pointer absolute"
                                                    placeholder=""
                                                    value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                    onChange={(date) => {
                                                        const value = date.toISOString()
                                                        setEProtocoloInputValue(value)
                                                        handleEProtocoloChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'número':
                                case 'number':
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className={`font-semibold pointer-events-none ${focusedField === 'eProtocolo' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                                <Input
                                                    className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                    style={{ 
                                                        caretColor: 'black',
                                                        color: focusedField === 'eProtocolo' ? 'black' : 'transparent'
                                                    }}
                                                    value={fieldValue}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^0-9]/g, '')
                                                        setEProtocoloInputValue(value)
                                                        handleEProtocoloChange(value)
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select()
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                    inputMode="numeric"
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'dropdown':
                                    return (
                                        <IssueFieldDropdown
                                            title={nome}
                                            icon={getFieldIcon()}
                                            dropdownTrigger={
                                                <div className="w-[270px]">
                                                    <Tag
                                                        className={`${fieldValue === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                                   fieldValue === 'DIVERSAS' ? 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100' : 
                                                                   'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                                    >
                                                        {fieldValue || 'Selecionar'}
                                                    </Tag>
                                                </div>
                                            }
                                        >
                                            {(eProtocoloConfig.options || ['ALPHA', 'DIVERSAS']).map((option) => {
                                                const optionValue = typeof option === 'object' ? option.value : option
                                                const optionLabel = typeof option === 'object' ? option.label : option
                                                return (
                                                    <Dropdown.Item
                                                        key={optionValue}
                                                        eventKey={optionValue}
                                                        active={optionValue === fieldValue}
                                                        onSelect={handleEProtocoloChange}
                                                    >
                                                        <div className="flex items-center relative">
                                                            <Tag className={`${optionValue === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                                           'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100'}`}>
                                                                {optionLabel}
                                                            </Tag>
                                                        </div>
                                                    </Dropdown.Item>
                                                )
                                            })}
                                        </IssueFieldDropdown>
                                    )
                                default:
                                    return (
                                        <IssueField title={nome} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'eProtocolo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className={`font-semibold pointer-events-none ${focusedField === 'eProtocolo' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                                <Input
                                                    className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                    style={{ 
                                                        caretColor: 'black', 
                                                        textTransform: 'uppercase',
                                                        color: focusedField === 'eProtocolo' ? 'black' : 'transparent'
                                                    }}
                                                    value={fieldValue}
                                                    onChange={(e) => {
                                                        const value = e.target.value.toUpperCase()
                                                        setEProtocoloInputValue(value)
                                                        handleEProtocoloChange(value)
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select()
                                                        setFocusedField('eProtocolo')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            eProtocolo: localIssueData.eProtocolo || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEProtocoloBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                            }
                        })()}
                    </div>
                     <div className="mb-0.1">
                        {(() => {
                            const empreendimentoConfig = getEmpreendimentoFieldConfig()
                            if (!empreendimentoConfig) {
                                // Fallback to original hardcoded field if no configuration found
                                return (
                                    <IssueField title="Empreendimento" icon={<TbBuilding />}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold pointer-events-none">{empreendimentoInputValue}</span>
                            <Input
                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                style={{ caretColor: 'black' }}
                                value={empreendimentoInputValue}
                                onChange={(e) => {
                                                    const value = e.target.value.toUpperCase();
                                    setEmpreendimentoInputValue(value);
                                    handleEmpreendimentoChange(value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                    setFocusedField('empreendimento');
                                    // Store the original value when focusing
                                    setOriginalFieldValues(prev => ({
                                        ...prev,
                                                        empreendimento: localIssueData.empreendimento || ''
                                    }));
                                }}
                                onBlur={() => {
                                    setFocusedField(null);
                                    handleEmpreendimentoBlur();
                                }}
                            />
                        </div>
                    </IssueField>
                                )
                            }

                            // Dynamic field based on configuration
                            const { nome, tipo } = empreendimentoConfig
                            const fieldValue = (empreendimentoInputValue || '').toString()

                            // Get the appropriate icon based on field type
                            const getFieldIcon = () => {
                                switch (tipo.toLowerCase()) {
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
                                        return <TbBuilding />
                                }
                            }

                            switch (tipo.toLowerCase()) {
                                case 'data':
                                case 'date':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className="font-semibold">
                                                    {fieldValue ? 
                                                        dayjs(fieldValue).format('DD/MM/YYYY') : 
                                                        ''
                                                    }
                                                </span>
                                                <DatePicker
                                                    className="opacity-0 cursor-pointer absolute"
                                                    value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                    onChange={(date) => {
                                                        const value = date.toISOString()
                                                        setEmpreendimentoInputValue(value)
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'dropdown':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className="w-[295px]">
                                                <Select
                                                    instanceId={`dropdown-empreendimento`}
                                                    placeholder=""
                                                    className="w-full"
                                                    options={empreendimentoConfig.options || []}
                                                    value={empreendimentoConfig.options?.find(option => option.value === fieldValue) || null}
                                                    onChange={(selectedOption) => {
                                                        const value = selectedOption ? selectedOption.value : ''
                                                        setEmpreendimentoInputValue(value)
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'checkbox':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <Checkbox
                                                    checked={fieldValue === 'true' || fieldValue === true}
                                                    onChange={(checked) => {
                                                        setEmpreendimentoInputValue(checked)
                                                        handleEmpreendimentoChange(checked)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || false
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'radio':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <Radio.Group
                                                    value={fieldValue}
                                                    onChange={(value) => {
                                                        setEmpreendimentoInputValue(value)
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                    className="flex flex-wrap gap-2"
                                                >
                                                    {empreendimentoConfig.options?.map((option) => (
                                                        <Radio
                                                            key={option.value}
                                                            value={option.value}
                                                            className="flex items-center"
                                                        >
                                                            {option.label}
                                                        </Radio>
                                                    ))}
                                                </Radio.Group>
                                            </div>
                                        </IssueField>
                                    )
                                case 'multiselect':
                                case 'seleção múltipla':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className="w-[295px]">
                                                <Select
                                                    isMulti
                                                    instanceId={`multiselect-empreendimento`}
                                                    placeholder=""
                                                    className="w-full"
                                                    options={empreendimentoConfig.options || []}
                                                    value={Array.isArray(fieldValue) ? fieldValue.map(val => 
                                                        typeof val === 'string' ? { value: val, label: val } : val
                                                    ) : []}
                                                    onChange={(selectedOptions) => {
                                                        const values = selectedOptions ? selectedOptions.map(option => option.value || option) : []
                                                        setEmpreendimentoInputValue(values)
                                                        handleEmpreendimentoChange(values)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || []
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'switch':
                                case 'interruptor':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <Switcher
                                                    checked={fieldValue === 'true' || fieldValue === true}
                                                    onChange={(checked) => {
                                                        setEmpreendimentoInputValue(checked)
                                                        handleEmpreendimentoChange(checked)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || false
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'email':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className={`font-semibold pointer-events-none ${focusedField === 'empreendimento' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                                <Input
                                                    type="email"
                                                    className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                    style={{ 
                                                        caretColor: 'black',
                                                        color: focusedField === 'empreendimento' ? 'black' : 'transparent'
                                                    }}
                                                    value={fieldValue}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setEmpreendimentoInputValue(value)
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select()
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'hora':
                                case 'time':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className="font-semibold">
                                                    {fieldValue ? 
                                                        dayjs(fieldValue).format('HH:mm') : 
                                                        ''
                                                    }
                                                </span>
                                                <TimeInput
                                                    className="opacity-0 cursor-pointer absolute"
                                                    value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                    onChange={(date) => {
                                                        const value = date.toISOString()
                                                        setEmpreendimentoInputValue(value)
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'data e hora':
                                case 'datetime':
                                    const { DateTimepicker } = DatePicker
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className="font-semibold">
                                                    {fieldValue ? 
                                                        dayjs(fieldValue).format('DD/MM/YYYY HH:mm') : 
                                                        ''
                                                    }
                                                </span>
                                                <DateTimepicker
                                                    className="opacity-0 cursor-pointer absolute"
                                                    placeholder=""
                                                    value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                    onChange={(date) => {
                                                        const value = date.toISOString()
                                                        setEmpreendimentoInputValue(value)
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                case 'número':
                                case 'number':
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className={`font-semibold pointer-events-none ${focusedField === 'empreendimento' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                                <Input
                                                    className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                    style={{ 
                                                        caretColor: 'black',
                                                        color: focusedField === 'empreendimento' ? 'black' : 'transparent'
                                                    }}
                                                    value={fieldValue}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^0-9]/g, '')
                                                        setEmpreendimentoInputValue(value)
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select()
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                    inputMode="numeric"
                                                />
                                            </div>
                                        </IssueField>
                                    )
                                default:
                                    // Default to text field
                                    return (
                                        <IssueField title={nome || "Empreendimento"} icon={getFieldIcon()}>
                                            <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                                focusedField === 'empreendimento' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}>
                                                <span className={`font-semibold pointer-events-none ${focusedField === 'empreendimento' ? 'opacity-0' : 'opacity-100'}`} style={{ textTransform: 'uppercase' }}>{fieldValue}</span>
                                                <Input
                                                    className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                    style={{ 
                                                        caretColor: 'black', 
                                                        textTransform: 'uppercase',
                                                        color: focusedField === 'empreendimento' ? 'black' : 'transparent'
                                                    }}
                                                    value={fieldValue}
                                                    onChange={(e) => {
                                                        const value = e.target.value.toUpperCase()
                                                        console.log('Empreendimento onChange:', { originalValue: e.target.value, uppercasedValue: value })
                                                        handleEmpreendimentoChange(value)
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select()
                                                        setFocusedField('empreendimento')
                                                        setOriginalFieldValues(prev => ({
                                                            ...prev,
                                                            empreendimento: localIssueData.empreendimento || ''
                                                        }))
                                                    }}
                                                    onBlur={() => {
                                                        setFocusedField(null)
                                                        handleEmpreendimentoBlur()
                                                    }}
                                                    spellCheck={false}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </IssueField>
                                    )
                            }
                        })()}
                        </div>
                    <div className="mb-0.1">
                    {(() => {
                        const custasConfig = getCustasFieldConfig()
                        if (!custasConfig) {
                            // Fallback to original hardcoded dropdown if no configuration found
                            return (
                                <IssueFieldDropdown
                                    title="Custas"
                                    icon={<TbReportMoney />}
                                    dropdownTrigger={
                                        <div className="w-[270px]">
                                            <Tag
                                                className={`${localIssueData.custas === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                           localIssueData.custas === 'CLIENTE' ? 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100' : 
                                                           'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                            >
                                                {localIssueData.custas || 'Selecionar'}
                                            </Tag>
                                        </div>
                                    }
                                >
                                    {['ALPHA', 'CLIENTE'].map((option) => (
                                        <Dropdown.Item
                                            key={option}
                                            eventKey={option}
                                            active={option === localIssueData.custas}
                                            onSelect={handleCustasChange}
                                        >
                                            <div className="flex items-center relative">
                                                <Tag className={`${option === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                               'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100'}`}>
                                                    {option}
                                                </Tag>
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                                </IssueFieldDropdown>
                            )
                        }

                        // Dynamic field based on configuration
                        const { nome, tipo } = custasConfig
                        const fieldValue = localIssueData.custas || ''

                        // Get the appropriate icon based on field type
                        const getFieldIcon = () => {
                            switch (tipo.toLowerCase()) {
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
                                    return <TbReportMoney />
                            }
                        }

                        switch (tipo.toLowerCase()) {
                            case 'data':
                            case 'date':
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <span className="font-semibold">
                                                {fieldValue ? 
                                                    dayjs(fieldValue).format('DD/MM/YYYY') : 
                                                    ''
                                                }
                                            </span>
                                            <DatePicker
                                                className="opacity-0 cursor-pointer absolute"
                                                value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                onChange={(date) => {
                                                    const value = date.toISOString()
                                                    handleCustasChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'dropdown':
                                return (
                                    <IssueFieldDropdown
                                        title={nome || "Custas"}
                                        icon={getFieldIcon()}
                                        dropdownTrigger={
                                            <div className="w-[270px]">
                                                <Tag
                                                    className={`${fieldValue === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                               fieldValue === 'DIVERSAS' ? 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100' : 
                                                               'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                                >
                                                    {fieldValue || 'Selecionar'}
                                                </Tag>
                                            </div>
                                        }
                                    >
                                        {(custasConfig.options || []).map((option) => (
                                            <Dropdown.Item
                                                key={option.value || option}
                                                eventKey={option.value || option}
                                                active={option.value === fieldValue || option === fieldValue}
                                                onSelect={(value) => {
                                                    handleCustasChange(value)
                                                }}
                                            >
                                                {option.label || option}
                                            </Dropdown.Item>
                                        ))}
                                    </IssueFieldDropdown>
                                )
                            case 'checkbox':
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <Checkbox
                                                checked={fieldValue === 'true' || fieldValue === true}
                                                onChange={(checked) => {
                                                    handleCustasChange(checked)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || false
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'radio':
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <Radio.Group
                                                value={fieldValue}
                                                onChange={(value) => {
                                                    handleCustasChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                                className="flex flex-wrap gap-2"
                                            >
                                                {custasConfig.options?.map((option) => (
                                                    <Radio
                                                        key={option.value}
                                                        value={option.value}
                                                        className="flex items-center"
                                                    >
                                                        {option.label}
                                                    </Radio>
                                                ))}
                                            </Radio.Group>
                                        </div>
                                    </IssueField>
                                )
                            case 'multiselect':
                            case 'seleção múltipla':
                                return (
                                    <IssueFieldDropdown
                                        title={nome || "Custas"}
                                        icon={getFieldIcon()}
                                        dropdownTrigger={
                                            <div className="w-[270px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(fieldValue) && fieldValue.length > 0 ? (
                                                        fieldValue.map((val, index) => (
                                                            <Tag
                                                                key={index}
                                                                className="bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                                                            >
                                                                {val}
                                                            </Tag>
                                                        ))
                                                    ) : (
                                                        <Tag className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                                            Selecionar
                                                        </Tag>
                                                    )}
                                                </div>
                                            </div>
                                        }
                                    >
                                        {(custasConfig.options || []).map((option) => (
                                            <Dropdown.Item
                                                key={option.value || option}
                                                eventKey={option.value || option}
                                                active={Array.isArray(fieldValue) && fieldValue.includes(option.value || option)}
                                                onSelect={(value) => {
                                                    const currentValues = Array.isArray(fieldValue) ? fieldValue : []
                                                    const newValues = currentValues.includes(value) 
                                                        ? currentValues.filter(v => v !== value)
                                                        : [...currentValues, value]
                                                    handleCustasChange(newValues)
                                                }}
                                            >
                                                {option.label || option}
                                            </Dropdown.Item>
                                        ))}
                                    </IssueFieldDropdown>
                                )
                            case 'switch':
                            case 'interruptor':
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <Switcher
                                                checked={fieldValue === 'true' || fieldValue === true}
                                                onChange={(checked) => {
                                                    handleCustasChange(checked)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || false
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'email':
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <span className={`font-semibold pointer-events-none ${focusedField === 'custas' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                            <Input
                                                type="email"
                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                style={{ 
                                                    caretColor: 'black',
                                                    color: focusedField === 'custas' ? 'black' : 'transparent'
                                                }}
                                                value={fieldValue}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    handleCustasChange(value)
                                                }}
                                                onFocus={(e) => {
                                                    e.target.select()
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'hora':
                            case 'time':
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <span className="font-semibold">
                                                {fieldValue ? 
                                                    dayjs(fieldValue).format('HH:mm') : 
                                                    ''
                                                }
                                            </span>
                                            <TimeInput
                                                className="opacity-0 cursor-pointer absolute"
                                                value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                onChange={(date) => {
                                                    const value = date.toISOString()
                                                    handleCustasChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'data e hora':
                            case 'datetime':
                                const { DateTimepicker } = DatePicker
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <span className="font-semibold">
                                                {fieldValue ? 
                                                    dayjs(fieldValue).format('DD/MM/YYYY HH:mm') : 
                                                    ''
                                                }
                                            </span>
                                            <DateTimepicker
                                                className="opacity-0 cursor-pointer absolute"
                                                placeholder=""
                                                value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                onChange={(date) => {
                                                    const value = date.toISOString()
                                                    handleCustasChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'número':
                            case 'number':
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <span className={`font-semibold pointer-events-none ${focusedField === 'custas' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                            <Input
                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                style={{ 
                                                    caretColor: 'black',
                                                    color: focusedField === 'custas' ? 'black' : 'transparent'
                                                }}
                                                value={fieldValue}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                                    handleCustasChange(value)
                                                }}
                                                onFocus={(e) => {
                                                    e.target.select()
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                                inputMode="numeric"
                                            />
                                        </div>
                                    </IssueField>
                                )
                            default:
                                // Default to text field
                                return (
                                    <IssueField title={nome || "Custas"} icon={getFieldIcon()}>
                                        <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                            focusedField === 'custas' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                            <span className={`font-semibold pointer-events-none ${focusedField === 'custas' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                            <Input
                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                style={{ 
                                                    caretColor: 'black',
                                                    color: focusedField === 'custas' ? 'black' : 'transparent'
                                                }}
                                                value={fieldValue}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    handleCustasChange(value)
                                                }}
                                                onFocus={(e) => {
                                                    e.target.select()
                                                    setFocusedField('custas')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        custas: localIssueData.custas || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    setFocusedField(null)
                                                    handleCustasBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                        }
                    })()}
                    </div>
                    <div className="mb-0.1">
                    {(() => {
                        const vencimentoMatriculaConfig = getVencimentoMatriculaFieldConfig()
                        if (!vencimentoMatriculaConfig) {
                            // Fallback to original hardcoded date field if no configuration found
                            return (
                                <IssueField titleHtml="Vencimento<br/>Matrícula" icon={<TbCalendar />}>
                                    <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <span className="font-semibold">
                                            {vencimentoMatriculaInputValue ? 
                                                dayjs(vencimentoMatriculaInputValue).format('DD/MM/YYYY') : 
                                                ''
                                            }
                                        </span>
                                        <DatePicker
                                            className="opacity-0 cursor-pointer absolute"
                                            value={vencimentoMatriculaInputValue ? 
                                                dayjs(vencimentoMatriculaInputValue).toDate() : 
                                                dayjs().toDate()
                                            }
                                            inputtable={false}
                                            inputPrefix={null}
                                            inputSuffix={null}
                                            clearable={false}
                                            onChange={(date) => {
                                                const value = date.toISOString()
                                                handleVencimentoMatriculaChange(value)
                                            }}
                                            onFocus={() => {
                                                setFocusedField('vencimentoMatricula')
                                                setOriginalFieldValues(prev => ({
                                                    ...prev,
                                                    vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                }))
                                            }}
                                            onBlur={() => {
                                                handleVencimentoMatriculaBlur()
                                            }}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo, nome } = vencimentoMatriculaConfig
                        const fieldValue = vencimentoMatriculaInputValue || ''
                        
                        // Helper function to get field icon
                        const getFieldIcon = () => {
                            switch (tipo.toLowerCase()) {
                                case 'date':
                                case 'data':
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
                                case 'número':
                                case 'number':
                                    return <TbReportMoney />
                                default:
                                    return <TbClipboardText />
                            }
                        }

                        switch (tipo.toLowerCase()) {
                            case 'date':
                            case 'data':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span className="font-semibold">
                                                {fieldValue ? 
                                                    dayjs(fieldValue).format('DD/MM/YYYY') : 
                                                    ''
                                                }
                                            </span>
                                            <DatePicker
                                                className="opacity-0 cursor-pointer absolute"
                                                value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                onChange={(date) => {
                                                    const value = date.toISOString()
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'dropdown':
                                return (
                                    <IssueFieldDropdown
                                        titleHtml="Vencimento<br/>Matrícula"
                                        icon={getFieldIcon()}
                                        dropdownTrigger={
                                            <div className="w-[270px]">
                                                <Tag
                                                    className={`${fieldValue === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                               fieldValue === 'DIVERSAS' ? 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100' : 
                                                               'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                                >
                                                    {fieldValue || 'Selecionar'}
                                                </Tag>
                                            </div>
                                        }
                                    >
                                        {(vencimentoMatriculaConfig.options || []).map((option) => (
                                            <Dropdown.Item
                                                key={option.value || option}
                                                eventKey={option.value || option}
                                                active={option.value === fieldValue || option === fieldValue}
                                                onSelect={(value) => {
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                            >
                                                {option.label || option}
                                            </Dropdown.Item>
                                        ))}
                                    </IssueFieldDropdown>
                                )
                            case 'checkbox':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <Checkbox
                                                checked={fieldValue === 'true' || fieldValue === true}
                                                onChange={(checked) => {
                                                    handleVencimentoMatriculaChange(checked)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || false
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'radio':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <Radio.Group
                                                value={fieldValue}
                                                onChange={(value) => {
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            >
                                                {vencimentoMatriculaConfig.options?.map((option) => (
                                                    <Radio key={option.value} value={option.value}>
                                                        {option.label}
                                                    </Radio>
                                                ))}
                                            </Radio.Group>
                                        </div>
                                    </IssueField>
                                )
                            case 'multiselect':
                            case 'seleção múltipla':
                                return (
                                    <IssueFieldDropdown
                                        titleHtml="Vencimento<br/>Matrícula"
                                        icon={getFieldIcon()}
                                        dropdownTrigger={
                                            <div className="w-[270px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(fieldValue) && fieldValue.length > 0 ? (
                                                        fieldValue.map((val, index) => (
                                                            <Tag
                                                                key={index}
                                                                className="bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                                                            >
                                                                {val}
                                                            </Tag>
                                                        ))
                                                    ) : (
                                                        <Tag className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                                            Selecionar
                                                        </Tag>
                                                    )}
                                                </div>
                                            </div>
                                        }
                                    >
                                        {(vencimentoMatriculaConfig.options || []).map((option) => (
                                            <Dropdown.Item
                                                key={option.value || option}
                                                eventKey={option.value || option}
                                                active={Array.isArray(fieldValue) && fieldValue.includes(option.value || option)}
                                                onSelect={(value) => {
                                                    const currentValues = Array.isArray(fieldValue) ? fieldValue : []
                                                    const newValues = currentValues.includes(value) 
                                                        ? currentValues.filter(v => v !== value)
                                                        : [...currentValues, value]
                                                    handleVencimentoMatriculaChange(newValues)
                                                }}
                                            >
                                                {option.label || option}
                                            </Dropdown.Item>
                                        ))}
                                    </IssueFieldDropdown>
                                )
                            case 'switch':
                            case 'interruptor':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <Switcher
                                                checked={fieldValue === 'true' || fieldValue === true}
                                                onChange={(checked) => {
                                                    handleVencimentoMatriculaChange(checked)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || false
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'email':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span className={`font-semibold pointer-events-none ${focusedField === 'vencimentoMatricula' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                            <Input
                                                type="email"
                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                style={{ 
                                                    caretColor: 'black',
                                                    color: focusedField === 'vencimentoMatricula' ? 'black' : 'transparent'
                                                }}
                                                value={fieldValue}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                                onFocus={(e) => {
                                                    e.target.select()
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'hora':
                            case 'time':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span className="font-semibold">
                                                {fieldValue ? 
                                                    dayjs(fieldValue).format('HH:mm') : 
                                                    ''
                                                }
                                            </span>
                                            <TimeInput
                                                className="opacity-0 cursor-pointer absolute"
                                                value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                onChange={(date) => {
                                                    const value = date.toISOString()
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'data e hora':
                            case 'datetime':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span className="font-semibold">
                                                {fieldValue ? 
                                                    dayjs(fieldValue).format('DD/MM/YYYY HH:mm') : 
                                                    ''
                                                }
                                            </span>
                                            <DateTimepicker
                                                className="opacity-0 cursor-pointer absolute"
                                                placeholder=""
                                                value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                                onChange={(date) => {
                                                    const value = date.toISOString()
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                                onFocus={() => {
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            case 'número':
                            case 'number':
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span className={`font-semibold pointer-events-none ${focusedField === 'vencimentoMatricula' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue}</span>
                                            <Input
                                                type="number"
                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                style={{ 
                                                    caretColor: 'black',
                                                    color: focusedField === 'vencimentoMatricula' ? 'black' : 'transparent'
                                                }}
                                                value={fieldValue}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                                onFocus={(e) => {
                                                    e.target.select()
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                            default:
                                // Default to text field
                                return (
                                    <IssueField titleHtml="Vencimento<br/>Matrícula" icon={getFieldIcon()}>
                                        <div className="flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span className={`font-semibold pointer-events-none ${focusedField === 'vencimentoMatricula' ? 'opacity-0' : 'opacity-100'}`}>{fieldValue || 'Clique para editar'}</span>
                                            <Input
                                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0"
                                                style={{ 
                                                    caretColor: 'black',
                                                    color: focusedField === 'vencimentoMatricula' ? 'black' : 'transparent'
                                                }}
                                                value={fieldValue}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    handleVencimentoMatriculaChange(value)
                                                }}
                                                onFocus={(e) => {
                                                    e.target.select()
                                                    setFocusedField('vencimentoMatricula')
                                                    setOriginalFieldValues(prev => ({
                                                        ...prev,
                                                        vencimentoMatricula: localIssueData.vencimentoMatricula || ''
                                                    }))
                                                }}
                                                onBlur={() => {
                                                    handleVencimentoMatriculaBlur()
                                                }}
                                            />
                                        </div>
                                    </IssueField>
                                )
                        }
                    })()}
                    </div>
                    {(() => {
                        const envioITBIEscrituraConfig = getEnvioITBIEscrituraFieldConfig()
                        if (!envioITBIEscrituraConfig) {
                            // Fallback to original hardcoded date field if no configuration found
                            return (
                                <IssueField titleHtml="Envio ITBI/<br/>Escritura" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'envioITBIEscritura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                            <span className="font-semibold">
                                {envioITBIEscrituraInputValue ? 
                                    dayjs(envioITBIEscrituraInputValue).format('DD/MM/YYYY') : 
                                    ''
                                }
                            </span>
                            <DatePicker
                                className="opacity-0 cursor-pointer absolute"
                                value={envioITBIEscrituraInputValue ? 
                                    dayjs(envioITBIEscrituraInputValue).toDate() : 
                                    dayjs().toDate()
                                }
                                inputtable={false}
                                inputPrefix={null}
                                inputSuffix={null}
                                clearable={false}
                                onChange={(date) => handleEnvioITBIEscrituraChange(date)}
                                onFocus={() => setFocusedField('envioITBIEscritura')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                                </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = envioITBIEscrituraConfig
                        const fieldValue = envioITBIEscrituraInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField titleHtml="Envio ITBI/<br/>Escritura" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'envioITBIEscritura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setEnvioITBIEscrituraInputValue(checked)
                                                handleEnvioITBIEscrituraChange(checked)
                                            }}
                                        />
                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField titleHtml="Envio ITBI/<br/>Escritura" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'envioITBIEscritura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || 'Clique para editar'}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, envioITBIEscritura: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('envioITBIEscritura')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to date field
                            return (
                                <IssueField titleHtml="Envio ITBI/<br/>Escritura" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'envioITBIEscritura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold">
                                            {envioITBIEscrituraInputValue ? 
                                                dayjs(envioITBIEscrituraInputValue).format('DD/MM/YYYY') : 
                                                ''
                                            }
                                        </span>
                                        <DatePicker
                                            className="opacity-0 cursor-pointer absolute"
                                            value={envioITBIEscrituraInputValue ? 
                                                dayjs(envioITBIEscrituraInputValue).toDate() : 
                                                dayjs().toDate()
                                            }
                                            inputtable={false}
                                            inputPrefix={null}
                                            inputSuffix={null}
                                            clearable={false}
                                            onChange={(date) => handleEnvioITBIEscrituraChange(date)}
                                            onFocus={() => setFocusedField('envioITBIEscritura')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const escrituraPagoConfig = getEscrituraPagoFieldConfig()
                        if (!escrituraPagoConfig) {
                            // Fallback to original hardcoded checkbox field if no configuration found
                            return (
                                <IssueField title="Escritura Pago?" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'escrituraPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                            <Checkbox
                                checked={escrituraPagoInputValue}
                                onChange={(checked) => {
                                    setEscrituraPagoInputValue(checked);
                                    handleEscrituraPagoChange(checked);
                                }}
                                onFocus={() => setFocusedField('escrituraPago')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = escrituraPagoConfig
                        const fieldValue = escrituraPagoInputValue || ''
                        
                        if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField title="Escritura Pago?" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'escrituraPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || 'Clique para editar'}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, escrituraPago: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('escrituraPago')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="Escritura Pago?" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'escrituraPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold">
                                            {escrituraPagoInputValue ? 
                                                dayjs(escrituraPagoInputValue).format('DD/MM/YYYY') : 
                                                ''
                                            }
                                        </span>
                                        <DatePicker
                                            className="opacity-0 cursor-pointer absolute"
                                            value={escrituraPagoInputValue ? 
                                                dayjs(escrituraPagoInputValue).toDate() : 
                                                dayjs().toDate()
                                            }
                                            inputtable={false}
                                            inputPrefix={null}
                                            inputSuffix={null}
                                            clearable={false}
                                            onChange={(date) => handleEscrituraPagoChange(date)}
                                            onFocus={() => setFocusedField('escrituraPago')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to checkbox field
                            return (
                                <IssueField title="Escritura Pago?" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'escrituraPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setEscrituraPagoInputValue(checked)
                                                handleEscrituraPagoChange(checked)
                                            }}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const minutaAprovadaConfig = getMinutaAprovadaFieldConfig()
                        if (!minutaAprovadaConfig) {
                            // Fallback to original hardcoded checkbox field if no configuration found
                            return (
                                <IssueField title="Minuta Aprovada?" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'minutaAprovada' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                            <Checkbox
                                checked={minutaAprovadaInputValue}
                                onChange={(checked) => {
                                    setMinutaAprovadaInputValue(checked);
                                    handleMinutaAprovadaChange(checked);
                                }}
                                onFocus={() => setFocusedField('minutaAprovada')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = minutaAprovadaConfig
                        const fieldValue = minutaAprovadaInputValue || ''
                        
                        if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField title="Minuta Aprovada?" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'minutaAprovada' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || 'Clique para editar'}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, minutaAprovada: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('minutaAprovada')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                        </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="Minuta Aprovada?" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'minutaAprovada' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold">
                                            {minutaAprovadaInputValue ? 
                                                dayjs(minutaAprovadaInputValue).format('DD/MM/YYYY') : 
                                                ''
                                            }
                                        </span>
                                        <DatePicker
                                            className="opacity-0 cursor-pointer absolute"
                                            value={minutaAprovadaInputValue ? 
                                                dayjs(minutaAprovadaInputValue).toDate() : 
                                                dayjs().toDate()
                                            }
                                            inputtable={false}
                                            inputPrefix={null}
                                            inputSuffix={null}
                                            clearable={false}
                                            onChange={(date) => handleMinutaAprovadaChange(date)}
                                            onFocus={() => setFocusedField('minutaAprovada')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to checkbox field
                            return (
                                <IssueField title="Minuta Aprovada?" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'minutaAprovada' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setMinutaAprovadaInputValue(checked)
                                                handleMinutaAprovadaChange(checked)
                                            }}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const dataEnvioRegistroConfig = getDataEnvioRegistroFieldConfig()
                        if (!dataEnvioRegistroConfig) {
                            // Fallback to original hardcoded date field if no configuration found
                            return (
                                <IssueField titleHtml="Data Envio<br/>para Registro" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'dataEnvioRegistro' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                            <span className="font-semibold">
                                {dataEnvioRegistroInputValue ? 
                                    dayjs(dataEnvioRegistroInputValue).format('DD/MM/YYYY') : 
                                    ''
                                }
                            </span>
                            <DatePicker
                                className="opacity-0 cursor-pointer absolute"
                                value={dataEnvioRegistroInputValue ? 
                                    dayjs(dataEnvioRegistroInputValue).toDate() : 
                                    dayjs().toDate()
                                }
                                inputtable={false}
                                inputPrefix={null}
                                inputSuffix={null}
                                clearable={false}
                                onChange={(date) => handleDataEnvioRegistroChange(date)}
                                onFocus={() => setFocusedField('dataEnvioRegistro')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                                </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = dataEnvioRegistroConfig
                        const fieldValue = dataEnvioRegistroInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField titleHtml="Data Envio<br/>para Registro" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'dataEnvioRegistro' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setDataEnvioRegistroInputValue(checked)
                                                handleDataEnvioRegistroChange(checked)
                                            }}
                                        />
                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField titleHtml="Data Envio<br/>para Registro" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'dataEnvioRegistro' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || 'Clique para editar'}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, dataEnvioRegistro: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('dataEnvioRegistro')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to date field
                            return (
                                <IssueField titleHtml="Data Envio<br/>para Registro" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'dataEnvioRegistro' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold">
                                            {dataEnvioRegistroInputValue ? 
                                                dayjs(dataEnvioRegistroInputValue).format('DD/MM/YYYY') : 
                                                ''
                                            }
                                        </span>
                                        <DatePicker
                                            className="opacity-0 cursor-pointer absolute"
                                            value={dataEnvioRegistroInputValue ? 
                                                dayjs(dataEnvioRegistroInputValue).toDate() : 
                                                dayjs().toDate()
                                            }
                                            inputtable={false}
                                            inputPrefix={null}
                                            inputSuffix={null}
                                            clearable={false}
                                            onChange={(date) => handleDataEnvioRegistroChange(date)}
                                            onFocus={() => setFocusedField('dataEnvioRegistro')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    <div className="flex items-start mb-2">
                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] pt-1">
                            <span className="text-lg"><TbCircleCheck /></span>
                            <span>Pendências:</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder=""
                                    value={newPendingItem}
                                    onChange={(e) => setNewPendingItem(e.target.value.toUpperCase())}
                                    onKeyPress={handlePendingKeyPress}
                                    className="w-[300px]"
                                    style={{ textTransform: 'uppercase' }}
                                />
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={addPendingItem}
                                    disabled={!newPendingItem.trim()}
                                    style={{ zIndex: 10, position: 'relative' }}
                                >
                                    Adicionar
                                </Button>
                            </div>
                            
                            {/* Pending items list */}
                            {(localIssueData.pendingItems && localIssueData.pendingItems.length > 0) && (
                                <div className="flex flex-col gap-2">
                                    {localIssueData.pendingItems.map((item) => (
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


                </div>
                <div className="flex flex-col">
                    {(() => {
                        const entryDateConfig = getEntryDateFieldConfig()
                        if (!entryDateConfig) {
                            // Fallback to original hardcoded field if no configuration found
                            return (
                                <IssueField title="Data de Entrada" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'entryDate' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold">
                                            {localIssueData.entryDate ? 
                                                dayjs(localIssueData.entryDate).format('DD/MM/YYYY') : 
                                                (localIssueData.dueDate ? 
                                                    dayjs(localIssueData.dueDate).format('DD/MM/YYYY') : 
                                        ''
                                    )
                                }
                            </span>
                            <DatePicker
                                className="opacity-0 cursor-pointer absolute"
                                            value={localIssueData.entryDate ? 
                                                dayjs(localIssueData.entryDate).toDate() : 
                                                (localIssueData.dueDate ? 
                                                    dayjs(localIssueData.dueDate).toDate() : 
                                        dayjs().toDate()
                                    )
                                }
                                inputtable={false}
                                inputPrefix={null}
                                inputSuffix={null}
                                clearable={false}
                                onChange={(date) => handleEntryDateChange(date)}
                                onFocus={() => setFocusedField('entryDate')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = entryDateConfig
                        const fieldValue = localIssueData.entryDate || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Data de Entrada" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'entryDate' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                const newData = { ...localIssueData, entryDate: checked }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('entryDate')}
                                onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField title="Data de Entrada" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'entryDate' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || 'Clique para editar'}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, entryDate: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('entryDate')}
                                onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to date field
                            return (
                                <IssueField title="Data de Entrada" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'entryDate' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleEntryDateChange(date)}
                                            onFocus={() => setFocusedField('entryDate')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const tipoConfig = getTipoFieldConfig()
                        if (!tipoConfig) {
                            // Fallback to original hardcoded dropdown field if no configuration found
                            return (
                                <IssueFieldDropdown
                                    title="Tipo"
                                    icon={<TbClipboardText />}
                                    dropdownTrigger={
                                        <div className="w-[270px]">
                                            <Tag
                                                className={`${localIssueData.tipo === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                           localIssueData.tipo === 'DIVERSAS' ? 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100' : 
                                                           'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                            >
                                                {localIssueData.tipo || 'Selecionar'}
                                            </Tag>
                                        </div>
                                    }
                                >
                                    {['ALPHA', 'DIVERSAS'].map((option) => (
                                        <Dropdown.Item
                                            key={option}
                                            eventKey={option}
                                            active={option === localIssueData.tipo}
                                            onSelect={handleTipoChange}
                                        >
                                            <div className="flex items-center relative">
                                                <Tag className={`${option === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                               'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100'}`}>
                                                    {option}
                                                </Tag>
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                                </IssueFieldDropdown>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo, options } = tipoConfig
                        const fieldValue = localIssueData.tipo || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Tipo" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'tipo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setLocalIssueData({ ...localIssueData, tipo: checked })
                                                handleTipoChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('tipo')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField title="Tipo" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'tipo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || 'Clique para editar'}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, tipo: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('tipo')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="Tipo" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'tipo' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold">
                                            {fieldValue ? 
                                                dayjs(fieldValue).format('DD/MM/YYYY') : 
                                                'Clique para editar'
                                            }
                                        </span>
                                        <DatePicker
                                            className="opacity-0 cursor-pointer absolute"
                                            value={fieldValue ? dayjs(fieldValue).toDate() : dayjs().toDate()}
                                            inputtable={false}
                                            inputPrefix={null}
                                            inputSuffix={null}
                                            clearable={false}
                                            onChange={(date) => handleTipoChange(date)}
                                            onFocus={() => setFocusedField('tipo')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to dropdown field
                            return (
                                <IssueFieldDropdown
                                    title="Tipo"
                                    icon={<TbClipboardText />}
                                    dropdownTrigger={
                                        <div className="w-[270px]">
                                            <Tag
                                                className={`${fieldValue === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                           fieldValue === 'DIVERSAS' ? 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100' : 
                                                           'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                            >
                                                {fieldValue || 'Selecionar'}
                                            </Tag>
                                        </div>
                                    }
                                >
                                    {(options || ['ALPHA', 'DIVERSAS']).map((option) => {
                                        const optionValue = typeof option === 'object' ? option.value : option
                                        const optionLabel = typeof option === 'object' ? option.label : option
                                        return (
                                            <Dropdown.Item
                                                key={optionValue}
                                                eventKey={optionValue}
                                                active={optionValue === fieldValue}
                                                onSelect={handleTipoChange}
                                            >
                                                <div className="flex items-center relative">
                                                    <Tag className={`${optionValue === 'ALPHA' ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 
                                                                   'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100'}`}>
                                                        {optionLabel}
                                                    </Tag>
                                                </div>
                                            </Dropdown.Item>
                                        )
                                    })}
                                </IssueFieldDropdown>
                            )
                        }
                    })()}
                    {(() => {
                        const ordemConfig = getOrdemFieldConfig()
                        if (!ordemConfig) {
                            // Fallback to original hardcoded text field if no configuration found
                            return (
                                <IssueField title="Ordem" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'ordem' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold pointer-events-none">{ordemInputValue}</span>
                            <Input
                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                style={{ caretColor: 'black' }}
                                value={ordemInputValue}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setOrdemInputValue(value);
                                    handleOrdemChange(value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                    setFocusedField('ordem');
                                    // Store the original value when focusing
                                    setOriginalFieldValues(prev => ({
                                        ...prev,
                                        ordem: issueData.ordem || ''
                                    }));
                                }}
                                onBlur={() => {
                                    setFocusedField(null);
                                    handleOrdemBlur();
                                }}
                                inputMode="numeric"
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = ordemConfig
                        const fieldValue = ordemInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Ordem" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'ordem' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setOrdemInputValue(checked)
                                                handleOrdemChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('ordem')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="Ordem" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'ordem' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleOrdemChange(date)}
                                            onFocus={() => setFocusedField('ordem')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to text field (with numeric input mode)
                            return (
                                <IssueField title="Ordem" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'ordem' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                setOrdemInputValue(value);
                                                handleOrdemChange(value);
                                            }}
                                            onFocus={(e) => {
                                                e.target.select();
                                                setFocusedField('ordem');
                                                setOriginalFieldValues(prev => ({
                                                    ...prev,
                                                    ordem: issueData.ordem || ''
                                                }));
                                            }}
                                            onBlur={() => {
                                                setFocusedField(null);
                                                handleOrdemBlur();
                                            }}
                                            inputMode="numeric"
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const unidadeConfig = getUnidadeFieldConfig()
                        if (!unidadeConfig) {
                            // Fallback to original hardcoded text field if no configuration found
                            return (
                                <IssueField title="Unidade" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'unidade' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold pointer-events-none">{unidadeInputValue}</span>
                            <Input
                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                style={{ caretColor: 'black' }}
                                value={unidadeInputValue}
                                onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                    setUnidadeInputValue(value);
                                    handleUnidadeChange(value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                    setFocusedField('unidade');
                                    setOriginalFieldValues(prev => ({ ...prev, unidade: issueData.unidade || '' }));
                                }}
                                onBlur={() => {
                                    setFocusedField(null);
                                    handleUnidadeBlur();
                                }}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = unidadeConfig
                        const fieldValue = unidadeInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Unidade" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'unidade' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setUnidadeInputValue(checked)
                                                handleUnidadeChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('unidade')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="Unidade" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'unidade' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleUnidadeChange(date)}
                                            onFocus={() => setFocusedField('unidade')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to text field (with uppercase transformation)
                            return (
                                <IssueField title="Unidade" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'unidade' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                setUnidadeInputValue(value);
                                                handleUnidadeChange(value);
                                            }}
                                            onFocus={(e) => {
                                                e.target.select();
                                                setFocusedField('unidade');
                                                setOriginalFieldValues(prev => ({ ...prev, unidade: issueData.unidade || '' }));
                                            }}
                                            onBlur={() => {
                                                setFocusedField(null);
                                                handleUnidadeBlur();
                                            }}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const naturezaConfig = getNaturezaFieldConfig()
                        if (!naturezaConfig) {
                            // Fallback to original hardcoded text field if no configuration found
                            return (
                                <IssueField title="Natureza" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'natureza' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold pointer-events-none">{naturezaInputValue}</span>
                            <Input
                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                style={{ caretColor: 'black' }}
                                value={naturezaInputValue}
                                onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                    setNaturezaInputValue(value);
                                    handleNaturezaChange(value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                    setFocusedField('natureza');
                                    setOriginalFieldValues(prev => ({ ...prev, natureza: issueData.natureza || '' }));
                                }}
                                onBlur={() => {
                                    setFocusedField(null);
                                    handleNaturezaBlur();
                                }}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = naturezaConfig
                        const fieldValue = naturezaInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Natureza" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'natureza' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setNaturezaInputValue(checked)
                                                handleNaturezaChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('natureza')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="Natureza" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'natureza' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleNaturezaChange(date)}
                                            onFocus={() => setFocusedField('natureza')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to text field (with uppercase transformation)
                            return (
                                <IssueField title="Natureza" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'natureza' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                setNaturezaInputValue(value);
                                                handleNaturezaChange(value);
                                            }}
                                            onFocus={(e) => {
                                                e.target.select();
                                                setFocusedField('natureza');
                                                setOriginalFieldValues(prev => ({ ...prev, natureza: issueData.natureza || '' }));
                                            }}
                                            onBlur={() => {
                                                setFocusedField(null);
                                                handleNaturezaBlur();
                                            }}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const codigoValidacaoITBIConfig = getCodigoValidacaoITBIFieldConfig()
                        if (!codigoValidacaoITBIConfig) {
                            // Fallback to original hardcoded text field if no configuration found
                            return (
                                <IssueField titleHtml="Código de<br/>Validação ITBI" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'codigoValidacaoITBI' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold pointer-events-none">{codigoValidacaoITBIInputValue}</span>
                            <Input
                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                style={{ caretColor: 'black' }}
                                value={codigoValidacaoITBIInputValue}
                                onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                    setCodigoValidacaoITBIInputValue(value);
                                    handleCodigoValidacaoITBIChange(value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                    setFocusedField('codigoValidacaoITBI');
                                    setOriginalFieldValues(prev => ({ ...prev, codigoValidacaoITBI: issueData.codigoValidacaoITBI || '' }));
                                }}
                                onBlur={() => {
                                    setFocusedField(null);
                                    handleCodigoValidacaoITBIBlur();
                                }}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = codigoValidacaoITBIConfig
                        const fieldValue = codigoValidacaoITBIInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField titleHtml="Código de<br/>Validação ITBI" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'codigoValidacaoITBI' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setCodigoValidacaoITBIInputValue(checked)
                                                handleCodigoValidacaoITBIChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('codigoValidacaoITBI')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField titleHtml="Código de<br/>Validação ITBI" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'codigoValidacaoITBI' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleCodigoValidacaoITBIChange(date)}
                                            onFocus={() => setFocusedField('codigoValidacaoITBI')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to text field (with uppercase transformation)
                            return (
                                <IssueField titleHtml="Código de<br/>Validação ITBI" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'codigoValidacaoITBI' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                setCodigoValidacaoITBIInputValue(value);
                                                handleCodigoValidacaoITBIChange(value);
                                            }}
                                            onFocus={(e) => {
                                                e.target.select();
                                                setFocusedField('codigoValidacaoITBI');
                                                setOriginalFieldValues(prev => ({ ...prev, codigoValidacaoITBI: issueData.codigoValidacaoITBI || '' }));
                                            }}
                                            onBlur={() => {
                                                setFocusedField(null);
                                                handleCodigoValidacaoITBIBlur();
                                            }}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const itbiPagoConfig = getItbiPagoFieldConfig()
                        if (!itbiPagoConfig) {
                            // Fallback to original hardcoded checkbox field if no configuration found
                            return (
                                <IssueField title="ITBI Pago?" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'itbiPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                            <Checkbox
                                checked={itbiPagoInputValue}
                                onChange={(checked) => {
                                    setItbiPagoInputValue(checked);
                                    handleItbiPagoChange(checked);
                                }}
                                onFocus={() => setFocusedField('itbiPago')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = itbiPagoConfig
                        const fieldValue = itbiPagoInputValue || ''
                        
                        if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField title="ITBI Pago?" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'itbiPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, itbiPago: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('itbiPago')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="ITBI Pago?" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'itbiPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleItbiPagoChange(date)}
                                            onFocus={() => setFocusedField('itbiPago')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to checkbox field
                            return (
                                <IssueField title="ITBI Pago?" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'itbiPago' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setItbiPagoInputValue(checked)
                                                handleItbiPagoChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('itbiPago')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const envioMinutaConfig = getEnvioMinutaFieldConfig()
                        if (!envioMinutaConfig) {
                            // Fallback to original hardcoded date field if no configuration found
                            return (
                                <IssueField title="Envio Minuta" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'envioMinuta' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                            <span className="font-semibold">
                                {envioMinutaInputValue ? 
                                    dayjs(envioMinutaInputValue).format('DD/MM/YYYY') : 
                                    ''
                                }
                            </span>
                            <DatePicker
                                className="opacity-0 cursor-pointer absolute"
                                value={envioMinutaInputValue ? 
                                    dayjs(envioMinutaInputValue).toDate() : 
                                    dayjs().toDate()
                                }
                                inputtable={false}
                                inputPrefix={null}
                                inputSuffix={null}
                                clearable={false}
                                onChange={(date) => handleEnvioMinutaChange(date)}
                                onFocus={() => setFocusedField('envioMinuta')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = envioMinutaConfig
                        const fieldValue = envioMinutaInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Envio Minuta" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'envioMinuta' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setEnvioMinutaInputValue(checked)
                                                handleEnvioMinutaChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('envioMinuta')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField title="Envio Minuta" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'envioMinuta' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, envioMinuta: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('envioMinuta')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to date field
                            return (
                                <IssueField title="Envio Minuta" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'envioMinuta' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleEnvioMinutaChange(date)}
                                            onFocus={() => setFocusedField('envioMinuta')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const dataLavraturaConfig = getDataLavraturaFieldConfig()
                        if (!dataLavraturaConfig) {
                            // Fallback to original hardcoded date field if no configuration found
                            return (
                                <IssueField title="Data Lavratura" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'dataLavratura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                            <span className="font-semibold">
                                {dataLavraturaInputValue ? 
                                    dayjs(dataLavraturaInputValue).format('DD/MM/YYYY') : 
                                    ''
                                }
                            </span>
                            <DatePicker
                                className="opacity-0 cursor-pointer absolute"
                                value={dataLavraturaInputValue ? 
                                    dayjs(dataLavraturaInputValue).toDate() : 
                                    dayjs().toDate()
                                }
                                inputtable={false}
                                inputPrefix={null}
                                inputSuffix={null}
                                clearable={false}
                                onChange={(date) => handleDataLavraturaChange(date)}
                                onFocus={() => setFocusedField('dataLavratura')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = dataLavraturaConfig
                        const fieldValue = dataLavraturaInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Data Lavratura" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'dataLavratura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setDataLavraturaInputValue(checked)
                                                handleDataLavraturaChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('dataLavratura')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'text' || tipo.toLowerCase() === 'texto') {
                            return (
                                <IssueField title="Data Lavratura" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'dataLavratura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const newData = { ...localIssueData, dataLavratura: e.target.value }
                                                setLocalIssueData(newData)
                                                updateIssueData(newData)
                                            }}
                                            onFocus={() => setFocusedField('dataLavratura')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to date field
                            return (
                                <IssueField title="Data Lavratura" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'dataLavratura' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleDataLavraturaChange(date)}
                                            onFocus={() => setFocusedField('dataLavratura')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                    {(() => {
                        const statusONRConfig = getStatusONRFieldConfig()
                        if (!statusONRConfig) {
                            // Fallback to original hardcoded text field if no configuration found
                            return (
                                <IssueField title="Status ONR" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'statusONR' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>
                            <span className="font-semibold pointer-events-none">{statusONRInputValue}</span>
                            <Input
                                className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                style={{ caretColor: 'black' }}
                                value={statusONRInputValue}
                                onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                    setStatusONRInputValue(value);
                                    handleStatusONRChange(value);
                                }}
                                onFocus={(e) => {
                                    e.target.select();
                                    setFocusedField('statusONR');
                                    setOriginalFieldValues(prev => ({ ...prev, statusONR: issueData.statusONR || '' }));
                                }}
                                onBlur={() => {
                                    setFocusedField(null);
                                    handleStatusONRBlur();
                                }}
                            />
                        </div>
                    </IssueField>
                            )
                        }

                        // Dynamic field based on configuration
                        const { tipo } = statusONRConfig
                        const fieldValue = statusONRInputValue || ''
                        
                        if (tipo.toLowerCase() === 'checkbox') {
                            return (
                                <IssueField title="Status ONR" icon={<TbCheckupList />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[45px] min-h-[46px] relative ${
                                        focusedField === 'statusONR' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <Checkbox
                                            checked={fieldValue === 'true' || fieldValue === true}
                                            onChange={(checked) => {
                                                setStatusONRInputValue(checked)
                                                handleStatusONRChange(checked)
                                            }}
                                            onFocus={() => setFocusedField('statusONR')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else if (tipo.toLowerCase() === 'data' || tipo.toLowerCase() === 'date') {
                            return (
                                <IssueField title="Status ONR" icon={<TbCalendar />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'statusONR' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
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
                                            onChange={(date) => handleStatusONRChange(date)}
                                            onFocus={() => setFocusedField('statusONR')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </IssueField>
                            )
                        } else {
                            // Default to text field (with uppercase transformation)
                            return (
                                <IssueField title="Status ONR" icon={<TbClipboardText />}>
                                    <div className={`flex items-center gap-1 px-3 rounded-xl cursor-pointer w-[295px] min-h-[46px] relative ${
                                        focusedField === 'statusONR' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                        <span className="font-semibold pointer-events-none">{fieldValue || ''}</span>
                                        <Input
                                            className="absolute inset-0 cursor-pointer bg-transparent border-none focus:ring-0 text-transparent"
                                            style={{ caretColor: 'black' }}
                                            value={fieldValue}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                setStatusONRInputValue(value);
                                                handleStatusONRChange(value);
                                            }}
                                            onFocus={(e) => {
                                                e.target.select();
                                                setFocusedField('statusONR');
                                                setOriginalFieldValues(prev => ({ ...prev, statusONR: issueData.statusONR || '' }));
                                            }}
                                            onBlur={() => {
                                                setFocusedField(null);
                                                handleStatusONRBlur();
                                            }}
                                        />
                                    </div>
                                </IssueField>
                            )
                        }
                    })()}
                </div>
            </div>
            <div className="mt-8">
                <h5 className="mb-4">Observações</h5>
                {editDescription ? (
                    <RichTextEditor
                        ref={descriptionInput}
                        content={issueData.description}
                        customEditor={editor}
                        onBlur={() => setEditDescription(false)}
                    />
                ) : (
                    <div
                        className="mt-2 prose max-w-full cursor-pointer"
                        role="button"
                        onClick={handleDescriptionClick}
                    >
                        <div className="prose-p:text-sm dark:prose-p:text-gray-400">
                            {ReactHtmlParser(issueData.description || '')}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default IssueBody

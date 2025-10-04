import dayjs from 'dayjs'

// Activity types constants
export const ACTIVITY_TYPES = {
    UPDATE_TICKET: 'UPDATE-TICKET',
    COMMENT: 'COMMENT',
    ADD_FILES_TO_TICKET: 'ADD-FILES-TO-TICKET',
    ATTACHMENT: 'ATTACHMENT',
    CREATE_TICKET: 'CREATE-TICKET',
    UPDATE_STATUS: 'UPDATE-STATUS',
    UPDATE_FIELD: 'UPDATE-FIELD',
    ADD_PENDING_ITEM: 'ADD-PENDING-ITEM',
    TOGGLE_PENDING_ITEM: 'TOGGLE-PENDING-ITEM',
    REMOVE_PENDING_ITEM: 'REMOVE-PENDING-ITEM',
    PROJECT_COMPLETED: 'PROJECT-COMPLETED',
    PROJECT_CANCELLED: 'PROJECT-CANCELLED',
    PROJECT_RESTORED: 'PROJECT-RESTORED',
}

// Board status mapping removed - boards are now dynamic

// Create activity entry
export const createActivityEntry = (type, data, user = null) => {
    const baseActivity = {
        type,
        dateTime: dayjs().unix(),
        userName: user?.name || 'Usuário',
        userImg: user?.img || '',
    }

    switch (type) {
        case ACTIVITY_TYPES.UPDATE_STATUS:
            return {
                ...baseActivity,
                ticket: data.projectId || data.id,
                status: data.oldStatus,
                newStatus: data.newStatus,
                statusLabel: data.newStatus,
            }
        
        case ACTIVITY_TYPES.COMMENT:
            return {
                ...baseActivity,
                comment: data.comment,
                ticket: data.projectId || data.id,
                action: data.action || 'added', // 'added', 'edited', or 'removed'
            }
        
        case ACTIVITY_TYPES.ADD_FILES_TO_TICKET:
            return {
                ...baseActivity,
                files: data.files.map(file => file.name),
                ticket: data.projectId || data.id,
                action: data.action || 'added', // 'added' or 'removed'
            }
        
        case ACTIVITY_TYPES.ATTACHMENT:
            return {
                ...baseActivity,
                attachmentName: data.attachmentName,
                action: data.action, // 'added' or 'removed'
                ticket: data.projectId || data.id,
            }
        
        case ACTIVITY_TYPES.UPDATE_FIELD:
            return {
                ...baseActivity,
                field: data.field,
                oldValue: data.oldValue,
                newValue: data.newValue,
                ticket: data.projectId || data.id,
            }
        
        case ACTIVITY_TYPES.ADD_PENDING_ITEM:
            return {
                ...baseActivity,
                pendingItem: data.text,
                ticket: data.projectId || data.id,
            }
        
        case ACTIVITY_TYPES.TOGGLE_PENDING_ITEM:
            return {
                ...baseActivity,
                pendingItem: data.text,
                completed: data.completed,
                ticket: data.projectId || data.id,
            }
        
        case ACTIVITY_TYPES.REMOVE_PENDING_ITEM:
            return {
                ...baseActivity,
                pendingItem: data.text,
                ticket: data.projectId || data.id,
            }
        
        case ACTIVITY_TYPES.PROJECT_COMPLETED:
            return {
                ...baseActivity,
                ticket: data.projectId || data.id,
                action: 'completed',
            }
        
        case ACTIVITY_TYPES.PROJECT_CANCELLED:
            return {
                ...baseActivity,
                ticket: data.projectId || data.id,
                action: 'cancelled',
            }
        
        case ACTIVITY_TYPES.PROJECT_RESTORED:
            return {
                ...baseActivity,
                ticket: data.projectId || data.id,
                action: 'restored',
            }
        
        default:
            return baseActivity
    }
}

// Add activity to project data
export const addActivityToProject = (projectData, activityEntry) => {
    const updatedProject = { ...projectData }
    
    // Ensure activity is an array, handling both array and JSON string cases
    let activity = updatedProject.activity
    if (!activity) {
        activity = []
    } else if (typeof activity === 'string') {
        try {
            activity = JSON.parse(activity)
        } catch (e) {
            activity = []
        }
    } else if (!Array.isArray(activity)) {
        activity = []
    }
    
    // Add new activity at the beginning (most recent first)
    activity.unshift(activityEntry)
    
    // Keep only the last 50 activities to prevent data bloat
    if (activity.length > 50) {
        activity = activity.slice(0, 50)
    }
    
    updatedProject.activity = activity
    return updatedProject
}

// Get readable field names for activity display
export const getFieldDisplayName = (fieldName) => {
    const fieldNames = {
        'ordem': 'Ordem',
        'eProtocolo': 'E-protocolo',
        'empreendimento': 'Empreendimento',
        'unidade': 'Unidade',
        'custas': 'Custas',
        'natureza': 'Natureza',
        'vencimentoMatricula': 'Vencimento Matrícula',
        'codigoValidacaoITBI': 'Código de Validação ITBI',
        'envioITBIEscritura': 'Envio ITBI/Escritura',
        'itbiPago': 'ITBI Pago',
        'escrituraPago': 'Escritura Pago',
        'envioMinuta': 'Envio Minuta',
        'minutaAprovada': 'Minuta Aprovada',
        'dataLavratura': 'Data Lavratura',
        'dataEnvioRegistro': 'Data Envio para Registro',
        'statusONR': 'Status ONR',
        'tipo': 'Tipo',
        'entryDate': 'Data de Entrada',
        'description': 'Descrição',
    }
    
    return fieldNames[fieldName] || fieldName
} 
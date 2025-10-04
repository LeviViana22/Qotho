// Generate unique ID using timestamp and random component
export const createUID = (len) => {
    // Use timestamp + random number for uniqueness
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `registro_${timestamp}_${random}`
}

export const generateProjectId = (columns) => {
    // Get all existing project IDs
    const existingIds = []
    
    // Extract all project IDs from all boards
    Object.values(columns).forEach(board => {
        board.forEach(project => {
            if (project.projectId && project.projectId.startsWith('RC-')) {
                const number = parseInt(project.projectId.replace('RC-', ''))
                if (!isNaN(number)) {
                    existingIds.push(number)
                }
            }
        })
    })
    
    // Find the next available number
    let nextNumber = 1
    while (existingIds.includes(nextNumber)) {
        nextNumber++
    }
    
    return `RC-${nextNumber}`
}

export const createCardObject = () => {
    return {
        id: createUID(10),
        projectId: '', // Will be set when creating the project
        name: 'Untitled Task',
        description: 'Observações',
        cover: '',
        members: [],
        labels: ['Task'],
        attachments: [],
        comments: [],
        dueDate: null,
        assignedTo: '',
        label: '',
        createdAt: new Date().toISOString(), // Add creation timestamp
        // Note: Dynamic fields will be added based on field configuration
        // Hardcoded fields removed to work with dynamic field system
    }
}

export const taskLabelColors = {
    'Live issue': 'bg-rose-200 dark:bg-rose-200 dark:text-gray-900',
    Task: 'bg-blue-200 dark:bg-blue-200 dark:text-gray-900',
    Bug: 'bg-amber-200 dark:bg-amber-200 dark:text-gray-900',
    'Low priority': 'bg-purple-200 dark:bg-purple-200 dark:text-gray-900',
}

export const labelList = ['Task', 'Bug', 'Live issue', 'Low priority']


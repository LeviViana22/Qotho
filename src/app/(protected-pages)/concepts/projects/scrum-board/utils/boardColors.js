// Dynamic board color utilities

// Define the color sequence based on the existing color mappings
export const BOARD_COLOR_SEQUENCE = [
    'gray', 'purple', 'blue', 'yellow', 'pink', 'indigo', 'green', 'orange', 'red'
]

// Default color for new boards
export const DEFAULT_BOARD_COLOR = 'gray'

// Color mappings for different UI elements
export const BOARD_COLOR_MAPPINGS = {
    // For status display (ProjectDetailsDrawer)
    statusDisplay: {
        'gray': 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
        'purple': 'bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100',
        'blue': 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100',
        'yellow': 'bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100',
        'pink': 'bg-pink-100 dark:bg-pink-800 text-pink-900 dark:text-pink-100',
        'indigo': 'bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100',
        'green': 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100',
        'orange': 'bg-orange-100 dark:bg-orange-800 text-orange-900 dark:text-orange-100',
        'red': 'bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-100',
    },
    // For title highlighting (BoardTitle)
    titleHighlight: {
        'gray': 'bg-gray-200 dark:bg-gray-700',
        'purple': 'bg-purple-100 dark:bg-purple-800',
        'blue': 'bg-blue-100 dark:bg-blue-800',
        'yellow': 'bg-yellow-100 dark:bg-yellow-800',
        'pink': 'bg-pink-100 dark:bg-pink-800',
        'indigo': 'bg-indigo-100 dark:bg-indigo-800',
        'green': 'bg-green-100 dark:bg-green-800',
        'orange': 'bg-orange-100 dark:bg-orange-800',
        'red': 'bg-red-100 dark:bg-red-800',
    },
    // For card shadows (BoardCard)
    cardShadow: {
        'gray': 'shadow-gray-300',
        'purple': 'shadow-purple-300',
        'blue': 'shadow-blue-300',
        'yellow': 'shadow-yellow-300',
        'pink': 'shadow-pink-300',
        'indigo': 'shadow-indigo-300',
        'green': 'shadow-green-300',
        'orange': 'shadow-orange-300',
        'red': 'shadow-red-300',
    },
    // For buttons (TicketContent)
    buttonColor: {
        'gray': 'bg-gray-500 hover:bg-gray-600',
        'purple': 'bg-purple-500 hover:bg-purple-600',
        'blue': 'bg-blue-500 hover:bg-blue-600',
        'yellow': 'bg-yellow-500 hover:bg-yellow-600',
        'pink': 'bg-pink-500 hover:bg-pink-600',
        'indigo': 'bg-indigo-500 hover:bg-indigo-600',
        'green': 'bg-green-500 hover:bg-green-600',
        'orange': 'bg-orange-500 hover:bg-orange-600',
        'red': 'bg-red-500 hover:bg-red-600',
    }
}

// Get the color for a board based on its position in the sequence
export const getBoardColor = (boardName, boardOrder) => {
    const colorIndex = boardOrder % BOARD_COLOR_SEQUENCE.length
    return BOARD_COLOR_SEQUENCE[colorIndex]
}

// Get color class for a specific UI element type
export const getBoardColorClass = (boardName, boardOrder, elementType) => {
    const color = getBoardColor(boardName, boardOrder)
    return BOARD_COLOR_MAPPINGS[elementType]?.[color] || BOARD_COLOR_MAPPINGS[elementType]?.['gray']
}

// Create dynamic color mappings for all boards
export const createDynamicColorMappings = (boards, elementType) => {
    const mappings = {}
    const boardNames = Object.keys(boards)
    
    boardNames.forEach((boardName, index) => {
        const color = getBoardColor(boardName, index)
        mappings[boardName] = BOARD_COLOR_MAPPINGS[elementType]?.[color] || BOARD_COLOR_MAPPINGS[elementType]?.['gray']
    })
    
    return mappings
}

// Legacy mappings removed - boards are now dynamic and stored in database

// Get color for boards - now fully dynamic from database
export const getLegacyOrDynamicColor = (boardName, boardOrder) => {
    return getBoardColor(boardName, boardOrder)
}

// Get color class for a board using database colors
export const getBoardColorClassFromDB = (boardName, boardColors, elementType) => {
    const color = boardColors[boardName] || DEFAULT_BOARD_COLOR
    return BOARD_COLOR_MAPPINGS[elementType]?.[color] || BOARD_COLOR_MAPPINGS[elementType]?.[DEFAULT_BOARD_COLOR]
}

// Create dynamic color mappings using database colors
export const createDynamicColorMappingsFromDB = (boards, boardColors, elementType) => {
    const mappings = {}
    const boardNames = Object.keys(boards)
    
    boardNames.forEach((boardName) => {
        const color = boardColors[boardName] || DEFAULT_BOARD_COLOR
        mappings[boardName] = BOARD_COLOR_MAPPINGS[elementType]?.[color] || BOARD_COLOR_MAPPINGS[elementType]?.[DEFAULT_BOARD_COLOR]
    })
    
    return mappings
}

// Save board color to database
export const saveBoardColor = async (boardName, color) => {
    try {
        const response = await fetch('/api/board-colors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ boardName, color }),
        })
        
        if (!response.ok) {
            throw new Error('Failed to save board color')
        }
        
        return await response.json()
    } catch (error) {
        console.error('Error saving board color:', error)
        throw error
    }
}

// Update board color when board is renamed
export const updateBoardColorName = async (oldBoardName, newBoardName, color) => {
    try {
        const response = await fetch('/api/board-colors', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldBoardName, newBoardName, color }),
        })
        
        if (!response.ok) {
            throw new Error('Failed to update board color')
        }
        
        return await response.json()
    } catch (error) {
        console.error('Error updating board color:', error)
        throw error
    }
}

// Load board colors from database
export const loadBoardColors = async () => {
    try {
        const response = await fetch('/api/board-colors')
        
        if (!response.ok) {
            throw new Error('Failed to load board colors')
        }
        
        return await response.json()
    } catch (error) {
        console.error('Error loading board colors:', error)
        return {}
    }
}

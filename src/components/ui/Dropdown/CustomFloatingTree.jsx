import { createContext, useContext, useRef, useId } from 'react'

// Custom FloatingTree context with deterministic ID generation using React's useId
const FloatingTreeContext = createContext()

// Create a mock event emitter for compatibility
const createMockEventEmitter = () => ({
    on: (event, callback) => {
        // Mock implementation - just return a cleanup function
        return () => {}
    },
    off: (event, callback) => {},
    emit: (event, data) => {}
})

export const CustomFloatingTree = ({ children }) => {
    const treeId = useId() // React's useId for hydration-safe IDs
    const events = useRef(createMockEventEmitter())
    
    return (
        <FloatingTreeContext.Provider value={{ 
            treeId,
            events: events.current
        }}>
            {children}
        </FloatingTreeContext.Provider>
    )
}

export const CustomFloatingNode = ({ children, id: providedId }) => {
    const context = useContext(FloatingTreeContext)
    const nodeId = useId() // React's useId for hydration-safe IDs
    
    return (
        <FloatingTreeContext.Provider value={{ 
            ...context, 
            nodeId: providedId || nodeId
        }}>
            {children}
        </FloatingTreeContext.Provider>
    )
}

export const useFloatingParentNodeId = () => {
    const context = useContext(FloatingTreeContext)
    return context?.nodeId || null
}

export const useFloatingTree = () => {
    const context = useContext(FloatingTreeContext)
    return context || { 
        treeId: 'default', 
        nodeId: null,
        events: createMockEventEmitter()
    }
}


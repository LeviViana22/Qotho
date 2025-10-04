'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadBoardColors, saveBoardColor, updateBoardColorName, DEFAULT_BOARD_COLOR } from '../utils/boardColors'

const BoardColorsContext = createContext()

export const useBoardColors = () => {
    const context = useContext(BoardColorsContext)
    if (!context) {
        throw new Error('useBoardColors must be used within a BoardColorsProvider')
    }
    return context
}

export const BoardColorsProvider = ({ children }) => {
    const [boardColors, setBoardColors] = useState({})
    const [isLoading, setIsLoading] = useState(true)

    // Load board colors from database
    const loadColors = useCallback(async () => {
        try {
            setIsLoading(true)
            const colors = await loadBoardColors()
            setBoardColors(colors)
        } catch (error) {
            console.error('Error loading board colors:', error)
            setBoardColors({})
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Save board color to database
    const saveColor = useCallback(async (boardName, color) => {
        try {
            await saveBoardColor(boardName, color)
            setBoardColors(prev => ({
                ...prev,
                [boardName]: color
            }))
        } catch (error) {
            console.error('Error saving board color:', error)
            throw error
        }
    }, [])

    // Update board color when board is renamed
    const updateColorName = useCallback(async (oldBoardName, newBoardName, color) => {
        try {
            await updateBoardColorName(oldBoardName, newBoardName, color)
            setBoardColors(prev => {
                const newColors = { ...prev }
                if (oldBoardName in newColors) {
                    delete newColors[oldBoardName]
                }
                if (color) {
                    newColors[newBoardName] = color
                }
                return newColors
            })
        } catch (error) {
            console.error('Error updating board color name:', error)
            throw error
        }
    }, [])

    // Get color for a specific board
    const getBoardColor = useCallback((boardName) => {
        return boardColors[boardName] || DEFAULT_BOARD_COLOR
    }, [boardColors])

    // Load colors on mount
    useEffect(() => {
        loadColors()
    }, [loadColors])

    const value = {
        boardColors,
        isLoading,
        loadColors,
        saveColor,
        updateColorName,
        getBoardColor
    }

    return (
        <BoardColorsContext.Provider value={value}>
            {children}
        </BoardColorsContext.Provider>
    )
}


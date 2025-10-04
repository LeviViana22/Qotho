'use client'
import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { BOARD_COLOR_SEQUENCE } from '../utils/boardColors'

const BoardColorPicker = ({ isOpen, onClose, currentColor, onColorSelect }) => {
    const [selectedColor, setSelectedColor] = useState(currentColor || 'gray')

    const handleColorSelect = (color) => {
        setSelectedColor(color)
    }

    const handleConfirm = () => {
        onColorSelect(selectedColor)
        onClose()
    }

    const colorOptions = BOARD_COLOR_SEQUENCE.map(color => ({
        name: color,
        bgClass: `bg-${color}-500`,
        hoverClass: `hover:bg-${color}-600`,
        borderClass: `border-${color}-500`,
        selectedClass: selectedColor === color ? `ring-2 ring-${color}-500 ring-offset-2` : ''
    }))

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            width={400}
            title="Escolher Cor do Quadro"
        >
            <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Selecione uma cor para este quadro:
                </p>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {colorOptions.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => handleColorSelect(color.name)}
                            className={`
                                w-12 h-12 rounded-full border-2 transition-all duration-200
                                ${color.bgClass} ${color.borderClass} ${color.selectedClass}
                                hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${selectedColor === color.name ? 'ring-2 ring-offset-2' : ''}
                            `}
                            style={{
                                backgroundColor: getColorValue(color.name),
                                borderColor: getColorValue(color.name, 600)
                            }}
                            title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                        />
                    ))}
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        size="sm"
                        variant="solid"
                    >
                        Confirmar
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

// Helper function to get actual color values for the color picker
const getColorValue = (colorName, shade = 500) => {
    const colorMap = {
        gray: { 500: '#6B7280', 600: '#4B5563' },
        purple: { 500: '#8B5CF6', 600: '#7C3AED' },
        blue: { 500: '#3B82F6', 600: '#2563EB' },
        yellow: { 500: '#EAB308', 600: '#CA8A04' },
        pink: { 500: '#EC4899', 600: '#DB2777' },
        indigo: { 500: '#6366F1', 600: '#4F46E5' },
        green: { 500: '#10B981', 600: '#059669' },
        orange: { 500: '#F97316', 600: '#EA580C' },
        red: { 500: '#EF4444', 600: '#DC2626' }
    }
    
    return colorMap[colorName]?.[shade] || colorMap.gray[shade]
}

export default BoardColorPicker

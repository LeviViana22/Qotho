'use client'
import { Fragment, useState, useRef, useEffect } from 'react'
import Segment from '@/components/ui/Segment'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import UploadFile from './UploadFile'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import { TbChevronRight, TbLayoutGrid, TbList, TbSearch, TbPlus, TbFolderPlus, TbUpload } from 'react-icons/tb'
import { PiSignInDuotone } from "react-icons/pi"
import { truncateFolderName } from '@/utils/textTruncate'

const FileManagerHeader = ({ onEntryClick, onDirectoryClick, onGoBack, searchQuery, onSearchChange, onCancelSelection, onMoveFiles }) => {
    const { directories, layout, setLayout, setCreateFolderDialog, setUploadFolderDialog, selectedFiles, isMultiSelectMode, clearSelection } = useFileManagerStore()
    const [novoDropdownOpen, setNovoDropdownOpen] = useState(false)
    const novoButtonRef = useRef(null)

    const handleEntryClick = () => {
        onEntryClick()
    }

    const handleDirectoryClick = (id) => {
        onDirectoryClick(id)
    }

    const handleNovoClick = () => {
        setNovoDropdownOpen(!novoDropdownOpen)
    }

    const handleNovaPasta = () => {
        setNovoDropdownOpen(false)
        setCreateFolderDialog({ open: true })
    }

    const handleCarregarPasta = () => {
        setNovoDropdownOpen(false)
        
        // Create a hidden file input that accepts directories
        const input = document.createElement('input')
        input.type = 'file'
        input.webkitdirectory = true
        input.multiple = true
        input.style.display = 'none'
        input.setAttribute('webkitdirectory', 'true')
        
        // Handle file selection
        const handleFileSelection = (e) => {
            const files = Array.from(e.target.files)
            console.log('Header: Files selected:', files.length)
            console.log('Header: Files:', files.map(f => ({ name: f.name, size: f.size, type: f.type, webkitRelativePath: f.webkitRelativePath })))
            if (files.length > 0) {
                // Open custom confirmation dialog
                setUploadFolderDialog({ open: true, files: files })
            }
            
            // Clean up
            input.removeEventListener('change', handleFileSelection)
            document.body.removeChild(input)
        }
        
        input.addEventListener('change', handleFileSelection)
        
        // Add to DOM and trigger click
        document.body.appendChild(input)
        
        // Use requestAnimationFrame to ensure proper timing
        requestAnimationFrame(() => {
            input.click()
        })
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (novoButtonRef.current && !novoButtonRef.current.contains(event.target)) {
                setNovoDropdownOpen(false)
            }
        }

        if (novoDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [novoDropdownOpen])

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                {directories.length > 0 ? (
                    <div className="flex items-center gap-2">
                        <h3 className="flex items-center gap-2 text-base sm:text-2xl">
                            <span
                                className="hover:text-primary cursor-pointer"
                                role="button"
                                onClick={handleEntryClick}
                            >
                                File Manager
                            </span>
                            {directories.map((dir, index) => (
                                <Fragment key={dir.id}>
                                    <TbChevronRight className="text-lg" />
                                    {directories.length - 1 === index ? (
                                        <span className="truncate max-w-[150px]" title={dir.label}>
                                            {truncateFolderName(dir.label)}
                                        </span>
                                    ) : (
                                        <span
                                            className="hover:text-primary cursor-pointer truncate max-w-[150px]"
                                            role="button"
                                            title={dir.label}
                                            onClick={() =>
                                                handleDirectoryClick(dir.id)
                                            }
                                        >
                                            {truncateFolderName(dir.label)}
                                        </span>
                                    )}
                                </Fragment>
                            ))}
                        </h3>
                    </div>
                ) : (
                    <h3>File Manager</h3>
                )}
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Input
                        placeholder="Buscar arquivos e pastas..."
                        value={searchQuery || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-64 pr-10"
                        size="sm"
                    />
                    <TbSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                </div>
                {isMultiSelectMode ? (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="solid"
                            size="sm"
                            onClick={onCancelSelection}
                            className="bg-gray-500 text-white hover:bg-gray-600"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            size="sm"
                            onClick={onMoveFiles}
                            className="bg-blue-500 text-white hover:bg-blue-600"
                        >
                            Mover ({selectedFiles.length})
                        </Button>
                    </div>
                ) : (
                    <div className="relative" ref={novoButtonRef}>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<TbPlus />}
                            onClick={handleNovoClick}
                            className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                        >
                        </Button>
                    {novoDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                            <div className="py-1">
                       <button
                           onClick={handleNovaPasta}
                           className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                       >
                           <TbFolderPlus className="text-lg text-gray-500" />
                           <span className="font-semibold">Nova pasta</span>
                       </button>
                       <button
                           onClick={handleCarregarPasta}
                           className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                       >
                           <TbUpload className="text-lg text-gray-500" />
                           <span className="font-semibold">Carregar pasta</span>
                       </button>
                            </div>
                        </div>
                    )}
                    </div>
                )}
                <Segment value={layout} onChange={(val) => setLayout(val)}>
                    <Segment.Item value="grid" className="text-xl px-3">
                        <TbLayoutGrid />
                    </Segment.Item>
                    <Segment.Item value="list" className="text-xl px-3">
                        <TbList />
                    </Segment.Item>
                </Segment>
                {onGoBack && (
                    <button
                        onClick={onGoBack}
                        className="flex items-center gap-2 px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Desconectar"
                    >
                        <PiSignInDuotone className="text-xl" />
                        
                    </button>
                )}
                <UploadFile />
            </div>
        </div>
    )
}

export default FileManagerHeader

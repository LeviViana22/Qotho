'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import AbbreviateNumber from '@/components/shared/AbbreviateNumber'
import Loading from '@/components/shared/Loading'
import classNames from '@/utils/classNames'
import {
    TbFileText,
    TbFiles,
} from 'react-icons/tb'

const options = [
    { label: 'Semanal', value: 'weekly' },
    { label: 'Mensal', value: 'monthly' },
    { label: 'Anual', value: 'yearly' },
]

const DisplayColumn = ({ icon, label, value, iconClass }) => {
    return (
        <div className={classNames('flex flex-col items-center gap-5')}>
            <div
                className={classNames(
                    'rounded-full flex items-center justify-center h-12 w-12 text-xl text-gray-900',
                    iconClass,
                )}
            >
                {icon}
            </div>
            <div className="text-center">
                <h6 className="font-bold mb-1">
                    {value > 0 ? '+' : ''}{value}%
                </h6>
                <div className="text-center text-xs">{label}</div>
            </div>
        </div>
    )
}

const Bar = ({ percent, className }) => {
    return (
        <div className="flex-1" style={{ width: `${Math.abs(percent)}%` }}>
            <div className={classNames('h-1.5 rounded-full', className)} />
            <div className="font-bold heading-text mt-1">{percent}%</div>
        </div>
    )
}

const ProjectRevenue = ({ refreshKey = 0 }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('weekly')
    const [growthData, setGrowthData] = useState({
        overallGrowth: 0,
        alphaGrowth: 0,
        diversasGrowth: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const calculateGrowthData = async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            // Fetch data from API
            const response = await fetch('/api/projects/scrum-board')
            
            if (!response.ok) {
                throw new Error('Failed to fetch scrum board data')
            }
            
            const data = await response.json()
            const boards = data.boards || data
            
            // Get current date and calculate periods
            const now = new Date()
            let startDate, endDate, previousStartDate, previousEndDate
            
            if (selectedPeriod === 'weekly') {
                // Current week
                const currentWeekStart = new Date(now)
                currentWeekStart.setDate(now.getDate() - now.getDay())
                currentWeekStart.setHours(0, 0, 0, 0)
                endDate = new Date(now)
                endDate.setHours(23, 59, 59, 999)
                
                // Previous week
                previousEndDate = new Date(currentWeekStart)
                previousEndDate.setMilliseconds(-1)
                previousStartDate = new Date(previousEndDate)
                previousStartDate.setDate(previousEndDate.getDate() - 6)
                previousStartDate.setHours(0, 0, 0, 0)
                
                startDate = currentWeekStart
            } else if (selectedPeriod === 'monthly') {
                // Current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date(now)
                endDate.setHours(23, 59, 59, 999)
                
                // Previous month
                previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
                previousEndDate.setHours(23, 59, 59, 999)
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            } else { // yearly
                // Current year
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now)
                endDate.setHours(23, 59, 59, 999)
                
                // Previous year
                previousEndDate = new Date(now.getFullYear() - 1, 11, 31)
                previousEndDate.setHours(23, 59, 59, 999)
                previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
            }
            
            // Count projects by tipo for current and previous periods
            const currentCounts = { alpha: 0, diversas: 0, total: 0 }
            const previousCounts = { alpha: 0, diversas: 0, total: 0 }
            
            // Process all boards (excluding Canceladas)
            Object.entries(boards).forEach(([boardName, board]) => {
                if (Array.isArray(board) && boardName !== 'Canceladas') {
                    board.forEach(project => {
                        // Skip placeholder projects and only process real projects
                        if (project && project.id && !project.name?.startsWith('Board: ')) {
                            const projectDate = new Date(project.createdAt)
                            
                            // Check if project is in current period
                            if (projectDate >= startDate && projectDate <= endDate) {
                                currentCounts.total++
                                if (project.tipo === 'ALPHA') {
                                    currentCounts.alpha++
                                } else if (project.tipo === 'DIVERSAS') {
                                    currentCounts.diversas++
                                }
                            }
                            
                            // Check if project is in previous period
                            if (projectDate >= previousStartDate && projectDate <= previousEndDate) {
                                previousCounts.total++
                                if (project.tipo === 'ALPHA') {
                                    previousCounts.alpha++
                                } else if (project.tipo === 'DIVERSAS') {
                                    previousCounts.diversas++
                                }
                            }
                        }
                    })
                }
            })
            
            // Calculate growth percentages
            const calculateGrowth = (current, previous) => {
                if (previous === 0) {
                    return current > 0 ? 100 : 0
                }
                return Math.round(((current - previous) / previous) * 100)
            }
            
            const overallGrowth = calculateGrowth(currentCounts.total, previousCounts.total)
            const alphaGrowth = calculateGrowth(currentCounts.alpha, previousCounts.alpha)
            const diversasGrowth = calculateGrowth(currentCounts.diversas, previousCounts.diversas)
            
            setGrowthData({
                overallGrowth,
                alphaGrowth,
                diversasGrowth
            })
            
        } catch (error) {
            console.error('Error calculating growth data:', error)
            setError(error.message)
            setGrowthData({
                overallGrowth: 0,
                alphaGrowth: 0,
                diversasGrowth: 0
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        calculateGrowthData()

        // Set up interval to refresh data periodically (every 2 minutes)
        const interval = setInterval(() => {
            calculateGrowthData()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [selectedPeriod, refreshKey])

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h4>Crescimento</h4>
                <Select
                    instanceId="growth-period"
                    className="w-[120px]"
                    size="sm"
                    placeholder="Selecionar período"
                    value={options.filter(
                        (option) => option.value === selectedPeriod,
                    )}
                    options={options}
                    isSearchable={false}
                    onChange={(option) => {
                        if (option?.value) {
                            setSelectedPeriod(option?.value)
                        }
                    }}
                />
            </div>
            
            {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                    <Loading loading />
                </div>
            ) : error ? (
                <div className="h-[200px] flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-2">Erro ao carregar dados</p>
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="mt-8">
                        <div className="flex items-center gap-3">
                            <h2 className={classNames(
                                'text-2xl font-bold',
                                growthData.overallGrowth > 0 ? 'text-green-600' : 
                                growthData.overallGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                            )}>
                                {growthData.overallGrowth > 0 ? '+' : ''}{growthData.overallGrowth}%
                            </h2>
                            <div className="font-normal leading-5">
                                <div>Taxa de</div>
                                <div>Crescimento</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-6">
                        <Bar
                            percent={growthData.alphaGrowth}
                            className={classNames(
                                'rounded-full',
                                growthData.alphaGrowth > 0 ? 'bg-green-200' : 
                                growthData.alphaGrowth < 0 ? 'bg-red-200' : 'bg-gray-200'
                            )}
                        />
                        <Bar
                            percent={growthData.diversasGrowth}
                            className={classNames(
                                'rounded-full',
                                growthData.diversasGrowth > 0 ? 'bg-blue-200' : 
                                growthData.diversasGrowth < 0 ? 'bg-red-200' : 'bg-gray-200'
                            )}
                        />
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 mt-8">
                        <div className="grid grid-cols-2 gap-4">
                            <DisplayColumn
                                icon={<TbFileText />}
                                label="Alpha"
                                value={growthData.alphaGrowth}
                                iconClass={classNames(
                                    'rounded-full',
                                    growthData.alphaGrowth > 0 ? 'bg-green-200' : 
                                    growthData.alphaGrowth < 0 ? 'bg-red-200' : 'bg-gray-200'
                                )}
                            />
                            <DisplayColumn
                                icon={<TbFiles />}
                                label="Diversas"
                                value={growthData.diversasGrowth}
                                iconClass={classNames(
                                    'rounded-full',
                                    growthData.diversasGrowth > 0 ? 'bg-blue-200' : 
                                    growthData.diversasGrowth < 0 ? 'bg-red-200' : 'bg-gray-200'
                                )}
                            />
                        </div>
                    </div>
                </>
            )}
        </Card>
    )
}

export default ProjectRevenue
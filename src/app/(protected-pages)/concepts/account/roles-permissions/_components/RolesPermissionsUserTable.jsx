'use client'
import { useMemo, useState, useEffect } from 'react'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Dropdown from '@/components/ui/Dropdown'
import DataTable from '@/components/shared/DataTable'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import useUserStore from '@/stores/userStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import isBrowser from '@/utils/isBrowser'
import dayjs from 'dayjs'
import { TbChevronDown } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

const statusColor = {
    active: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    blocked: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
}

const statusLabels = {
    active: 'Ativo',
    blocked: 'Bloqueado',
}

const RolesPermissionsUserTable = (props) => {
    const { userListTotal = 0, pageIndex = 1, pageSize = 10 } = props
    const router = useRouter()
    const isHydrated = useUserStoreHydrated()
    const [userImages, setUserImages] = useState({})

    const initialLoading = useRolePermissionsStore(
        (state) => state.initialLoading,
    )
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const selectedUser = useRolePermissionsStore((state) => state.selectedUser)
    const setSelectedUser = useRolePermissionsStore(
        (state) => state.setSelectedUser,
    )
    const setSelectAllUser = useRolePermissionsStore(
        (state) => state.setSelectAllUser,
    )
    const rolePermissionsUserList = useRolePermissionsStore((state) => state.userList)
    
    // Get Zustand store functions and users
    const { updateUser, getAllUsers, users: zustandUsers, loadUsers } = useUserStore()
    
    // Use Zustand users as the primary source, fallback to role permissions store
    const userList = zustandUsers.length > 0 ? zustandUsers : rolePermissionsUserList

    const { onAppendQueryParams } = useAppendQueryParams()

    // Load users from Zustand store if not already loaded
    useEffect(() => {
        if (zustandUsers.length === 0 && isHydrated) {
            loadUsers()
        }
    }, [zustandUsers.length, isHydrated, loadUsers])

    // Load images whenever userList changes
    useEffect(() => {
        if (userList.length > 0) {
            const images = {}
            userList.forEach(user => {
                // Prioritize API data (user.img) over stored image
                if (user.img) {
                    images[user.id] = user.img
                }
            })
            setUserImages(images)
        }
    }, [userList, isHydrated])

    const handlePaginationChange = (page) => {
        onAppendQueryParams({
            pageIndex: String(page),
        })
    }

    const handleSelectChange = (value) => {
        onAppendQueryParams({
            pageSize: String(value),
            pageIndex: '1',
        })
    }

    const handleSort = (sort) => {
        onAppendQueryParams({
            order: sort.order,
            sortKey: sort.key,
        })
    }

    const handleRowSelect = (checked, row) => {
        setSelectedUser(checked, row)
    }

    const handleAllRowSelect = (checked, rows) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectAllUser(originalRows)
        } else {
            setSelectAllUser([])
        }
    }

    const handleRoleChange = (role, id) => {
        // Update in Zustand store - this will trigger UI re-render
        updateUser(id, { role })
    }

    const handleStatusChange = (status, id) => {
        // Update in Zustand store - this will trigger UI re-render
        updateUser(id, { status })
    }

    const handleUserClick = (userId) => {
        // Navigate to user edit page with the user ID
        router.push(`/concepts/account/user-edit/${userId}`)
    }

    const columns = useMemo(
        () => [
            {
                header: 'Nome',
                accessorKey: 'name',
                cell: (props) => {
                    const row = props.row.original
                    // Prioritize API data, then stored image, then empty string
                    const userImage = row.img || userImages[row.id] || ''
                    
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar 
                                size={40} 
                                shape="circle" 
                                src={userImage}
                                // Add a key to force re-render when image changes
                                key={`${row.id}-${userImage ? 'img' : 'no-img'}`}
                            />
                            <div>
                                <div 
                                    className="font-bold heading-text cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => handleUserClick(row.id)}
                                >
                                    {row.name}
                                </div>
                                <div>{row.email}</div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center">
                            <Dropdown
                                renderTitle={
                                    <div
                                        className="inline-flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                        role="button"
                                    >
                                        <Tag className={statusColor[row.status]}>
                                            <span className="capitalize">{statusLabels[row.status]}</span>
                                        </Tag>
                                        <TbChevronDown />
                                    </div>
                                }
                            >
                                <Dropdown.Item
                                    eventKey="active"
                                    onClick={() => handleStatusChange('active', row.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Tag className={statusColor.active}>
                                            <span className="capitalize">Ativo</span>
                                        </Tag>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Item
                                    eventKey="blocked"
                                    onClick={() => handleStatusChange('blocked', row.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Tag className={statusColor.blocked}>
                                            <span className="capitalize">Bloqueado</span>
                                        </Tag>
                                    </div>
                                </Dropdown.Item>
                            </Dropdown>
                        </div>
                    )
                },
            },
            {
                header: 'Último acesso',
                accessorKey: 'lastOnline',
                cell: (props) => {
                    const row = props.row.original
                    const lastAccess = dayjs.unix(row.lastOnline)
                    const now = dayjs()
                    const isToday = lastAccess.isSame(now, 'day')
                    const isYesterday = lastAccess.isSame(now.subtract(1, 'day'), 'day')
                    
                    let dateText = ''
                    if (isToday) {
                        dateText = 'Hoje'
                    } else if (isYesterday) {
                        dateText = 'Ontem'
                    } else {
                        dateText = lastAccess.format('DD/MM/YYYY')
                    }
                    
                    return (
                        <div className="flex flex-col">
                            <span className="font-semibold">
                                {dateText}
                            </span>
                            <small>
                                {lastAccess.format('HH:mm')}
                            </small>
                        </div>
                    )
                },
            },
            {
                header: 'Função',
                accessorKey: 'role',
                size: 70,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <Dropdown
                            renderTitle={
                                <div
                                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    role="button"
                                >
                                    <span className="font-bold heading-text">
                                        {
                                            roleList.find(
                                                (role) => role.id === row.role,
                                            )?.name
                                        }
                                    </span>
                                    <TbChevronDown />
                                </div>
                            }
                        >
                            {roleList
                                .filter((role) => role.id !== row.role)
                                .map((role) => (
                                    <Dropdown.Item
                                        key={role.id}
                                        eventKey={role.id}
                                        onClick={() =>
                                            handleRoleChange(role.id, row.id)
                                        }
                                    >
                                        {role.name}
                                    </Dropdown.Item>
                                ))}
                        </Dropdown>
                    )
                },
            },
        ], // eslint-disable-next-line react-hooks/exhaustive-deps
        [roleList, userList],
    )

    return (
        <>
            <DataTable
                selectable
                columns={columns}
                data={userList}
                noData={!initialLoading && userList.length === 0}
                skeletonAvatarColumns={[0]}
                skeletonAvatarProps={{ width: 28, height: 28 }}
                loading={initialLoading}
                pagingData={{
                    total: userListTotal,
                    pageIndex,
                    pageSize,
                }}
                checkboxChecked={(row) =>
                    selectedUser.some((selected) => selected.id === row.id)
                }
                hoverable={false}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
                onSort={handleSort}
                onCheckBoxChange={handleRowSelect}
                onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
        </>
    )
}

export default RolesPermissionsUserTable

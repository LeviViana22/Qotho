'use client'
import React, { useState, useEffect } from 'react'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Link from 'next/link'
import signOut from '@/server/actions/auth/handleSignOut'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import isBrowser from '@/utils/isBrowser'
import {
    PiUserDuotone,
    PiGearDuotone,
    PiPulseDuotone,
    PiSignOutDuotone,
} from 'react-icons/pi'

const dropdownItemList = [
    {
        label: 'Perfil',
        path: '/concepts/account/settings',
        icon: <PiUserDuotone />,
    },
    {
        label: 'Configurações',
        path: '/concepts/account/settings',
        icon: <PiGearDuotone />,
    },
    {
        label: 'Logs',
        path: '/concepts/account/activity-log',
        icon: <PiPulseDuotone />,
    },
]

const _UserDropdown = () => {
    const { session } = useCurrentSession()
    const { currentUser } = useUserStore()
    const isHydrated = useUserStoreHydrated()
    const [userImage, setUserImage] = useState('')

    const handleSignOut = async () => {
        await signOut()
    }

    // Use currentUser from Zustand store if hydrated and available, otherwise fall back to session
    const userInfo = (isHydrated && currentUser) ? currentUser : session?.user
    const userName = userInfo?.name || userInfo?.userName || 'Anonymous'
    const userEmail = userInfo?.email || 'No email available'
    
    // Debug logging
    useEffect(() => {
        console.log('UserProfileDropdown: Debug info:', {
            isHydrated,
            currentUser: currentUser ? { id: currentUser.id, name: currentUser.name, img: currentUser.img, image: currentUser.image } : null,
            userInfo: userInfo ? { id: userInfo.id, name: userInfo.name, img: userInfo.img, image: userInfo.image } : null,
            session: session?.user ? { id: session.user.id, name: session.user.name } : null,
            userImage
        })
    }, [isHydrated, currentUser, userInfo, session, userImage])
    
    // Update user image after hydration to prevent hydration mismatch
    useEffect(() => {
        if (isHydrated && currentUser && isBrowser) {
            // Use image directly from Zustand store
            const imageUrl = currentUser.img || currentUser.image || ''
            console.log('UserProfileDropdown: Setting user image from currentUser:', imageUrl)
            setUserImage(imageUrl)
        } else if (userInfo) {
            // During SSR or before hydration, use the fallback image
            const imageUrl = userInfo.img || userInfo.image || ''
            console.log('UserProfileDropdown: Setting user image from userInfo:', imageUrl)
            setUserImage(imageUrl)
        }
    }, [isHydrated, currentUser, userInfo?.img, userInfo?.image])

    // Show loading state while hydrating (only in browser)
    if (isBrowser && !isHydrated) {
        return (
            <div className="flex items-center">
                <Avatar size={32} icon={<PiUserDuotone />} />
            </div>
        )
    }

    const avatarProps = {
        ...(userImage
            ? { src: userImage }
            : { icon: <PiUserDuotone /> }),
    }

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            renderTitle={
                <div className="cursor-pointer flex items-center">
                    <Avatar size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <Avatar {...avatarProps} />
                    <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                            {userName}
                        </div>
                        <div className="text-xs">
                            {userEmail}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            {dropdownItemList.map((item) => (
                <Dropdown.Item
                    key={item.label}
                    eventKey={item.label}
                    className="px-0"
                >
                    <Link className="flex h-full w-full px-2" href={item.path}>
                        <span className="flex gap-2 items-center w-full">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </span>
                    </Link>
                </Dropdown.Item>
            ))}
            <Dropdown.Item variant="divider" />
            <Dropdown.Item
                eventKey="Sign Out"
                className="gap-2"
                onClick={handleSignOut}
            >
                <span className="text-xl">
                    <PiSignOutDuotone />
                </span>
                <span>Sair</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown

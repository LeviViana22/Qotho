'use client'
import { useRef } from 'react'
import ToggleDrawer from '@/components/shared/ToggleDrawer'
import UserFormMenu from './UserFormMenu'

const UserFormMobileMenu = () => {
    const drawerRef = useRef(null)

    return (
        <>
            <div>
                <ToggleDrawer ref={drawerRef} title="Navigation">
                    <UserFormMenu
                        onChange={() => {
                            drawerRef.current?.handleCloseDrawer()
                        }}
                    />
                </ToggleDrawer>
            </div>
        </>
    )
}

export default UserFormMobileMenu


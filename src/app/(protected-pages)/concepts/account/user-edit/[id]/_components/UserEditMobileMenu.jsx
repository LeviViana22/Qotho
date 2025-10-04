'use client'
import { useRef } from 'react'
import ToggleDrawer from '@/components/shared/ToggleDrawer'
import UserEditMenu from './UserEditMenu'

const UserEditMobileMenu = () => {
    const drawerRef = useRef(null)

    return (
        <>
            <div>
                <ToggleDrawer ref={drawerRef} title="Navigation">
                    <UserEditMenu
                        onChange={() => {
                            drawerRef.current?.handleCloseDrawer()
                        }}
                    />
                </ToggleDrawer>
            </div>
        </>
    )
}

export default UserEditMobileMenu

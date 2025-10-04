'use client'
import { useRef } from 'react'
import ToggleDrawer from '@/components/shared/ToggleDrawer'
import AddUserMenu from './AddUserMenu'

const AddUserMobileMenu = () => {
    const drawerRef = useRef(null)

    return (
        <>
            <div>
                <ToggleDrawer ref={drawerRef} title="Navigation">
                    <AddUserMenu
                        onChange={() => {
                            drawerRef.current?.handleCloseDrawer()
                        }}
                    />
                </ToggleDrawer>
            </div>
        </>
    )
}

export default AddUserMobileMenu

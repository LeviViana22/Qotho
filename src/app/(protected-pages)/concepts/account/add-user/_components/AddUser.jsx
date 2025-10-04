'use client'

import { lazy, Suspense } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import AddUserMenu from './AddUserMenu'
import AddUserMobileMenu from './AddUserMobileMenu'
import Loading from '@/components/shared/Loading'
import { useUserFormStore } from '../_store/userFormStore'

const Profile = lazy(() => import('./AddUserProfile'))
const Notification = lazy(() => import('./AddUserNotification'))

const AddUser = () => {
    const { currentView } = useUserFormStore()

    return (
        <AdaptiveCard className="h-full">
            <div className="flex flex-auto h-full">
                <div className="w-[200px] xl:w-[280px] hidden lg:block">
                    <AddUserMenu />
                </div>
                <div className="xl:ltr:pl-6 xl:rtl:pr-6 flex-1 py-2">
                    <div className="mb-6 lg:hidden">
                        <AddUserMobileMenu />
                    </div>
                    <Suspense
                        fallback={<Loading loading={true} className="w-full" />}
                    >
                        {currentView === 'profile' && <Profile />}
                        {currentView === 'notification' && <Notification />}
                    </Suspense>
                </div>
            </div>
        </AdaptiveCard>
    )
}

export default AddUser


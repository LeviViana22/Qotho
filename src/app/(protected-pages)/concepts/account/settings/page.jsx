import Settings from './_components/Settings'
import { checkPageAccess } from '@/utils/serverPageAccess'

const Page = async () => {
    // Check if user has access to settings page
    await checkPageAccess('concepts/account/settings')
    
    return <Settings />
}

export default Page

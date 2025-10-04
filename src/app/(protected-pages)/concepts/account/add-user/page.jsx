import AddUser from './_components/AddUser'
import { requireAdmin } from '@/utils/serverPageAccess'

const Page = async () => {
    // Require admin access to create users
    await requireAdmin()
    
    return <AddUser />
}

export default Page


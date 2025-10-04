import { usersData } from '@/mock/data/usersData'

const getSrcumboardMembers = async () => {
    // Try to get real users from localStorage first (client-side hydration)
    if (typeof window !== 'undefined') {
        try {
            const userStoreData = localStorage.getItem('user-store')
            if (userStoreData) {
                const parsedData = JSON.parse(userStoreData)
                const realUsers = parsedData.state?.users || []
                
                if (realUsers.length > 0) {
                    // Use real users from the user store
                    const borderMembersId = ['3', '2', '4', '7', '1', '10', '9']
                    const participantMembers = realUsers.filter((user) =>
                        borderMembersId.includes(user.id),
                    )
                    return {
                        participantMembers,
                        allMembers: realUsers,
                    }
                }
            }
        } catch (error) {
            console.log('Error reading user store data, falling back to mock data')
        }
    }
    
    // Fallback to mock data if real users are not available
    const borderMembersId = ['3', '2', '4', '7', '1', '10', '9']
    const participantMembers = usersData.filter((user) =>
        borderMembersId.includes(user.id),
    )
    return {
        participantMembers,
        allMembers: usersData,
    }
}

export default getSrcumboardMembers

import { useEffect, useState } from 'react'

/**
 * Hook to return users with their images from Zustand store
 * @param {Array} users - Array of user objects
 * @returns {Array} Array of users with their images
 */
export const useStoredUserImages = (users = []) => {
    const [usersWithImages, setUsersWithImages] = useState(users)

    useEffect(() => {
        if (!users || users.length === 0) {
            setUsersWithImages(users)
            return
        }

        // Return users as they are from the store (images already loaded)
        setUsersWithImages(users)
    }, [users])

    return usersWithImages
}

export default useStoredUserImages
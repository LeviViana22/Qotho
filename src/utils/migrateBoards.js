// Utility functions for migrating boards from localStorage to database

export const needsMigration = () => {
    try {
        const scrumboardData = localStorage.getItem('scrumboardData')
        const migratedFlag = localStorage.getItem('migratedToDatabase')
        
        // Only migrate if we have scrumboard data and haven't migrated yet
        // This is specifically for the scrum-board/escrituras system
        return scrumboardData && !migratedFlag
    } catch (error) {
        console.error('Error checking migration status:', error)
        return false
    }
}

export const migrateBoardsToDatabase = async () => {
    try {
        const scrumboardData = localStorage.getItem('scrumboardData')
        
        if (!scrumboardData) {
            console.log('No scrumboard data found in localStorage')
            return false
        }

        const boards = JSON.parse(scrumboardData)
        console.log('Migrating boards to database:', Object.keys(boards))

        const response = await fetch('/api/migrate-boards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ boards }),
        })

        if (response.ok) {
            const result = await response.json()
            console.log('Migration successful:', result)
            
            // Set migration flag to prevent re-migration
            localStorage.setItem('migratedToDatabase', 'true')
            
            return true
        } else {
            console.error('Migration failed:', await response.text())
            return false
        }
    } catch (error) {
        console.error('Error during migration:', error)
        return false
    }
}

const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    // Find the admin user by name "Levi Viana"
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { name: { contains: 'Levi Viana' } },
          { firstName: { contains: 'Levi' } },
          { lastName: { contains: 'Viana' } }
        ]
      }
    })

    if (!adminUser) {
      console.log('Admin user "Levi Viana" not found. Available users:')
      const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true }
      })
      console.log(allUsers)
      return
    }

    console.log('Found admin user:', adminUser.name, adminUser.email)

    // Reset password to 'admin123'
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        password: hashedPassword,
        lastOnline: Math.floor(Date.now() / 1000) // Update last online to current time
      }
    })

    console.log(`Password reset successfully for ${updatedUser.name} (${updatedUser.email})`)
    console.log('New password: admin123')
    console.log('Please change this password after logging in!')
    
  } catch (error) {
    console.error('Error resetting admin password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()

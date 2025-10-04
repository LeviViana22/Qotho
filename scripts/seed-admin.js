const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    // Check if any admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        title: 'System Administrator',
        personalInfo: {
          location: 'São Paulo, BR',
          address: 'Rua das Flores, 123',
          postcode: '01234-567',
          city: 'São Paulo',
          country: 'BR',
          dialCode: '+55',
          phoneNumber: '+55-11-99999-9999',
        },
        lastOnline: 1640995200, // Fixed timestamp: 2022-01-01 00:00:00 UTC
      },
    })

    console.log('Admin user created successfully:', adminUser)
  } catch (error) {
    console.error('Error seeding admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()

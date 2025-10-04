import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createUser(userData) {
  const { email, password, name, firstName, lastName, role = 'user', status = 'active', title, personalInfo, image } = userData
  
  // Password should already be hashed when passed from API route
  // Only hash if it's not already hashed (for backward compatibility)
  const hashedPassword = password ? (password.startsWith('$2') ? password : await bcrypt.hash(password, 12)) : null
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || `${firstName} ${lastName}`,
      firstName,
      lastName,
      role,
      status,
      title,
      image: image || '',
      personalInfo: personalInfo || {},
      lastOnline: 1640995200, // Fixed timestamp: 2022-01-01 00:00:00 UTC
    },
  })

  return user
}

export async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
      sessions: true,
    },
  })
}

export async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: true,
      sessions: true,
    },
  })
}

export async function updateUser(id, userData) {
  const { password, ...updateData } = userData
  
  // Hash password if provided
  if (password) {
    updateData.password = await bcrypt.hash(password, 12)
  }
  
  updateData.updatedAt = new Date()
  
  return await prisma.user.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id },
  })
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUsersByRole(role) {
  return await prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: 'desc' },
  })
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export async function updateLastOnline(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: { lastOnline: 1640995200 }, // Fixed timestamp: 2022-01-01 00:00:00 UTC
  })
}



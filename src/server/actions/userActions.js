'use server'

import fs from 'fs'
import path from 'path'

const USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.json')

// Read users from JSON file
const getUsers = () => {
  try {
    const fileContent = fs.readFileSync(USERS_FILE_PATH, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error reading users file:', error)
    return []
  }
}

// Write users to JSON file
const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    console.error('Error writing users file:', error)
    return false
  }
}

// Get all users
export const getAllUsers = async () => {
  return getUsers()
}

// Add a new user
export const addUser = async (userData) => {
  const users = getUsers()
  const newUser = {
    id: (users.length + 1).toString(),
    ...userData,
    lastOnline: 1640995200, // Fixed timestamp: 2022-01-01 00:00:00 UTC
    orderHistory: [],
    paymentMethod: [],
    subscription: [],
    totalSpending: 0
  }
  
  users.push(newUser)
  const success = saveUsers(users)
  
  if (success) {
    return { success: true, user: newUser }
  } else {
    return { success: false, error: 'Failed to save user' }
  }
}

// Update an existing user
export const updateUser = async (userId, userData) => {
  const users = getUsers()
  const userIndex = users.findIndex(user => user.id === userId)
  
  if (userIndex === -1) {
    return { success: false, error: 'User not found' }
  }
  
  users[userIndex] = { ...users[userIndex], ...userData }
  const success = saveUsers(users)
  
  if (success) {
    return { success: true, user: users[userIndex] }
  } else {
    return { success: false, error: 'Failed to update user' }
  }
}

// Delete a user
export const deleteUser = async (userId) => {
  const users = getUsers()
  const filteredUsers = users.filter(user => user.id !== userId)
  
  if (filteredUsers.length === users.length) {
    return { success: false, error: 'User not found' }
  }
  
  const success = saveUsers(filteredUsers)
  
  if (success) {
    return { success: true }
  } else {
    return { success: false, error: 'Failed to delete user' }
  }
}

// Get user by ID
export const getUserById = async (userId) => {
  const users = getUsers()
  return users.find(user => user.id === userId)
}


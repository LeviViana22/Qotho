// Client-side email functions (no NodeMailer here)

// In-memory storage for sent emails (in a real app, this would be a database)
let sentEmails = []

/**
 * Get mock email list for testing (fallback when API fails)
 */
function getMockEmails() {
  const inboxEmails = [
    {
      id: '1',
      name: 'John Doe',
      title: 'Welcome to our platform',
      message: [{
        id: '1',
        name: 'John Doe',
        content: 'Thank you for joining our platform. We\'re excited to have you on board!',
        date: '2022-01-01', // Fixed date for SSR compatibility
        avatar: '/img/avatars/thumb-1.jpg'
      }],
      starred: false,
      flagged: false,
      checked: false,
      label: 'inbox'
    },
    {
      id: '2',
      name: 'Jane Smith',
      title: 'Project Update',
      message: [{
        id: '2',
        name: 'Jane Smith',
        content: 'Here\'s the latest update on our project. Everything is progressing well.',
        date: '2021-12-31', // Fixed date for SSR compatibility
        avatar: '/img/avatars/thumb-2.jpg'
      }],
      starred: true,
      flagged: false,
      checked: false,
      label: 'inbox'
    },
    {
      id: '3',
      name: 'Support Team',
      title: 'Your ticket has been resolved',
      message: [{
        id: '3',
        name: 'Support Team',
        content: 'We\'ve resolved your support ticket. Please let us know if you need anything else.',
        date: '2021-12-30', // Fixed date for SSR compatibility
        avatar: '/img/avatars/thumb-3.jpg'
      }],
      starred: false,
      flagged: true,
      checked: false,
      label: 'inbox'
    }
  ]

  // Combine inbox and sent emails
  return [...inboxEmails, ...sentEmails]
}

/**
 * Get a single mock email by ID (fallback)
 */
function getMockEmail(id) {
  const emails = getMockEmails()
  return emails.find(email => email.id === id) || null
}

/**
 * Toggle star status of an email
 */
function toggleStar(emailId) {
  // Find email in sent emails
  const sentEmail = sentEmails.find(email => email.id === emailId)
  if (sentEmail) {
    sentEmail.starred = !sentEmail.starred
    return true
  }
  
  // For inbox emails, we'd need to persist this in a real app
  // For now, just return success
  return true
}

/**
 * Get emails by category (fallback to mock data)
 */
function getEmailsByCategory(category) {
  const allEmails = getMockEmails()
  
  if (category === 'inbox') {
    return allEmails.filter(email => email.label === 'inbox')
  } else if (category === 'sentItem') {
    return allEmails.filter(email => email.label === 'sentItem')
  } else if (category === 'starred') {
    return allEmails.filter(email => email.starred === true)
  } else if (category === 'flagged') {
    return allEmails.filter(email => email.flagged === true)
  }
  
  return allEmails
}

/**
 * Add a sent email to the list (called from API route)
 */
function addSentEmail(emailData) {
  const sentEmail = {
    id: `sent_${1234567890}`, // Fixed ID for SSR compatibility
    name: 'You',
    title: emailData.subject,
    message: [{
      id: `sent_${1234567890}`, // Fixed ID for SSR compatibility
      name: 'You',
      content: emailData.content,
      date: '2022-01-01', // Fixed date for SSR compatibility
      avatar: '/img/avatars/thumb-1.jpg'
    }],
    starred: false,
    flagged: false,
    checked: false,
    label: 'sentItem',
    to: emailData.to,
    sentAt: '2022-01-01T00:00:00.000Z' // Fixed timestamp for SSR compatibility
  }
  
  sentEmails.unshift(sentEmail)
  console.log('Added sent email:', sentEmail)
}

/**
 * Fetch emails from API with fallback to mock data
 */
async function fetchEmailsFromAPI(category = 'inbox') {
  try {
    const folderMap = {
      'inbox': 'INBOX',
      'sentItem': 'INBOX.Sent',
      'draft': 'INBOX.Drafts',
      'junk': 'INBOX.spam',
      'archive': 'INBOX.Archive',
      'deleted': 'INBOX.Trash'
    }
    
    const folder = folderMap[category] || 'INBOX'
    
    const response = await fetch(`/api/email/fetch?folder=${folder}&limit=20`) // Reduced limit from 50 to 20
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch emails')
    }
    
    return data.emails
  } catch (error) {
    console.error('Failed to fetch emails from API, using mock data:', error)
    return getEmailsByCategory(category)
  }
}

export {
  getMockEmails,
  getMockEmail,
  toggleStar,
  getEmailsByCategory,
  addSentEmail,
  fetchEmailsFromAPI
} 
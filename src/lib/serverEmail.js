const nodemailer = require('nodemailer')
import Imap from 'imap'
import { simpleParser } from 'mailparser'

/**
 * Clean Gmail signatures and broken image URLs
 */
function cleanGmailSignatures(content) {
  // Remove Gmail signature divs
  let cleaned = content
    .replace(/<div[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '')
    .replace(/<div[^>]*data-smartmail="gmail_signature"[^]*?<\/div>/gi, '')
    .replace(/<div[^>]*dir="ltr"[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '')
    .replace(/<div[^>]*dir="ltr"[^>]*data-smartmail="gmail_signature"[^]*?<\/div>/gi, '')
  
  // Remove broken Gmail signature images
  cleaned = cleaned
    .replace(/<img[^>]*src="[^"]*mail-sig-[^"]*"[^>]*>/gi, '')
    .replace(/<img[^>]*src="[^"]*ci3\.googleusercontent\.com[^"]*"[^>]*>/gi, '')
    .replace(/<img[^>]*src="[^"]*googleusercontent\.com[^"]*"[^>]*>/gi, '')
  
  // Remove any remaining Gmail signature related content
  cleaned = cleaned
    .replace(/<div[^>]*dir="ltr"[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '')
    .replace(/<div[^>]*dir="ltr"[^>]*data-smartmail="gmail_signature"[^]*?<\/div>/gi, '')
    .replace(/<div[^>]*dir="ltr"[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '')
  
  return cleaned
}

/**
 * Detect and fix problematic email content patterns
 */
function fixProblematicContent(content) {
  // Check if content contains problematic base64 patterns
  const hasProblematicBase64 = /\/[A-Za-z0-9+/=]{20,}/.test(content) || /[A-Za-z0-9+/=]{50,}/.test(content)
  const hasContentDisposition = /Content-Disposition:/.test(content)
  const hasBoundaryMarkers = /--[a-zA-Z0-9_=+\-]{10,}/.test(content)
  const hasGmailSignature = /gmail_signature/.test(content) || /mail-sig-/.test(content)
  
  if (hasProblematicBase64 || hasContentDisposition || hasBoundaryMarkers || hasGmailSignature) {
    console.log('Detected problematic content patterns, applying fixes...')
    
    // Remove problematic patterns
    let fixed = content
      .replace(/\/[A-Za-z0-9+/=]{20,}/g, '')
      .replace(/[A-Za-z0-9+/=]{50,}/g, '')
      .replace(/Content-Disposition:[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
      .replace(/--[a-zA-Z0-9_=+\-]{10,}/g, '')
      .replace(/Content-Type:\s*[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
      .replace(/\/[A-Za-z0-9+/=]{10,}/g, '')
      .replace(/[A-Za-z0-9+/=]{30,}/g, '')
    
    // Remove Gmail signature completely
    fixed = fixed.replace(/<div[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '')
    fixed = fixed.replace(/<div[^>]*data-smartmail="gmail_signature"[^]*?<\/div>/gi, '')
    fixed = fixed.replace(/<img[^>]*src="[^"]*mail-sig-[^"]*"[^>]*>/gi, '')
    fixed = fixed.replace(/<img[^>]*src="[^"]*ci3\.googleusercontent\.com[^"]*"[^>]*>/gi, '')
    
    // Remove any remaining Gmail signature related content
    fixed = fixed.replace(/<div[^>]*dir="ltr"[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '')
    fixed = fixed.replace(/<div[^>]*dir="ltr"[^>]*data-smartmail="gmail_signature"[^]*?<\/div>/gi, '')
    
    // If content is still problematic, try to extract only the HTML body
    if (/\/[A-Za-z0-9+/=]{10,}/.test(fixed) || /Content-Disposition:/.test(fixed) || /gmail_signature/.test(fixed)) {
      console.log('Content still problematic, extracting HTML body only...')
      const bodyMatch = fixed.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        fixed = bodyMatch[1].trim()
      } else {
        // If no body tag, try to find the first HTML content
        const htmlMatch = fixed.match(/<[^>]+>[\s\S]*?<\/[^>]+>/)
        if (htmlMatch) {
          fixed = htmlMatch[0]
        }
      }
    }
    
    return fixed
  }
  
  return content
}

/**
 * Decode quoted-printable content with proper encoding handling
 */
function decodeQuotedPrintable(str) {
  // First, decode the quoted-printable encoding
  let decoded = str
    .replace(/=([0-9A-F]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    .replace(/=3D/g, '=')
    .replace(/=\r?\n/g, '')
  
  // Handle HTML entities for Portuguese characters
  decoded = decoded
    .replace(/&Aacute;/g, 'Á')
    .replace(/&aacute;/g, 'á')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&acirc;/g, 'â')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&atilde;/g, 'ã')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&auml;/g, 'ä')
    .replace(/&Eacute;/g, 'É')
    .replace(/&eacute;/g, 'é')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&iacute;/g, 'í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&oacute;/g, 'ó')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&otilde;/g, 'õ')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&ccedil;/g, 'ç')
  
  return decoded
}

console.log('Email configuration:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  user: process.env.EMAIL_USER ? '***' : 'NOT SET',
  password: process.env.EMAIL_PASSWORD ? '***' : 'NOT SET'
})

// Simple in-memory cache for emails
const emailCache = new Map()
const CACHE_DURATION = 10000 // 10 seconds for faster updates
// Individual email cache
const individualEmailCache = new Map()
// Soft-deleted emails (persist in memory during runtime)
const deletedEmailIds = new Set()
const deletedEmailsStorage = new Map()

// File-based persistence for deleted emails
import fs from 'fs'
import path from 'path'

const DELETED_EMAILS_FILE = path.join(process.cwd(), 'deleted-emails.json')

// Load deleted emails from file on startup
function loadDeletedEmails() {
  try {
    if (fs.existsSync(DELETED_EMAILS_FILE)) {
      const data = fs.readFileSync(DELETED_EMAILS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      // Restore deletedEmailIds
      if (parsed.deletedEmailIds) {
        parsed.deletedEmailIds.forEach(id => deletedEmailIds.add(id))
      }
      
      // Restore deletedEmailsStorage
      if (parsed.deletedEmailsStorage) {
        Object.entries(parsed.deletedEmailsStorage).forEach(([key, value]) => {
          deletedEmailsStorage.set(key, value)
        })
      }
      
      console.log(`Loaded ${deletedEmailIds.size} deleted email IDs and ${deletedEmailsStorage.size} deleted emails from file`)
    }
  } catch (error) {
    console.error('Error loading deleted emails:', error.message)
  }
}

// Save deleted emails to file
function saveDeletedEmails() {
  try {
    const data = {
      deletedEmailIds: Array.from(deletedEmailIds),
      deletedEmailsStorage: Object.fromEntries(deletedEmailsStorage)
    }
    fs.writeFileSync(DELETED_EMAILS_FILE, JSON.stringify(data, null, 2))
    console.log(`Saved ${deletedEmailIds.size} deleted email IDs and ${deletedEmailsStorage.size} deleted emails to file`)
  } catch (error) {
    console.error('Error saving deleted emails:', error.message)
  }
}

// Load deleted emails on module initialization
loadDeletedEmails()

/**
 * Clear all caches and restore deleted emails
 * This function helps recover from inconsistent states
 */
function clearAllCaches() {
  try {
    console.log('clearAllCaches: Clearing all email caches...')
    
    // Clear email cache
    emailCache.clear()
    console.log('clearAllCaches: Cleared emailCache')
    
    // Clear individual email cache
    individualEmailCache.clear()
    console.log('clearAllCaches: Cleared individualEmailCache')
    
    // Clear deleted emails storage
    deletedEmailIds.clear()
    deletedEmailsStorage.clear()
    console.log('clearAllCaches: Cleared deleted emails storage')
    
    // Remove the persistence file
    if (fs.existsSync(DELETED_EMAILS_FILE)) {
      fs.unlinkSync(DELETED_EMAILS_FILE)
      console.log('clearAllCaches: Removed deleted-emails.json file')
    }
    
    console.log('clearAllCaches: All caches cleared successfully')
    return true
  } catch (error) {
    console.error('clearAllCaches: Error clearing caches:', error)
    return false
  }
}

/**
 * Clean up fake "Unknown/Deleted Email" entries from deleted emails storage
 */
function cleanupFakeDeletedEmails() {
  try {
    console.log('cleanupFakeDeletedEmails: Cleaning up fake deleted email entries...')
    
    let removedCount = 0
    
    // Find and remove fake entries
    for (const [emailId, email] of deletedEmailsStorage.entries()) {
      if (email.name === 'Unknown' && 
          email.title === 'Deleted Email' && 
          email.content === 'This email was deleted') {
        
        console.log(`cleanupFakeDeletedEmails: Removing fake entry: ${emailId}`)
        deletedEmailsStorage.delete(emailId)
        deletedEmailIds.delete(emailId)
        removedCount++
      }
    }
    
    // Save the cleaned up data
    if (removedCount > 0) {
      saveDeletedEmails()
      console.log(`cleanupFakeDeletedEmails: Removed ${removedCount} fake entries`)
    } else {
      console.log('cleanupFakeDeletedEmails: No fake entries found')
    }
    
    return removedCount
  } catch (error) {
    console.error('cleanupFakeDeletedEmails: Error cleaning up fake entries:', error)
    return 0
  }
}

// In-memory storage for sent emails (since Mailo doesn't have a sent folder)
const sentEmailsStorage = new Map()

/**
 * Save a sent email to local storage
 */
function saveSentEmail(emailData) {
  const timestamp = 1640995200000 // Fixed timestamp: 2022-01-01 00:00:00 UTC
  const sentEmail = {
    id: `sent_${timestamp}_${timestamp.toString(36).substr(2, 9)}`,
    name: emailData.from || process.env.EMAIL_USER,
    title: emailData.subject,
    message: [{
      id: `msg_sent_${timestamp}`,
      name: emailData.from || process.env.EMAIL_USER,
      content: emailData.content,
      date: new Date().toLocaleDateString(),
      avatar: `/img/avatars/thumb-${(timestamp % 12) + 1}.jpg`
    }],
    starred: false,
    flagged: false,
    checked: false,
    label: 'sentitem',
    from: emailData.from || process.env.EMAIL_USER,
    to: emailData.to,
    date: new Date().toISOString(),
    content: emailData.content
  }
  
  sentEmailsStorage.set(sentEmail.id, sentEmail)
  console.log('Saved sent email locally:', sentEmail.id)
  
  return sentEmail
}

/**
 * Get all sent emails from local storage
 */
function getSentEmails() {
  return Array.from(sentEmailsStorage.values()).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )
}

/**
 * Create SMTP transporter for sending emails
 */
function createSMTPTransporter() {
  console.log('=== CREATING SMTP TRANSPORTER ===')
  console.log('SMTP Config:', {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
  })
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Add additional options for Mailo
    tls: {
      rejectUnauthorized: false,
      // Add SSL-specific options
      secureProtocol: 'TLSv1_2_method'
    },
    // Add debug info
    debug: true,
    logger: true
  })
  
  console.log('SMTP transporter config created')
  return transporter
}

/**
 * Send an email using SMTP
 */
async function sendEmail(to, subject, content) {
  try {
    console.log('=== SEND EMAIL FUNCTION CALLED ===')
    console.log('Parameters:', { to, subject, contentLength: content?.length })
    console.log('Environment check:', {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_SECURE: process.env.EMAIL_SECURE,
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
    })
    
    console.log('Creating mail options...')
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: content,
    }

    console.log('Mail options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject })

    console.log('Creating SMTP transporter...')
    const transporter = createSMTPTransporter()
    console.log('SMTP transporter created successfully')
    
    console.log('Sending email via SMTP...')
    const result = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', result.messageId)
    console.log('Full SMTP result:', {
        messageId: result.messageId,
        response: result.response,
        accepted: result.accepted,
        rejected: result.rejected,
        envelope: result.envelope,
        raw: result.raw
    })
    
    // Check if the email was actually accepted
    if (result.accepted && result.accepted.length > 0) {
        console.log('✅ Email accepted by SMTP server for delivery')
        
        // Save sent email locally since Mailo doesn't have a sent folder
        saveSentEmail({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            content: mailOptions.html
        })
    } else {
        console.log('❌ Email not accepted by SMTP server')
    }
    
    if (result.rejected && result.rejected.length > 0) {
        console.log('❌ Email rejected by SMTP server:', result.rejected)
    }
    
    return { success: true, id: result.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Fetch emails from IMAP server with improved error handling, retry logic, and caching
 */
async function fetchEmails(folder = 'INBOX', limit = 20, page = 1) { // Added page parameter for pagination
  // Check cache first
  const cacheKey = `${folder}-${limit}-${page}`
  const cached = emailCache.get(cacheKey)
  
  if (cached && 1640995200000 - cached.timestamp < CACHE_DURATION) { // Fixed timestamp check
    console.log(`Returning cached emails for ${folder} page ${page} (${cached.emails.length} emails)`)
    return cached.emails
  }

  return new Promise((resolve, reject) => {
    // Try different IMAP configurations
    const configs = [
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        tlsOptions: { 
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method'
        }
      },
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        tlsOptions: { 
          rejectUnauthorized: false
        }
      },
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 143,
        tls: false
      }
    ]

    let currentConfigIndex = 0
    let retryCount = 0
    const maxRetries = 1 // Reduced from 2 to 1 to prevent excessive retries

    const tryConnection = () => {
      if (currentConfigIndex >= configs.length) {
        console.log('All IMAP configurations failed, returning empty array')
        resolve([]) // Return empty array instead of rejecting
        return
      }

      const config = configs[currentConfigIndex]
      console.log(`Trying IMAP config ${currentConfigIndex + 1} (attempt ${retryCount + 1}):`, {
        host: config.host,
        port: config.port,
        tls: config.tls
      })

      const imap = new Imap(config)
      const emails = []
      let connectionTimeout

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        console.log(`IMAP connection timeout for config ${currentConfigIndex + 1}`)
        imap.end()
        retryConnection()
      }, 10000) // 10 second timeout for faster response

      imap.once('ready', () => {
        clearTimeout(connectionTimeout)
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            console.log(`Config ${currentConfigIndex + 1} failed to open box:`, err.message)
            imap.end()
            retryConnection()
            return
          }

          console.log(`Successfully connected with config ${currentConfigIndex + 1}, box:`, box.messages.total, 'messages')

          // Get emails for the specific page with pagination
          const startSeq = Math.max(1, box.messages.total - (page * limit) + 1)
          const endSeq = Math.max(1, box.messages.total - ((page - 1) * limit))
          
          console.log(`Fetching emails for page ${page}: sequence ${startSeq} to ${endSeq} (total messages: ${box.messages.total})`)
          
          const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
             bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
             struct: true,
             envelope: true,
             flags: true
           })

          fetch.on('message', (msg, seqno) => {
            const emailId = `email_${seqno}`
            
            // Check for existing email status in cache
            let existingStatus = { starred: false, flagged: false }
            for (const [key, value] of emailCache.entries()) {
              const existingEmail = value.emails.find(e => e.id === emailId)
              if (existingEmail) {
                existingStatus = { 
                  starred: existingEmail.starred || false, 
                  flagged: existingEmail.flagged || false 
                }
                break
              }
            }
            
            const email = {
              id: emailId,
              name: '',
              title: '',
              message: [],
              starred: existingStatus.starred,
              flagged: existingStatus.flagged,
              checked: false,
              read: false, // Default to unread
              label: folder.toLowerCase(),
              from: '',
              to: '',
              date: '',
              content: '',
              attachments: [],
              total: 0, // Will be set after we get the total count
              folderTotal: 0
            }

            msg.on('flags', (flags) => {
              // Check if email has been read (has \Seen flag)
              email.read = flags.includes('\\Seen')
              console.log(`Email ${seqno} flags:`, flags, 'read:', email.read)
            })

            msg.on('body', (stream, info) => {
              let buffer = ''
              stream.on('data', (chunk) => {
                // Use Buffer.from instead of deprecated Buffer() constructor
                buffer += Buffer.from(chunk).toString('utf8')
              })
              stream.once('end', () => {
                                 if (info.which === 'TEXT') {
                   // Simple content extraction - preserve all content with size limits
                   let content = buffer
                     .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                     .replace(/\r\n/g, '\n')
                     .replace(/\r/g, '\n')
                     
                   // Limit content size to prevent memory issues (max 1MB)
                   if (content.length > 1024 * 1024) {
                     console.log(`Email ${seqno}: Content too large (${content.length} bytes), truncating`)
                     content = content.substring(0, 1024 * 1024) + '\n\n[Content truncated due to size]'
                   }
                     
                   // Check for charset in the content
                   const charsetMatch = content.match(/charset=["']?([^"'\s;]+)["']?/i)
                   const detectedCharset = charsetMatch ? charsetMatch[1].toLowerCase() : 'utf-8'
                   console.log(`Email ${seqno} detected charset: ${detectedCharset}`)
                   
                   // Decode quoted-printable content
                   content = decodeQuotedPrintable(content)
                   
                   // Try to convert from detected charset to UTF-8
                   try {
                     if (detectedCharset !== 'utf-8' && detectedCharset !== 'utf8') {
                       // For ISO-8859-1 or other encodings, we need to handle it properly
                       if (detectedCharset === 'iso-8859-1' || detectedCharset === 'latin1') {
                         // Convert from Latin-1 to UTF-8
                         const decoder = new TextDecoder('latin1')
                         const encoder = new TextEncoder()
                         const bytes = new Uint8Array(content.length)
                         for (let i = 0; i < content.length; i++) {
                           bytes[i] = content.charCodeAt(i)
                         }
                         content = decoder.decode(bytes)
                       }
                     }
                   } catch (error) {
                     console.log(`Email ${seqno} charset conversion failed:`, error.message)
                   }
                   
                   // Additional fix for common Portuguese character issues
                   // If we see Ã¡, Ã£, Ã§, etc., it means UTF-8 was incorrectly decoded as Latin-1
                   if (content.includes('Ã¡') || content.includes('Ã£') || content.includes('Ã§')) {
                     console.log(`Email ${seqno}: Detected UTF-8 incorrectly decoded as Latin-1, fixing...`)
                     // Convert the string back to bytes and decode as UTF-8
                     const bytes = new Uint8Array(content.length)
                     for (let i = 0; i < content.length; i++) {
                       bytes[i] = content.charCodeAt(i)
                     }
                     content = new TextDecoder('utf-8').decode(bytes)
                   }
                   
                                      // Enhanced content extraction for all email types with better performance
                   let finalContent = content.trim()
                   
                   // Remove MIME boundary endings first
                   finalContent = finalContent.replace(/-----=_NextPart_[^--]*--/g, '')
                   
                   // Look for MIME boundaries and content sections with early exit
                   const mimeBoundaryMatch = finalContent.match(/--[a-zA-Z0-9_]+/)
                   if (mimeBoundaryMatch) {
                     // Split by MIME boundaries and find the actual content
                     const parts = finalContent.split(/--[a-zA-Z0-9_]+/)
                     for (const part of parts) {
                       const trimmedPart = part.trim()
                       if (trimmedPart && 
                           !trimmedPart.startsWith('Content-Type:') &&
                           !trimmedPart.startsWith('MIME-Version:') &&
                           !trimmedPart.startsWith('From:') &&
                           !trimmedPart.startsWith('To:') &&
                           !trimmedPart.startsWith('Subject:') &&
                           !trimmedPart.startsWith('Date:') &&
                           !trimmedPart.startsWith('Message-ID:') &&
                           !trimmedPart.startsWith('X-') &&
                           (trimmedPart.includes('<html') || 
                            trimmedPart.includes('<!DOCTYPE') ||
                            trimmedPart.includes('<body') ||
                            trimmedPart.includes('<p>') ||
                            (trimmedPart.length > 20 && !trimmedPart.includes('Content-Type:')))) {
                         finalContent = trimmedPart
                         console.log(`Email ${seqno}: Found content in MIME part`)
                         break
                       }
                     }
                   } else {
                     // Try to find where the actual email content starts
                     const contentStarters = [
                       /<!DOCTYPE HTML/i,
                       /<html/i,
                       /<body/i,
                       /Content-Type: text\/html/i,
                       /Content-Type: text\/plain/i,
                       /<p>/i
                     ]
                     
                     let startIndex = -1
                     for (const starter of contentStarters) {
                       const match = finalContent.match(starter)
                       if (match) {
                         startIndex = match.index
                         break
                       }
                     }
                     
                     if (startIndex !== -1) {
                       // Found a clear starting point, use content from there
                       finalContent = finalContent.substring(startIndex)
                       console.log(`Email ${seqno}: Found content start at index ${startIndex}`)
                     } else {
                       // If no clear start found, try to remove the first paragraph if it's just raw text
                       const lines = finalContent.split('\n')
                       if (lines.length > 2) {
                         const firstLine = lines[0].trim()
                         const secondLine = lines[1].trim()
                         
                         // If first line looks like raw email content (no HTML tags, just text)
                         // and second line has HTML or proper formatting, skip the first line
                         if (firstLine && 
                             !firstLine.includes('<') && 
                             !firstLine.includes('>') &&
                             (secondLine.includes('<') || secondLine.includes('Content-Type:'))) {
                           finalContent = lines.slice(1).join('\n')
                           console.log(`Email ${seqno}: Removed first raw line`)
                         }
                       }
                     }
                   }
                   
                   // Additional cleanup for common issues with better performance
                    // Remove any remaining MIME headers
                    finalContent = finalContent.replace(/Content-Type:[^\n]*\n/g, '')
                    finalContent = finalContent.replace(/Content-Transfer-Encoding:[^\n]*\n/g, '')
                    finalContent = finalContent.replace(/MIME-Version:[^\n]*\n/g, '')
                    
                    // Remove any remaining email headers
                    finalContent = finalContent.replace(/From:[^\n]*\n/g, '')
                    finalContent = finalContent.replace(/To:[^\n]*\n/g, '')
                    finalContent = finalContent.replace(/Subject:[^\n]*\n/g, '')
                    finalContent = finalContent.replace(/Date:[^\n]*\n/g, '')
                    finalContent = finalContent.replace(/Message-ID:[^\n]*\n/g, '')
                    
                  // Check if this email contains HTML content that should be processed as HTML
                  const hasHtmlContent = finalContent.includes('Content-Type: text/html') || 
                                       finalContent.includes('<!DOCTYPE html>') || 
                                       finalContent.includes('<html') ||
                                       finalContent.includes('<table') ||
                                       finalContent.includes('<tr>') ||
                                       finalContent.includes('<td') ||
                                       finalContent.includes('<img') ||
                                       finalContent.includes('<a href') ||
                                       finalContent.includes('squarespace-email-marketing.s3.amazonaws.com') ||
                                       finalContent.includes('Veja as possibilidades') ||
                                       finalContent.includes('ACUITY') ||
                                       finalContent.includes('BIO SITES') ||
                                       finalContent.includes('UNFOLD') ||
                                       finalContent.includes('DOMAINS')
                  
                  if (hasHtmlContent) {
                    console.log('Email contains HTML content, processing as HTML email')
                    console.log('HTML content preview:', finalContent.substring(0, 500))
                  }
                  
                  // Clean content and convert inline images to proper img tags (with size limits)
                  const cleanResult = cleanEmailContent(finalContent)
                  finalContent = cleanResult.cleaned
                  if (cleanResult.isProcessedHtml) {
                    email.isProcessedHtml = true
                  }
                   
                   // Clean Gmail signatures and broken image URLs
                   finalContent = cleanGmailSignatures(finalContent)
                    
                    // Remove background colors and styles from email content
                    finalContent = finalContent
                        .replace(/bgcolor="[^"]*"/g, '') // Remove bgcolor attributes
                        .replace(/background="[^"]*"/g, '') // Remove background attributes
                        .replace(/background-color="[^"]*"/g, '') // Remove background-color attributes
                        .replace(/style="[^"]*background[^"]*"/g, 'style=""') // Remove style with background
                        .replace(/style="\s*"/g, '') // Remove empty style attributes
                    
  // Additional aggressive cleanup for any remaining base64 data (with size limits)
                    finalContent = finalContent.replace(/\/9j\/[A-Za-z0-9+/=]{50,}/g, '')
                    finalContent = finalContent.replace(/[A-Za-z0-9+/=]{100,}/g, '')
                    
                    // Remove any remaining MIME content that might contain base64
                    finalContent = finalContent.replace(/Content-Disposition:[^]*?\/9j\/[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
                    finalContent = finalContent.replace(/Content-Type:\s*image\/[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
                    
                    // Remove any remaining base64 patterns
                    finalContent = finalContent.replace(/\/9j\/[A-Za-z0-9+/=]+/g, '')
                    finalContent = finalContent.replace(/[A-Za-z0-9+/=]{200,}/g, '')
                    
  // Enhanced base64 cleanup - remove any long sequences of base64-like characters
  finalContent = finalContent.replace(/[A-Za-z0-9+/=]{50,}/g, '')
  
  // Remove Content-ID and other MIME headers that might contain base64
  finalContent = finalContent.replace(/Content-ID:\s*<[^>]*>/g, '')
  finalContent = finalContent.replace(/Content-Transfer-Encoding:\s*base64[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
  
  // Remove base64 content with spaces (like the corrupted content) - more specific patterns
  finalContent = finalContent.replace(/\]\s*Content-ID:\s*<[^>]*>\s*[A-Za-z0-9+/=\s]{50,}/g, '')
  
  // Only remove sequences that look like actual base64 (with proper base64 character distribution)
  finalContent = finalContent.replace(/[A-Za-z0-9+/=]{100,}(?=\s|$)/g, '') // Only very long sequences
  finalContent = finalContent.replace(/[A-Za-z0-9+/=]{50,}(?=\s*[A-Za-z0-9+/=]{50,})/g, '') // Only when followed by more base64
  
  // Remove the specific corrupted base64 pattern (starts with VHhe7dx and similar)
  finalContent = finalContent.replace(/^\s*[A-Za-z0-9+/=\s]{50,}\s*$/gm, '') // Remove lines that are only base64
  finalContent = finalContent.replace(/\s+[A-Za-z0-9+/=]{50,}\s+/g, ' ') // Remove base64 blocks surrounded by spaces
  
  // Remove any remaining base64 content blocks (more conservative)
  finalContent = finalContent.replace(/[A-Za-z0-9+/=]{200,}/g, '') // Only very long sequences
                   
                   // Simple content extraction - just clean up the content
                   let cleanContent = finalContent
                   
                   // Clean Gmail signatures and broken image URLs
                   cleanContent = cleanGmailSignatures(cleanContent)
                   
                   // Remove background colors and styles from email content
                   cleanContent = cleanContent
                       .replace(/bgcolor="[^"]*"/g, '') // Remove bgcolor attributes
                       .replace(/background="[^"]*"/g, '') // Remove background attributes
                       .replace(/background-color="[^"]*"/g, '') // Remove background-color attributes
                       .replace(/style="[^"]*background[^"]*"/g, 'style=""') // Remove style with background
                       .replace(/style="\s*"/g, '') // Remove empty style attributes
                   
                   // Remove any remaining base64 data that might be causing issues
                   cleanContent = cleanContent.replace(/\/[A-Za-z0-9+/=]{20,}/g, '')
                   cleanContent = cleanContent.replace(/[A-Za-z0-9+/=]{50,}/g, '')
                   
                   // Remove empty lines and excessive whitespace
                   cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n')
                   cleanContent = cleanContent.trim()
                   
                   // Extract attachments using the original function
                   console.log(`Email ${seqno}: About to extract attachments from content length: ${content.length}`)
                   const attachments = extractAttachments(content)
                   console.log(`Email ${seqno}: Extracted ${attachments.length} attachments`)
                   
                                     email.content = cleanContent
                    email.attachments = attachments
                    
                    console.log(`Email ${seqno} content length: ${email.content.length}`)
                    console.log(`Email ${seqno} attachments: ${attachments.length}`)
                    console.log(`Email ${seqno} content preview: ${email.content.substring(0, 200)}...`)
                    
                    // Debug: Check if there's still base64 data
                    if (finalContent.includes('/9j/') || finalContent.includes('Content-Disposition: inline')) {
                      console.log(`Email ${seqno}: Still contains base64 or inline data!`)
                      console.log(`Email ${seqno}: Content contains /9j/: ${finalContent.includes('/9j/')}`)
                      console.log(`Email ${seqno}: Content contains inline: ${finalContent.includes('Content-Disposition: inline')}`)
                    }
                    
                    // Debug: Log the actual content structure for problematic emails
                    if (finalContent.includes('Content-Disposition:') || finalContent.includes('/9j/')) {
                      console.log(`Email ${seqno}: === CONTENT DEBUG ===`)
                      console.log(`Email ${seqno}: Content length: ${finalContent.length}`)
                      console.log(`Email ${seqno}: First 1000 chars: ${finalContent.substring(0, 1000)}`)
                      console.log(`Email ${seqno}: Last 500 chars: ${finalContent.substring(finalContent.length - 500)}`)
                    }
                 } else {
                  const header = Imap.parseHeader(buffer)
                  email.from = header.from?.[0] || ''
                  email.to = header.to?.[0] || ''
                  email.title = header.subject?.[0] || ''
                  // Process date to ensure it's in a proper format
                  const rawDate = header.date?.[0] || new Date().toISOString()
                  console.log('Raw date from IMAP:', rawDate)
                  try {
                    const parsedDate = new Date(rawDate)
                    email.date = parsedDate.toISOString()
                    console.log('Parsed date:', email.date)
                  } catch (error) {
                    console.log('Error parsing date, using current time:', rawDate, error.message)
                    email.date = new Date().toISOString()
                  }
                  
                  // Extract name from email
                  const fromMatch = email.from.match(/([^<]+)<(.+)>/)
                  if (fromMatch) {
                    email.name = fromMatch[1].trim()
                  } else {
                    email.name = email.from.split('@')[0]
                  }
                }
              })
            })

            msg.once('end', () => {
              // Create message object for the UI
              email.message = [{
                id: `msg_${seqno}`,
                name: email.name,
                mail: [email.to], // Add mail array like mock
                from: email.from,
                avatar: `/img/avatars/thumb-${(seqno % 12) + 1}.jpg`,
                date: new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                content: email.content,
                attachment: email.attachments.map(att => ({
                  file: att.filename,
                  type: att.type,
                  size: att.size || 'Unknown',
                  data: att.data
                }))
              }]
              
              // Add mail array to match mock structure
              email.mail = [email.to]
              
              console.log(`Email ${seqno} created with ID: ${email.id}`)
              emails.push(email)
            })
          })

          fetch.once('error', (err) => {
            console.log(`Fetch error with config ${currentConfigIndex + 1}:`, err.message)
            imap.end()
            retryConnection()
          })

          fetch.once('end', () => {
            // Sort newest first (by date desc; fallback to seqno/id desc)
            emails.sort((a, b) => {
              const ad = a.date ? new Date(a.date).getTime() : 0
              const bd = b.date ? new Date(b.date).getTime() : 0
              if (bd !== ad) return bd - ad
              const as = parseInt(String(a.id).replace('email_', ''), 10) || 0
              const bs = parseInt(String(b.id).replace('email_', ''), 10) || 0
              return bs - as
            })

            console.log(`Successfully fetched ${emails.length} emails with config ${currentConfigIndex + 1}`)
            imap.end()
            
            // Filter out soft-deleted emails
            const filtered = emails.filter(e => !deletedEmailIds.has(e.id))
            // Add total count to each email for pagination
            const emailsWithTotal = filtered.map(email => ({
              ...email,
              total: box.messages.total,
              folderTotal: box.messages.total
            }))
            
            // Cache the results with total count for pagination
            emailCache.set(cacheKey, {
              emails: emailsWithTotal,
              timestamp: 1640995200000, // Fixed timestamp
              total: box.messages.total
            })
            
            resolve(emailsWithTotal)
          })
        })
      })

      imap.once('error', (err) => {
        clearTimeout(connectionTimeout)
        console.log(`IMAP error with config ${currentConfigIndex + 1}:`, err.message)
        retryConnection()
      })

      imap.once('end', () => {
        clearTimeout(connectionTimeout)
        console.log(`IMAP connection ended for config ${currentConfigIndex + 1}`)
      })

      imap.connect()
    }

    const retryConnection = () => {
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`Retrying connection (${retryCount}/${maxRetries})...`)
        setTimeout(tryConnection, 1000) // Wait 1 second before retry
      } else {
        retryCount = 0
        currentConfigIndex++
        tryConnection()
      }
    }

    tryConnection()
  })
}

/**
 * Fetch a single email by ID (e.g., email_5) without loading the whole mailbox
 */
async function fetchEmailById(folder = 'INBOX', id) {
  if (!id) return null
  const seqno = parseInt(String(id).replace('email_', ''), 10)
  if (!Number.isFinite(seqno) || seqno <= 0) return null

  const cacheKey = `${folder}-${seqno}`
  const cached = individualEmailCache.get(cacheKey)
  if (cached && 1640995200000 - cached.timestamp < CACHE_DURATION) { // Fixed timestamp check
    return cached.email
  }

  return new Promise((resolve) => {
    // Add overall timeout for email processing
    const overallTimeout = setTimeout(() => {
      if (isResolved) return // Don't resolve if already done
      console.log(`Email ${seqno}: Overall processing timeout, returning partial result`)
      isResolved = true
      resolve({
        id: `email_${seqno}`,
        name: 'Email processing timeout',
        title: 'Processing timeout',
        message: [{
          id: `msg_${seqno}`,
          name: 'Processing timeout',
          mail: [''],
          from: '',
          avatar: '/img/avatars/thumb-1.jpg',
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'This email took too long to process. Please try again or contact support.',
          attachment: []
        }],
        starred: false,
        flagged: false,
        checked: false,
        label: folder.toLowerCase(),
        from: '',
        to: '',
        date: '',
        content: 'Processing timeout',
        attachments: [],
        mail: ['']
      })
    }, 45000) // 45 second overall timeout
    
    let isResolved = false // Flag to prevent multiple resolves
    
    const configs = [
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method' },
      },
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      },
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 143,
        tls: false,
      },
    ]

    let currentConfigIndex = 0
    let retryCount = 0
    const maxRetries = 1 // Reduced from 2 to 1 to prevent excessive retries

    const tryConnection = () => {
      if (currentConfigIndex >= configs.length) {
        resolve(null)
        return
      }

      const config = configs[currentConfigIndex]
      const imap = new Imap(config)
      let connectionTimeout
      let resultEmail = null

      connectionTimeout = setTimeout(() => {
        console.log(`Email ${seqno}: IMAP connection timeout, retrying...`)
        imap.end()
        retryConnection()
      }, 30000) // Increased from 15s to 30s

      imap.once('ready', () => {
        clearTimeout(connectionTimeout)
        imap.openBox(folder, false, (err) => {
          if (err) {
            imap.end()
            retryConnection()
            return
          }

          const fetch = imap.seq.fetch(`${seqno}:${seqno}`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true,
            envelope: true,
            flags: true
          })

          fetch.on('message', (msg) => {
            const emailId = `email_${seqno}`
            
            // Check for existing email status in cache
            let existingStatus = { starred: false, flagged: false }
            for (const [key, value] of emailCache.entries()) {
              const existingEmail = value.emails.find(e => e.id === emailId)
              if (existingEmail) {
                existingStatus = { 
                  starred: existingEmail.starred || false, 
                  flagged: existingEmail.flagged || false 
                }
                break
              }
            }
            
            const email = {
              id: emailId,
              name: '',
              title: '',
              message: [],
              starred: existingStatus.starred,
              flagged: existingStatus.flagged,
              checked: false,
              read: false, // Default to unread
              label: folder.toLowerCase(),
              from: '',
              to: '',
              date: '',
              content: '',
              attachments: [],
            }

            msg.on('flags', (flags) => {
              // Check if email has been read (has \Seen flag)
              email.read = flags.includes('\\Seen')
              console.log(`Email ${seqno} flags:`, flags, 'read:', email.read)
            })

            msg.on('body', (stream, info) => {
              let buffer = ''
              let totalSize = 0
              const MAX_CONTENT_SIZE = 25 * 1024 * 1024 // 25MB limit
              
              stream.on('data', (chunk) => {
                // Use Buffer.from instead of deprecated Buffer() constructor
                buffer += Buffer.from(chunk).toString('utf8')
                totalSize += chunk.length
                
                // Early size check to prevent processing extremely large emails
                if (totalSize > MAX_CONTENT_SIZE) {
                  console.log(`Email ${seqno}: Content too large (${Math.round(totalSize / 1024 / 1024)}MB), but continuing with truncated content...`)
                  // Don't destroy the stream, just limit the buffer size
                  if (buffer.length > MAX_CONTENT_SIZE) {
                    buffer = buffer.substring(0, MAX_CONTENT_SIZE) + '\n\n[Content truncated due to size]'
                  }
                }
              })
              stream.once('end', () => {
                if (info.which === 'TEXT') {
                  // Check if content is too large to process
                  if (buffer.length > MAX_CONTENT_SIZE) {
                    console.log(`Email ${seqno}: Buffer too large (${Math.round(buffer.length / 1024 / 1024)}MB), processing truncated content...`)
                    // Truncate the buffer but still process it
                    buffer = buffer.substring(0, MAX_CONTENT_SIZE) + '\n\n[Content truncated due to size]'
                  }
                  
                  let content = buffer
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                    .replace(/\r\n/g, '\n')
                    .replace(/\r/g, '\n')

                  const charsetMatch = content.match(/charset=["']?([^"'\s;]+)["']?/i)
                  const detectedCharset = charsetMatch ? charsetMatch[1].toLowerCase() : 'utf-8'
                  if (detectedCharset) {
                    // quoted-printable decode
                    content = decodeQuotedPrintable(content)
                    try {
                      if (detectedCharset === 'iso-8859-1' || detectedCharset === 'latin1') {
                        const decoder = new TextDecoder('latin1')
                        const bytes = new Uint8Array(content.length)
                        for (let i = 0; i < content.length; i++) bytes[i] = content.charCodeAt(i)
                        content = decoder.decode(bytes)
                      }
                    } catch {}
                    if (content.includes('Ã¡') || content.includes('Ã£') || content.includes('Ã§')) {
                      const bytes = new Uint8Array(content.length)
                      for (let i = 0; i < content.length; i++) bytes[i] = content.charCodeAt(i)
                      content = new TextDecoder('utf-8').decode(bytes)
                    }
                  }

                  let finalContent = content.trim()
                  finalContent = finalContent.replace(/-----=_NextPart_[^--]*--/g, '')
                  const mimeBoundaryMatch = finalContent.match(/--[a-zA-Z0-9_]+/)
                  if (mimeBoundaryMatch) {
                    const parts = finalContent.split(/--[a-zA-Z0-9_]+/)
                    for (const part of parts) {
                      const trimmedPart = part.trim()
                      if (
                        trimmedPart &&
                        !trimmedPart.startsWith('Content-Type:') &&
                        !trimmedPart.startsWith('MIME-Version:') &&
                        !trimmedPart.startsWith('From:') &&
                        !trimmedPart.startsWith('To:') &&
                        !trimmedPart.startsWith('Subject:') &&
                        !trimmedPart.startsWith('Date:') &&
                        !trimmedPart.startsWith('Message-ID:') &&
                        !trimmedPart.startsWith('X-') &&
                        (trimmedPart.includes('<html') ||
                          trimmedPart.includes('<!DOCTYPE') ||
                          trimmedPart.includes('<body') ||
                          trimmedPart.includes('<p>') ||
                          (trimmedPart.length > 20 && !trimmedPart.includes('Content-Type:')))
                      ) {
                        finalContent = trimmedPart
                        break
                      }
                    }
                  } else {
                    const contentStarters = [/<!DOCTYPE HTML/i, /<html/i, /<body/i, /Content-Type: text\/html/i, /Content-Type: text\/plain/i, /<p>/i]
                    let startIndex = -1
                    for (const starter of contentStarters) {
                      const m = finalContent.match(starter)
                      if (m) {
                        startIndex = m.index
                        break
                      }
                    }
                    if (startIndex !== -1) {
                      finalContent = finalContent.substring(startIndex)
                    }
                  }

                  // Remove remaining headers then clean + inline images
                  finalContent = finalContent
                    .replace(/Content-Type:[^\n]*\n/g, '')
                    .replace(/Content-Transfer-Encoding:[^\n]*\n/g, '')
                    .replace(/MIME-Version:[^\n]*\n/g, '')
                    .replace(/From:[^\n]*\n/g, '')
                    .replace(/To:[^\n]*\n/g, '')
                    .replace(/Subject:[^\n]*\n/g, '')
                    .replace(/Date:[^\n]*\n/g, '')
                    .replace(/Message-ID:[^\n]*\n/g, '')

                  // Check if this email contains HTML content that should be processed as HTML
                  const hasHtmlContent = finalContent.includes('Content-Type: text/html') || 
                                       finalContent.includes('<!DOCTYPE html>') || 
                                       finalContent.includes('<html') ||
                                       finalContent.includes('<table') ||
                                       finalContent.includes('<tr>') ||
                                       finalContent.includes('<td') ||
                                       finalContent.includes('<img') ||
                                       finalContent.includes('<a href') ||
                                       finalContent.includes('squarespace-email-marketing.s3.amazonaws.com') ||
                                       finalContent.includes('Veja as possibilidades') ||
                                       finalContent.includes('ACUITY') ||
                                       finalContent.includes('BIO SITES') ||
                                       finalContent.includes('UNFOLD') ||
                                       finalContent.includes('DOMAINS')
                  
                  if (hasHtmlContent) {
                    console.log(`Email ${seqno}: Contains HTML content, processing as HTML email`)
                    console.log(`Email ${seqno}: HTML content preview:`, finalContent.substring(0, 500))
                  }

                                     const cleanResult = cleanEmailContent(finalContent)
                                     finalContent = cleanResult.cleaned
                                     if (cleanResult.isProcessedHtml) {
                                       email.isProcessedHtml = true
                                     }
                   
                   // Clean Gmail signatures and broken image URLs
                   finalContent = cleanGmailSignatures(finalContent)

                  // Background cleanup
                  finalContent = finalContent
                    .replace(/bgcolor="[^"]*"/g, '')
                    .replace(/background="[^"]*"/g, '')
                    .replace(/background-color="[^"]*"/g, '')
                    .replace(/style="[^"]*background[^"]*"/g, 'style=""')
                    .replace(/style="\s*"/g, '')

                                     // Simple content extraction - just clean up the content
                   let cleanContent = finalContent
                   
                   // Clean Gmail signatures and broken image URLs
                   cleanContent = cleanGmailSignatures(cleanContent)
                   
                   // Remove background colors and styles from email content
                   cleanContent = cleanContent
                       .replace(/bgcolor="[^"]*"/g, '') // Remove bgcolor attributes
                       .replace(/background="[^"]*"/g, '') // Remove background attributes
                       .replace(/background-color="[^"]*"/g, '') // Remove background-color attributes
                       .replace(/style="[^"]*background[^"]*"/g, 'style=""') // Remove style with background
                       .replace(/style="\s*"/g, '') // Remove empty style attributes
                   
                   // Remove any remaining base64 data that might be causing issues
                   cleanContent = cleanContent.replace(/\/[A-Za-z0-9+/=]{20,}/g, '')
                   cleanContent = cleanContent.replace(/[A-Za-z0-9+/=]{50,}/g, '')
                   
                   // Enhanced base64 cleanup for non-HTML emails
                   cleanContent = cleanContent.replace(/Content-ID:\s*<[^>]*>/g, '')
                   cleanContent = cleanContent.replace(/Content-Transfer-Encoding:\s*base64[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
                   
                   // Remove base64 content with spaces (like the corrupted content) - more specific patterns
                   cleanContent = cleanContent.replace(/\]\s*Content-ID:\s*<[^>]*>\s*[A-Za-z0-9+/=\s]{50,}/g, '')
                   
                   // Only remove sequences that look like actual base64 (with proper base64 character distribution)
                   cleanContent = cleanContent.replace(/[A-Za-z0-9+/=]{100,}(?=\s|$)/g, '') // Only very long sequences
                   cleanContent = cleanContent.replace(/[A-Za-z0-9+/=]{50,}(?=\s*[A-Za-z0-9+/=]{50,})/g, '') // Only when followed by more base64
                   
                   // Remove the specific corrupted base64 pattern (starts with VHhe7dx and similar)
                   cleanContent = cleanContent.replace(/^\s*[A-Za-z0-9+/=\s]{50,}\s*$/gm, '') // Remove lines that are only base64
                   cleanContent = cleanContent.replace(/\s+[A-Za-z0-9+/=]{50,}\s+/g, ' ') // Remove base64 blocks surrounded by spaces
                   
                                      // Remove empty lines and excessive whitespace
                   cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n')
                   cleanContent = cleanContent.trim()
                   
                   // Skip attachment extraction for processed HTML emails
                   if (email.isProcessedHtml) {
                     console.log(`Email ${seqno}: HTML email already processed, skipping attachment extraction`)
                     email.content = cleanContent
                     email.attachments = []
                     // Set a flag to skip the rest of processing
                     email.skipProcessing = true
                   }
                   
                   // Extract attachments using the original function (only if not skipped)
                   if (!email.skipProcessing) {
                     console.log(`Email ${seqno}: About to extract attachments from content length: ${content.length}`)
                     
                     // For very large content, limit attachment processing
                     let contentToProcess = content
                     if (content.length > 10 * 1024 * 1024) { // 10MB
                       console.log(`Email ${seqno}: Content very large (${Math.round(content.length / 1024 / 1024)}MB), limiting attachment processing`)
                       contentToProcess = content.substring(0, 10 * 1024 * 1024) // Process only first 10MB
                     }
                     
                     const attachments = extractAttachments(contentToProcess)
                     console.log(`Email ${seqno}: Extracted ${attachments.length} attachments`)
                     
                     // Set attachments for non-HTML emails
                     email.attachments = attachments
                   } else {
                     console.log(`Email ${seqno}: Processing skipped for HTML email`)
                     // Ensure attachments is set for HTML emails
                     if (!email.attachments) {
                       email.attachments = []
                     }
                   }
                  
                  // Ensure we have content to display
                  if (!cleanContent || cleanContent.trim() === '') {
                    console.log(`Email ${seqno}: Clean content is empty, using fallback`)
                    cleanContent = finalContent || content || 'No content available'
                  }
                  
                  // If content is still empty after fallback, try to extract plain text
                  if (!cleanContent || cleanContent.trim() === '') {
                    console.log(`Email ${seqno}: Content still empty, extracting plain text`)
                    const plainTextMatch = content.match(/(?:\r?\n){2}([\s\S]*)/)
                    if (plainTextMatch) {
                      cleanContent = plainTextMatch[1].trim()
                    } else {
                      cleanContent = 'No content available'
                    }
                  }
                  
                  // Final safety check - if we still have no content, provide a meaningful message
                  if (!cleanContent || cleanContent.trim() === '') {
                    console.log(`Email ${seqno}: All content extraction failed, using fallback content`)
                    cleanContent = `Email: ${email.title || 'Untitled'}\nFrom: ${email.from || 'Unknown sender'}\nDate: ${email.date || 'Unknown date'}\n\nThis email contains content that could not be processed. The email may be too large or contain complex formatting.`
                  }
                  
                  console.log(`Email ${seqno}: Final content length: ${cleanContent.length}`)
                  console.log(`Email ${seqno}: Content preview: ${cleanContent.substring(0, 200)}...`)
                  console.log(`Email ${seqno}: Attachments count: ${email.attachments ? email.attachments.length : 0}`)
                  
                  // Debug: Log attachment details (only for non-HTML emails)
                  if (!email.skipProcessing && email.attachments && email.attachments.length > 0) {
                    email.attachments.forEach((att, index) => {
                      console.log(`Email ${seqno}: Attachment ${index + 1}:`, {
                        filename: att.filename,
                        type: att.type,
                        size: att.size,
                        dataLength: att.data ? att.data.length : 0
                      })
                    })
                  }
                  
                  email.content = cleanContent
                } else {
                  const header = Imap.parseHeader(buffer)
                  email.from = header.from?.[0] || ''
                  email.to = header.to?.[0] || ''
                  email.title = header.subject?.[0] || ''
                  // Process date to ensure it's in a proper format
                  const rawDate = header.date?.[0] || new Date().toISOString()
                  console.log('Raw date from IMAP:', rawDate)
                  try {
                    const parsedDate = new Date(rawDate)
                    email.date = parsedDate.toISOString()
                    console.log('Parsed date:', email.date)
                  } catch (error) {
                    console.log('Error parsing date, using current time:', rawDate, error.message)
                    email.date = new Date().toISOString()
                  }
                  const fromMatch = email.from.match(/([^<]+)<(.+)>/)
                  email.name = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0]
                }
              })
            })

            msg.once('end', () => {
              // Ensure we have valid content and attachments
              const messageContent = email.content || 'No content available'
              const messageAttachments = email.attachments || []
              
              console.log(`Email ${seqno}: Creating message with content length: ${messageContent.length}`)
              console.log(`Email ${seqno}: Creating message with ${messageAttachments.length} attachments`)
              console.log(`Email ${seqno}: Message content preview: ${messageContent.substring(0, 200)}...`)
              
              // Debug: Log the final message structure
              console.log(`Email ${seqno}: Final message structure:`, {
                content: messageContent.substring(0, 100) + '...',
                attachmentCount: messageAttachments.length,
                firstAttachment: messageAttachments[0] ? {
                  filename: messageAttachments[0].file,
                  type: messageAttachments[0].type,
                  size: messageAttachments[0].size
                } : null
              })
              
              email.message = [
                {
                  id: `msg_${seqno}`,
                  name: email.name,
                  mail: [email.to], // Add mail array like mock
                  from: email.from,
                  avatar: `/img/avatars/thumb-${(seqno % 12) + 1}.jpg`,
                  date: new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                  content: messageContent,
                  attachment: messageAttachments.map(att => ({
                    file: att.filename,
                    type: att.type,
                    size: att.size || 'Unknown',
                    data: att.data
                  }))
                },
              ]
              
              // Add mail array to match mock structure
              email.mail = [email.to]
              
              resultEmail = email
            })
          })

          fetch.once('end', () => {
            clearTimeout(overallTimeout) // Clear the overall timeout
            imap.end()
            if (resultEmail && !isResolved) {
              isResolved = true
              individualEmailCache.set(cacheKey, { email: resultEmail, timestamp: 1640995200000 }) // Fixed timestamp
            resolve(resultEmail)
            }
          })

          fetch.once('error', () => {
            if (isResolved) return
            imap.end()
            retryConnection()
          })
        })
      })

      imap.once('error', () => {
        if (isResolved) return
        clearTimeout(connectionTimeout)
        retryConnection()
      })

      imap.once('end', () => {
        clearTimeout(connectionTimeout)
      })

      imap.connect()
    }

    const retryConnection = () => {
      if (isResolved) return // Don't retry if already resolved
      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(tryConnection, 1000)
      } else {
        retryCount = 0
        currentConfigIndex++
        tryConnection()
      }
    }

    tryConnection()
  })
}

/**
 * Test email connection
 */
async function testConnection() {
  try {
    console.log('Testing email connection...')
    
    // Test SMTP
    const transporter = createSMTPTransporter()
    await transporter.verify()
    
    console.log('Email connection test successful')
    return { success: true, message: 'Email connection successful' }
  } catch (error) {
    console.error('Email connection test failed:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Process a single MIME part to extract attachment information
 */
function processMimePart(part, partNumber) {
  const partAttachments = []
  
  console.log(`Processing MIME part ${partNumber} for attachments`)
  
  // Check if this is an attachment
  const isAttachment = /Content-Disposition:\s*attachment/i.test(part)
  const isInline = /Content-Disposition:\s*inline/i.test(part)
  
  // Also check for Content-Description which might indicate attachments in some email formats
  const hasContentDescription = /Content-Description:\s*[^\r\n]+/i.test(part)
  const contentDescriptionMatch = part.match(/Content-Description:\s*([^\r\n]+)/i)
  const contentDescription = contentDescriptionMatch ? contentDescriptionMatch[1].trim() : ''
  
  console.log(`Part ${partNumber} - isAttachment: ${isAttachment}, isInline: ${isInline}, hasContentDescription: ${hasContentDescription}`)
  if (contentDescription) {
    console.log(`Content-Description: ${contentDescription}`)
  }
  
  if (isAttachment || isInline || (hasContentDescription && contentDescription.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i))) {
    console.log(`Found ${isAttachment ? 'attachment' : 'inline'} in part ${partNumber}`)
    
    // Extract filename
    const filenameMatch = part.match(/filename=["']?([^"'\r\n]+)["']?/i)
    let filename = filenameMatch ? filenameMatch[1] : 'attachment'
    
    // If no filename found but we have a Content-Description with a file extension, use that
    if (filename === 'attachment' && contentDescription && contentDescription.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i)) {
      filename = contentDescription
    }
    
    // Extract content type
    const contentTypeMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i)
    const contentType = contentTypeMatch ? contentTypeMatch[1].toLowerCase() : 'application/octet-stream'
    
    console.log(`Filename: ${filename}, Content-Type: ${contentType}`)
    
    // Extract base64 data - look for it after headers
    const headerEndMatch = part.match(/(?:\r?\n){2}/)
    let base64Content = ''
    
    if (headerEndMatch) {
      const base64Start = headerEndMatch.index + headerEndMatch[0].length
      base64Content = part.substring(base64Start).trim()
    } else {
      // Fallback: look for base64 data anywhere in the part
      // Find the longest base64-like string in the part
      const base64Matches = part.match(/[A-Za-z0-9+/=]{50,}/g)
      if (base64Matches) {
        base64Content = base64Matches.sort((a, b) => b.length - a.length)[0] // Get the longest match
      }
    }
    
    console.log(`Base64 content length: ${base64Content.length}`)
    console.log(`Base64 content preview (first 100 chars):`, base64Content.substring(0, 100))
    
    // Clean up the base64 content
    const base64Data = base64Content.replace(/\s+/g, '')
    
    console.log(`Cleaned base64 data length: ${base64Data.length}`)
    
    if (base64Data && base64Data.length > 100 && base64Data.length < 10 * 1024 * 1024) { // 10MB limit
      // Determine file type from content type or filename extension
      let fileType = 'file'
      if (contentType.includes('image/')) {
        fileType = contentType.split('/')[1]
      } else if (filename.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i)) {
        fileType = filename.split('.').pop().toLowerCase()
      }
      
      console.log(`Extracted attachment: ${filename} (${fileType}), size: ${Math.round(base64Data.length / 1024)}KB`)
      
      // Format file size
      const sizeInKB = Math.round(base64Data.length / 1024)
      const sizeInMB = (base64Data.length / (1024 * 1024)).toFixed(1)
      const formattedSize = sizeInKB > 1024 ? `${sizeInMB} MB` : `${sizeInKB}KB`
      
      const attachmentObj = {
        filename: filename,
        type: fileType,
        size: formattedSize,
        data: base64Data,
        inline: isInline
      }
      
      console.log('Pushing attachment object (processMimePart):', attachmentObj)
      partAttachments.push(attachmentObj)
    } else {
      console.log(`Skipping attachment ${filename}: size ${base64Data?.length || 0} bytes`)
    }
  }
  
  return partAttachments
}

/**
 * Extract attachments and inline images from email content with proper MIME parsing
 */
function extractAttachments(content) {
  const attachments = []
  
  console.log('=== EXTRACTING ATTACHMENTS ===')
  console.log('Content length:', content.length)
  console.log('Content preview (first 500 chars):', content.substring(0, 500))
  
  // Look for all MIME boundaries in the content
  const boundaryMatches = content.match(/--[a-zA-Z0-9_=+\-]+/g)
  if (!boundaryMatches) {
    console.log('No MIME boundaries found')
    return attachments
  }
  
  console.log('Found MIME boundaries:', boundaryMatches)
  
  // For Outlook emails, we need to handle the specific boundary structure
  // Look for the main boundary that contains the attachment
  const mainBoundary = boundaryMatches.find(b => b.includes('_004_'))
  if (mainBoundary) {
    console.log('Found main boundary:', mainBoundary)
    // Split by the main boundary to get the attachment part
    const mainParts = content.split(mainBoundary)
    console.log('Split by main boundary into', mainParts.length, 'parts')
    
    // Look for the part that contains the attachment
    for (let i = 0; i < mainParts.length; i++) {
      const part = mainParts[i].trim()
      if (!part || part.startsWith('--')) continue
      
      console.log(`Main part ${i + 1}, length: ${part.length}`)
      console.log(`Main part ${i + 1} preview (first 200 chars):`, part.substring(0, 200))
      
      // Check if this part contains attachment information
      if (part.includes('Content-Description:') || part.includes('Content-Disposition:') || part.includes('application/pdf')) {
        console.log(`Found potential attachment in main part ${i + 1}`)
        // Process this part for attachments
        const partAttachments = processMimePart(part, i + 1)
        attachments.push(...partAttachments)
      }
    }
  }
  
  // Also try the original method as fallback
  let parts = [content]
  for (const boundary of boundaryMatches) {
    const newParts = []
    for (const part of parts) {
      newParts.push(...part.split(boundary))
    }
    parts = newParts
  }
  
  console.log('Split into', parts.length, 'parts')
  
  // Process each MIME part
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part || part.startsWith('--')) continue
    
    console.log(`Processing part ${i + 1}, length: ${part.length}`)
    console.log(`Part ${i + 1} preview (first 200 chars):`, part.substring(0, 200))
    
    // Check if this is an attachment
    const isAttachment = /Content-Disposition:\s*attachment/i.test(part)
    const isInline = /Content-Disposition:\s*inline/i.test(part)
    
    // Also check for Content-Description which might indicate attachments in some email formats
    const hasContentDescription = /Content-Description:\s*[^\r\n]+/i.test(part)
    const contentDescriptionMatch = part.match(/Content-Description:\s*([^\r\n]+)/i)
    const contentDescription = contentDescriptionMatch ? contentDescriptionMatch[1].trim() : ''
    
    console.log(`Part ${i + 1} - isAttachment: ${isAttachment}, isInline: ${isInline}, hasContentDescription: ${hasContentDescription}`)
    if (contentDescription) {
      console.log(`Content-Description: ${contentDescription}`)
    }
    
    if (isAttachment || isInline || (hasContentDescription && contentDescription.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i))) {
      console.log(`Found ${isAttachment ? 'attachment' : 'inline'} in part ${i + 1}`)
      
      // Extract filename
      const filenameMatch = part.match(/filename=["']?([^"'\r\n]+)["']?/i)
      let filename = filenameMatch ? filenameMatch[1] : 'attachment'
      
      // If no filename found but we have a Content-Description with a file extension, use that
      if (filename === 'attachment' && contentDescription && contentDescription.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i)) {
        filename = contentDescription
      }
      
      // Extract content type
      const contentTypeMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i)
      const contentType = contentTypeMatch ? contentTypeMatch[1].toLowerCase() : 'application/octet-stream'
      
      console.log(`Filename: ${filename}, Content-Type: ${contentType}`)
      
      // Extract base64 data - look for it after headers
      const headerEndMatch = part.match(/(?:\r?\n){2}/)
      let base64Content = ''
      
      if (headerEndMatch) {
        const base64Start = headerEndMatch.index + headerEndMatch[0].length
        base64Content = part.substring(base64Start).trim()
      } else {
        // Fallback: look for base64 data anywhere in the part
        // Find the longest base64-like string in the part
        const base64Matches = part.match(/[A-Za-z0-9+/=]{50,}/g)
        if (base64Matches) {
          base64Content = base64Matches.sort((a, b) => b.length - a.length)[0] // Get the longest match
        }
      }
      
      console.log(`Base64 content length: ${base64Content.length}`)
      console.log(`Base64 content preview (first 100 chars):`, base64Content.substring(0, 100))
      
      // Clean up the base64 content
      const base64Data = base64Content.replace(/\s+/g, '')
      
      console.log(`Cleaned base64 data length: ${base64Data.length}`)
      
      if (base64Data && base64Data.length > 100 && base64Data.length < 10 * 1024 * 1024) { // 10MB limit
        // Determine file type from content type or filename extension
        let fileType = 'file'
        if (contentType.includes('image/')) {
          fileType = contentType.split('/')[1]
        } else if (filename.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i)) {
          fileType = filename.split('.').pop().toLowerCase()
        }
        
        console.log(`Extracted attachment: ${filename} (${fileType}), size: ${Math.round(base64Data.length / 1024)}KB`)
        
        // Format file size
        const sizeInKB = Math.round(base64Data.length / 1024)
        const sizeInMB = (base64Data.length / (1024 * 1024)).toFixed(1)
        const formattedSize = sizeInKB > 1024 ? `${sizeInMB} MB` : `${sizeInKB}KB`
        
        const attachmentObj = {
          filename: filename,
          type: fileType,
          size: formattedSize,
      data: base64Data,
          inline: isInline
        }
        
        console.log('Pushing attachment object:', attachmentObj)
        attachments.push(attachmentObj)
      } else {
        console.log(`Skipping attachment ${filename}: size ${base64Data?.length || 0} bytes`)
      }
    }
  }
  
  // Remove duplicates based on filename
  const uniqueAttachments = []
  const seenFilenames = new Set()
  
  for (const attachment of attachments) {
    if (!seenFilenames.has(attachment.filename)) {
      seenFilenames.add(attachment.filename)
      uniqueAttachments.push(attachment)
    } else {
      console.log(`Skipping duplicate attachment: ${attachment.filename}`)
    }
  }
  
  console.log(`Extracted ${uniqueAttachments.length} unique attachments (${attachments.length} total found)`)
  return uniqueAttachments
}

/**
 * Clean email content by properly extracting the actual email body from MIME structure
 */
function cleanEmailContent(content) {
  console.log('=== CLEANING EMAIL CONTENT ===')
  console.log('Original content length:', content.length)
  
  // Early exit if content is too large
  if (content.length > 10 * 1024 * 1024) { // 10MB limit
    console.log('Content too large, truncating before processing')
    content = content.substring(0, 10 * 1024 * 1024) + '\n\n[Content truncated due to size]'
  }
  
  // Detect email types
  const isGmailEmail = content.includes('<div dir="ltr">') || content.includes('gmail.com')
  const isCloudflareEmail = content.includes('cloudflare.com') || content.includes('Your account has been accessed from a new IP address')
  const isSquarespaceEmail = content.includes('squarespace.com') || 
                            content.includes('Não perca seu progresso') ||
                            content.includes('Veja as possibilidades') ||
                            content.includes('ACUITY') ||
                            content.includes('BIO SITES') ||
                            content.includes('UNFOLD') ||
                            content.includes('DOMAINS') ||
                            content.includes('acuityscheduling.com') ||
                            content.includes('biosites.com') ||
                            content.includes('unfold.com') ||
                            content.includes('domains.squarespace.com')
  const isOutlookEmail = content.includes('--_000__--') || content.includes('--_004__') || content.includes('Content-Description:')
  const isHtmlEmail = content.includes('<!DOCTYPE html') || content.includes('<html') || content.includes('<body') || content.includes('Content-Type: text/html')
  
  if (isGmailEmail) {
    console.log('Detected Gmail email, applying Gmail-specific processing')
  }
  
  if (isCloudflareEmail) {
    console.log('Detected Cloudflare email, applying Cloudflare-specific processing')
  }
  
  if (isOutlookEmail) {
    console.log('Detected Outlook email, applying Outlook-specific processing')
  }
  
  if (isHtmlEmail) {
    console.log('Detected HTML email, applying HTML-specific processing')
  }
  
  let cleaned = content
  
  // Handle Outlook emails with specific MIME parsing
  if (isOutlookEmail) {
    console.log('Processing Outlook email with specific MIME parsing')
    console.log('Original content preview:', content.substring(0, 500))
    
    // Try a simpler approach - look for text content between boundaries
    // Remove all MIME headers and boundaries, keep only the actual content
    let simpleContent = content
    
    // Remove MIME boundaries and related patterns
    simpleContent = simpleContent.replace(/--[a-zA-Z0-9_=+\-]+/g, '')
    simpleContent = simpleContent.replace(/boundary="[^"]*"/g, '')
    simpleContent = simpleContent.replace(/boundary=[a-zA-Z0-9_=+\-]+/g, '')
    
    // Remove MIME headers
    simpleContent = simpleContent.replace(/Content-[^:]*:[^\r\n]*/g, '')
    simpleContent = simpleContent.replace(/MIME-Version:[^\r\n]*/g, '')
    simpleContent = simpleContent.replace(/Message-ID:[^\r\n]*/g, '')
    simpleContent = simpleContent.replace(/Date:[^\r\n]*/g, '')
    simpleContent = simpleContent.replace(/From:[^\r\n]*/g, '')
    simpleContent = simpleContent.replace(/To:[^\r\n]*/g, '')
    simpleContent = simpleContent.replace(/Subject:[^\r\n]*/g, '')
    
    // Remove any remaining boundary-related text
    simpleContent = simpleContent.replace(/boundary[^a-zA-Z0-9]*/g, '')
    simpleContent = simpleContent.replace(/_[0-9]+__/g, '')
    
    // Clean up whitespace and empty lines
    simpleContent = simpleContent.replace(/\r\n/g, '\n')
    simpleContent = simpleContent.replace(/\n\s*\n/g, '\n')
    simpleContent = simpleContent.trim()
    
    // Split by lines and get unique non-empty lines
    const lines = simpleContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const uniqueLines = [...new Set(lines)]
    
    console.log('Simple processing - all lines:', lines)
    console.log('Simple processing - unique lines:', uniqueLines)
    
    cleaned = uniqueLines.join('\n')
    
    console.log('Outlook email processed (simple method), final length:', cleaned.length)
    console.log('Outlook final content:', `"${cleaned}"`)
    return { cleaned, isProcessedHtml: false }
  }
  
  // Handle HTML emails with sophisticated processing
  if (isHtmlEmail) {
    console.log('Processing HTML email with sophisticated extraction')
    
    let htmlContent = content
    
    // Find the HTML content - look for DOCTYPE or HTML tags
    if (htmlContent.includes('<!DOCTYPE html>')) {
      const doctypeIndex = htmlContent.indexOf('<!DOCTYPE html>')
      htmlContent = htmlContent.substring(doctypeIndex)
      console.log('Extracted HTML content from DOCTYPE, length:', htmlContent.length)
    } else if (htmlContent.includes('<html')) {
      const htmlIndex = htmlContent.indexOf('<html')
      htmlContent = htmlContent.substring(htmlIndex)
      console.log('Extracted HTML content from <html> tag, length:', htmlContent.length)
    }
    
    // For Squarespace emails, ensure we get the complete HTML
  if (isSquarespaceEmail) {
    console.log('Squarespace email detected, extracting complete HTML')
    console.log('Squarespace email content preview:', content.substring(0, 1000))
    
    // Look for the complete HTML document
    const htmlMatch = htmlContent.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/i)
    if (htmlMatch) {
      htmlContent = htmlMatch[1]
      console.log('Extracted complete HTML document for Squarespace email, length:', htmlContent.length)
    } else {
      console.log('No complete HTML document found, using existing content')
      console.log('HTML content preview:', htmlContent.substring(0, 1000))
    }
  }
    
    // Clean up corrupted content within HTML while preserving structure
    console.log('Cleaning corrupted content within HTML')
    
    // Only remove very long base64 sequences that are clearly corrupted
    htmlContent = htmlContent.replace(/[A-Za-z0-9+/=]{200,}/g, '')
    
    // Remove only specific MIME headers that might be embedded in HTML
    htmlContent = htmlContent.replace(/Content-Transfer-Encoding:[^\r\n]*/g, '')
    htmlContent = htmlContent.replace(/MIME-Version:[^\r\n]*/g, '')
    
    // Remove only specific boundary markers that might be in HTML
    htmlContent = htmlContent.replace(/--[a-zA-Z0-9_=+\-]{20,}/g, '')
    
    // Remove empty lines and excessive whitespace
    htmlContent = htmlContent.replace(/\n\s*\n/g, '\n')
    htmlContent = htmlContent.replace(/^\s+$/gm, '')
    
    // Ensure proper HTML structure
    if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html')) {
      // If we lost the HTML structure, try to find it again
      const bodyMatch = htmlContent.match(/<body[^>]*>[\s\S]*<\/body>/i)
      if (bodyMatch) {
        htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>${bodyMatch[0]}</html>`
        console.log('Reconstructed HTML structure from body content')
      }
    }
    
    // Convert inline images to proper img tags
    console.log('Converting inline images to img tags')
    
    // Look for base64 inline images and convert them to img tags
    const base64ImageRegex = /data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)/g
    cleaned = cleaned.replace(base64ImageRegex, (match, format, data) => {
      // Limit base64 data size to prevent huge images
      if (data.length > 100000) { // ~75KB limit
        console.log('Skipping large inline image:', data.length, 'bytes')
        return '[Large inline image removed]'
      }
      return match // Keep the original data URL
    })
    
    // Look for Content-ID references and convert them to img tags
    const cidRegex = /<img[^>]*src="cid:([^"]+)"[^>]*>/gi
    cleaned = cleaned.replace(cidRegex, (match, cid) => {
      console.log('Found CID reference:', cid)
      return match // Keep the original CID reference
    })
    
    // Look for server-side image references and convert them to img tags
    const serverImageRegex = /\/cpsess\d+\/3rdparty\/roundcube\/[^"\s]*/g
    cleaned = cleaned.replace(serverImageRegex, (match) => {
      console.log('Found server-side image reference:', match)
      return `<img src="https://mail.cartoriolealceara.com.br:2096${match}" alt="Inline image" style="max-width: 100%; height: auto;" />`
    })
    
    // Look for Google signature images and convert them to img tags
    const googleImageRegex = /ci3\.googleusercontent\.com\/mail-sig\/[A-Za-z0-9+/=]+/g
    cleaned = cleaned.replace(googleImageRegex, (match) => {
      console.log('Found Google signature image:', match)
      return `<img src="https://${match}" alt="Email signature" style="max-width: 100%; height: auto;" />`
    })
    
    // Set the cleaned content to the processed HTML
    cleaned = htmlContent.trim()
    console.log('HTML email processed, final length:', cleaned.length)
    console.log('HTML preview:', cleaned.substring(0, 500) + '...')
    
    // Return a flag to indicate this is processed HTML
    return { cleaned, isProcessedHtml: true }
  } else {
    // For non-HTML emails, apply the complex MIME parsing logic
    console.log('Processing non-HTML email with complex MIME parsing')
    
    // Look for MIME boundaries and extract the text/html or text/plain part
    const boundaryMatches = cleaned.match(/--[a-zA-Z0-9_=+\-]+/g)
    if (boundaryMatches) {
      console.log('Found MIME boundaries:', boundaryMatches)
      
      // Split content by all boundaries
      let parts = [cleaned]
      for (const boundary of boundaryMatches) {
        const newParts = []
        for (const part of parts) {
          newParts.push(...part.split(boundary))
        }
        parts = newParts
      }
      
      console.log('Split into', parts.length, 'parts')
      
      // Check if any part contains HTML content
      let hasHtmlContent = false
      let htmlPart = null
      for (const part of parts) {
        if (part.includes('Content-Type: text/html') || 
            part.includes('<!DOCTYPE html>') || 
            part.includes('<html') ||
            part.includes('<table') ||
            part.includes('<tr>') ||
            part.includes('<td') ||
            part.includes('<img') ||
            part.includes('<a href') ||
            part.includes('squarespace-email-marketing.s3.amazonaws.com')) {
          hasHtmlContent = true
          htmlPart = part
          console.log('Found HTML content in MIME parts, redirecting to HTML processing')
          console.log('HTML part preview:', part.substring(0, 500))
          break
        }
      }
      
      // If we found HTML content, redirect to HTML processing
      if (hasHtmlContent && htmlPart) {
        console.log('Redirecting to HTML processing for MIME email with HTML content')
        // Remove MIME headers from the HTML part
        const headerEndMatch = htmlPart.match(/(?:\r?\n){2}/)
        let cleanHtmlPart = htmlPart
        if (headerEndMatch) {
          cleanHtmlPart = htmlPart.substring(headerEndMatch.index + headerEndMatch[0].length)
        }
        
        console.log('Extracted HTML part for processing, length:', cleanHtmlPart.length)
        console.log('HTML part preview:', cleanHtmlPart.substring(0, 500))
        
        // Process as HTML email
        const htmlResult = cleanEmailContent(cleanHtmlPart)
        return htmlResult
      }
      
      // Find the text/html or text/plain part (the actual email body)
      let emailBody = null
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim()
        if (!part || part.startsWith('--')) continue
        
        console.log(`Checking part ${i + 1}, length: ${part.length}`)
        
        // Check if this is the main email content (not an attachment)
        const isAttachment = /Content-Disposition:\s*attachment/i.test(part)
        const isInline = /Content-Disposition:\s*inline/i.test(part)
        
        if (!isAttachment && !isInline) {
          // This could be the email body
          if (part.includes('Content-Type: text/plain')) {
            // Extract the content after the headers
            const headerEndMatch = part.match(/(?:\r?\n){2}/)
            if (headerEndMatch) {
              const contentStart = headerEndMatch.index + headerEndMatch[0].length
              const textContent = part.substring(contentStart).trim()
              // Check if this contains actual email content (not just headers)
              if (textContent.length > 50 && !textContent.startsWith('Content-')) {
                emailBody = textContent
                console.log(`Found text/plain email body in part ${i + 1}, length: ${emailBody.length}`)
                break
              }
            }
          } else if (part.includes('Content-Type: text/html') || 
              (part.includes('<html') || part.includes('<body') || part.includes('<p>') || part.includes('<div'))) {
            
            // Extract the content after the headers
            const headerEndMatch = part.match(/(?:\r?\n){2}/)
            if (headerEndMatch) {
              const contentStart = headerEndMatch.index + headerEndMatch[0].length
              emailBody = part.substring(contentStart).trim()
              console.log(`Found text/html email body in part ${i + 1}, length: ${emailBody.length}`)
              break
            }
          }
        }
      }
      
      if (emailBody) {
        // Clean up any base64 content that might have leaked through
        emailBody = emailBody.replace(/Content-ID:\s*<[^>]*>/g, '')
        emailBody = emailBody.replace(/Content-Transfer-Encoding:\s*base64[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
        
        // Remove base64 content with spaces (like the corrupted content) - more specific patterns
        emailBody = emailBody.replace(/\]\s*Content-ID:\s*<[^>]*>\s*[A-Za-z0-9+/=\s]{50,}/g, '')
        
        // Only remove sequences that look like actual base64 (with proper base64 character distribution)
        emailBody = emailBody.replace(/[A-Za-z0-9+/=]{100,}(?=\s|$)/g, '') // Only very long sequences
        emailBody = emailBody.replace(/[A-Za-z0-9+/=]{50,}(?=\s*[A-Za-z0-9+/=]{50,})/g, '') // Only when followed by more base64
        
        // Remove the specific corrupted base64 pattern (starts with VHhe7dx and similar)
        emailBody = emailBody.replace(/^\s*[A-Za-z0-9+/=\s]{50,}\s*$/gm, '') // Remove lines that are only base64
        emailBody = emailBody.replace(/\s+[A-Za-z0-9+/=]{50,}\s+/g, ' ') // Remove base64 blocks surrounded by spaces
        
        cleaned = emailBody
      }
    }
  }
  
  // Special handling for Gmail emails with <div dir="ltr"> structure
  if (cleaned.includes('<div dir="ltr">') && cleaned.includes('Content-Type:')) {
    console.log('Detected Gmail email structure, extracting div content')
    const gmailMatch = cleaned.match(/<div dir="ltr">([\s\S]*?)<\/div>/i)
    if (gmailMatch) {
      cleaned = gmailMatch[1].trim()
      console.log('Extracted Gmail div content, length:', cleaned.length)
    }
  }
  
  // For Gmail emails, try to extract just the clean text content
  if (isGmailEmail && cleaned.includes('<div dir="ltr">')) {
    console.log('Extracting clean Gmail text content')
    const cleanTextMatch = cleaned.match(/<div dir="ltr">([^<]+)<\/div>/i)
    if (cleanTextMatch) {
      cleaned = cleanTextMatch[1].trim()
      console.log('Extracted clean Gmail text, length:', cleaned.length)
    }
  }
  
  // Additional Gmail-specific cleanup for the raw content
  if (isGmailEmail) {
    console.log('Applying additional Gmail cleanup')
    
    // Remove the specific base64 patterns you mentioned
    cleaned = cleaned.replace(/Mzk\+Pg0Kc3RyZWFtDQp4n[A-Za-z0-9+/=]+/g, '')
    cleaned = cleaned.replace(/Z1\+8epl9f3hACgL[A-Za-z0-9+/=]+/g, '')
    cleaned = cleaned.replace(/nMxUSQqqs8uJfejLtyr7OLffm310v[A-Za-z0-9+/=]+/g, '')
    cleaned = cleaned.replace(/OHJvE5UP7dvupclvhoNjmc8W1az9bNR9SE0\+Gw[A-Za-z0-9+/=]+/g, '')
    
    // Remove any remaining long base64 strings
    cleaned = cleaned.replace(/[A-Za-z0-9+/=]{100,}/g, '')
    
    // Remove any content that looks like base64 data mixed with text
    cleaned = cleaned.replace(/[A-Za-z0-9+/=]{20,}[A-Za-z]{1,3}[A-Za-z0-9+/=]{20,}/g, '')
    
    // Remove specific remaining base64 patterns
    cleaned = cleaned.replace(/ODcyODQzDQolJUVPRg=/g, '')
    cleaned = cleaned.replace(/[A-Za-z0-9+/=]{10,}=$/g, '') // Remove base64 at end of string
    cleaned = cleaned.replace(/^[A-Za-z0-9+/=]{10,}=/g, '') // Remove base64 at start of string
    
    console.log('After Gmail cleanup, length:', cleaned.length)
  }
  
  // If we still have MIME content, try to extract just the HTML/body
  if (cleaned.includes('Content-Type:') || cleaned.includes('Content-Disposition:')) {
    console.log('Still has MIME content, extracting HTML/body')
    
    // Try to find HTML content
    const htmlMatch = cleaned.match(/<html[^>]*>([\s\S]*?)<\/html>/i)
    if (htmlMatch) {
      cleaned = htmlMatch[1]
      console.log('Extracted HTML content')
    } else {
      const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        cleaned = bodyMatch[1]
        console.log('Extracted body content')
      } else {
        // Try to find content after the last Content-Type header
        const lastContentType = cleaned.lastIndexOf('Content-Type:')
        if (lastContentType !== -1) {
          const afterContentType = cleaned.substring(lastContentType)
          const contentMatch = afterContentType.match(/(?:\r?\n){2}([\s\S]*)/)
          if (contentMatch) {
            cleaned = contentMatch[1].trim()
            console.log('Extracted content after Content-Type header')
          }
        }
      }
    }
  }
  
  // Remove any remaining MIME headers
  cleaned = cleaned.replace(/Content-Type:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/Content-Transfer-Encoding:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/MIME-Version:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/Content-Disposition:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/Content-ID:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/X-Attachment-Id:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/From:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/To:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/Subject:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/Date:[^\n]*\n/g, '')
  cleaned = cleaned.replace(/Message-ID:[^\n]*\n/g, '')
  
  // Remove boundary markers
  cleaned = cleaned.replace(/--[a-zA-Z0-9_=+\-]+/g, '')
  
  // Remove Gmail signatures
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '')
  cleaned = cleaned.replace(/<div[^>]*data-smartmail="gmail_signature"[^]*?<\/div>/gi, '')
  cleaned = cleaned.replace(/<img[^>]*src="[^"]*mail-sig-[^"]*"[^>]*>/gi, '')
  cleaned = cleaned.replace(/<img[^>]*src="[^"]*ci3\.googleusercontent\.com[^"]*"[^>]*>/gi, '')
  
  // Remove any remaining base64 data that might be causing issues (more aggressive for Gmail)
  cleaned = cleaned.replace(/\/[A-Za-z0-9+/=]{20,}/g, '')
  cleaned = cleaned.replace(/[A-Za-z0-9+/=]{50,}/g, '')
  
  // Additional cleanup for Gmail's specific base64 patterns
  cleaned = cleaned.replace(/[A-Za-z0-9+/=]{30,}/g, '')
  cleaned = cleaned.replace(/Mzk\+Pg0Kc3RyZWFtDQp4n[A-Za-z0-9+/=]+/g, '')
  cleaned = cleaned.replace(/Z1\+8epl9f3hACgL[A-Za-z0-9+/=]+/g, '')
  
  // Remove background colors and styles (more aggressive for Gmail)
  cleaned = cleaned
    .replace(/bgcolor="[^"]*"/g, '')
    .replace(/background="[^"]*"/g, '')
    .replace(/background-color="[^"]*"/g, '')
    .replace(/style="[^"]*background[^"]*"/g, 'style=""')
    .replace(/style="\s*"/g, '')
    .replace(/style="[^"]*"/g, '') // Remove all style attributes for Gmail
    .replace(/<[^>]*style="[^"]*"[^>]*>/g, (match) => match.replace(/style="[^"]*"/g, '')) // Remove style from any tag
  
  // Remove empty lines and excessive whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')
  cleaned = cleaned.trim()
  
  // Final cleanup for Gmail emails - remove any remaining HTML tags and get clean text
  if (isGmailEmail && cleaned.includes('<')) {
    console.log('Final Gmail HTML cleanup')
    cleaned = cleaned.replace(/<[^>]*>/g, '') // Remove all HTML tags
    cleaned = cleaned.replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    cleaned = cleaned.replace(/&amp;/g, '&') // Replace &amp; with &
    cleaned = cleaned.replace(/&lt;/g, '<') // Replace &lt; with <
    cleaned = cleaned.replace(/&gt;/g, '>') // Replace &gt; with >
    cleaned = cleaned.trim()
    console.log('After final HTML cleanup, length:', cleaned.length)
  }
  
  // For Gmail emails, always convert to plain text to avoid styling issues
  if (isGmailEmail) {
    console.log('Converting Gmail email to plain text to avoid styling issues')
    cleaned = cleaned.replace(/<[^>]*>/g, '') // Remove all HTML tags
    cleaned = cleaned.replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    cleaned = cleaned.replace(/&amp;/g, '&') // Replace &amp; with &
    cleaned = cleaned.replace(/&lt;/g, '<') // Replace &lt; with <
    cleaned = cleaned.replace(/&gt;/g, '>') // Replace &gt; with >
    cleaned = cleaned.trim()
    console.log('After plain text conversion, length:', cleaned.length)
  }
  
  console.log('Cleaned content length:', cleaned.length)
  
  // Final size check
  if (cleaned.length > 2 * 1024 * 1024) { // 2MB limit
    console.log('Cleaned content too large, truncating')
    cleaned = cleaned.substring(0, 2 * 1024 * 1024) + '\n\n[Content truncated due to size]'
  }
  
  // If we ended up with no content, try to extract something useful from the original
  if (!cleaned || cleaned.trim() === '') {
    console.log('Cleaned content is empty, trying to extract fallback content')
    
    // For Gmail emails, try to extract just the text content
    if (isGmailEmail) {
      console.log('Trying Gmail-specific fallback extraction')
      const gmailTextMatch = content.match(/<div dir="ltr">([^<]+)<\/div>/i)
      if (gmailTextMatch) {
        cleaned = gmailTextMatch[1].trim()
        console.log('Found Gmail text content, length:', cleaned.length)
      }
    }
    
    // Try to find any text content in the original
    if (!cleaned || cleaned.trim() === '') {
      const textMatch = content.match(/(?:\r?\n){2}([\s\S]*)/)
      if (textMatch) {
        cleaned = textMatch[1].trim()
        console.log('Found fallback content from original, length:', cleaned.length)
      } else {
        // Last resort: just show a message
        cleaned = 'Email content could not be processed. Please try viewing the original email.'
        console.log('Using last resort fallback content')
      }
    }
  }
  
  // Handle Cloudflare emails specifically (must be first to avoid being overridden)
  if (isCloudflareEmail) {
    console.log('Applying Cloudflare-specific content extraction')
    
    // First try to extract the text content directly from the original content
    const originalTextMatch = content.match(/(Your Cloudflare account was recently accessed[\s\S]*?)(?:\n\n|$)/i)
    if (originalTextMatch) {
      cleaned = originalTextMatch[1].trim()
      console.log('Found Cloudflare text in original content, length:', cleaned.length)
    } else {
      // If no text found in original, try cleaned content
      const textMatch = cleaned.match(/(Your Cloudflare account was recently accessed[\s\S]*?)(?:\n\n|$)/i)
      if (textMatch) {
        cleaned = textMatch[1].trim()
        console.log('Extracted Cloudflare text content, length:', cleaned.length)
      } else {
        // If no text found, try to extract HTML content
        const htmlMatch = cleaned.match(/(<!DOCTYPE html>[\s\S]*)/i)
        if (htmlMatch) {
          cleaned = htmlMatch[1]
          console.log('Extracted Cloudflare HTML content, length:', cleaned.length)
        }
      }
    }
  }
  
  // Handle other base64 + HTML patterns (fallback)
  if (!isCloudflareEmail && cleaned.startsWith('+') && cleaned.includes('<!DOCTYPE html>')) {
    console.log('Detected base64 + HTML pattern, extracting HTML content')
    const htmlStart = cleaned.indexOf('<!DOCTYPE html>')
    if (htmlStart > 0) {
      cleaned = cleaned.substring(htmlStart)
      console.log('Extracted HTML content, length:', cleaned.length)
    }
  }
  
  // Handle other base64 patterns at the start
  if (cleaned.match(/^[A-Za-z0-9+/=]{20,}/)) {
    console.log('Detected base64 pattern at start, removing')
    const htmlMatch = cleaned.match(/(<!DOCTYPE html>[\s\S]*)/i)
    if (htmlMatch) {
      cleaned = htmlMatch[1]
      console.log('Extracted HTML after base64 removal, length:', cleaned.length)
    } else {
      // If no HTML found, try to find any text content
      const textMatch = cleaned.match(/([A-Za-z\s]+)/)
      if (textMatch) {
        cleaned = textMatch[1].trim()
        console.log('Extracted text content, length:', cleaned.length)
      }
    }
  }
  
  // Final base64 cleanup - remove any remaining base64 content
  cleaned = cleaned.replace(/Content-ID:\s*<[^>]*>/g, '')
  cleaned = cleaned.replace(/Content-Transfer-Encoding:\s*base64[^]*?(?=\n\n|\n[A-Z]|$)/g, '')
  
  // Remove base64 content with spaces (like the corrupted content) - more specific patterns
  cleaned = cleaned.replace(/\]\s*Content-ID:\s*<[^>]*>\s*[A-Za-z0-9+/=\s]{50,}/g, '')
  
  // Only remove sequences that look like actual base64 (with proper base64 character distribution)
  cleaned = cleaned.replace(/[A-Za-z0-9+/=]{100,}(?=\s|$)/g, '') // Only very long sequences
  cleaned = cleaned.replace(/[A-Za-z0-9+/=]{50,}(?=\s*[A-Za-z0-9+/=]{50,})/g, '') // Only when followed by more base64
  
  // Remove the specific corrupted base64 pattern (starts with VHhe7dx and similar)
  cleaned = cleaned.replace(/^\s*[A-Za-z0-9+/=\s]{50,}\s*$/gm, '') // Remove lines that are only base64
  cleaned = cleaned.replace(/\s+[A-Za-z0-9+/=]{50,}\s+/g, ' ') // Remove base64 blocks surrounded by spaces
  
  // Convert inline images to proper img tags for non-HTML emails
  console.log('Converting inline images to img tags for non-HTML email')
  
  // Look for base64 inline images and convert them to img tags
  const base64ImageRegex = /data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)/g
  cleaned = cleaned.replace(base64ImageRegex, (match, format, data) => {
    // Limit base64 data size to prevent huge images
    if (data.length > 100000) { // ~75KB limit
      console.log('Skipping large inline image:', data.length, 'bytes')
      return '[Large inline image removed]'
    }
    return match // Keep the original data URL
  })
  
  // Look for Content-ID references and convert them to img tags
  const cidRegex = /<img[^>]*src="cid:([^"]+)"[^>]*>/gi
  cleaned = cleaned.replace(cidRegex, (match, cid) => {
    console.log('Found CID reference:', cid)
    return match // Keep the original CID reference
  })
  
  // Look for server-side image references and convert them to img tags
  const serverImageRegex = /\/cpsess\d+\/3rdparty\/roundcube\/[^"\s]*/g
  cleaned = cleaned.replace(serverImageRegex, (match) => {
    console.log('Found server-side image reference:', match)
    return `<img src="https://mail.cartoriolealceara.com.br:2096${match}" alt="Inline image" style="max-width: 100%; height: auto;" />`
  })
  
  // Look for Google signature images and convert them to img tags
  const googleImageRegex = /ci3\.googleusercontent\.com\/mail-sig\/[A-Za-z0-9+/=]+/g
  cleaned = cleaned.replace(googleImageRegex, (match) => {
    console.log('Found Google signature image:', match)
    return `<img src="https://${match}" alt="Email signature" style="max-width: 100%; height: auto;" />`
  })
  
  console.log('Final cleaned content length:', cleaned.length)
  return { cleaned, isProcessedHtml: false }
}

/**
 * List available IMAP folders
 */
async function listAvailableFolders() {
  return new Promise((resolve) => {
    const configs = [
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        tlsOptions: { 
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method'
        }
      }
    ]

    const config = configs[0]
    const imap = new Imap(config)
    const folders = []
    
    imap.once('ready', () => {
      // Check if list method exists
      if (typeof imap.list === 'function') {
        imap.list('', '*', (err, boxes) => {
          if (err) {
            console.log('Error listing folders:', err.message)
            imap.end()
            resolve([])
            return
          }
          
          boxes.forEach((box) => {
            folders.push(box.name)
          })
          
          console.log('Available IMAP folders:', folders)
          imap.end()
          resolve(folders)
        })
      } else {
        console.log('IMAP list method not available, returning empty array')
        imap.end()
        resolve([])
      }
    })

    imap.once('error', (err) => {
      console.log('IMAP error listing folders:', err.message)
      imap.end()
      resolve([])
    })

    imap.once('end', () => {
      console.log('IMAP connection ended for folder listing')
    })

    imap.connect()
  })
}

/**
 * Get total count of emails in a folder
 */
async function getFolderEmailCount(folder = 'INBOX') {
  return new Promise((resolve) => {
    const configs = [
      {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        tlsOptions: { 
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method'
        }
      }
    ]

    const config = configs[0]
    const imap = new Imap(config)
    
    imap.once('ready', () => {
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          console.log(`Failed to open box ${folder}:`, err.message)
          imap.end()
          resolve(0)
          return
        }
        
        console.log(`Folder ${folder} has ${box.messages.total} total messages`)
        imap.end()
        resolve(box.messages.total)
      })
    })

    imap.once('error', (err) => {
      console.log(`IMAP error getting count for ${folder}:`, err.message)
      imap.end()
      resolve(0)
    })

    imap.once('end', () => {
      console.log(`IMAP connection ended for ${folder} count`)
    })

    imap.connect()
  })
}

/**
 * Clear email cache
 */
function clearEmailCache() {
  emailCache.clear()
  console.log('Email cache cleared')
}

/**
 * Soft-delete an email by id and keep it available in Deleted storage
 */
function softDeleteEmail(email) {
  try {
    if (!email || !email.id) {
      console.error('softDeleteEmail: Invalid email object or missing ID')
      return false
    }
    
    console.log('softDeleteEmail: Processing email:', email.id)
    
  deletedEmailIds.add(email.id)
  // Ensure we store a minimal safe copy if only id was provided
  const stored = deletedEmailsStorage.get(email.id) || {}
  deletedEmailsStorage.set(email.id, {
    id: email.id,
      name: email.name || stored.name || 'Unknown',
      title: email.title || stored.title || 'Deleted Email',
      message: email.message || stored.message || [{ id: `msg_${1234567890}`, name: email.name || 'Unknown', content: email.content || 'This email was deleted', date: '2022-01-01', avatar: '' }], // Fixed values for SSR compatibility
    starred: email.starred ?? stored.starred ?? false,
    flagged: email.flagged ?? stored.flagged ?? false,
    checked: false,
    label: 'deleted',
      from: email.from || stored.from || 'unknown@example.com',
    to: email.to || stored.to || '',
    date: email.date || stored.date || new Date().toISOString(),
      content: email.content || stored.content || 'This email was deleted',
    attachments: email.attachments || stored.attachments || [],
  })
    
    console.log('softDeleteEmail: Email stored in deletedEmailsStorage')
    console.log('softDeleteEmail: deletedEmailsStorage size after storing:', deletedEmailsStorage.size)
    console.log('softDeleteEmail: deletedEmailIds size after storing:', deletedEmailIds.size)
    
    // Save to file for persistence
    saveDeletedEmails()
    
  // also evict it from caches
  for (const [key, value] of emailCache.entries()) {
    emailCache.set(key, {
      emails: value.emails.filter(e => e.id !== email.id),
      timestamp: value.timestamp,
    })
  }
    
  for (const key of individualEmailCache.keys()) {
    if (key.endsWith(`-${parseInt(String(email.id).replace('email_', ''), 10)}`)) {
      individualEmailCache.delete(key)
    }
  }
    
    console.log('softDeleteEmail: Email successfully soft deleted')
  return true
  } catch (error) {
    console.error('softDeleteEmail: Error occurred:', error)
    return false
  }
}

/**
 * Toggle flag status of an email
 */
function toggleFlag(emailId, flagged) {
  if (!emailId) return false
  
  // Update in deleted emails storage if it exists there
  const deletedEmail = deletedEmailsStorage.get(emailId)
  if (deletedEmail) {
    deletedEmail.flagged = flagged
    deletedEmailsStorage.set(emailId, deletedEmail)
    return true
  }
  
  // Update in sent emails storage if it exists there
  const sentEmail = sentEmails.find(email => email.id === emailId)
  if (sentEmail) {
    sentEmail.flagged = flagged
    return true
  }
  
  // For IMAP emails, we need to update the cache
  for (const [key, value] of emailCache.entries()) {
    const emailIndex = value.emails.findIndex(e => e.id === emailId)
    if (emailIndex !== -1) {
      value.emails[emailIndex].flagged = flagged
      emailCache.set(key, value)
      return true
    }
  }
  
  return true
}

/**
 * Toggle favoritar status of an email and manage favoritos folder
 */
function toggleFavoritar(emailId, favoritar) {
  if (!emailId) return false
  
  // Update in deleted emails storage if it exists there
  const deletedEmail = deletedEmailsStorage.get(emailId)
  if (deletedEmail) {
    deletedEmail.starred = favoritar
    deletedEmailsStorage.set(emailId, deletedEmail)
  }
  
  // Update in sent emails storage if it exists there
  const sentEmail = sentEmails.find(email => email.id === emailId)
  if (sentEmail) {
    sentEmail.starred = favoritar
  }
  
  // For IMAP emails, we need to update the cache
  for (const [key, value] of emailCache.entries()) {
    const emailIndex = value.emails.findIndex(e => e.id === emailId)
    if (emailIndex !== -1) {
      value.emails[emailIndex].starred = favoritar
      emailCache.set(key, value)
    }
  }
  
  // Manage favoritos folder - add or remove from favoritos cache
  const favoritosKey = 'favoritos-1-20' // Default pagination for favoritos
  const favoritosCache = emailCache.get(favoritosKey)
  
  if (favoritar) {
    // Add to favoritos if not already there
    if (favoritosCache) {
      const existsInFavoritos = favoritosCache.emails.some(e => e.id === emailId)
      if (!existsInFavoritos) {
        // Find the email from any cache and add to favoritos
        let emailToAdd = null
        for (const [cacheKey, cacheValue] of emailCache.entries()) {
          if (cacheKey !== favoritosKey) {
            const foundEmail = cacheValue.emails.find(e => e.id === emailId)
            if (foundEmail) {
              emailToAdd = { ...foundEmail, starred: true }
              break
            }
          }
        }
        
        if (emailToAdd) {
          favoritosCache.emails.unshift(emailToAdd) // Add to beginning
          emailCache.set(favoritosKey, favoritosCache)
        }
      }
    }
  } else {
    // Remove from favoritos
    if (favoritosCache) {
      favoritosCache.emails = favoritosCache.emails.filter(e => e.id !== emailId)
      emailCache.set(favoritosKey, favoritosCache)
    }
  }
  
  return true
}

/**
 * Remove email based on current folder using proper IMAP operations
 * - Inbox/Sent/Draft/Archive: Move to trash using IMAP MOVE
 * - Trash/Spam: Permanently delete using IMAP EXPUNGE
 */
async function removerEmail(emailId, currentFolder, action = 'move_to_trash') {
  try {
    if (!emailId) {
      console.error('removerEmail: No emailId provided')
      return false
    }
    
    console.log(`removerEmail: Processing email ${emailId} from folder ${currentFolder} with action ${action}`)
    
    // Determine if this is a permanent delete or move to trash
    const isPermanentDelete = action === 'delete_permanently'
    
    if (isPermanentDelete) {
      console.log('removerEmail: Permanently deleting email using IMAP EXPUNGE')
      return await permanentDeleteEmail(emailId, currentFolder)
    } else {
      console.log('removerEmail: Moving email to trash using IMAP MOVE')
      return await moveEmailToTrash(emailId, currentFolder)
    }
  } catch (error) {
    console.error('removerEmail: Error occurred:', error)
    return false
  }
}

/**
 * Move email to trash using IMAP MOVE command
 */
async function moveEmailToTrash(emailId, currentFolder) {
  try {
    console.log(`moveEmailToTrash: Moving email ${emailId} from ${currentFolder} to trash`)
    
    // Map current folder to IMAP folder name
    const folderMap = {
      'inbox': 'INBOX',
      'sentItem': 'INBOX.Sent',
      'draft': 'INBOX.Draft', 
      'archive': 'INBOX.Archive'
    }
    
    const sourceFolder = folderMap[currentFolder] || 'INBOX'
    const targetFolder = 'INBOX.Trash'
    
    console.log(`moveEmailToTrash: Moving from ${sourceFolder} to ${targetFolder}`)
    
    // Focus on IMAP MOVE operation first
    console.log('moveEmailToTrash: Attempting IMAP MOVE operation...')
    const imapResult = await performImapMove(emailId, sourceFolder, targetFolder)
    console.log('moveEmailToTrash: IMAP MOVE result:', imapResult)
    
    if (imapResult) {
      console.log('moveEmailToTrash: Successfully moved email via IMAP')
      // Email was successfully moved on server, also add to local storage for UI consistency
      const emailToMove = findEmailInCache(emailId) || {
        id: emailId,
        name: 'Unknown',
        title: 'Deleted Email',
        content: 'This email was deleted',
        date: new Date().toISOString()
      }
      const localResult = softDeleteEmail(emailToMove)
      console.log('moveEmailToTrash: Added to local deleted emails storage:', localResult)
      return true
    } else {
      console.error('moveEmailToTrash: IMAP MOVE failed - email was not moved on server')
      // IMAP MOVE failed, don't add to local storage as fallback
      // This ensures we don't have inconsistent state
      return false
    }
    
  } catch (error) {
    console.error('moveEmailToTrash: Error occurred:', error)
    return false
  }
}

/**
 * Permanently delete email using IMAP EXPUNGE
 */
async function permanentDeleteEmail(emailId, currentFolder) {
  try {
    console.log(`permanentDeleteEmail: Permanently deleting email ${emailId} from ${currentFolder}`)
    
    // Map current folder to IMAP folder name
    const folderMap = {
      'deleted': 'INBOX.Trash',
      'junk': 'INBOX.spam'
    }
    
    const sourceFolder = folderMap[currentFolder] || 'INBOX.Trash'
    
    console.log(`permanentDeleteEmail: Deleting from ${sourceFolder}`)
    
    // Use IMAP EXPUNGE to permanently delete
    const result = await performImapExpunge(emailId, sourceFolder)
    
    if (result) {
      console.log('permanentDeleteEmail: Successfully deleted email permanently')
      // Remove from local storage
      deletedEmailIds.delete(emailId)
      deletedEmailsStorage.delete(emailId)
      
      // Save changes to file
      saveDeletedEmails()
      
      // Remove from all caches
      for (const [key, value] of emailCache.entries()) {
        value.emails = value.emails.filter(e => e.id !== emailId)
        emailCache.set(key, value)
      }
      
      return true
    } else {
      console.error('permanentDeleteEmail: Failed to delete email via IMAP')
      return false
    }
  } catch (error) {
    console.error('permanentDeleteEmail: Error occurred:', error)
    return false
  }
}

/**
 * Perform IMAP MOVE operation using proper IMAP commands
 */
async function performImapMove(uid, sourceFolder, targetFolder) {
  return new Promise((resolve) => {
    try {
      console.log(`performImapMove: Moving UID ${uid} from ${sourceFolder} to ${targetFolder}`)
      
      // Use the existing IMAP connection pattern
      const configs = [
        {
          user: process.env.EMAIL_USER,
          password: process.env.EMAIL_PASSWORD,
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 993,
          tls: process.env.EMAIL_TLS === 'true',
          tlsOptions: { rejectUnauthorized: false }
        }
      ]
      
      const config = configs[0]
      const imap = new Imap(config)
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        console.log('performImapMove: IMAP connection timeout')
        imap.end()
        resolve(false)
      }, 15000) // 15 second timeout
      
      imap.once('ready', () => {
        clearTimeout(connectionTimeout)
        console.log('performImapMove: IMAP connection ready')
        
        imap.openBox(sourceFolder, false, (err, box) => {
          if (err) {
            console.log(`performImapMove: Failed to open source box ${sourceFolder}:`, err.message)
            imap.end()
            resolve(false)
            return
          }
          
          console.log(`performImapMove: Opened source box ${sourceFolder}, box has ${box.messages.total} messages`)
          console.log(`performImapMove: Attempting to move UID ${uid} to ${targetFolder}`)
          
          // Use UID-based move operation
          imap.uid.move(uid, targetFolder, (err) => {
            imap.end()
            
            if (err) {
              console.error(`performImapMove: Failed to move email:`, err.message)
              console.error(`performImapMove: Error details:`, err)
              resolve(false)
            } else {
              console.log(`performImapMove: Successfully moved email ${uid} to ${targetFolder}`)
              resolve(true)
            }
          })
        })
      })
      
      imap.once('error', (err) => {
        clearTimeout(connectionTimeout)
        console.error('performImapMove: IMAP connection error:', err.message)
        resolve(false)
      })
      
      imap.once('end', () => {
        clearTimeout(connectionTimeout)
        console.log('performImapMove: IMAP connection ended')
      })
      
      console.log('performImapMove: Connecting to IMAP server...')
      imap.connect()
      
    } catch (error) {
      console.error('performImapMove: Error occurred:', error)
      resolve(false)
    }
  })
}

/**
 * Perform IMAP EXPUNGE operation
 */
async function performImapExpunge(emailId, folder) {
  return new Promise((resolve) => {
    try {
      console.log(`performImapExpunge: Permanently deleting email ${emailId} from ${folder}`)
      
      // Extract UID from emailId
      const uid = emailId.replace('email_', '')
      
      console.log(`performImapExpunge: Permanently deleting UID ${uid} from ${folder}`)
      
      // Use the existing IMAP connection pattern
      const configs = [
        {
          user: process.env.EMAIL_USER,
          password: process.env.EMAIL_PASSWORD,
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 993,
          tls: process.env.EMAIL_TLS === 'true',
          tlsOptions: { rejectUnauthorized: false }
        }
      ]
      
      const config = configs[0]
      const imap = new Imap(config)
      
      imap.once('ready', () => {
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            console.log(`performImapExpunge: Failed to open box ${folder}:`, err.message)
            imap.end()
            resolve(false)
            return
          }
          
          console.log(`performImapExpunge: Opened box ${folder}, deleting UID ${uid}`)
          
          // First mark the email as deleted using UID, then expunge
          imap.uid.addFlags(uid, '\\Deleted', (err) => {
            if (err) {
              console.error(`performImapExpunge: Failed to mark email as deleted:`, err.message)
              imap.end()
              resolve(false)
              return
            }
            
            console.log(`performImapExpunge: Marked email ${uid} as deleted, now expunging`)
            
            // Now expunge (permanently delete) the email
            imap.expunge((err) => {
              imap.end()
              
              if (err) {
                console.error(`performImapExpunge: Failed to expunge email:`, err.message)
                resolve(false)
              } else {
                console.log(`performImapExpunge: Successfully permanently deleted email ${uid}`)
                resolve(true)
              }
            })
          })
        })
      })
      
      imap.once('error', (err) => {
        console.error('performImapExpunge: IMAP connection error:', err.message)
        resolve(false)
      })
      
      imap.once('end', () => {
        console.log('performImapExpunge: IMAP connection ended')
      })
      
      imap.connect()
      
    } catch (error) {
      console.error('performImapExpunge: Error occurred:', error)
      resolve(false)
    }
  })
}

/**
 * Find email in cache by ID
 */
function findEmailInCache(emailId) {
  // Search in email cache
  for (const [key, value] of emailCache.entries()) {
    const foundEmail = value.emails.find(e => e.id === emailId)
    if (foundEmail) {
      return foundEmail
    }
  }
  
  // Search in sent emails (get from the function instead of global variable)
  try {
    const sentEmailsList = getSentEmails()
    const sentEmail = sentEmailsList.find(email => email.id === emailId)
    if (sentEmail) {
      return sentEmail
    }
  } catch (error) {
    console.log('findEmailInCache: Error getting sent emails:', error.message)
  }
  
  return null
}

function listDeletedEmails() {
  console.log('listDeletedEmails: deletedEmailsStorage size:', deletedEmailsStorage.size)
  console.log('listDeletedEmails: deletedEmailsStorage keys:', Array.from(deletedEmailsStorage.keys()))
  console.log('listDeletedEmails: deletedEmailIds size:', deletedEmailIds.size)
  console.log('listDeletedEmails: deletedEmailIds values:', Array.from(deletedEmailIds))
  
  const emails = Array.from(deletedEmailsStorage.values()).sort((a, b) => {
    const ad = a.date ? new Date(a.date).getTime() : 0
    const bd = b.date ? new Date(b.date).getTime() : 0
    if (bd !== ad) return bd - ad
    const as = parseInt(String(a.id).replace('email_', ''), 10) || 0
    const bs = parseInt(String(b.id).replace('email_', ''), 10) || 0
    return bs - as
  })
  
  console.log('listDeletedEmails: returning', emails.length, 'emails')
  return emails
}

export {
  sendEmail,
  fetchEmails,
  fetchEmailById,
  testConnection,
  clearEmailCache,
  saveSentEmail,
  getSentEmails,
  emailCache,
  getFolderEmailCount,
  listAvailableFolders,
  // delete helpers
  softDeleteEmail,
  listDeletedEmails,
  clearAllCaches,
  cleanupFakeDeletedEmails,
  // flag helpers
  toggleFlag,
  // favoritar helpers
  toggleFavoritar,
  // remover helpers
  removerEmail,
  // move helpers
  performImapMove
}

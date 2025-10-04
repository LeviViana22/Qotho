# Email Troubleshooting Guide

## Common Issues and Solutions

### 1. SSL/TLS Connection Errors

**Error:** `SSL routines:ssl3_get_record:wrong version number`

**Solutions:**
- Try different IMAP ports: 993 (SSL) or 143 (non-SSL)
- Update your `.env.local` with alternative settings:

```env
# Try these alternative IMAP settings
IMAP_HOST=imap.mailo.com
IMAP_PORT=143  # Instead of 993
```

### 2. Nodemailer Import Errors

**Error:** `createTransporter is not a function`

**Solutions:**
- The system now uses `require('nodemailer')` instead of ES6 import
- Test with the "Test Nodemailer" button in the email test component
- If still failing, try reinstalling nodemailer: `npm install nodemailer@latest`

### 3. Mailo-Specific Configuration

**For Mailo accounts, try these settings:**

```env
# Primary configuration
EMAIL_HOST=smtp.mailo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@mailo.com
EMAIL_PASSWORD=your-app-password

# IMAP - try both configurations
IMAP_HOST=imap.mailo.com
IMAP_PORT=993

# Alternative IMAP (if 993 doesn't work)
# IMAP_HOST=imap.mailo.com
# IMAP_PORT=143
```

### 4. Testing Steps

1. **Check Configuration**: Use "Check Config" button
2. **Test Nodemailer**: Use "Test Nodemailer" button
3. **Test SMTP**: Use "Test SMTP" button
4. **Test Fetch**: Use "Test Fetch" button

### 5. Fallback System

The system includes multiple fallback mechanisms:
- **IMAP Configurations**: Tries 3 different SSL/TLS configurations
- **Mock Data**: Falls back to mock data if API fails
- **Error Handling**: Graceful degradation with error messages

### 6. Environment Variables

Make sure your `.env.local` file has all required variables:

```env
EMAIL_HOST=smtp.mailo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@mailo.com
EMAIL_PASSWORD=your-app-password
IMAP_HOST=imap.mailo.com
IMAP_PORT=993
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Mailo Account Settings

**Check your Mailo account:**
- Enable SMTP/IMAP access in your Mailo settings
- Use app-specific password if available
- Check if your account supports external email clients

### 8. Network Issues

**If you're behind a firewall:**
- Check if ports 587 (SMTP) and 993/143 (IMAP) are open
- Try using a different network
- Check with your IT department about email client restrictions

### 9. Debug Information

The system logs detailed information to help troubleshoot:
- Check browser console for frontend errors
- Check terminal/server logs for backend errors
- Use the test buttons to isolate specific issues

### 10. Alternative Providers

If Mailo continues to have issues, you can try with other providers:

**Gmail:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

**Outlook:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
```

## Getting Help

If you're still having issues:
1. Check the browser console for specific error messages
2. Test each component individually using the test buttons
3. Verify your Mailo credentials are correct
4. Try the alternative IMAP configurations

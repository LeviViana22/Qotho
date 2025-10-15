# Google Drive File Manager Setup

This guide will help you set up the Google Drive integration for the file manager.

## Prerequisites

1. A Google Cloud Project
2. Google Drive API enabled
3. OAuth 2.0 credentials configured

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. **IMPORTANT**: Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google-drive/callback` (for development)
   - `https://yourdomain.com/api/auth/google-drive/callback` (for production)
5. Save the Client ID and Client Secret

**⚠️ Common Issue**: If you get "Missing required parameter: redirect_uri" error:
- Make sure the redirect URI in Google Cloud Console **exactly matches** the one in your code
- The redirect URI must be added to the "Authorized redirect URIs" list in Google Cloud Console
- Check that there are no extra spaces or typos

### 3. Environment Configuration

Add the following to your `.env.local` file:

```env
# Google Drive API Configuration
GOOGLE_DRIVE_CLIENT_ID=your-google-drive-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-drive-client-secret
```

### 4. Token Storage (Important)

The current implementation requires you to store the Google Drive access tokens. You have several options:

#### Option A: Database Storage (Recommended)
Store tokens in your database and retrieve them based on the user session.

#### Option B: Session Storage
Modify the NextAuth configuration to include the Google Drive tokens in the session.

#### Option C: Temporary Storage
For testing purposes, you can store tokens in memory (not recommended for production).

### 5. Testing

1. Start your development server: `npm run dev`
2. Navigate to the file manager page
3. Click "Connect Google Drive"
4. Complete the OAuth flow
5. You should see your Google Drive files and folders

### 6. Debug Configuration

If you're having issues, you can check your configuration by visiting:
`http://localhost:3000/api/auth/google-drive/debug`

This will show you:
- Whether your environment variables are set correctly
- What redirect URI is being used
- Configuration status

## Features

The Google Drive file manager supports:

- ✅ View files and folders
- ✅ Navigate folder hierarchy
- ✅ Upload files
- ✅ Delete files
- ✅ Rename files
- ✅ Download files
- ✅ Share files with other users
- ✅ Grid and list view layouts
- ✅ File type detection
- ✅ Breadcrumb navigation

## Troubleshooting

### Common Issues

1. **"No Google Drive access token" error**
   - Make sure you've completed the OAuth flow
   - Check that tokens are being stored and retrieved correctly

2. **"Failed to fetch files" error**
   - Verify your Google Drive API is enabled
   - Check your OAuth credentials
   - Ensure the redirect URI matches exactly

3. **Upload fails**
   - Check file size limits
   - Verify the user has write permissions
   - Check network connectivity

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
NODE_ENV=development
```

## Security Considerations

1. **Token Security**: Store access tokens securely
2. **Scope Limitation**: Only request necessary permissions
3. **HTTPS**: Always use HTTPS in production
4. **Token Refresh**: Implement token refresh logic for long-term usage

## API Scopes Used

- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app
- `https://www.googleapis.com/auth/drive.metadata` - Access to file metadata

## Next Steps

1. Implement proper token storage
2. Add token refresh logic
3. Add error handling for expired tokens
4. Implement file preview functionality
5. Add bulk operations support

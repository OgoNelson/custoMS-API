# Gmail OAuth2 Integration Guide

This guide explains how to set up and use the Gmail OAuth2 feature in the custoMS API.

## Overview

The Gmail OAuth2 integration allows companies to:
- Connect their Gmail account securely using OAuth2
- Send birthday emails through their authenticated Gmail account
- Manage and disconnect their Gmail integration
- Handle token expiration and re-authentication automatically

## Environment Variables Required

Add these to your `.env` file:

```env
GMAIL_CLIENT_ID=your_google_oauth_client_id
GMAIL_CLIENT_SECRET=your_google_oauth_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/v1/company/auth/google/callback
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth2 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add your redirect URI: `http://localhost:3000/api/v1/company/auth/google/callback`
   - Save the Client ID and Client Secret

## API Endpoints

### 1. Initiate Gmail OAuth Setup
```http
POST /api/v1/company/setup-gmail
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&scope=..."
}
```

### 2. OAuth Callback (handled automatically)
```http
GET /api/v1/company/auth/google/callback?code=<authorization_code>&state=<company_id>
```

### 3. Check Gmail Connection Status
```http
GET /api/v1/company/gmail-status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "isConnected": true,
  "email": "company@gmail.com"
}
```

### 4. Disconnect Gmail
```http
POST /api/v1/company/disconnect-gmail
Authorization: Bearer <jwt_token>
```

## Implementation Details

### Database Schema

The Company model includes these Gmail OAuth2 fields:

```javascript
// Gmail OAuth2 integration
gmailRefreshToken: { type: String, default: "" }, // stored ENCRYPTED
replyToEmail: { type: String }, // email where replies are sent to
gmailSetupComplete: { type: Boolean, default: false }, // track if Gmail OAuth2 is set up
```

### Security Features

- **Token Encryption**: Refresh tokens are encrypted using AES encryption
- **Token Expiration Handling**: Automatic detection and handling of expired tokens
- **Secure Storage**: Sensitive credentials are stored securely in the database

### Email Sending Process

1. Check if Gmail is connected for the company
2. Decrypt the stored refresh token
3. Generate new access token using refresh token
4. Send email via Gmail API using OAuth2
5. Log email status for tracking

## Testing

### Automated Testing

Run the test script to verify the OAuth2 flow:

```bash
node test-gmail-oauth.js
```

### Manual Testing Steps

1. Start your server: `npm run dev`
2. Register/login to get JWT token
3. Call `/api/v1/company/setup-gmail` to get auth URL
4. Visit the auth URL in your browser
5. Complete Google OAuth consent flow
6. Verify connection with `/api/v1/company/gmail-status`
7. Test email sending functionality

## Error Handling

### Common Errors

1. **Invalid Grant**: Refresh token expired
   - Solution: User needs to re-authenticate
   - System automatically marks Gmail as disconnected

2. **Missing Environment Variables**
   - Solution: Ensure all required env vars are set

3. **Redirect URI Mismatch**
   - Solution: Ensure redirect URI matches Google Cloud Console settings

### Error Responses

```json
{
  "error": "Gmail authorization expired. Please reconnect your Gmail account."
}
```

## Troubleshooting

### Issues and Solutions

1. **"Gmail not connected for this company"**
   - User needs to complete OAuth setup first

2. **"redirect_uri_mismatch"**
   - Check redirect URI in Google Cloud Console
   - Ensure it matches your environment variable

3. **"access_denied"**
   - User denied consent during OAuth flow
   - User needs to retry and grant permissions

## Security Considerations

- Never expose client secrets in frontend code
- Always use HTTPS in production
- Regularly rotate OAuth2 credentials
- Monitor for unusual email sending activity
- Implement rate limiting for email sending

## Production Deployment

For production deployment:

1. Update redirect URI to your production domain
2. Use environment-specific configuration
3. Set up proper logging and monitoring
4. Implement email sending quotas
5. Add webhook notifications for failed sends
6. Set up backup email service provider

## Support

For issues with the Gmail OAuth2 integration:

1. Check the server logs for detailed error messages
2. Verify Google Cloud Console settings
3. Ensure all environment variables are correctly set
4. Test with the provided test script
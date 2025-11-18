# Security Considerations

This application handles sensitive credentials and data. Please review the following security considerations:

## Credential Storage

### WordPress Credentials
- WordPress credentials (URL, username, and application password) are stored in your browser's **localStorage**
- These credentials are **NOT encrypted** in localStorage
- They are stored locally and never sent to any third-party server except your WordPress site
- Anyone with access to your browser can potentially read these credentials

**Recommendations:**
1. Always use [WordPress Application Passwords](https://wordpress.org/documentation/article/application-passwords/) instead of your main password
2. Only use this application on trusted devices
3. Clear your browser data when using shared computers
4. Regularly rotate your WordPress application passwords

### Gemini API Key
- Your Gemini API key is stored in the `.env.local` file
- **Never commit `.env.local` to version control** (it's included in `.gitignore`)
- The API key is only sent to Google's Gemini API
- Keep your API key secure and don't share it

## Network Security

### HTTPS Recommended
- Always use HTTPS for your WordPress URL
- This ensures credentials are encrypted in transit

### CORS Configuration
- Your WordPress site must allow Cross-Origin Resource Sharing (CORS) from the domain where this app is hosted
- For local development, this is typically `http://localhost:5173`
- Configure your WordPress site to allow the appropriate origins

## Input Validation

### XSS Protection
- User input is sanitized before being inserted into WordPress posts
- HTML entities are escaped to prevent XSS attacks
- However, always review generated content before publishing

### File Upload
- Only JPEG and PNG images are accepted
- Images are processed client-side before upload
- Large files may impact performance

## Best Practices

1. **Use Draft Mode First**: Always create posts as drafts and review them before publishing
2. **Regular Backups**: Keep regular backups of your WordPress site
3. **Keep Dependencies Updated**: Regularly update npm packages to get security fixes
4. **Monitor API Usage**: Keep track of your Gemini API usage to detect unauthorized use
5. **Application Passwords**: Create separate application passwords for different uses and revoke them when no longer needed

## Reporting Security Issues

If you discover a security vulnerability in this application, please report it by creating an issue in the repository. Please do not publicly disclose security vulnerabilities until they have been addressed.

## Disclaimer

This is an educational/productivity tool. Use at your own risk. Always ensure you have appropriate backups and test in a staging environment before using in production.

# Changelog

## Code Review Fixes - 2025-11-18

### 🔒 Security Fixes

- **Fixed XSS vulnerability**: Added HTML entity escaping for user-generated content in `htmlGenerator.ts`
  - User input is now sanitized before being inserted into WordPress posts
  - FAQ questions and answers are properly escaped
  - Article content is escaped to prevent script injection

- **Added security documentation**: Created `SECURITY.md` with comprehensive security guidelines
  - Documents credential storage risks
  - Provides best practices for secure usage
  - Includes recommendations for WordPress application passwords

### 🐛 Bug Fixes

- **Fixed environment variable issue** in `geminiService.ts`
  - Changed from `process.env.API_KEY` to `import.meta.env.VITE_GEMINI_API_KEY`
  - This was preventing the Gemini integration from working in Vite
  - Updated error messages to be more helpful

- **Fixed async Promise anti-pattern** in `imageProcessor.ts`
  - Removed unnecessary `new Promise(async ...)` wrapper
  - Now uses async/await directly for cleaner code
  - Better error propagation

- **Improved URL validation**: Added proper WordPress URL validation
  - Validates URL format before saving settings
  - Checks for valid HTTP/HTTPS protocol
  - Provides clear error messages

### 💪 Improvements

- **Better error handling**:
  - Removed all `any` types from catch blocks
  - Added specific error messages for common issues (CORS, auth, network)
  - Improved error type checking using `instanceof Error`

- **Enhanced article formatting**:
  - Better paragraph detection and formatting
  - Filters out empty paragraphs
  - Improved WordPress block syntax

- **Better TypeScript support**:
  - Added type definitions for `@google/genai` package
  - Created `types/genai.d.ts` for better IDE support
  - Updated `tsconfig.json` to include custom type roots

### 📚 Documentation

- **Updated README.md**:
  - Fixed environment variable name (`GEMINI_API_KEY` → `VITE_GEMINI_API_KEY`)
  - Added step-by-step setup instructions
  - Included links to get API keys
  - Added WordPress configuration steps

- **Added `.env.local.example`**:
  - Template file for required environment variables
  - Includes helpful comments and links

- **Created `SECURITY.md`**:
  - Comprehensive security documentation
  - Best practices for credential management
  - Network security recommendations

### 🛠️ Development

- **Added `.gitignore`**:
  - Prevents committing sensitive files (`.env.local`)
  - Excludes common development artifacts
  - Covers multiple IDEs and operating systems

### 📝 Files Changed

- `services/geminiService.ts` - Fixed environment variable access
- `services/imageProcessor.ts` - Removed async Promise anti-pattern
- `services/htmlGenerator.ts` - Added HTML sanitization
- `services/wpUploader.ts` - Added URL validation function
- `components/SettingsModal.tsx` - Integrated URL validation
- `App.tsx` - Improved error handling
- `README.md` - Updated documentation
- `tsconfig.json` - Added custom type roots
- **New files**:
  - `.env.local.example` - Environment variable template
  - `.gitignore` - Git ignore rules
  - `SECURITY.md` - Security documentation
  - `CHANGELOG.md` - This file
  - `types/genai.d.ts` - TypeScript definitions

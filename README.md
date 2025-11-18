<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1TssAJH5Uy5zGe8j3mSbI5Dfy-uW4-O8n

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file and set your Gemini API key:
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   You can get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

3. Run the app:
   ```bash
   npm run dev
   ```

4. Configure WordPress settings in the app:
   - Click the settings icon in the top-right corner
   - Enter your WordPress URL (e.g., `https://yourblog.com`)
   - Enter your WordPress username
   - Create and enter an [Application Password](https://wordpress.org/documentation/article/application-passwords/)

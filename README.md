# Codeforces AI Assistant Chrome Extension

A Chrome extension that helps competitive programmers solve Codeforces problems using AI assistance from OpenAI, Claude, or Google Gemini.

## Features

- 🤖 **Multi-AI Support**: Choose between OpenAI GPT-4, Claude, or Google Gemini
- 🌐 **Multi-language**: Get explanations in English or Hinglish
- 💻 **Multiple Programming Languages**: Generate solutions in C++, Python, Java, C, JavaScript, Go, or Rust
- 📊 **Usage Statistics**: Track your problem-solving progress
- ⚙️ **Customizable Settings**: Set default preferences and manage API keys
- 🎨 **Modern UI**: Beautiful, responsive interface with dark/light theme support

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your extensions list

### Setup

1. **Add Icons**: Place your icon files in the `icons/` folder:
   - `icon16.png` (16x16 pixels)
   - `icon32.png` (32x32 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. **Configure API Keys**:
   - Click the extension icon and go to Options
   - Add your API key for your preferred AI provider:
     - **OpenAI**: Get from [OpenAI API Keys](https://platform.openai.com/api-keys)
     - **Claude**: Get from [Anthropic Console](https://console.anthropic.com/)
     - **Gemini**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Usage

1. Navigate to any Codeforces problem page
2. Click the extension icon in your browser toolbar
3. Select your preferred approach language and code language
4. Click "Generate Solution"
5. Copy the generated approach and code

## Supported Pages

- `https://codeforces.com/problemset/problem/*`
- `https://codeforces.com/contest/*/problem/*`
- `https://codeforces.com/gym/*/problem/*`

## Permissions

- `activeTab`: To access the current Codeforces page
- `storage`: To save your settings and API keys
- `contextMenus`: To add right-click menu options
- `scripting`: To extract problem data from pages
- `notifications`: To show status notifications

## File Structure

```
├── manifest.json          # Extension configuration
├── background.js          # Service worker for background tasks
├── content.js            # Content script for problem extraction
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── options.html          # Settings page
├── options.js            # Settings functionality
├── icons/                # Extension icons
└── README.md             # This file
```

## Development

### Key Components

1. **Background Script** (`background.js`): Handles extension lifecycle, context menus, and message passing
2. **Content Script** (`content.js`): Extracts problem data from Codeforces pages
3. **Popup** (`popup.html/js/css`): Main user interface for generating solutions
4. **Options Page** (`options.html/js`): Settings and API key management

### API Integration

The extension supports three AI providers:

- **OpenAI GPT-4**: Uses the Chat Completions API
- **Claude**: Uses the Messages API
- **Google Gemini**: Uses the Generate Content API

### Storage

- **Sync Storage**: API keys and user preferences
- **Local Storage**: Usage statistics and cache data

## Troubleshooting

### Common Issues

1. **Extension not working on Codeforces**:
   - Make sure you're on a supported Codeforces page
   - Check that the extension is enabled
   - Refresh the page and try again

2. **API errors**:
   - Verify your API key is correct
   - Check your API quota/billing
   - Test the connection in the options page

3. **Problem data not loading**:
   - Ensure you're on a problem page (not contest list)
   - Check browser console for errors
   - Try refreshing the page

### Debug Mode

1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Look for extension-related log messages
4. Check for any error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0
- Initial release
- Multi-AI provider support
- Problem extraction from Codeforces
- Modern UI with theme support
- Settings and statistics tracking

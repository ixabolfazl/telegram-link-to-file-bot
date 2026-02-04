# Telegram Link To File Bot

A Cloudflare Worker-based Telegram bot that receives direct download links, downloads files up to 50MB, and sends them back to users via Telegram.

Live Demo : [t.me/li2filebot](https://t.me/li2filebot)


## Features

- 📥 Download files from direct URLs (up to 50MB)
- 🖼️ Support for images, videos, documents, and other file types
- 🌐 Cloudflare Workers deployment for global performance
- 🔄 Automatic file type detection and appropriate sending method
- ⚡ Fast processing with direct URL sending for smaller files

## How It Works

This project runs as a Cloudflare Worker that handles Telegram webhook updates:

1. **Telegram Webhook** receives messages from users
2. **Link Processing** validates the URL and checks file size via HEAD request
3. **File Download & Send** downloads the file and sends it back via Telegram API (using direct URL for small files or multipart upload for larger ones)

```
User → Telegram → Cloudflare Worker → Download File → Send Back to User
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ixabolfazl/telegram-file-downloader-bot.git
cd telegram-file-downloader-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Edit the `worker.js` file and update the settings at the top:

```javascript
const BOT_TOKEN = "YOUR_BOT_TOKEN"; // Get from @BotFather
const CHANNEL_USERNAME = "@your_channel_username"; // Your channel username
const BOT_USERNAME = "@your_bot_username"; // Your bot username
const CHANNEL_SECOND_LINK = "https://t.me/+your_channel_invite_link"; // Optional second channel link
```

### 4. Deploy to Cloudflare Workers

Install Wrangler CLI if not already installed:

```bash
npm install -g wrangler
```

Login to Cloudflare:

```bash
wrangler auth login
```

Deploy the worker:

```bash
wrangler deploy
```

### 5. Set Webhook

After deployment, visit the following URL in your browser to set the webhook. Replace `YOUR_WORKER_URL` with your deployed worker URL:

`YOUR_WORKER_URL/setwebhook`

Example: `https://your-worker-name.your-subdomain.workers.dev/setwebhook`


## Support the Project

If you find this project useful, giving a **star (⭐)** is more than enough. Thank you!

## License

This project is open source and available under the [MIT License](LICENSE).
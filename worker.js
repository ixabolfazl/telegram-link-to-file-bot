// ---------- Settings ---------- //

const BOT_TOKEN = "BOT_TOKEN"; // Telegram bot token
const CHANNEL_USERNAME = "@abolfazl_devs"; // Channel username
const BOT_USERNAME = "@li2filebot"; // Bot username
const CHANNEL_SECOND_LINK = "https://t.me/+your_channel_invite_link"; // Optional second channel link

// ---------- Constants ---------- //

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_URL_SIZE = 20 * 1024 * 1024; // 20 MB for direct URL sending
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
const MIME_TYPE_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/x-matroska': '.mkv',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/ogg': '.ogg',
    'application/ogg': '.ogg',
    'audio/flac': '.flac',
    'audio/aac': '.aac',
    'audio/webm': '.webm',
    'audio/x-ms-wma': '.wma',
    'audio/midi': '.mid'
};
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// ---------- Main Handler ---------- //

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);
  const pathname = url.pathname;

  if (pathname === '/') {
    return new Response('OK', { status: 200 });
  }

  if (pathname === "/webhook") {
    return handleWebhook(event);
  }

  if (pathname === '/setwebhook') {
    return registerWebhook(event, url);
  }

  return new Response('Not Found', { status: 404 });
}

// ---------- Webhook Handler ---------- //

async function handleWebhook(event) {
  const update = await event.request.json();
  event.waitUntil(processUpdate(update));
  return new Response('Ok');
}

// ---------- Update Processing ---------- //

async function processUpdate(update) {
  if (update.message) {
    await onMessage(update.message);
  } else if (update.callback_query) {
    await onCallbackQuery(update.callback_query);
  }
}

// ---------- Message Handler ---------- //

async function onMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';

  // Handle /start command
  if (text.startsWith('/start')) {
    const welcomeText = `سلام! 👋

من یک ربات دانلود هستم که لینک‌ دانلود را دریافت می‌کنم و فایل‌ را دانلود و برای شما ارسال میکنم.

🔸 برای استفاده، کافی است لینک دانلود مستقیم را ارسال کنید. 

⚠️ توجه به علت محدودیت تلگرام امکان دانلود فایل های بیشتر از ۵۰ مگابایت وجود ندارد.

◾️ Developed by @ixabolfazl`;
    await sendMessage(chatId, null, welcomeText);
    return;
  }

  // Handle /help command
  if (text.startsWith('/help')) {
    const helpText = `راهنما 📖

• لینک دانلود مستقیم را ارسال کنید.
• ربات فایل را دانلود کرده و برای شما در تلگرام ارسال می‌کند.

⚠️ توجه به علت محدودیت تلگرام امکان دانلود فایل های بیشتر از ۵۰ مگابایت وجود ندارد.`;
    await sendMessage(chatId, null, helpText);
    return;
  }

  // Check mandatory join
  const isMember = await checkMembership(chatId);
  if (!isMember) {
    const joinText = `برای استفاده از ربات باید عضو کانال زیر شوید. 

🔶 <a href="${CHANNEL_SECOND_LINK || `https://t.me/${CHANNEL_USERNAME.substring(1)}`}">${CHANNEL_USERNAME}</a>

لطفا بعد از عضویت، دکمه عضو شدم را فشار دهید.`;
    const keyboard = [
      [{ text: "عضو شدم", callback_data: "joined" }]
    ];
    await sendMessage(chatId, message.message_id, joinText, keyboard);
    return;
  }

  // Process link
  if (isValidUrl(text)) {
    await processLink(chatId, text, message.message_id);
  } else {
    await sendMessage(chatId, message.message_id, "لطفاً یک لینک دانلود مستقیم معتبر ارسال کنید.");
  }
}

// ---------- Callback Handler ---------- //

async function onCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === "joined") {
    const isMember = await checkMembership(chatId);
    if (isMember) {
      await deleteMessage(chatId, callbackQuery.message.message_id);
      await sendMessage(chatId, null, "✅ عضویت تایید شد! حالا می‌توانید از ربات استفاده کنید.");
      
      // Check if the original message was a link
      const replyToMessage = callbackQuery.message.reply_to_message;
      if (replyToMessage && replyToMessage.text && isValidUrl(replyToMessage.text)) {
        await processLink(chatId, replyToMessage.text, replyToMessage.message_id);
      }
    } else {
      await answerCallbackQuery(callbackQuery.id, "شما هنوز عضو نشده‌اید. لطفاً عضو شوید.");
    }
  }
}

// ---------- Check Membership ---------- //

async function checkMembership(chatId) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_USERNAME}&user_id=${chatId}`);
    const result = await response.json();
    return result.ok && ['member', 'administrator', 'creator'].includes(result.result.status);
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
}

// ---------- Delete Message ---------- //

async function deleteMessage(chatId, messageId) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`);
}

// ---------- Process Link ---------- //

async function processLink(chatId, link, replyId) {
  try {
    await sendMessage(chatId, replyId, "▪️ در حال پردازش لینک...");

    // Check header for file size
    const headResponse = await fetch(link, { method: 'HEAD' });
    if (!headResponse.ok) {
      await sendMessage(chatId, replyId, "❌ لینک معتبر نیست یا قابل دسترسی نیست.");
      return;
    }

    const contentType = headResponse.headers.get('content-type') || '';
    const contentLength = parseInt(headResponse.headers.get('content-length') || '0');
    const fileName = getFileNameFromUrl(link, contentType);
    const fileType = determineFileType(contentType, link);

    if (contentLength <= MAX_URL_SIZE) {
      await sendFileByUrl(chatId, link, fileType, fileName, contentLength);
    } else {
      await sendFileByMultipart(chatId, link, fileType, fileName);
    }

  } catch (error) {
    console.error('Error processing link:', error);
    await sendMessage(chatId, replyId, "❌ خطا در پردازش لینک. لطفاً دوباره امتحان کنید.");
  }
}

// ---------- Send File by URL ---------- //

async function sendFileByUrl(chatId, url, fileType, fileName, fileSize) {
  let endpoint = '';
  const params = {
    chat_id: chatId
  };

  if (fileType === 'photo') {
    endpoint = 'sendPhoto';
    params.photo = url;
    params.caption = `Downloaded by ${BOT_USERNAME}`;
  } else if (fileType === 'video') {
    endpoint = 'sendVideo';
    params.video = url;
    params.caption = `Downloaded by ${BOT_USERNAME}`;
    params.supports_streaming = 'true';
  } else {
    endpoint = 'sendDocument';
    params.document = url;
    params.caption = `Downloaded by ${BOT_USERNAME}`;
  }

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const result = await response.json();

  if (!result.ok) {
    console.error('Telegram API error:', result);
    await sendFileByMultipart(chatId, url, fileType, fileName);
  }
}

// ---------- Send File by Multipart ---------- //

async function sendFileByMultipart(chatId, url, fileType, fileName) {
  try {
    const fileResponse = await fetch(url);

    if (!fileResponse.ok) {
      await sendMessage(chatId, null, '❌ دانلود فایل ناموفق بود.');
      return;
    }

    const fileBlob = await fileResponse.blob();
    const fileSize = fileBlob.size;

    if (fileSize > MAX_FILE_SIZE) {
      await sendMessage(chatId, null, `❌ حجم فایل (${formatSize(fileSize)}) بیشتر از ۵۰ مگابایت است.`);
      return;
    }

    const formData = new FormData();
    formData.append('chat_id', chatId);

    let endpoint = '';
    if (fileType === 'photo') {
      endpoint = 'sendPhoto';
      formData.append('photo', fileBlob, fileName);
      formData.append('caption', `Downloaded by ${BOT_USERNAME}`);
    } else if (fileType === 'video') {
      endpoint = 'sendVideo';
      formData.append('video', fileBlob, fileName);
      formData.append('caption', `Downloaded by ${BOT_USERNAME}`);
      formData.append('supports_streaming', 'true');
    } else {
      endpoint = 'sendDocument';
      formData.append('document', fileBlob, fileName);
      formData.append('caption', `Downloaded by ${BOT_USERNAME}`);
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      await sendMessage(chatId, null, `❌ ${result.description || 'Failed to send file'}`);
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    await sendMessage(chatId, null, '❌ خطا در آپلود فایل.');
  }
}

// ---------- Send Message ---------- //

async function sendMessage(chatId, replyId, text, keyboard = []) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_to_message_id: replyId
  };

  if (keyboard.length > 0) {
    payload.reply_markup = { inline_keyboard: keyboard };
  }

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

// ---------- Answer Callback Query ---------- //

async function answerCallbackQuery(callbackQueryId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text
    })
  });
}

// ---------- Register Webhook ---------- //

async function registerWebhook(event, url) {
  const webhookUrl = `${url.protocol}//${url.hostname}/webhook`;
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

// ---------- Helper Functions ---------- //

function determineFileType(contentType, url) {
  const urlLower = url.toLowerCase();

  if (contentType.startsWith('image/')) {
    return 'photo';
  }

  if (contentType.startsWith('video/')) {
    return 'video';
  }

  // Check by file extension
  for (const ext of IMAGE_EXTENSIONS) {
    if (urlLower.includes(ext)) {
      return 'photo';
    }
  }

  for (const ext of VIDEO_EXTENSIONS) {
    if (urlLower.includes(ext)) {
      return 'video';
    }
  }

  return 'document';
}

function getFileNameFromUrl(url, contentType) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    let fileName = parts[parts.length - 1];

    if (fileName && fileName.includes('.')) {
      return decodeURIComponent(fileName);
    }

    const timestamp = Date.now();
    const ext = getExtensionFromContentType(contentType);
    return `file_${timestamp}${ext}`;

  } catch {
    return `file_${Date.now()}`;
  }
}

function getExtensionFromContentType(contentType) {
  return MIME_TYPE_MAP[contentType] || '';
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
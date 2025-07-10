// Telegram API functions with enhanced media support
async function sendMessageToChannel(botToken, channelId, text, options = {}) {
    const formData = new FormData();
    formData.append('chat_id', channelId);

    if (options.disable_notification) {
        formData.append('disable_notification', 'true');
    }

    if (options.protect_content) {
        formData.append('protect_content', 'true');
    }

    // Handle different media types
    if (options.media) {
        const file = options.media;
        const fileType = file.type;

        if (fileType.startsWith('image/')) {
            // Send photo
            formData.append('photo', file);
            if (text) {
                formData.append('caption', text);
                formData.append('parse_mode', 'HTML');
            }

            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
            return await response.json();

        } else if (fileType.startsWith('video/')) {
            // Send video
            formData.append('video', file);
            if (text) {
                formData.append('caption', text);
                formData.append('parse_mode', 'HTML');
            }

            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
                method: 'POST',
                body: formData
            });
            return await response.json();

        } else if (fileType.startsWith('audio/')) {
            // Send audio
            formData.append('audio', file);
            if (text) {
                formData.append('caption', text);
                formData.append('parse_mode', 'HTML');
            }

            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
                method: 'POST',
                body: formData
            });
            return await response.json();

        } else {
            // Send document
            formData.append('document', file);
            if (text) {
                formData.append('caption', text);
                formData.append('parse_mode', 'HTML');
            }

            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        }
    } else {
        // Send text message only
        formData.append('text', text);
        formData.append('parse_mode', 'HTML');

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    }
}

// Format text with HTML/Markdown support
function formatText(text) {
    // Convert Markdown to HTML
    text = text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<b>$1</b>')
        // Italic
        .replace(/__(.*?)__/g, '<i>$1</i>')
        .replace(/_(.*?)_/g, '<i>$1</i>')
        // Code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Strikethrough
        .replace(/~~(.*?)~~/g, '<s>$1</s>')
        // Underline (HTML only)
        .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');

    return text;
}

// Get file size in human readable format
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file type icon using FontAwesome
function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'fas fa-image';
    if (fileType.startsWith('video/')) return 'fas fa-video';
    if (fileType.startsWith('audio/')) return 'fas fa-music';
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('word')) return 'fas fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return 'fas fa-file-archive';
    return 'fas fa-file';
}
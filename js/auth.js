// Authentication Management
document.addEventListener('DOMContentLoaded', function () {
    const authForm = document.getElementById('auth-form');
    const authStatus = document.getElementById('auth-status');
    const authSection = document.getElementById('auth-section');
    const postSection = document.getElementById('post-section');

    // Load saved credentials if they exist
    const savedBotToken = localStorage.getItem('telegram_bot_token');
    const savedChannelId = localStorage.getItem('telegram_channel_id');

    if (savedBotToken && savedChannelId) {
        document.getElementById('bot-token').value = savedBotToken;
        document.getElementById('channel-id').value = savedChannelId;

        // Auto-verify if credentials exist
        verifyCredentials(savedBotToken, savedChannelId);
    }

    authForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const botToken = document.getElementById('bot-token').value.trim();
        const channelId = document.getElementById('channel-id').value.trim();

        if (!botToken || !channelId) {
            showStatus(authStatus, 'Please fill in all fields', 'error');
            return;
        }

        if (!botToken.match(/^\d+:[a-zA-Z0-9_-]+$/)) {
            showStatus(authStatus, 'Invalid bot token format', 'error');
            return;
        }

        await verifyCredentials(botToken, channelId);
    });

    async function verifyCredentials(botToken, channelId) {
        showStatus(authStatus, 'Verifying credentials...', 'info');
        authForm.classList.add('loading');

        try {
            const botInfo = await getBotInfo(botToken);

            if (botInfo.ok) {
                localStorage.setItem('telegram_bot_token', botToken);
                localStorage.setItem('telegram_channel_id', channelId);

                showStatus(authStatus, `Connected successfully as @${botInfo.result.username}`, 'success');

                // Show post section
                setTimeout(() => {
                    authSection.style.display = 'none';
                    postSection.style.display = 'block';
                    postSection.classList.add('fade-in');

                    // Dispatch success event
                    document.dispatchEvent(new Event('telegramAuthSuccess'));
                }, 1000);
            } else {
                showStatus(authStatus, `${botInfo.description || 'Invalid bot token'}`, 'error');
            }
        } catch (error) {
            showStatus(authStatus, `Connection failed: ${error.message}`, 'error');
            console.error('Authentication error:', error);
        } finally {
            authForm.classList.remove('loading');
        }
    }

    function showStatus(element, message, type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };

        element.innerHTML = `<div class="${type}-message">${icons[type]} ${message}</div>`;
    }
});

async function getBotInfo(botToken) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        return await response.json();
    } catch (error) {
        return { ok: false, description: error.message };
    }
}
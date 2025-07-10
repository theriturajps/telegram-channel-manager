// Main application logic with enhanced features
document.addEventListener('DOMContentLoaded', function () {
    const postForm = document.getElementById('post-form');
    const postStatus = document.getElementById('post-status');
    const postTextArea = document.getElementById('post-text');
    const mediaInput = document.getElementById('post-media');
    const mediaPreview = document.getElementById('media-preview');
    const previewBtn = document.getElementById('preview-post');
    const saveDraftBtn = document.getElementById('save-draft');
    const loadDraftBtn = document.getElementById('load-draft');

    let selectedMedia = null;

    // Initialize formatting toolbar
    initializeFormattingToolbar();

    // Initialize media handling
    initializeMediaHandling();

    // Initialize draft system
    initializeDraftSystem();

    // Handle post submission
    postForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const botToken = localStorage.getItem('telegram_bot_token');
        const channelId = localStorage.getItem('telegram_channel_id');
        const postText = postTextArea.value.trim();
        const disableNotification = document.getElementById('disable-notification').checked;
        const protectContent = document.getElementById('protect-content').checked;

        if (!postText && !selectedMedia) {
            showStatus(postStatus, 'Please enter text or select media', 'error');
            return;
        }

        showStatus(postStatus, 'Publishing post to channel...', 'info');
        postForm.classList.add('loading');

        try {
            const options = {
                disable_notification: disableNotification,
                protect_content: protectContent
            };

            if (selectedMedia) {
                options.media = selectedMedia;
            }

            // Format text for Telegram
            const formattedText = formatText(postText);

            const result = await sendMessageToChannel(botToken, channelId, formattedText, options);

            if (result.ok) {
                showStatus(postStatus, 'Post published successfully!', 'success');

                // Save to drafts for reuse
                saveToDrafts(postText, selectedMedia?.name);

                // Clear form
                postForm.reset();
                clearMediaPreview();

                // Clear selected media
                selectedMedia = null;
            } else {
                showStatus(postStatus, `Error: ${result.description || 'Failed to send post'}`, 'error');
            }
        } catch (error) {
            showStatus(postStatus, `Error: ${error.message}`, 'error');
            console.error('Post submission error:', error);
        } finally {
            postForm.classList.remove('loading');
        }
    });

    // Preview functionality
    previewBtn.addEventListener('click', function () {
        const text = postTextArea.value.trim();
        if (!text && !selectedMedia) {
            showStatus(postStatus, 'Nothing to preview', 'error');
            return;
        }

        showPreview(text, selectedMedia);
    });

    // Modal functionality
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-close') ||
            e.target.closest('.modal-close') ||
            e.target.classList.contains('modal')) {
            closeModal();
        }
    });

    function closeModal() {
        document.getElementById('preview-modal').style.display = 'none';
        document.getElementById('drafts-modal').style.display = 'none';
    }

    function initializeFormattingToolbar() {
        const toolbar = document.querySelector('.toolbar');

        if (!toolbar) {
            console.error('Toolbar not found');
            return;
        }

        toolbar.addEventListener('click', function (e) {
            if (e.target.closest('[data-format]')) {
                e.preventDefault();
                const format = e.target.closest('[data-format]').dataset.format;
                applyFormatting(format);
            }
        });
    }

    function applyFormatting(format) {
        const textarea = postTextArea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        let formattedText = '';

        switch (format) {
            case 'bold':
                formattedText = selectedText ? `<b>${selectedText}</b>` : '<b></b>';
                break;
            case 'italic':
                formattedText = selectedText ? `<i>${selectedText}</i>` : '<i></i>';
                break;
            case 'underline':
                formattedText = selectedText ? `<u>${selectedText}</u>` : '<u></u>';
                break;
            case 'strikethrough':
                formattedText = selectedText ? `<s>${selectedText}</s>` : '<s></s>';
                break;
            case 'code':
                formattedText = selectedText ? `<code>${selectedText}</code>` : '<code></code>';
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    formattedText = selectedText ? `<a href="${url}">${selectedText}</a>` : `<a href="${url}">Link Text</a>`;
                }
                break;
        }

        if (formattedText) {
            const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
            textarea.value = newValue;

            // Set cursor position
            const newCursorPos = start + formattedText.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
        }
    }

    function initializeMediaHandling() {
        mediaInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                selectedMedia = file;
                showMediaPreview(file);
            } else {
                clearMediaPreview();
            }
        });
    }

    function showMediaPreview(file) {
        mediaPreview.classList.add('has-media');

        const fileIcon = getFileIcon(file.type);
        const fileSize = formatFileSize(file.size);

        let previewContent = `
            <div class="media-item">
                <i class="${fileIcon}" style="font-size: 1.5rem; color: #6c757d;"></i>
                <div class="media-info">
                    <div style=" font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${file.name}</div>
                    <div style="color: #6b7280;">${fileSize}</div>
                </div>
            </div>
        `;

        // Show image preview if it's an image
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewContent = `
                    <div class="media-item">
                        <img src="${e.target.result}" alt="Preview" style="max-width: 120px; max-height: 120px;">
                        <div class="media-info">
                            <div style=" font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${file.name}</div>
                            <div style="color: #6b7280;">${fileSize}</div>
                        </div>
                    </div>
                `;
                mediaPreview.innerHTML = previewContent;
            };
            reader.readAsDataURL(file);
        } else {
            mediaPreview.innerHTML = previewContent;
        }
    }

    function clearMediaPreview() {
        mediaPreview.classList.remove('has-media');
        mediaPreview.innerHTML = '';
        selectedMedia = null;
    }

    function showPreview(text, media) {
        const previewContent = document.getElementById('preview-content');
        let content = '';

        if (text) {
            // Convert formatting for preview
            const previewText = text
                .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
                .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
                .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                .replace(/<s>(.*?)<\/s>/g, '<del>$1</del>')
                .replace(/<code>(.*?)<\/code>/g, '<code style="background: #f1f3f4; padding: 2px 4px; border-radius: 3px;">$1</code>')
                .replace(/\n/g, '<br>');

            content += `<div style="margin-bottom: 0.75rem;">${previewText}</div>`;
        }

        if (media) {
            if (media.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    content += `<img src="${e.target.result}" style="max-width: 100%; border-radius: 6px;">`;
                    previewContent.innerHTML = content;
                };
                reader.readAsDataURL(media);
            } else {
                const fileIcon = getFileIcon(media.type);
                content += `
                    <div style="border: 1px solid #dee2e6; border-radius: 6px; padding: 0.75rem; background: white;">
                        <i class="${fileIcon}" style="font-size: 1.2rem; color: #6c757d; margin-right: 0.5rem;"></i>
                        <span>${media.name}</span>
                        <small style="color: #6b7280; display: block; margin-top: 0.25rem;">${formatFileSize(media.size)}</small>
                    </div>
                `;
                previewContent.innerHTML = content;
            }
        } else {
            previewContent.innerHTML = content;
        }

        // Show modal
        document.getElementById('preview-modal').style.display = 'flex';
    }

    function initializeDraftSystem() {
        saveDraftBtn.addEventListener('click', saveDraft);
        loadDraftBtn.addEventListener('click', showDrafts);
    }

    function saveDraft() {
        const text = postTextArea.value.trim();
        if (!text) {
            showStatus(postStatus, 'Nothing to save', 'error');
            return;
        }

        const drafts = JSON.parse(localStorage.getItem('telegram_drafts') || '[]');
        const draft = {
            id: Date.now(),
            text: text,
            mediaName: selectedMedia?.name || null,
            timestamp: new Date().toISOString(),
            preview: text.substring(0, 80) + (text.length > 80 ? '...' : '')
        };

        drafts.unshift(draft);

        // Keep only last 10 drafts
        if (drafts.length > 10) {
            drafts.splice(10);
        }

        localStorage.setItem('telegram_drafts', JSON.stringify(drafts));
        showStatus(postStatus, 'Draft saved successfully!', 'success');
    }

    function showDrafts() {
        const drafts = JSON.parse(localStorage.getItem('telegram_drafts') || '[]');
        const draftsList = document.getElementById('drafts-list');

        if (drafts.length === 0) {
            draftsList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 1rem;">No saved drafts</p>';
        } else {
            draftsList.innerHTML = drafts.map(draft => `
                <div class="draft-item">
                    <div class="draft-meta">
                        <i class="fas fa-clock" style="margin-right: 0.25rem;"></i>
                        ${new Date(draft.timestamp).toLocaleDateString()}
                        ${draft.mediaName ? `<i class="fas fa-paperclip" style="margin-left: 0.5rem; margin-right: 0.25rem;"></i>${draft.mediaName}` : ''}
                    </div>
                    <div class="draft-preview">${draft.preview}</div>
                    <div class="draft-actions">
                        <button class="btn btn-primary" onclick="loadDraft(${draft.id})">
                            <i class="fas fa-folder-open"></i> Load
                        </button>
                        <button class="btn btn-secondary" onclick="deleteDraft(${draft.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('drafts-modal').style.display = 'flex';
    }

    // Global functions for draft management
    window.loadDraft = function (draftId) {
        const drafts = JSON.parse(localStorage.getItem('telegram_drafts') || '[]');
        const draft = drafts.find(d => d.id === draftId);

        if (draft) {
            postTextArea.value = draft.text;
            showStatus(postStatus, 'Draft loaded successfully!', 'success');

            // Close modal
            closeModal();
        }
    };

    window.deleteDraft = function (draftId) {
        if (confirm('Are you sure you want to delete this draft?')) {
            let drafts = JSON.parse(localStorage.getItem('telegram_drafts') || '[]');
            drafts = drafts.filter(d => d.id !== draftId);
            localStorage.setItem('telegram_drafts', JSON.stringify(drafts));
            showDrafts(); // Refresh the list
        }
    };

    function saveToDrafts(text, mediaName) {
        const drafts = JSON.parse(localStorage.getItem('telegram_drafts') || '[]');
        const draft = {
            id: Date.now(),
            text: text,
            mediaName: mediaName,
            timestamp: new Date().toISOString(),
            preview: text.substring(0, 80) + (text.length > 80 ? '...' : '')
        };

        drafts.unshift(draft);

        // Keep only last 10 drafts
        if (drafts.length > 10) {
            drafts.splice(10);
        }

        localStorage.setItem('telegram_drafts', JSON.stringify(drafts));
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
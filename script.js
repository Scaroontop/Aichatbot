class ShapesIncChat {
    constructor() {
        this.apiKey = 'HQUWJWT4072UVNCOGWYJ2HWPVL985JEEYZDNJ7CVH74';
        this.apiVersion = 'v2';
        this.userId = 'Scaroontop';
        this.channelId = this.generateChannelId();
        this.shapeUsername = 'Star-tr15';
        this.baseURL = 'https://api.shapes.inc';
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimitDelay = 1000; // 1 second between requests
        this.currentShape = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        this.updateUsernameField();
        this.fetchAndDisplayShapeInfo(this.shapeUsername);
    }

    initializeElements() {
        this.elements = {
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendMessage'),
            chatMessages: document.getElementById('chatMessages'),
            apiVersionSelect: document.getElementById('apiVersion'),
            userIdInput: document.getElementById('userId'),
            shapeUsernameInput: document.getElementById('shapeUsername'),
            channelIdInput: document.getElementById('channelId'),
            apiKeyInput: document.getElementById('apiKey'),
            showAdvancedBtn: document.getElementById('showAdvanced'),
            advancedSettings: document.querySelector('.advanced-settings'),
            saveSettingsBtn: document.getElementById('saveSettings'),
            saveBasicSettingsBtn: document.getElementById('saveBasicSettings'),
            regenerateChannelBtn: document.getElementById('regenerateChannel'),
            customChannelBtn: document.getElementById('customChannel'),
            showCommandsBtn: document.getElementById('showCommands'),
            commandsPanel: document.querySelector('.commands-panel'),
            imageUploadBtn: document.getElementById('uploadImage'),
            audioUploadBtn: document.getElementById('uploadAudio'),
            imageUploadInput: document.getElementById('imageUpload'),
            audioUploadInput: document.getElementById('audioUpload'),
            typingIndicator: document.querySelector('.typing-indicator'),
            toggleAdvancedInfoBtn: document.getElementById('toggleAdvancedInfo'),
            advancedInfo: document.querySelector('.advanced-info'),
            shapeProfile: document.querySelector('.shape-profile')
        };
    }

    attachEventListeners() {
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.elements.messageInput.addEventListener('focus', () => {
            if (this.currentShape) {
                this.elements.shapeProfile.classList.remove('hidden');
            }
        });

        this.elements.apiVersionSelect.addEventListener('change', () => {
            this.apiVersion = this.elements.apiVersionSelect.value;
            if (this.apiVersion === 'v1') {
                this.elements.userIdInput.value = '';
                this.userId = '';
            }
            this.updateUsernameField();
        });

        this.elements.userIdInput.addEventListener('input', (e) => {
            if (this.apiVersion === 'v1') {
                e.preventDefault();
                e.target.value = '';
                return false;
            }
        });

        this.elements.saveBasicSettingsBtn.addEventListener('click', () => {
            if (this.apiVersion === 'v1' && this.elements.userIdInput.value.trim() !== '') {
                this.showError('Username cannot be set in V1 mode');
                return;
            }
            this.saveSettings();
            this.showSuccess('Basic settings saved successfully!');
            setTimeout(() => location.reload(), 1000);
        });

        this.elements.showAdvancedBtn.addEventListener('click', () => {
            this.elements.advancedSettings.classList.toggle('hidden');
        });

        this.elements.saveSettingsBtn.addEventListener('click', () => {
            if (this.apiVersion === 'v1' && this.elements.userIdInput.value.trim() !== '') {
                this.showError('Username cannot be set in V1 mode');
                return;
            }
            this.saveSettings();
            this.showSuccess('Advanced settings saved successfully!');
            setTimeout(() => location.reload(), 1000);
        });

        this.elements.shapeUsernameInput.addEventListener('change', () => {
            this.shapeUsername = this.elements.shapeUsernameInput.value;
            this.fetchAndDisplayShapeInfo(this.shapeUsername);
        });

        this.elements.toggleAdvancedInfoBtn.addEventListener('click', () => {
            const isHidden = this.elements.advancedInfo.classList.contains('hidden');
            this.elements.advancedInfo.classList.toggle('hidden');
            this.elements.toggleAdvancedInfoBtn.textContent = 
                isHidden ? 'Hide Advanced Information' : 'Show Advanced Information';
        });

        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.getAttribute('data-command');
                if (command === '!imagine') {
                    this.elements.messageInput.value = command + ' ';
                    this.elements.messageInput.focus();
                } else {
                    this.elements.messageInput.value = command;
                    this.sendMessage();
                }
                this.elements.commandsPanel.classList.add('hidden');
            });
        });

        // Additional event listeners...
        this.setupCommandButtons();
    }

    async fetchAndDisplayShapeInfo(username) {
        try {
            const response = await fetch(`${this.baseURL}/shapes/public/${username}`);
            if (!response.ok) throw new Error('Failed to fetch shape info');
            
            const data = await response.json();
            this.currentShape = data;
            this.updateShapeProfile(data);
            return data;
        } catch (error) {
            console.error('Error fetching shape info:', error);
            this.showError(`Failed to load information for shape: ${username}`);
            return null;
        }
    }

    updateShapeProfile(profile) {
        if (!profile) return;

        // Update basic info
        document.getElementById('shapeAvatar').src = profile.avatar_url || profile.avatar;
        document.getElementById('shapeName').textContent = profile.name;
        document.getElementById('shapeDescription').textContent = profile.search_description;
        
        document.getElementById('userCount').textContent = 
            `👤 ${profile.user_count?.toLocaleString() || 0} users`;
        document.getElementById('messageCount').textContent = 
            `💬 ${profile.message_count?.toLocaleString() || 0} messages`;

        // Update tags
        const tagsContainer = document.getElementById('shapeTags');
        tagsContainer.innerHTML = '';
        profile.search_tags_v2?.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });

        // Update advanced information
        document.getElementById('shapeTagline').textContent = profile.tagline || 'N/A';
        document.getElementById('shapeUniverse').textContent = profile.character_universe || 'N/A';
        document.getElementById('shapeBackground').textContent = profile.character_background || 'N/A';
        document.getElementById('shapeStatus').textContent = profile.shape_settings?.status || 'N/A';
        document.getElementById('shapeInitialMessage').textContent = 
            profile.shape_settings?.shape_initial_message || 'N/A';

        // Update example prompts
        const promptsContainer = document.getElementById('shapePrompts');
        promptsContainer.innerHTML = '';
        if (profile.example_prompts?.length > 0) {
            profile.example_prompts.forEach(prompt => {
                const promptElement = document.createElement('div');
                promptElement.className = 'prompt-item';
                promptElement.textContent = prompt;
                promptsContainer.appendChild(promptElement);
            });
        } else {
            promptsContainer.textContent = 'No example prompts available';
        }
    }

    updateUsernameField() {
        const usernameSettings = this.elements.userIdInput.parentElement;
        if (this.apiVersion === 'v1') {
            usernameSettings.classList.add('disabled');
            this.elements.userIdInput.value = '';
            this.userId = '';
        } else {
            usernameSettings.classList.remove('disabled');
            this.elements.userIdInput.value = this.userId;
        }
    }

    async sendMessage() {
        const messageText = this.elements.messageInput.value.trim();
        if (!messageText) return;

        const sanitizedMessage = this.sanitizeInput(messageText);
        this.addMessageToChat('user', sanitizedMessage);
        this.elements.messageInput.value = '';
        this.showTypingIndicator();

        this.queueRequest(async () => {
            try {
                const response = await this.makeApiRequest(sanitizedMessage);
                this.hideTypingIndicator();
                const botResponse = response.choices[0].message.content;
                this.addMessageToChat('bot', botResponse);
                
                // Update shape info after each message
                await this.fetchAndDisplayShapeInfo(this.shapeUsername);
            } catch (error) {
                this.hideTypingIndicator();
                this.showError('Failed to get response from the API');
                console.error('API Error:', error);
            }
        });
    }

    addMessageToChat(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        // Check if content contains an image URL
        const imageUrlRegex = /https:\/\/files\.shapes\.inc\/.*\.(png|jpg|jpeg|gif)/i;
        const imageUrl = content.match(imageUrlRegex);

        if (imageUrl) {
            // If there's text before or after the image URL, add it
            const textContent = content.replace(imageUrl[0], '').trim();
            if (textContent) {
                messageDiv.textContent = textContent;
            }

            // Add the image
            const img = document.createElement('img');
            img.src = imageUrl[0];
            img.alt = 'Shape generated image';
            img.loading = 'lazy';
            messageDiv.appendChild(img);
        } else {
            messageDiv.textContent = content;
        }

        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // ... (keep existing utility methods like generateChannelId, encryptApiKey, etc.)

    showTypingIndicator() {
        this.elements.typingIndicator.classList.remove('hidden');
        this.elements.typingIndicator.classList.add('visible');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.classList.remove('visible');
        setTimeout(() => {
            this.elements.typingIndicator.classList.add('hidden');
        }, 300);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        this.elements.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        this.elements.chatMessages.appendChild(successDiv);
        this.scrollToBottom();
        setTimeout(() => successDiv.remove(), 5000);
    }

    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('chatSettings')) || {};
        this.apiVersion = settings.apiVersion || 'v2';
        this.userId = this.apiVersion === 'v2' ? (settings.userId || 'Scaroontop') : '';
        this.shapeUsername = settings.shapeUsername || 'Star-tr15';
        this.channelId = settings.channelId || this.generateChannelId();
        
        this.elements.apiVersionSelect.value = this.apiVersion;
        this.elements.userIdInput.value = this.userId;
        this.elements.shapeUsernameInput.value = this.shapeUsername;
        this.elements.channelIdInput.value = this.channelId;
        
        this.updateUsernameField();
        this.fetchAndDisplayShapeInfo(this.shapeUsername);
    }

    saveSettings() {
        if (this.apiVersion === 'v1' && this.elements.userIdInput.value.trim() !== '') {
            throw new Error('Username cannot be set in V1 mode');
        }

        const settings = {
            apiVersion: this.elements.apiVersionSelect.value,
            userId: this.apiVersion === 'v2' ? this.elements.userIdInput.value : '',
            shapeUsername: this.elements.shapeUsernameInput.value,
            channelId: this.elements.channelIdInput.value,
            apiKey: this.encryptApiKey(this.elements.apiKeyInput.value)
        };
        localStorage.setItem('chatSettings', JSON.stringify(settings));
    }

    // Keep existing API request methods...
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.shapesChat = new ShapesIncChat();
});

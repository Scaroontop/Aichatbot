class ShapesIncChat {
    constructor() {
        this.apiKey = 'HQUWJWT4072UVNCOGWYJ2HWPVL985JEEYZDNJ7CVH74';
        this.apiVersion = 'v2';
        this.userId = 'Scaroontop';
        this.channelId = this.generateChannelId();
        this.shapeUsername = 'star-tr15';
        this.baseURL = 'https://api.shapes.inc/v1';
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimitDelay = 1000; // 1 second between requests
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        this.updateUsernameField();
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
            typingIndicator: document.querySelector('.typing-indicator')
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

        this.elements.apiVersionSelect.addEventListener('change', () => {
            this.apiVersion = this.elements.apiVersionSelect.value;
            this.updateUsernameField();
        });

        this.elements.saveBasicSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            this.showSuccess('Basic settings saved successfully!');
            setTimeout(() => location.reload(), 1000);
        });

        this.elements.showAdvancedBtn.addEventListener('click', () => {
            this.elements.advancedSettings.classList.toggle('hidden');
        });

        this.elements.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            this.showSuccess('Advanced settings saved successfully!');
            setTimeout(() => location.reload(), 1000);
        });

        this.elements.regenerateChannelBtn.addEventListener('click', () => {
            this.channelId = this.generateChannelId();
            this.elements.channelIdInput.value = this.channelId;
        });

        this.elements.customChannelBtn.addEventListener('click', () => {
            const customId = prompt('Enter custom channel ID:');
            if (customId && customId.trim()) {
                this.channelId = customId.trim();
                this.elements.channelIdInput.value = this.channelId;
            }
        });

        this.elements.showCommandsBtn.addEventListener('click', () => {
            this.elements.commandsPanel.classList.toggle('hidden');
        });

        this.elements.imageUploadBtn.addEventListener('click', () => {
            this.elements.imageUploadInput.click();
        });

        this.elements.audioUploadBtn.addEventListener('click', () => {
            this.elements.audioUploadInput.click();
        });

        this.elements.imageUploadInput.addEventListener('change', (e) => {
            this.handleFileUpload(e, 'image');
        });

        this.elements.audioUploadInput.addEventListener('change', (e) => {
            this.handleFileUpload(e, 'audio');
        });

        this.setupCommandButtons();

        this.elements.shapeUsernameInput.addEventListener('change', () => {
            this.shapeUsername = this.elements.shapeUsernameInput.value;
            this.updateShapeProfile(this.shapeUsername);
        });
    }

    generateChannelId() {
        return 'channel_' + Math.random().toString(36).substr(2, 9);
    }

    encryptApiKey(apiKey) {
        return CryptoJS.SHA256(apiKey).toString();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        this.elements.chatMessages.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        this.elements.chatMessages.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
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

    async fetchShapeProfile(username) {
        try {
            const response = await fetch(`${this.baseURL}/shapes/public/${username}`);
            if (!response.ok) throw new Error('Failed to fetch shape profile');
            return await response.json();
        } catch (error) {
            console.error('Error fetching shape profile:', error);
            this.showError('Failed to load shape profile');
            return null;
        }
    }

    async updateShapeProfile(username) {
        const profile = await this.fetchShapeProfile(username);
        if (!profile) return;

        document.getElementById('shapeAvatar').src = profile.avatar_url || profile.avatar;
        document.getElementById('shapeName').textContent = profile.name;
        document.getElementById('shapeDescription').textContent = profile.search_description;
        
        document.getElementById('userCount').textContent = 
            `👤 ${profile.user_count?.toLocaleString() || 0} users`;
        document.getElementById('messageCount').textContent = 
            `💬 ${profile.message_count?.toLocaleString() || 0} messages`;
        
        const tagsContainer = document.getElementById('shapeTags');
        tagsContainer.innerHTML = '';
        profile.search_tags_v2?.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    }

    setupCommandButtons() {
        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.getAttribute('data-command');
                this.elements.messageInput.value = command;
                this.sendMessage();
            });
        });
    }

    showTypingIndicator() {
        this.elements.typingIndicator.classList.remove('hidden');
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.classList.add('hidden');
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        
        this.isProcessing = true;
        const request = this.requestQueue.shift();
        
        try {
            await request();
        } catch (error) {
            console.error('Error processing request:', error);
        }
        
        setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
        }, this.rateLimitDelay);
    }

    queueRequest(request) {
        this.requestQueue.push(request);
        this.processQueue();
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
            } catch (error) {
                this.hideTypingIndicator();
                this.showError('Failed to get response from the API');
                console.error('API Error:', error);
            }
        });
    }

    async makeApiRequest(message) {
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        if (this.apiVersion === 'v2') {
            headers['X-User-Id'] = this.userId;
            headers['X-Channel-Id'] = this.channelId;
        }

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: `shapesinc/${this.shapeUsername}`,
                messages: [{ role: 'user', content: message }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    }

    async handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // In a real implementation, you would upload the file to a server
            // and get back a URL. For this example, we'll simulate it:
            const fakeUrl = `https://example.com/${file.name}`;
            
            const content = [
                {
                    type: 'text',
                    text: `Please analyze this ${type}`
                },
                {
                    type: `${type}_url`,
                    [`${type}_url`]: {
                        url: fakeUrl
                    }
                }
            ];

            this.addMessageToChat('user', `Uploaded ${type}: ${file.name}`);
            this.showTypingIndicator();

            this.queueRequest(async () => {
                try {
                    const response = await this.makeApiRequestWithMedia(content);
                    this.hideTypingIndicator();
                    const botResponse = response.choices[0].message.content;
                    this.addMessageToChat('bot', botResponse);
                } catch (error) {
                    this.hideTypingIndicator();
                    this.showError(`Failed to process ${type}`);
                    console.error('Upload Error:', error);
                }
            });
        } catch (error) {
            this.showError(`Failed to upload ${type}`);
            console.error('Upload Error:', error);
        }
    }

    async makeApiRequestWithMedia(content) {
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        if (this.apiVersion === 'v2') {
            headers['X-User-Id'] = this.userId;
            headers['X-Channel-Id'] = this.channelId;
        }

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: `shapesinc/${this.shapeUsername}`,
                messages: [{ role: 'user', content: content }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('chatSettings')) || {};
        this.apiVersion = settings.apiVersion || 'v2';
        this.userId = this.apiVersion === 'v2' ? (settings.userId || 'Scaroontop') : '';
        this.shapeUsername = settings.shapeUsername || 'star-tr15';
        this.channelId = settings.channelId || this.generateChannelId();
        
        this.elements.apiVersionSelect.value = this.apiVersion;
        this.elements.userIdInput.value = this.userId;
        this.elements.shapeUsernameInput.value = this.shapeUsername;
        this.elements.channelIdInput.value = this.channelId;
        
        this.updateShapeProfile(this.shapeUsername);
        this.updateUsernameField();
    }

    saveSettings() {
        const settings = {
            apiVersion: this.elements.apiVersionSelect.value,
            userId: this.elements.userIdInput.value,
            shapeUsername: this.elements.shapeUsernameInput.value,
            channelId: this.elements.channelIdInput.value,
            apiKey: this.encryptApiKey(this.elements.apiKeyInput.value)
        };
        localStorage.setItem('chatSettings', JSON.stringify(settings));
    }

    addMessageToChat(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.textContent = content;
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.shapesChat = new ShapesIncChat();
});

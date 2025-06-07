class ShapesIncChat {
constructor() {
    this.apiKey = 'HQUWJWT4072UVNCOGWYJ2HWPVL985JEEYZDNJ7CVH74';
    this.apiVersion = 'v2';
    this.userId = 'Scaroontop'; // Set default username to current user
    this.channelId = this.generateChannelId();
    this.shapeUsername = 'star-tr15';
    this.baseURL = 'https://api.shapes.inc/v1';
    
    this.initializeElements();
    this.attachEventListeners();
    this.loadSettings();
    this.updateUsernameField();
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

setupCommandButtons() {
    document.querySelectorAll('.command-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.getAttribute('data-command');
            this.elements.messageInput.value = command;
            this.sendMessage();
        });
    });
}

    initializeElements() {
        // Initialize all DOM elements
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
            regenerateChannelBtn: document.getElementById('regenerateChannel'),
            showCommandsBtn: document.getElementById('showCommands'),
            commandsPanel: document.querySelector('.commands-panel'),
            imageUploadBtn: document.getElementById('uploadImage'),
            audioUploadBtn: document.getElementById('uploadAudio'),
            saveBasicSettingsBtn: document.getElementById('saveBasicSettings'),
            customChannelBtn: document.getElementById('customChannel'),
            imageUploadInput: document.getElementById('imageUpload'),
            audioUploadInput: document.getElementById('audioUpload')
        };
    }

    attachEventListeners() {
        // Attach all event listeners
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        this.elements.showAdvancedBtn.addEventListener('click', () => {
            this.elements.advancedSettings.classList.toggle('hidden');
        });

        this.elements.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            location.reload();
        });

        this.elements.regenerateChannelBtn.addEventListener('click', () => {
            this.channelId = this.generateChannelId();
            this.elements.channelIdInput.value = this.channelId;
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

            this.elements.apiVersionSelect.addEventListener('change', () => {
        this.apiVersion = this.elements.apiVersionSelect.value;
        this.updateUsernameField();
    });

    this.elements.saveBasicSettingsBtn.addEventListener('click', () => {
        this.saveSettings();
        location.reload();
    });

    this.elements.customChannelBtn.addEventListener('click', () => {
        const customId = prompt('Enter custom channel ID:');
        if (customId && customId.trim()) {
            this.channelId = customId.trim();
            this.elements.channelIdInput.value = this.channelId;
        }
    });

            this.setupCommandButtons();


        this.elements.audioUploadInput.addEventListener('change', (e) => {
            this.handleFileUpload(e, 'audio');
        });
    }

    generateChannelId() {
        return 'channel_' + Math.random().toString(36).substr(2, 9);
    }

    encryptApiKey(apiKey) {
        return CryptoJS.SHA256(apiKey).toString();
    }

loadSettings() {
    const settings = JSON.parse(localStorage.getItem('chatSettings')) || {};
    this.apiVersion = settings.apiVersion || 'v2';
    this.userId = this.apiVersion === 'v2' ? (settings.userId || 'Scaroontop') : '';
    this.shapeUsername = settings.shapeUsername || 'star-tr15';
    this.channelId = settings.channelId || this.generateChannelId();
    
    // Update UI
    this.elements.apiVersionSelect.value = this.apiVersion;
    this.elements.userIdInput.value = this.userId;
    this.elements.shapeUsernameInput.value = this.shapeUsername;
    this.elements.channelIdInput.value = this.channelId;
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

    async sendMessage() {
        const messageText = this.elements.messageInput.value.trim();
        if (!messageText) return;

        // Add user message to chat
        this.addMessageToChat('user', messageText);
        this.elements.messageInput.value = '';

        try {
            const response = await this.makeApiRequest(messageText);
            const botResponse = response.choices[0].message.content;
            this.addMessageToChat('bot', botResponse);
        } catch (error) {
            this.addMessageToChat('bot', 'Sorry, there was an error processing your message.');
            console.error('API Error:', error);
        }
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
            // Here you would typically upload the file to your server or a file hosting service
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

            // Add file preview to chat
            this.addMessageToChat('user', `Uploaded ${type}: ${file.name}`);
            
            // Make API request with file URL
            const response = await this.makeApiRequestWithMedia(content);
            const botResponse = response.choices[0].message.content;
            this.addMessageToChat('bot', botResponse);
        } catch (error) {
            this.addMessageToChat('bot', `Sorry, there was an error processing your ${type}.`);
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

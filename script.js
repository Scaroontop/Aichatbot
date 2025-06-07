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
        this.rateLimitDelay = 1000;
        this.currentShape = null;
        
        this.initializeElements();
        this.loadSettings();
        this.attachEventListeners();
        this.updateUsernameField();
        this.fetchAndDisplayShapeInfo(this.shapeUsername);
    }

    initializeElements() {
        this.elements = {};
        const elements = [
            'messageInput', 'sendMessage', 'chatMessages', 'apiVersion',
            'userId', 'shapeUsername', 'channelId', 'apiKey', 'showAdvanced',
            'advancedSettings', 'saveSettings', 'saveBasicSettings',
            'regenerateChannel', 'customChannel', 'showCommands',
            'commandsPanel', 'uploadImage', 'uploadAudio', 'imageUpload',
            'audioUpload', 'typingIndicator', 'toggleAdvancedInfo',
            'advancedInfo', 'shapeProfile'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.error(`Element with id "${id}" not found`);
            }
        });

        // Add class-based selectors
        this.elements.advancedSettings = document.querySelector('.advanced-settings');
        this.elements.commandsPanel = document.querySelector('.commands-panel');
        this.elements.typingIndicator = document.querySelector('.typing-indicator');
        this.elements.advancedInfo = document.querySelector('.advanced-info');
        this.elements.shapeProfile = document.querySelector('.shape-profile');
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

        try {
            const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
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
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async fetchAndDisplayShapeInfo(username) {
        try {
            const response = await fetch(`${this.baseURL}/shapes/public/${username}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch shape info: ${response.status}`);
            }
            
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

        const updateElement = (id, value, defaultValue = 'N/A') => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || defaultValue;
            }
        };

        // Update basic info
        const avatarElement = document.getElementById('shapeAvatar');
        if (avatarElement) {
            avatarElement.src = profile.avatar_url || profile.avatar;
            avatarElement.onerror = () => {
                avatarElement.src = 'default-avatar.png'; // Add a default avatar image
            };
        }

        updateElement('shapeName', profile.name);
        updateElement('shapeDescription', profile.search_description);
        updateElement('userCount', `👤 ${profile.user_count?.toLocaleString() || 0} users`);
        updateElement('messageCount', `💬 ${profile.message_count?.toLocaleString() || 0} messages`);

        // Update tags
        const tagsContainer = document.getElementById('shapeTags');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
            if (profile.search_tags_v2?.length > 0) {
                profile.search_tags_v2.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag';
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
            }
        }

        // Update advanced information
        updateElement('shapeTagline', profile.tagline);
        updateElement('shapeUniverse', profile.character_universe);
        updateElement('shapeBackground', profile.character_background);
        updateElement('shapeStatus', profile.shape_settings?.status);
        updateElement('shapeInitialMessage', profile.shape_settings?.shape_initial_message);

        // Update example prompts
        const promptsContainer = document.getElementById('shapePrompts');
        if (promptsContainer) {
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
    }

    attachEventListeners() {
        // Message sending
        const sendButton = this.elements.sendMessage;
        const messageInput = this.elements.messageInput;

        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Settings related events
        if (this.elements.apiVersion) {
            this.elements.apiVersion.addEventListener('change', () => {
                this.apiVersion = this.elements.apiVersion.value;
                this.updateUsernameField();
            });
        }

        if (this.elements.saveBasicSettings) {
            this.elements.saveBasicSettings.addEventListener('click', () => {
                try {
                    this.saveSettings();
                    this.showSuccess('Settings saved successfully');
                } catch (error) {
                    this.showError(error.message);
                }
            });
        }

        // Command buttons
        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.getAttribute('data-command');
                if (command === '!imagine') {
                    this.elements.messageInput.value = command + ' ';
                    this.elements.messageInput.focus();
                } else {
                    this.elements.messageInput.value = command;
                    this.sendMessage();
                }
                if (this.elements.commandsPanel) {
                    this.elements.commandsPanel.classList.add('hidden');
                }
            });
        });

        // Shape username change
        if (this.elements.shapeUsername) {
            this.elements.shapeUsername.addEventListener('change', () => {
                const newShapeUsername = this.elements.shapeUsername.value;
                if (newShapeUsername) {
                    this.shapeUsername = newShapeUsername;
                    this.fetchAndDisplayShapeInfo(this.shapeUsername);
                }
            });
        }

        // Other event listeners...
        this.attachRemainingEventListeners();
    }

    attachRemainingEventListeners() {
        // Add remaining event listeners here
        // This helps break up the method for readability
        if (this.elements.showCommands) {
            this.elements.showCommands.addEventListener('click', () => {
                if (this.elements.commandsPanel) {
                    this.elements.commandsPanel.classList.toggle('hidden');
                }
            });
        }

        if (this.elements.toggleAdvancedInfo) {
            this.elements.toggleAdvancedInfo.addEventListener('click', () => {
                if (this.elements.advancedInfo) {
                    const isHidden = this.elements.advancedInfo.classList.contains('hidden');
                    this.elements.advancedInfo.classList.toggle('hidden');
                    this.elements.toggleAdvancedInfo.textContent = 
                        isHidden ? 'Hide Advanced Information' : 'Show Advanced Information';
                }
            });
        }
    }

    async sendMessage() {
        const messageInput = this.elements.messageInput;
        if (!messageInput) return;

        const messageText = messageInput.value.trim();
        if (!messageText) return;

        const sanitizedMessage = this.sanitizeInput(messageText);
        this.addMessageToChat('user', sanitizedMessage);
        messageInput.value = '';
        this.showTypingIndicator();

        try {
            const response = await this.makeApiRequest(sanitizedMessage);
            this.hideTypingIndicator();
            if (response.choices && response.choices[0]) {
                const botResponse = response.choices[0].message.content;
                this.addMessageToChat('bot', botResponse);
                
                // Update shape info after successful message
                await this.fetchAndDisplayShapeInfo(this.shapeUsername);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.showError('Failed to get response from the API');
            console.error('API Error:', error);
        }
    }

    addMessageToChat(role, content) {
        const chatMessages = this.elements.chatMessages;
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        // Handle image URLs
        const imageUrlRegex = /https:\/\/files\.shapes\.inc\/.*\.(png|jpg|jpeg|gif)/i;
        const imageUrl = content.match(imageUrlRegex);

        if (imageUrl) {
            const textContent = content.replace(imageUrl[0], '').trim();
            if (textContent) {
                const textNode = document.createElement('p');
                textNode.textContent = textContent;
                messageDiv.appendChild(textNode);
            }

            const img = document.createElement('img');
            img.src = imageUrl[0];
            img.alt = 'Shape generated image';
            img.loading = 'lazy';
            img.onerror = () => {
                img.style.display = 'none';
                const errorText = document.createElement('p');
                errorText.textContent = '(Image failed to load)';
                errorText.className = 'error-text';
                messageDiv.appendChild(errorText);
            };
            messageDiv.appendChild(img);
        } else {
            messageDiv.textContent = content;
        }

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // Utility methods
    generateChannelId() {
        return 'channel_' + Math.random().toString(36).substr(2, 9);
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    showTypingIndicator() {
        if (this.elements.typingIndicator) {
            this.elements.typingIndicator.classList.remove('hidden');
            this.elements.typingIndicator.classList.add('visible');
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        if (this.elements.typingIndicator) {
            this.elements.typingIndicator.classList.remove('visible');
            setTimeout(() => {
                this.elements.typingIndicator.classList.add('hidden');
            }, 300);
        }
    }

    scrollToBottom() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        if (this.elements.chatMessages) {
            this.elements.chatMessages.appendChild(errorDiv);
            this.scrollToBottom();
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        if (this.elements.chatMessages) {
            this.elements.chatMessages.appendChild(successDiv);
            this.scrollToBottom();
            setTimeout(() => successDiv.remove(), 5000);
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('chatSettings')) || {};
            this.apiVersion = settings.apiVersion || 'v2';
            this.userId = this.apiVersion === 'v2' ? (settings.userId || 'Scaroontop') : '';
            this.shapeUsername = settings.shapeUsername || 'Star-tr15';
            this.channelId = settings.channelId || this.generateChannelId();
            
            // Update UI elements
            if (this.elements.apiVersion) this.elements.apiVersion.value = this.apiVersion;
            if (this.elements.userId) this.elements.userId.value = this.userId;
            if (this.elements.shapeUsername) this.elements.shapeUsername.value = this.shapeUsername;
            if (this.elements.channelId) this.elements.channelId.value = this.channelId;
            
            this.updateUsernameField();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showError('Failed to load settings');
        }
    }

    saveSettings() {
        try {
            if (this.apiVersion === 'v1' && this.elements.userId?.value.trim()) {
                throw new Error('Username cannot be set in V1 mode');
            }

            const settings = {
                apiVersion: this.elements.apiVersion?.value || 'v2',
                userId: this.apiVersion === 'v2' ? this.elements.userId?.value : '',
                shapeUsername: this.elements.shapeUsername?.value || 'Star-tr15',
                channelId: this.elements.channelId?.value || this.generateChannelId()
            };

            localStorage.setItem('chatSettings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError(error.message || 'Failed to save settings');
            return false;
        }
    }

    updateUsernameField() {
        if (!this.elements.userId) return;

        const usernameSettings = this.elements.userId.parentElement;
        if (this.apiVersion === 'v1') {
            usernameSettings?.classList.add('disabled');
            this.elements.userId.value = '';
            this.userId = '';
            this.elements.userId.disabled = true;
        } else {
            usernameSettings?.classList.remove('disabled');
            this.elements.userId.value = this.userId;
            this.elements.userId.disabled = false;
        }
    }
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.shapesChat = new ShapesIncChat();
});

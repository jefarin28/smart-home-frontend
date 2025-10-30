// Update this to your deployed backend URL
const API_URL = 'http://localhost:5000';
const socket = io(API_URL);

// Connect to backend via WebSocket
socket.on('connect', () => {
    console.log('Connected to backend');
    showMessage('Connected to server', 'success');
});

socket.on('disconnect', () => {
    console.log('Disconnected from backend');
});

socket.on('command_result', (data) => {
    console.log('Command result:', data);
    const statusDiv = document.getElementById('voice-status');
    if (data.status === 'success') {
        statusDiv.innerHTML = '<p style="color: green;">? ' + data.message + '</p>';
    } else {
        statusDiv.innerHTML = '<p style="color: red;">? ' + data.message + '</p>';
    }
    updateDeviceStatus();
});

async function sendCommand(command) {
    const messageDiv = document.getElementById('message');
    try {
        const response = await fetch(\\/command\, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: command, params: {} })
        });
        
        const data = await response.json();
        showMessage(data.message, data.status === 'success' ? 'success' : 'error');
        updateDeviceStatus();
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error:', error);
    }
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const messagesDiv = document.getElementById('chat-messages');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Display user message
    addChatMessage(message, 'user');
    input.value = '';
    
    try {
        const response = await fetch(\\/chat\, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        addChatMessage(data.message, 'ai');
    } catch (error) {
        addChatMessage('Error: ' + error.message, 'ai');
    }
}

function addChatMessage(text, sender) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message ' + sender;
    messageEl.textContent = text;
    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendChat();
    }
}

function startVoiceControl() {
    const btn = document.getElementById('voice-btn');
    const statusDiv = document.getElementById('voice-status');
    
    btn.disabled = true;
    btn.textContent = 'Listening...';
    statusDiv.className = 'voice-status listening';
    statusDiv.innerHTML = '<p>?? Listening...</p>';
    
    // Emit voice control event to backend
    socket.emit('listen_now');
    
    // Timeout after 5 seconds
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Start Listening';
        statusDiv.className = 'voice-status';
        statusDiv.innerHTML = '';
    }, 5000);
}

async function updateDeviceStatus() {
    try {
        const response = await fetch(\\/health\);
        const data = await response.json();
        const devices = data.devices;
        
        document.getElementById('light-status').textContent = devices.light.toUpperCase();
        document.getElementById('fan-status').textContent = devices.fan.toUpperCase();
        document.getElementById('music-status').textContent = devices.music.toUpperCase();
        document.getElementById('door-status').textContent = devices.front_door.toUpperCase();
        document.getElementById('temp-status').textContent = devices.ac_temp + '°C';
    } catch (error) {
        console.error('Error updating device status:', error);
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    
    setTimeout(() => {
        messageDiv.className = 'message';
    }, 3000);
}

// Update device status on page load
window.addEventListener('load', () => {
    updateDeviceStatus();
    setInterval(updateDeviceStatus, 5000);
});
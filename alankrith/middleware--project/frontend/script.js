// IVR System Frontend JavaScript

let currentSessionId = generateSessionId();
const API_BASE = 'http://localhost:3000';

// Text-to-Speech settings
let speechEnabled = true;
let speechSynthesis = window.speechSynthesis;
let selectedFemaleVoice = null;

// Initialize voices when page loads
function initializeVoices() {
    if (speechSynthesis) {
        // Load voices and select a female voice
        const voices = speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            // Voices not loaded yet, wait for them
            speechSynthesis.onvoiceschanged = function() {
                selectFemaleVoice();
            };
        } else {
            selectFemaleVoice();
        }
    }
}

function selectFemaleVoice() {
    const voices = speechSynthesis.getVoices();
    
    const preferredFemaleVoices = [
        'Microsoft Zira Desktop - English (United States)',
        'Microsoft Hazel Desktop - English (Great Britain)', 
        'Google UK English Female',
        'Google US English Female',
        'Microsoft Ana - English (United States)',
        'Microsoft Eva - English (United States)',
        'Microsoft Aria Online (Natural) - English (United States)',
        'Microsoft Jenny Online (Natural) - English (United States)'
    ];
    
    for (const voiceName of preferredFemaleVoices) {
        selectedFemaleVoice = voices.find(voice => voice.name === voiceName);
        if (selectedFemaleVoice) {
            console.log('Selected female voice:', selectedFemaleVoice.name);
            return;
        }
    }
    
    selectedFemaleVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('zira') ||
         voice.name.toLowerCase().includes('hazel') ||
         voice.name.toLowerCase().includes('ana') ||
         voice.name.toLowerCase().includes('eva') ||
         voice.name.toLowerCase().includes('aria') ||
         voice.name.toLowerCase().includes('jenny'))
    );
    
    if (!selectedFemaleVoice) {
        selectedFemaleVoice = voices.find(voice => voice.lang.includes('en'));
    }
    
    if (selectedFemaleVoice) {
        console.log('✅ Selected voice:', selectedFemaleVoice.name);
        setTimeout(() => showAvailableVoices(), 1000);
    } else {
        console.log('❌ No suitable voice found, will use default');
        setTimeout(() => showAvailableVoices(), 1000);
    }
}

function generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function speakResponse(text) {
    if (!speechEnabled || !speechSynthesis) {
        console.log('Text-to-speech is disabled or not supported');
        return;
    }

    speechSynthesis.cancel();
    
    let cleanText = text
        .replace(/🎤.*?:/g, '')
        .replace(/📋.*?:/g, '') 
        .replace(/[🎤📋✅❌⏳📡🔴]/g, '')
        .replace(/\n+/g, ' ') 
        .trim();
    
    const responseMatch = cleanText.match(/Response:\s*(.+)/i);
    if (responseMatch) {
        cleanText = responseMatch[1].trim();
    }
    
    if (cleanText) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const voices = speechSynthesis.getVoices();
        const ariaVoice = voices.find(voice => voice.name.includes('Microsoft Aria'));
        if (ariaVoice) utterance.voice = ariaVoice;
        
        utterance.onstart = function() {
            console.log('Started speaking response');
            updateVoiceStatus('🔊 Speaking response...', 'speaking');
        };
        
        utterance.onend = function() {
            console.log('Finished speaking response');
            updateVoiceStatus('', '');
        };
        
        utterance.onerror = function(event) {
            console.error('Speech synthesis error:', event);
            updateVoiceStatus('', '');
        };
        
        speechSynthesis.speak(utterance);
    }
}

function toggleSpeech() {
    speechEnabled = !speechEnabled;
    const speechToggle = document.getElementById('speechToggle');
    if (speechToggle) {
        speechToggle.textContent = speechEnabled ? '🔊' : '🔇';
        speechToggle.title = speechEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech';
    }
    console.log('Text-to-speech', speechEnabled ? 'enabled' : 'disabled');
}

function showAvailableVoices() {
    const voices = speechSynthesis.getVoices();
    console.log('🎤 All available voices:');
    voices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.gender || 'unknown gender'}`);
    });
    
    if (selectedFemaleVoice) {
        console.log('🎤 Currently selected voice:', selectedFemaleVoice.name);
    } else {
        console.log('🎤 No voice specifically selected, using system default');
    }
}

function updateSessionDisplay() {
    document.getElementById('sessionId').textContent = `Session: ${currentSessionId.split('-')[1]}`;
}

function setStatus(status, message) {
    const statusElement = document.getElementById('status');
    statusElement.className = `status ${status}`;
    switch(status) {
        case 'ready':
            statusElement.textContent = 'Ready';
            break;
        case 'processing':
            statusElement.textContent = ''; 
            break;
        case 'error':
            statusElement.textContent = 'Error';
            break;
    }
}

function updateResponse(message, isError = false) {
    const responseElement = document.getElementById('response');
    responseElement.textContent = message;
    responseElement.className = isError ? 'response error' : 'response';
}

// IVR Dialpad Functionality
async function callIVR(digit) {
    const button = document.querySelector(`[data-digit="${digit}"]`);
    
    // Visual feedback
    if (button) {
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 200);
    }

    setStatus('processing');
    updateResponse('Processing your request...', false);

    try {
        const response = await fetch(`${API_BASE}/ivr/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: currentSessionId,
                digit: digit
            })
        });

        const data = await response.json();

        if (response.ok) {
            setStatus('ready');
            updateResponse(data.response, false);
        } else {
            setStatus('error');
            updateResponse(data.error || 'An error occurred', true);
        }
    } catch (error) {
        setStatus('error');
        updateResponse(`Connection error: ${error.message}. Make sure the server is running on localhost:3000`, true);
    }
}

// Voice Recognition Variables
let isRecording = false;
let recognition = null;
let recordingTimeout = null;

// Initialize Speech Recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            console.log('Voice recognition started');
            updateVoiceStatus('🎤 Listening... Speak now!', 'recording');
        };

        recognition.onresult = function(event) {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            console.log('Speech recognized:', transcript);
            
            // Stop recording and process the speech
            stopRecording();
            processSpeechCommand(transcript);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            stopRecording();
            updateVoiceStatus('❌ Speech recognition error. Try again.', 'error');
            setTimeout(() => updateVoiceStatus('', ''), 3000);
        };

        recognition.onend = function() {
            console.log('Voice recognition ended');
            if (isRecording) {
                // If we're still supposed to be recording, restart
                recognition.start();
            }
        };
    }
}

// Voice Recognition Controls
function toggleVoiceRecording() {
    if (!recognition) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    isRecording = true;
    updateVoiceButton('recording');
    updateVoiceStatus('🎤 Listening... Speak now!', 'recording');
    
    try {
        recognition.start();
        
        recordingTimeout = setTimeout(() => {
            if (isRecording) {
                recognition.stop();
                updateVoiceStatus('⏳ Processing...', 'processing');
                
                setTimeout(() => {
                    stopRecording();
                    updateVoiceStatus('⏰ No speech detected. Try again.', 'error');
                    setTimeout(() => updateVoiceStatus('', ''), 2000);
                }, 2000);
            }
        }, 8000);
        
    } catch (error) {
        console.error('Error starting recognition:', error);
        stopRecording();
        updateVoiceStatus('❌ Could not start recording. Try again.', 'error');
        setTimeout(() => updateVoiceStatus('', ''), 3000);
    }
}

function stopRecording() {
    isRecording = false;
    updateVoiceButton('idle');
    
    if (recognition) {
        recognition.stop();
    }
    
    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
}

// Voice UI Updates
function updateVoiceButton(state) {
    const voiceButton = document.getElementById('voiceButton');
    const voiceIcon = document.getElementById('voiceIcon');
    const voiceLabel = document.getElementById('voiceLabel');
    
    voiceButton.className = 'voice-button';
    
    switch(state) {
        case 'recording':
            voiceButton.classList.add('recording');
            voiceIcon.textContent = '🔴';
            voiceLabel.textContent = 'Recording...';
            break;
        case 'processing':
            voiceButton.classList.add('processing');
            voiceIcon.textContent = '⏳';
            voiceLabel.textContent = ''; // Remove text, show only animation
            break;
        default:
            voiceIcon.textContent = '🎤';
            voiceLabel.textContent = 'Voice Command';
    }
}

function updateVoiceStatus(message, className = '') {
    const voiceStatus = document.getElementById('voiceStatus');
    voiceStatus.textContent = message;
    voiceStatus.className = `voice-status ${className}`;
}

// Speech Processing
async function processSpeechCommand(transcript) {
    updateVoiceButton('processing');
    updateVoiceStatus('📡 Processing your request...', 'processing');
    
    try {
        const response = await fetch(`${API_BASE}/conversation/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: currentSessionId,
                query: transcript
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update display with the response
        const responseText = data.message || data.response || 'No response received';
        const fullResponse = `🎤 You said: "${transcript}"\n\n📋 Response: ${responseText}`;
        
        setStatus('ready');
        updateResponse(fullResponse, false);
        updateVoiceStatus('✅ Voice command processed successfully!', 'success');
        
        // Speak the response automatically after voice input
        setTimeout(() => {
            speakResponse(responseText);
        }, 500); // Small delay to let the success message show first
        
        setTimeout(() => updateVoiceStatus('', ''), 2000);
        
    } catch (error) {
        console.error('Voice command error:', error);
        setStatus('error');
        updateResponse(`🎤 You said: "${transcript}"\n\n❌ Error: ${error.message}`, true);
        updateVoiceStatus('❌ Failed to process voice command', 'error');
        setTimeout(() => updateVoiceStatus('', ''), 2000);
    } finally {
        updateVoiceButton('idle');
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    updateSessionDisplay();
    initializeSpeechRecognition();
    initializeVoices(); // Initialize text-to-speech voices
    
    const dialButtons = document.querySelectorAll('.dial-button');
    dialButtons.forEach(button => {
        const digit = button.getAttribute('data-digit');
        button.addEventListener('click', () => callIVR(digit));
    });

    document.addEventListener('keydown', function(event) {
        const digit = event.key;
        if (digit >= '1' && digit <= '9') {
            callIVR(digit);
        }
    });
});

// Auto-refresh session every 5 minutes
setInterval(() => {
    currentSessionId = generateSessionId();
    updateSessionDisplay();
}, 5 * 60 * 1000);

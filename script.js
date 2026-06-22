// ================================================================
// API KEY (Replace with your own)
// This will be made private at the end of the project
// ================================================================
const GEMINI_API_KEY = 'API-KEY HERE'; // <-- Paste your key here

// ----- Keyboard state (prevent repeat triggers) -----
let keyPressed1 = false;
let keyPressed2 = false;

// ================================================================
// SCRIPT.JS - Minimalist AI Translator
// ================================================================

console.log('AI Translator loaded!');
console.log(`API Key set: ${GEMINI_API_KEY ? 'Yes' : 'Missing!'}`);

// ----- DOM References -----
const speakBtn1 = document.getElementById('speakBtn1');
const speakBtn2 = document.getElementById('speakBtn2');
const status1 = document.getElementById('status1');
const status2 = document.getElementById('status2');
const translationText1 = document.getElementById('translationText1');
const translationText2 = document.getElementById('translationText2');
const lang1 = document.getElementById('lang1');
const lang2 = document.getElementById('lang2');

// ----- State -----
let currentState = 'idle';

// ----- Helper: Update UI -----
function setStatus(speaker, state) {
    const statusEl = speaker === 1 ? status1 : status2;
    const btn = speaker === 1 ? speakBtn1 : speakBtn2;
    const textEl = speaker === 1 ? translationText1 : translationText2;

    statusEl.className = 'status-indicator';
    btn.className = 'speak-btn';
    textEl.className = 'translation-text';

    switch (state) {
        case 'ready':
            statusEl.classList.add('status-ready');
            textEl.classList.add('idle');
            textEl.textContent = 'Tap 🔴 to speak';
            btn.disabled = false;
            break;
        case 'listening':
            statusEl.classList.add('status-listening');
            btn.classList.add('listening');
            textEl.classList.add('listening');
            textEl.textContent = 'Listening...';
            btn.disabled = false;
            break;
        case 'translating':
            statusEl.classList.add('status-translating');
            btn.classList.add('translating');
            textEl.classList.add('translating');
            textEl.textContent = 'Translating...';
            btn.disabled = true;
            break;
        case 'disabled':
            statusEl.classList.add('status-disabled');
            btn.disabled = true;
            break;
        default:
            statusEl.classList.add('status-ready');
            textEl.classList.add('idle');
            textEl.textContent = 'Tap 🔴 to speak';
            btn.disabled = false;
    }
}

// ----- Button events (with real speech recognition) -----
function setupButton(btn, speaker) {
    const name = speaker === 1 ? 'Speaker 1' : 'Speaker 2';

    // ----- Mouse events (desktop) -----
    btn.addEventListener('mousedown', () => {
        console.log(`${name}: Button pressed (mouse)`);
        // Disable other button
        const otherBtn = speaker === 1 ? speakBtn2 : speakBtn1;
        otherBtn.disabled = true;
        setStatus(speaker, 'listening');
        setStatus(speaker === 1 ? 2 : 1, 'disabled');
        // Start real speech recognition
        startListening(speaker);
    });

    btn.addEventListener('mouseup', () => {
        console.log(`${name}: Button released (mouse)`);
        setStatus(speaker, 'translating');
        // Stop speech recognition
        stopListening(speaker);
    });

    // ----- Touch events (mobile) -----
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log(`${name}: Button pressed (touch)`);
        // Disable other button
        const otherBtn = speaker === 1 ? speakBtn2 : speakBtn1;
        otherBtn.disabled = true;
        setStatus(speaker, 'listening');
        setStatus(speaker === 1 ? 2 : 1, 'disabled');
        // Start real speech recognition
        startListening(speaker);
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        console.log(`${name}: Button released (touch)`);
        setStatus(speaker, 'translating');
        // Stop speech recognition
        stopListening(speaker);
    });
}

setupButton(speakBtn1, 1);
setupButton(speakBtn2, 2);

// ----- Keyboard shortcuts (desktop) with repeat protection -----
document.addEventListener('keydown', (e) => {
    // Speaker 1 (Bottom) → P key
    if ((e.key === 'p' || e.key === 'P') && !keyPressed1) {
        keyPressed1 = true;
        e.preventDefault(); // Prevent default browser behavior
        
        console.log('Speaker 1: P pressed');
        speakBtn2.disabled = true;
        setStatus(1, 'listening');
        setStatus(2, 'disabled');
        startListening(1);
    }
    
    // Speaker 2 (Top) → Q key
    if ((e.key === 'q' || e.key === 'Q') && !keyPressed2) {
        keyPressed2 = true;
        e.preventDefault();
        
        console.log('Speaker 2: Q pressed');
        speakBtn1.disabled = true;
        setStatus(2, 'listening');
        setStatus(1, 'disabled');
        startListening(2);
    }
});

document.addEventListener('keyup', (e) => {
    // Speaker 1 (Bottom) → P key
    if (e.key === 'p' || e.key === 'P') {
        keyPressed1 = false;
        e.preventDefault();
        
        console.log('Speaker 1: P released');
        if (isListening1) {
            setStatus(1, 'translating');
            stopListening(1);
        }
    }
    
    // Speaker 2 (Top) → Q key
    if (e.key === 'q' || e.key === 'Q') {
        keyPressed2 = false;
        e.preventDefault();
        
        console.log('⌨Speaker 2: Q released');
        if (isListening2) {
            setStatus(2, 'translating');
            stopListening(2);
        }
    }
});

// ----- Language change logging -----
lang1.addEventListener('change', () => {
    console.log(`Speaker 1 language changed to: ${lang1.value}`);
});

lang2.addEventListener('change', () => {
    console.log(`Speaker 2 language changed to: ${lang2.value}`);
});

// ================================================================
// 🚧 PLACEHOLDER FUNCTIONS FOR CM TO IMPLEMENT
// ================================================================

// ================================================================
// 🎤 WEB SPEECH API - Real Speech Recognition
// ================================================================

// Store recognition instances for each speaker
let recognition1 = null;
let recognition2 = null;
let finalTranscript1 = '';
let finalTranscript2 = '';

/**
 * Starts speech recognition for a given speaker
 * @param {number} speaker - 1 or 2
 */
function startListening(speaker) {
    console.log(`Starting speech recognition for Speaker ${speaker}`);
    
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition. Please use Chrome on Android or Desktop.');
        return;
    }
    
    // Create recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Set language from dropdown
    const lang = speaker === 1 ? lang1.value : lang2.value;
    recognition.lang = lang;
    
    // Configure
    recognition.interimResults = true;  // Show text while speaking
    recognition.continuous = false;     // Stop after one sentence
    recognition.maxAlternatives = 1;
    
    // Store the instance
    if (speaker === 1) {
        recognition1 = recognition;
        finalTranscript1 = '';
    } else {
        recognition2 = recognition;
        finalTranscript2 = '';
    }
    
    // ----- Event: onresult (speech detected) -----
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update UI with interim text (show on speaker's own side)
        const textEl = speaker === 1 ? translationText1 : translationText2;
        if (finalTranscript) {
            // Store final for later
            if (speaker === 1) {
                finalTranscript1 = finalTranscript;
            } else {
                finalTranscript2 = finalTranscript;
            }
            textEl.textContent = `${finalTranscript}`;
            textEl.style.color = '#88ff88';
        } else if (interimTranscript) {
            // Show interim with different style
            textEl.textContent = `${interimTranscript}`;
            textEl.style.color = '#ffcc44';
        }
    };
    
    // ----- Event: onerror (something went wrong) -----
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        const textEl = speaker === 1 ? translationText1 : translationText2;
        textEl.textContent = `Error: ${event.error}`;
        textEl.style.color = '#ff4444';
        
        // Reset after 2 seconds
        setTimeout(() => {
            setStatus(speaker, 'ready');
            setStatus(speaker === 1 ? 2 : 1, 'ready');
            const otherBtn = speaker === 1 ? speakBtn2 : speakBtn1;
            otherBtn.disabled = false;
        }, 2000);
    };
    
    // ----- Event: onend (recognition stopped) -----
    recognition.onend = () => {
        console.log(`Speech recognition ended for Speaker ${speaker}`);
        
        // If we have a final transcript, send it for translation
        const finalText = speaker === 1 ? finalTranscript1 : finalTranscript2;
        if (finalText && finalText.trim().length > 0) {
            console.log(`Final text: "${finalText}"`);
            // Translate it!
            const sourceLang = speaker === 1 ? lang1.value : lang2.value;
            const targetLang = speaker === 1 ? lang2.value : lang1.value;
            translateWithGemini(finalText, sourceLang, targetLang, speaker);
        } else {
            // No speech detected
            const textEl = speaker === 1 ? translationText1 : translationText2;
            textEl.textContent = 'No speech detected';
            textEl.style.color = '#ff6666';
            setTimeout(() => {
                setStatus(speaker, 'ready');
                setStatus(speaker === 1 ? 2 : 1, 'ready');
                const otherBtn = speaker === 1 ? speakBtn2 : speakBtn1;
                otherBtn.disabled = false;
            }, 1500);
        }
    };
    
    // Start listening
    try {
        recognition.start();
        console.log('Listening...');
    } catch (error) {
        console.error('Error starting recognition:', error);
    }
}

/**
 * Stops speech recognition for a given speaker
 * @param {number} speaker - 1 or 2
 */
function stopListening(speaker) {
    console.log(`Stopping speech recognition for Speaker ${speaker}`);
    const recognition = speaker === 1 ? recognition1 : recognition2;
    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
}

/**
 * Translates text using Gemini API
 * @param {string} text - The text to translate
 * @param {string} sourceLang - Source language code (e.g., 'en')
 * @param {string} targetLang - Target language code (e.g., 'es')
 * @param {number} speaker - The speaker who is speaking (1 or 2)
 */
async function translateWithGemini(text, sourceLang, targetLang, speaker) {
    console.log(`Translating "${text}" from ${sourceLang} to ${targetLang}`);
    
    // TODO: Implement Gemini API call using GEMINI_API_KEY
    // For now, simulate translation
    const targetSpeaker = speaker === 1 ? 2 : 1;
    const textEl = targetSpeaker === 1 ? translationText1 : translationText2;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Demo translation (just add a prefix)
    const demoTranslation = `[${targetLang}] ${text}`;
    textEl.textContent = demoTranslation;
    textEl.style.color = '#ffffff';
    
    // Reset status
    setStatus(speaker, 'ready');
    setStatus(targetSpeaker, 'ready');
    const otherBtn = speaker === 1 ? speakBtn2 : speakBtn1;
    otherBtn.disabled = false;
    
    // Store in conversation history (optional)
    console.log(`Translation complete: "${demoTranslation}"`);
}

function displayTranslation(translation, targetSpeaker) {
    console.log(`Displaying "${translation}" for Speaker ${targetSpeaker}`);
    // TODO: Update translationText1 or translationText2
}

console.log('Placeholder functions ready:');
console.log('  - startListening(speaker)');
console.log('  - stopListening(speaker)');
console.log('  - translateWithGemini(text, from, to, speaker)');
console.log('  - displayTranslation(text, targetSpeaker)');

console.log('All event listeners attached. Ready to build!');
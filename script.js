// ================================================================
// AI TRANSLATOR — script.js
// Replace with your actual Groq API key (starts with gsk_)
// ================================================================
const GROQ_API_KEY = '';

// ================================================================
// DOM REFERENCES
// ================================================================
const speakBtn1    = document.getElementById('speakBtn1');
const speakBtn2    = document.getElementById('speakBtn2');
const status1      = document.getElementById('status1');
const status2      = document.getElementById('status2');
const translationText1 = document.getElementById('translationText1');
const translationText2 = document.getElementById('translationText2');
const lang1        = document.getElementById('lang1');
const lang2        = document.getElementById('lang2');

// ================================================================
// STATE MACHINE
// States: 'idle' | 'speaker1_speaking' | 'speaker1_translating'
//       | 'speaker2_speaking' | 'speaker2_translating'
// ================================================================
let appState = 'idle';

function setState(newState) {
    appState = newState;
    console.log(`[State] → ${newState}`);

    switch (newState) {
        case 'idle':
            setStatus(1, 'ready');
            setStatus(2, 'ready');
            break;
        case 'speaker1_speaking':
            setStatus(1, 'listening');
            setStatus(2, 'disabled');
            break;
        case 'speaker1_translating':
            setStatus(1, 'translating');
            setStatus(2, 'disabled');
            break;
        case 'speaker2_speaking':
            setStatus(1, 'disabled');
            setStatus(2, 'listening');
            break;
        case 'speaker2_translating':
            setStatus(1, 'disabled');
            setStatus(2, 'translating');
            break;
    }
}

// ================================================================
// CONVERSATION HISTORY
// ================================================================
const conversationHistory = [];
const MAX_HISTORY = 5;

function addToHistory(speaker, original, translation) {
    conversationHistory.push({ speaker, original, translation });
    if (conversationHistory.length > MAX_HISTORY) {
        conversationHistory.shift();
    }
}

function getHistoryContext() {
    if (conversationHistory.length === 0) return '';
    const last2 = conversationHistory.slice(-2);
    return last2.map(entry =>
        `Speaker ${entry.speaker}: "${entry.original}" → "${entry.translation}"`
    ).join('\n');
}

// ================================================================
// UI HELPERS
// ================================================================
function setStatus(speaker, state) {
    const statusEl = speaker === 1 ? status1 : status2;
    const btn      = speaker === 1 ? speakBtn1 : speakBtn2;

    statusEl.className = 'status-indicator';
    btn.className = 'speak-btn';

    switch (state) {
        case 'ready':
            statusEl.classList.add('status-ready');
            btn.disabled = false;
            break;
        case 'listening':
            statusEl.classList.add('status-listening');
            btn.classList.add('listening');
            btn.disabled = false;
            break;
        case 'translating':
            statusEl.classList.add('status-translating');
            btn.classList.add('translating');
            btn.disabled = true;
            break;
        case 'disabled':
            statusEl.classList.add('status-disabled');
            btn.disabled = true;
            break;
    }
}

function setDisplayText(speaker, text, style = 'normal') {
    const textEl = speaker === 1 ? translationText1 : translationText2;

    textEl.style.color = '';
    textEl.className = 'translation-text';

    switch (style) {
        case 'idle':        textEl.classList.add('idle');        break;
        case 'listening':   textEl.classList.add('listening');   break;
        case 'translating': textEl.classList.add('translating'); break;
        case 'interim':     textEl.style.color = '#ffcc44';      break;
        case 'final-own':   textEl.style.color = '#88ff88';      break;
        case 'error':       textEl.style.color = '#ff4444';      break;
    }

    textEl.textContent = text;
}

// ================================================================
// SPEECH RECOGNITION
// ================================================================
let recognition1 = null;
let recognition2 = null;
let finalTranscript1 = '';
let finalTranscript2 = '';
let isListening1 = false;
let isListening2 = false;

function startListening(speaker) {
    if (appState !== 'idle') {
        console.warn(`[startListening] Blocked — state is "${appState}"`);
        return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not supported. Please use Chrome on Android or Desktop.');
        return;
    }

    console.log(`[SR] Starting for Speaker ${speaker}`);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = speaker === 1 ? lang1.value : lang2.value;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    if (speaker === 1) {
        recognition1 = recognition;
        finalTranscript1 = '';
        isListening1 = true;
    } else {
        recognition2 = recognition;
        finalTranscript2 = '';
        isListening2 = true;
    }

    setState(speaker === 1 ? 'speaker1_speaking' : 'speaker2_speaking');
    setDisplayText(speaker, 'Listening...', 'listening');

    recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalText += t;
            } else {
                interimText += t;
            }
        }

        if (finalText) {
            if (speaker === 1) finalTranscript1 = finalText;
            else finalTranscript2 = finalText;
            setDisplayText(speaker, finalText, 'final-own');
        } else if (interimText) {
            setDisplayText(speaker, interimText, 'interim');
        }
    };

    recognition.onerror = (event) => {
        console.error(`[SR] Error for Speaker ${speaker}:`, event.error);

        if (speaker === 1) isListening1 = false;
        else isListening2 = false;

        let msg = 'Error. Try again.';
        if (event.error === 'not-allowed')  msg = 'Mic permission denied. Check browser settings.';
        else if (event.error === 'no-speech') msg = 'No speech detected.';
        else if (event.error === 'network')   msg = 'Network error. Check connection.';

        setDisplayText(speaker, msg, 'error');

        setTimeout(() => {
            setDisplayText(speaker, 'Tap 🔴 to speak', 'idle');
            setDisplayText(speaker === 1 ? 2 : 1, 'Tap 🔴 to speak', 'idle');
            setState('idle');
        }, 2500);
    };

    recognition.onend = () => {
        console.log(`[SR] Ended for Speaker ${speaker}`);

        if (speaker === 1) isListening1 = false;
        else isListening2 = false;

        const finalText = speaker === 1 ? finalTranscript1 : finalTranscript2;

        if (finalText && finalText.trim().length > 0) {
            setState(speaker === 1 ? 'speaker1_translating' : 'speaker2_translating');
            setDisplayText(speaker, finalText, 'final-own');

            const sourceLang = speaker === 1 ? lang1.value : lang2.value;
            const targetLang = speaker === 1 ? lang2.value : lang1.value;
            translateWithGemini(finalText.trim(), sourceLang, targetLang, speaker);
        } else {
            setDisplayText(speaker, 'No speech detected', 'error');
            setTimeout(() => {
                setDisplayText(speaker, 'Tap 🔴 to speak', 'idle');
                setState('idle');
            }, 1500);
        }
    };

    try {
        recognition.start();
    } catch (err) {
        console.error('[SR] Failed to start:', err);
        if (speaker === 1) isListening1 = false;
        else isListening2 = false;
        setState('idle');
    }
}

function stopListening(speaker) {
    const listening = speaker === 1 ? isListening1 : isListening2;
    if (!listening) {
        console.log(`[SR] stopListening(${speaker}) skipped — not active`);
        return;
    }

    const recognition = speaker === 1 ? recognition1 : recognition2;
    if (recognition) {
        try {
            recognition.stop();
            console.log(`[SR] Stopped for Speaker ${speaker}`);
        } catch (err) {
            console.error('[SR] Error stopping:', err);
        }
    }
}

// ================================================================
// TRANSLATION — GEMINI API
// ================================================================
async function translateWithGemini(text, sourceLang, targetLang, speaker) {
    const targetSpeaker = speaker === 1 ? 2 : 1;

    setDisplayText(targetSpeaker, 'Translating...', 'translating');

    const historyContext = getHistoryContext();
    const contextBlock = historyContext
        ? `Context from recent conversation:\n${historyContext}\n\n`
        : '';

    const prompt = `You are a professional interpreter. Translate the following text from ${sourceLang} to ${targetLang}.

IMPORTANT: Make the translation sound natural, conversational, and culturally appropriate. Do NOT translate word-for-word. Use idioms and expressions that a native speaker would actually use.

${contextBlock}New text to translate:
"${text}"

Return ONLY the translated text. No explanations, no quotes, no preamble — just the translation.`;

    try {
        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.3,
                    max_tokens: 512,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`API ${response.status}: ${errData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const translation = data?.choices?.[0]?.message?.content?.trim();

        if (!translation) {
            throw new Error('Empty response from Groq');
        }

        console.log(`[Groq] "${text}" → "${translation}"`);

        addToHistory(speaker, text, translation);
        displayTranslation(translation, targetSpeaker);
        setState('idle');

    } catch (err) {
        console.error('[Groq] Translation failed:', err);
        setDisplayText(targetSpeaker, 'Translation failed. Tap to retry.', 'error');
        setDisplayText(speaker, 'Tap 🔴 to speak', 'idle');
        setState('idle');
    }
}

function displayTranslation(translation, targetSpeaker) {
    setDisplayText(targetSpeaker, translation, 'translated');
}

// ================================================================
// BUTTON EVENT SETUP
// ================================================================
function setupButton(btn, speaker) {
    const label = `Speaker ${speaker}`;

    btn.addEventListener('mousedown', () => {
        if (appState !== 'idle') return;
        console.log(`[Btn] ${label} pressed (mouse)`);
        startListening(speaker);
    });

    btn.addEventListener('mouseup', () => {
        const activeState = speaker === 1 ? 'speaker1_speaking' : 'speaker2_speaking';
        if (appState !== activeState) return;
        console.log(`[Btn] ${label} released (mouse)`);
        stopListening(speaker);
    });

    btn.addEventListener('mouseleave', () => {
        const activeState = speaker === 1 ? 'speaker1_speaking' : 'speaker2_speaking';
        if (appState !== activeState) return;
        stopListening(speaker);
    });

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (appState !== 'idle') return;
        console.log(`[Btn] ${label} pressed (touch)`);
        startListening(speaker);
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        const activeState = speaker === 1 ? 'speaker1_speaking' : 'speaker2_speaking';
        if (appState !== activeState) return;
        console.log(`[Btn] ${label} released (touch)`);
        stopListening(speaker);
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        const activeState = speaker === 1 ? 'speaker1_speaking' : 'speaker2_speaking';
        if (appState !== activeState) return;
        stopListening(speaker);
    }, { passive: false });
}

setupButton(speakBtn1, 1);
setupButton(speakBtn2, 2);

// ================================================================
// KEYBOARD SHORTCUTS — P = Speaker 1, Q = Speaker 2
// ================================================================
let keyPressed_P = false;
let keyPressed_Q = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        if (keyPressed_P || appState !== 'idle') return;
        keyPressed_P = true;
        e.preventDefault();
        console.log('[Keys] P down → Speaker 1');
        startListening(1);
    }
    if (e.key === 'q' || e.key === 'Q') {
        if (keyPressed_Q || appState !== 'idle') return;
        keyPressed_Q = true;
        e.preventDefault();
        console.log('[Keys] Q down → Speaker 2');
        startListening(2);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        keyPressed_P = false;
        e.preventDefault();
        if (appState === 'speaker1_speaking') stopListening(1);
    }
    if (e.key === 'q' || e.key === 'Q') {
        keyPressed_Q = false;
        e.preventDefault();
        if (appState === 'speaker2_speaking') stopListening(2);
    }
});

// ================================================================
// LANGUAGE CHANGE
// ================================================================
lang1.addEventListener('change', () => {
    console.log(`[Lang] Speaker 1 → ${lang1.value}`);
    conversationHistory.length = 0;
    if (appState === 'idle') setDisplayText(1, 'Tap 🔴 to speak', 'idle');
});

lang2.addEventListener('change', () => {
    console.log(`[Lang] Speaker 2 → ${lang2.value}`);
    conversationHistory.length = 0;
    if (appState === 'idle') setDisplayText(2, 'Tap 🔴 to speak', 'idle');
});

// ================================================================
// INIT
// ================================================================
setState('idle');
setDisplayText(1, 'Tap 🔴 to speak', 'idle');
setDisplayText(2, 'Tap 🔴 to speak', 'idle');

console.log('[Init] AI Translator ready');
console.log(`[Init] API key: ${GROQ_API_KEY ? 'set' : 'MISSING'}`);
// ================================================================
// AI TRANSLATOR — script.js
// Replace with your actual Groq API key (starts with gsk_)
// ================================================================
const GROQ_API_KEY = 'api key here';

// ----- UI Text Constants -----
const PLACEHOLDER_TEXT = 'Press mic to speak';
const LISTENING_TEXT = 'Listening...';
const TRANSLATING_TEXT = 'Translating...';

// ----- LANGUAGE FLAGS - Local Images -----
const LANGUAGE_FLAGS = {
    'en': 'images/flags/us.png',
    'es': 'images/flags/es.png',
    'fr': 'images/flags/fr.png',
    'de': 'images/flags/de.png',
    'ja': 'images/flags/jp.png',
    'zh': 'images/flags/cn.png',
    'ko': 'images/flags/kr.png',
    'pt': 'images/flags/pt.png',
    'it': 'images/flags/it.png',
    'ru': 'images/flags/ru.png',
    'ar': 'images/flags/sa.png',
    'hi': 'images/flags/in.png',
    'fil': 'images/flags/ph.png',  // ← Add Filipino
    'ceb': 'images/flags/ph.png'   // ← Add Cebuano (same flag)
};

function updateFlag(speaker, langCode) {
    const flagPath = LANGUAGE_FLAGS[langCode] || 'images/flags/us.png';
    const flagId = speaker === 1 ? 'flag1' : 'flag2';
    const flagImg = document.getElementById(flagId);
    if (flagImg) {
        flagImg.src = flagPath;
        const langName = document.getElementById(speaker === 1 ? 'lang1' : 'lang2');
        const selectedOption = langName.options[langName.selectedIndex];
        flagImg.alt = selectedOption ? selectedOption.text : '';
    }
}

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
    btn.className = 'mic-btn';

    switch (state) {
        case 'ready':
            statusEl.classList.add('status-ready');
            btn.disabled = false;
            setMicIcon(speaker, false);
            break;
        case 'listening':
            statusEl.classList.add('status-listening');
            btn.classList.add('listening');
            btn.disabled = false;
            setMicIcon(speaker, 'listening');
            break;
        case 'translating':
            statusEl.classList.add('status-translating');
            btn.classList.add('translating');
            btn.disabled = true;
            setMicIcon(speaker, false);
            break;
        case 'disabled':
            statusEl.classList.add('status-disabled');
            btn.disabled = true;
            setMicIcon(speaker, true);
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
        case 'translated':  textEl.style.color = '#333333';      break;
        case 'empty-text':  textEl.classList.add('empty-text');  break;
    }

    textEl.textContent = text;

    if (style === 'translated' || style === 'final-own') {
        setTranslationCardState(speaker, false);
    }
}

function setTranslationCardState(speaker, isEmpty) {
    const card = speaker === 1
        ? document.getElementById('translation1')
        : document.getElementById('translation2');
    const textEl = speaker === 1 ? translationText1 : translationText2;

    if (isEmpty) {
        card.classList.add('empty');
        textEl.classList.add('empty-text');
        textEl.textContent = '...';
        textEl.style.color = '#999999';
        textEl.style.fontStyle = 'italic';
    } else {
        card.classList.remove('empty');
        textEl.classList.remove('empty-text');
        textEl.style.fontStyle = '';
    }
}

// MICROPHONE ICON SWAPPER
const MIC_ACTIVE = 'images/mic-active.png';
const MIC_LISTENING = 'images/mic-listening.png';
const MIC_DISABLED = 'images/mic-disabled.png';

function setMicIcon(speaker, state) {
    const iconId = speaker === 1 ? 'micIcon1' : 'micIcon2';
    const icon = document.getElementById(iconId);
    if (!icon) return;

    // Also check if the button is disabled
    const btn = speaker === 1 ? speakBtn1 : speakBtn2;

    if (btn.disabled) {
        icon.src = MIC_DISABLED;
        return;
    }

    switch (state) {
        case 'idle':
        case 'ready':
            icon.src = MIC_ACTIVE;
            break;
        case 'listening':
            icon.src = MIC_LISTENING;
            break;
        case 'translating':
            icon.src = MIC_ACTIVE;
            break;
        case 'disabled':
            icon.src = MIC_DISABLED;
            break;
        default:
            icon.src = MIC_ACTIVE;
    }
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

    const otherSpeaker = speaker === 1 ? 2 : 1;
    setTranslationCardState(otherSpeaker, true);

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
    setDisplayText(speaker, LISTENING_TEXT, 'listening');

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
            setDisplayText(speaker, PLACEHOLDER_TEXT, 'idle');
            const otherSpeaker = speaker === 1 ? 2 : 1;
            setTranslationCardState(otherSpeaker, false);
            setDisplayText(otherSpeaker, PLACEHOLDER_TEXT, 'idle');
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
                setDisplayText(speaker, PLACEHOLDER_TEXT, 'idle');
                const otherSpeaker = speaker === 1 ? 2 : 1;
                setTranslationCardState(otherSpeaker, false);
                setDisplayText(otherSpeaker, PLACEHOLDER_TEXT, 'idle');
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
// TRANSLATION — GROQ API
// ================================================================
async function translateWithGemini(text, sourceLang, targetLang, speaker) {
    const targetSpeaker = speaker === 1 ? 2 : 1;

    setDisplayText(targetSpeaker, TRANSLATING_TEXT, 'translating');

    const historyContext = getHistoryContext();
    const contextBlock = historyContext
        ? `Previous conversation context (for reference only):\n${historyContext}\n\n`
        : '';

    const prompt = `You are a professional interpreter.

Translate the following text from ${sourceLang} to ${targetLang}.

Requirements:
- Preserve the original meaning, intent, and tone.
- Produce a natural, fluent translation that sounds like a native speaker.
- Adapt idioms, expressions, and cultural references when appropriate instead of translating them literally.
- Do not add, remove, or explain information.
- Preserve names, numbers, URLs, email addresses, and technical terms unless they should naturally be translated.
- Keep the same level of formality as the original.
- If the input is incomplete or contains speech disfluencies, translate it as naturally as possible without inventing missing content.

${contextBlock}Text:
${text}

Return only the translated text.`;

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
            throw new Error(`Groq API ${response.status}: ${errData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const translation = data?.choices?.[0]?.message?.content?.trim();

        if (!translation) {
            throw new Error('Empty response from Groq');
        }

        console.log(`[Groq] "${text}" → "${translation}"`);

        addToHistory(speaker, text, translation);
        displayTranslation(translation, targetSpeaker);
        setDisplayText(speaker, PLACEHOLDER_TEXT, 'idle');
        setState('idle');

    } catch (err) {
        console.error('[Groq] Translation failed:', err);
        setDisplayText(targetSpeaker, 'Translation failed. Tap to retry.', 'error');
        setDisplayText(speaker, PLACEHOLDER_TEXT, 'idle');
        setState('idle');
    }
}

function displayTranslation(translation, targetSpeaker) {
    setDisplayText(targetSpeaker, translation, 'translated');
    setTranslationCardState(targetSpeaker, false);
    
    const speaker = targetSpeaker === 1 ? 2 : 1;
    setDisplayText(speaker, PLACEHOLDER_TEXT, 'idle');
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
// KEYBOARD SHORTCUTS — Q = Speaker 1, P = Speaker 2
// ================================================================
let keyPressed_Q = false;
let keyPressed_P = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'q' || e.key === 'Q') {
        if (keyPressed_Q || appState !== 'idle') return;
        keyPressed_Q = true;
        e.preventDefault();
        console.log('[Keys] Q down → Speaker 1');
        startListening(1);
    }
    if (e.key === 'p' || e.key === 'P') {
        if (keyPressed_P || appState !== 'idle') return;
        keyPressed_P = true;
        e.preventDefault();
        console.log('[Keys] P down → Speaker 2');
        startListening(2);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'q' || e.key === 'Q') {
        keyPressed_Q = false;
        e.preventDefault();
        if (appState === 'speaker1_speaking') stopListening(1);
    }
    if (e.key === 'p' || e.key === 'P') {
        keyPressed_P = false;
        e.preventDefault();
        if (appState === 'speaker2_speaking') stopListening(2);
    }
});

// ================================================================
// LANGUAGE CHANGE
// ================================================================
lang1.addEventListener('change', () => {
    console.log(`[Lang] Speaker 1 → ${lang1.value}`);
    updateFlag(1, lang1.value);
    conversationHistory.length = 0;
    if (appState === 'idle') setDisplayText(1, PLACEHOLDER_TEXT, 'idle');
});

lang2.addEventListener('change', () => {
    console.log(`[Lang] Speaker 2 → ${lang2.value}`);
    updateFlag(2, lang2.value);
    conversationHistory.length = 0;
    if (appState === 'idle') setDisplayText(2, PLACEHOLDER_TEXT, 'idle');
});

// ================================================================
// INIT
// ================================================================
setState('idle');
setDisplayText(1, PLACEHOLDER_TEXT, 'idle');
setDisplayText(2, PLACEHOLDER_TEXT, 'idle');
updateFlag(1, lang1.value);
updateFlag(2, lang2.value);

console.log('[Init] AI Translator ready');
console.log(`[Init] API key: ${GROQ_API_KEY ? 'set' : 'MISSING'}`);


// ================================================================
// CUSTOM DROPDOWN
// ================================================================
function initDropdown(dropdownId, buttonId, menuId, langSelectId) {
    const dropdown = document.getElementById(dropdownId);
    const button = document.getElementById(buttonId);
    const menu = document.getElementById(menuId);
    const langSelect = document.getElementById(langSelectId);

    // Toggle dropdown
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.toggle('open');
        button.querySelector('.arrow').classList.toggle('open', isOpen);
    });

    // Select option
    menu.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        const value = li.dataset.value;
        const flag = li.dataset.flag;
        const text = li.textContent.trim();

        // Update button
        const flagImg = button.querySelector('.flag-image');
        const textSpan = button.querySelector('.selected-text');
        flagImg.src = flag;
        flagImg.alt = text;
        textSpan.textContent = text;

        // Update hidden select
        langSelect.value = value;

        // Update active state
        menu.querySelectorAll('li').forEach(item => item.classList.remove('active'));
        li.classList.add('active');

        // Close dropdown
        menu.classList.remove('open');
        button.querySelector('.arrow').classList.remove('open');

        // Trigger change event
        const event = new Event('change');
        langSelect.dispatchEvent(event);

        // Update flag if needed
        if (typeof updateFlag === 'function') {
            const speaker = langSelectId === 'lang1' ? 1 : 2;
            updateFlag(speaker, value);
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        menu.classList.remove('open');
        button.querySelector('.arrow').classList.remove('open');
    });
}

// Initialize custom dropdowns
initDropdown('dropdown1', 'dropdownBtn1', 'dropdownMenu1', 'lang1');
initDropdown('dropdown2', 'dropdownBtn2', 'dropdownMenu2', 'lang2');
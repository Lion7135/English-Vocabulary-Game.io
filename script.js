let currentDeck = [];
let currentCardIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 0;
let gameMode = null; 
let totalTimeUsed = 0;
let correctAnswers = 0;
let totalAnswers = 0;
let selectedDeckType = 'random30';
let selectedCustomDeckId = null;
let mistakesList = [];
let userDecks = [];
let currentEditingDeckId = null;
let currentTypingAnswer = '';
let nextWordHandler = null; 

const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const practiceBtn = document.getElementById('practiceBtn');
const typingModeBtn = document.getElementById('typingModeBtn');
const level1Btn = document.getElementById('level1Btn');
const level2Btn = document.getElementById('level2Btn');
const level3Btn = document.getElementById('level3Btn');
const quitBtn = document.getElementById('quitBtn');
const restartBtn = document.getElementById('restartBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const progressDisplay = document.getElementById('progressDisplay');
const englishWord = document.getElementById('englishWord');
const partOfSpeech = document.getElementById('partOfSpeech');
const pronunciation = document.getElementById('pronunciation');
const optionsContainer = document.getElementById('optionsContainer');
const speakBtn = document.getElementById('speakBtn');
const feedback = document.getElementById('feedback');
const correctAnswerText = document.getElementById('correctAnswerText');
const nextBtn = document.getElementById('nextBtn');

const deckButtons = document.querySelectorAll('.deck-btn');

const createNewDeckBtn = document.getElementById('createNewDeckBtn');
const customDecksList = document.getElementById('customDecksList');
const deckEditorModal = document.getElementById('deckEditorModal');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const editorTitle = document.getElementById('editorTitle');
const deckNameInput = document.getElementById('deckNameInput');
const addWordBtn = document.getElementById('addWordBtn');
const saveDeckBtn = document.getElementById('saveDeckBtn');
const deleteDeckBtn = document.getElementById('deleteDeckBtn');
const exportDeckBtn = document.getElementById('exportDeckBtn');
const importDeckBtn = document.getElementById('importDeckBtn');
const newEnglish = document.getElementById('newEnglish');
const newRussian = document.getElementById('newRussian');
const newPronunciation = document.getElementById('newPronunciation');
const newPartOfSpeech = document.getElementById('newPartOfSpeech');
const customWordsList = document.getElementById('customWordsList');
const customDeckCount = document.getElementById('customDeckCount');

const showMistakesBtn = document.getElementById('showMistakesBtn');
const mistakesModal = document.getElementById('mistakesModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const mistakesCountSpan = document.getElementById('mistakesCount');
const mistakesListContainer = document.getElementById('mistakesListContainer');
const showMistakesInGameBtn = document.getElementById('showMistakesInGameBtn');
const refreshRandomBtn = document.getElementById('refreshRandomBtn');
const globalExportBtn = document.getElementById('globalExportBtn');
const globalImportBtn = document.getElementById('globalImportBtn');

let synth = window.speechSynthesis;
let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
let isYandex = /yabrowser/i.test(navigator.userAgent);
let speechSupported = true;

function loadUserDecks() {
    const saved = localStorage.getItem('userFlashcardDecks');
    if (saved) {
        try {
            userDecks = JSON.parse(saved);
        } catch(e) {
            userDecks = [];
        }
    } else {
        userDecks = [];
        saveUserDecks();
    }
    renderCustomDecksList();
    updateDecksInGlobal();
}

function saveUserDecks() {
    localStorage.setItem('userFlashcardDecks', JSON.stringify(userDecks));
    updateDecksInGlobal();
    renderCustomDecksList();
}

function updateDecksInGlobal() {
    Object.keys(decks).forEach(key => {
        if (key.startsWith('user_')) {
            delete decks[key];
        }
    });
    
    userDecks.forEach(deck => {
        decks[`user_${deck.id}`] = deck.words;
    });
    
    updateDeckButtonsDisplay();
}

function renderCustomDecksList() {
    if (!customDecksList) return;
    
    if (userDecks.length === 0) {
        customDecksList.innerHTML = '<div class="no-decks">No custom decks yet. Click "Create New Deck" to start!</div>';
        return;
    }
    
    customDecksList.innerHTML = userDecks.map(deck => `
        <div class="custom-deck-item" data-deck-id="${deck.id}">
            <div class="deck-info">
                <i class="fas fa-layer-group"></i>
                <span class="deck-name">${escapeHtml(deck.name)}</span>
                <span class="deck-word-count">(${deck.words.length} words)</span>
            </div>
            <div class="deck-actions">
                <button class="edit-deck-btn" data-id="${deck.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="play-deck-btn" data-id="${deck.id}">
                    <i class="fas fa-play"></i> Play
                </button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.edit-deck-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeckEditor(btn.dataset.id);
        });
    });
    
    document.querySelectorAll('.play-deck-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedCustomDeckId = btn.dataset.id;
            selectedDeckType = `user_${btn.dataset.id}`;
            startGame(gameMode || 'practice');
        });
    });
}

function openDeckEditor(deckId = null) {
    currentEditingDeckId = deckId;
    
    if (deckId === null) {
        editorTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Create New Deck';
        deckNameInput.value = '';
        currentEditingWords = [];
        renderCustomWordsListEditor([]);
        deleteDeckBtn.classList.add('hidden');
    } else {
        const deck = userDecks.find(d => d.id === deckId);
        if (deck) {
            editorTitle.innerHTML = `<i class="fas fa-edit"></i> Edit: ${escapeHtml(deck.name)}`;
            deckNameInput.value = deck.name;
            currentEditingWords = [...deck.words];
            renderCustomWordsListEditor(currentEditingWords);
            deleteDeckBtn.classList.remove('hidden');
        }
    }
    
    deckEditorModal.classList.remove('hidden');
}

let currentEditingWords = [];

function renderCustomWordsListEditor(words) {
    if (!customWordsList) return;
    
    customDeckCount.textContent = words.length;
    
    if (words.length === 0) {
        customWordsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No words yet. Add some above!</div>';
        return;
    }
    
    customWordsList.innerHTML = words.map((word, index) => `
        <div class="custom-word-item">
            <div class="word-info">
                <span class="word-english">${escapeHtml(word.english)}</span>
                <span class="word-russian">→ ${escapeHtml(word.russian)}</span>
                <div class="word-details">
                    ${word.partOfSpeech ? `📖 ${escapeHtml(word.partOfSpeech)}` : ''}
                    ${word.pronunciation ? ` | 🔊 ${escapeHtml(word.pronunciation)}` : ''}
                </div>
            </div>
            <button class="btn-remove-word" data-index="${index}">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.btn-remove-word').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            currentEditingWords.splice(index, 1);
            renderCustomWordsListEditor(currentEditingWords);
        });
    });
}

function addWordToCurrentEditing() {
    const english = newEnglish.value.trim();
    const russian = newRussian.value.trim();
    const pronunciationVal = newPronunciation.value.trim();
    const partOfSpeechVal = newPartOfSpeech.value.trim();
    
    if (!english || !russian) {
        showTemporaryMessage('Please fill in English and Russian fields!', 'warning');
        return;
    }
    
    currentEditingWords.push({
        english: english,
        russian: russian,
        pronunciation: pronunciationVal || '/word/',
        partOfSpeech: partOfSpeechVal || 'n'
    });
    
    renderCustomWordsListEditor(currentEditingWords);
    
    newEnglish.value = '';
    newRussian.value = '';
    newPronunciation.value = '';
    newPartOfSpeech.value = '';
    
    showTemporaryMessage(`Added "${english}" to deck!`, 'info');
}

function saveCurrentDeck() {
    const deckName = deckNameInput.value.trim();
    if (!deckName) {
        showTemporaryMessage('Please enter a deck name!', 'warning');
        return;
    }
    
    if (currentEditingWords.length === 0) {
        showTemporaryMessage('Please add at least one word to the deck!', 'warning');
        return;
    }
    
    if (currentEditingDeckId === null) {
        const newId = 'deck_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        userDecks.push({
            id: newId,
            name: deckName,
            words: [...currentEditingWords]
        });
        showTemporaryMessage(`Deck "${deckName}" created successfully!`, 'info');
    } else {
        const index = userDecks.findIndex(d => d.id === currentEditingDeckId);
        if (index !== -1) {
            userDecks[index].name = deckName;
            userDecks[index].words = [...currentEditingWords];
            showTemporaryMessage(`Deck "${deckName}" updated successfully!`, 'info');
        }
    }
    
    saveUserDecks();
    closeModal();
}

function deleteCurrentDeck() {
    if (currentEditingDeckId && confirm('Are you sure you want to delete this deck? This cannot be undone!')) {
        userDecks = userDecks.filter(d => d.id !== currentEditingDeckId);
        saveUserDecks();
        showTemporaryMessage('Deck deleted!', 'info');
        closeModal();
    }
}

function exportCurrentDeck() {
    if (currentEditingWords.length === 0) {
        showTemporaryMessage('No words to export!', 'warning');
        return;
    }
    
    const deckName = deckNameInput.value.trim() || 'unnamed_deck';
    const exportData = {
        name: deckName,
        words: currentEditingWords,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${deckName.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showTemporaryMessage('Deck exported!', 'info');
}

function importToCurrentDeck() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                let wordsToAdd = [];
                
                if (imported.words && Array.isArray(imported.words)) {
                    wordsToAdd = imported.words;
                    if (imported.name && !deckNameInput.value.trim()) {
                        deckNameInput.value = imported.name;
                    }
                } else if (Array.isArray(imported)) {
                    wordsToAdd = imported;
                } else {
                    throw new Error('Invalid format');
                }
                
                currentEditingWords.push(...wordsToAdd);
                renderCustomWordsListEditor(currentEditingWords);
                showTemporaryMessage(`Imported ${wordsToAdd.length} words!`, 'info');
            } catch(err) {
                showTemporaryMessage('Failed to parse file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportAllDecks() {
    if (userDecks.length === 0) {
        showTemporaryMessage('No decks to export!', 'warning');
        return;
    }
    
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        decks: userDecks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `all_my_decks_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showTemporaryMessage('All decks exported!', 'info');
}

function importAllDecks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.decks && Array.isArray(imported.decks)) {
                    userDecks.push(...imported.decks);
                    saveUserDecks();
                    showTemporaryMessage(`Imported ${imported.decks.length} decks!`, 'info');
                } else if (Array.isArray(imported)) {
                    userDecks.push(...imported);
                    saveUserDecks();
                    showTemporaryMessage(`Imported ${imported.length} decks!`, 'info');
                } else {
                    throw new Error('Invalid format');
                }
            } catch(err) {
                showTemporaryMessage('Failed to import', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function getDeckInfo(deckType) {
    let size = 0;
    let name = '';
    
    if (deckType && deckType.startsWith('user_')) {
        const deckId = deckType.replace('user_', '');
        const deck = userDecks.find(d => d.id === deckId);
        if (deck) {
            name = deck.name;
            size = deck.words.length;
        }
    } else {
        const deck = decks[deckType];
        size = deck ? deck.length : 0;
        
        const names = {
            all: 'All Words',
            random30: 'Random Cards',
            unit1: 'Unit 1',
            unit2: 'Unit 2',
            unit3: 'Unit 3',
            unit4: 'Unit 4',
            unit5: 'Unit 5',
            unit6: 'Unit 6',
            unit7: 'Unit 7',
            unit8: 'Unit 8',
            unit9: 'Unit 9',
            unit10: 'Unit 10'
        };
        name = names[deckType] || 'Unknown Deck';
    }
    
    return { name, size };
}

function updateDeckButtonsDisplay() {
    deckButtons.forEach(btn => {
        const deckType = btn.dataset.deck;
        const deckInfo = getDeckInfo(deckType);
        
        let icon = 'fa-book';
        if (deckType === 'random30') icon = 'fa-random';
        if (deckType === 'all') icon = 'fa-globe';
        
        btn.innerHTML = `<i class="fas ${icon}"></i> ${deckInfo.name} (${deckInfo.size})`;
    });
}

function updateRandomDeck() {
    const allWords = decks.all || [];
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    decks.random30 = shuffled.slice(0, 30);
    updateDeckButtonsDisplay();
    if (selectedDeckType === 'random30') {
        currentDeck = [...decks.random30];
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomWrongAnswers(correctRussian, count) {
    const wrongs = currentDeck
        .map(w => w.russian)
        .filter(r => r !== correctRussian);
    
    if (wrongs.length < count) {
        const additionalWrongs = decks.all
            .map(w => w.russian)
            .filter(r => r !== correctRussian && !wrongs.includes(r));
        wrongs.push(...additionalWrongs);
    }
    
    shuffleArray(wrongs);
    return wrongs.slice(0, Math.min(count, wrongs.length));
}

function checkSpeechSupport() {
    if (!('speechSynthesis' in window)) {
        speechSupported = false;
        if (speakBtn) {
            speakBtn.disabled = true;
            speakBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Not Supported';
        }
        return false;
    }
    return true;
}

function speakWord() {
    if (gameMode === 'typing') {
        showTemporaryMessage('Audio is disabled in Typing Mode to make it more challenging!', 'warning');
        return;
    }
    
    if (!speechSupported || !currentDeck.length || !currentDeck[currentCardIndex]) return;
    
    const word = currentDeck[currentCardIndex].english;
    synth.cancel();
    
    setTimeout(() => {
        try {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = 'en-US';
            
            utterance.onstart = () => {
                if (speakBtn) speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
            };
            utterance.onend = () => {
                if (speakBtn) speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak Word';
            };
            utterance.onerror = () => {
                if (speakBtn) speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak Word';
            };
            synth.speak(utterance);
        } catch(e) {
            console.error('Speech error:', e);
        }
    }, 50);
}

function showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `temp-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeInOut 3s ease-in-out;
    `;
    
    if (type === 'warning') {
        messageDiv.style.backgroundColor = '#ffc107';
        messageDiv.style.color = '#212529';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#dc3545';
    } else {
        messageDiv.style.backgroundColor = '#28a745';
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv);
            }, 500);
        }
    }, 2500);
}

function setupNextWordKeyboardListener(enable) {
    if (nextWordHandler) {
        document.removeEventListener('keydown', nextWordHandler);
        nextWordHandler = null;
    }
    
    if (enable) {
        nextWordHandler = (e) => {
            if (e.key === 'Enter') {
                const nextBtn = document.getElementById('nextWordBtn');
                if (nextBtn && nextBtn.style.display !== 'none') {
                    e.preventDefault();
                    nextBtn.click();
                }
            }
        };
        document.addEventListener('keydown', nextWordHandler);
    }
}

function startGame(mode) {
    gameMode = mode;
    mistakesList = [];
    updateMistakesCounter();
    
    if (timer) clearInterval(timer);
    
    if (speakBtn) {
        speakBtn.disabled = false;
        speakBtn.style.opacity = '1';
        speakBtn.style.cursor = 'pointer';
        speakBtn.title = 'Speak the word';
    }
    
    setupNextWordKeyboardListener(false);
    
    if (selectedDeckType === 'random30') {
        updateRandomDeck();
    }

    let selectedDeck = decks[selectedDeckType];
    
    if (!selectedDeck || selectedDeck.length === 0) {
        if (selectedDeckType && selectedDeckType.startsWith('user_')) {
            showTemporaryMessage('This deck is empty! Add some words first.', 'warning');
            return;
        }
        selectedDeck = decks.all;
    }
    
    currentDeck = shuffleArray([...selectedDeck]);
    currentCardIndex = 0;
    score = 0;
    totalTimeUsed = 0;
    correctAnswers = 0;
    totalAnswers = 0;

    updateScoreDisplay();
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resultScreen.classList.add('hidden');

    loadCard();
}

function loadCard() {
    if (currentCardIndex >= currentDeck.length) {
        endGame();
        return;
    }

    const card = currentDeck[currentCardIndex];
    
    if (gameMode === 'typing') {
        loadCardTypingMode(card);
    } else {
        loadCardChoiceMode(card);
    }
}

function loadCardChoiceMode(card) {
    if (speakBtn) {
        speakBtn.disabled = false;
        speakBtn.style.opacity = '1';
        speakBtn.style.cursor = 'pointer';
        speakBtn.title = 'Speak the word';
    }
    
    englishWord.textContent = card.english;
    partOfSpeech.textContent = card.partOfSpeech || 'n.';
    pronunciation.textContent = card.pronunciation || '/word/';
    
    const deckInfo = getDeckInfo(selectedDeckType);
    progressDisplay.textContent = `${deckInfo.name}: ${currentCardIndex + 1}/${currentDeck.length}`;
    
    const correctAnswer = card.russian;
    const wrongAnswers = getRandomWrongAnswers(correctAnswer, 3);
    const allAnswers = shuffleArray([correctAnswer, ...wrongAnswers]);

    optionsContainer.innerHTML = '';
    allAnswers.forEach(answer => {
        const option = document.createElement('div');
        option.className = 'option';
        option.textContent = answer;
        option.addEventListener('click', () => selectAnswer(answer, correctAnswer));
        optionsContainer.appendChild(option);
    });

    feedback.classList.add('hidden');
    optionsContainer.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('correct', 'wrong');
        opt.style.pointerEvents = 'auto';
    });

    if (gameMode !== 'practice') {
        startTimer();
    } else {
        timerDisplay.textContent = 'Practice Mode';
    }
}

function loadCardTypingMode(card) {
    currentTypingAnswer = card.english;
    
    englishWord.textContent = card.russian;
    partOfSpeech.textContent = card.partOfSpeech || 'n.';
    pronunciation.textContent = '';
    
    const deckInfo = getDeckInfo(selectedDeckType);
    progressDisplay.textContent = `${deckInfo.name}: ${currentCardIndex + 1}/${currentDeck.length}`;
    
    if (speakBtn) {
        speakBtn.disabled = true;
        speakBtn.style.opacity = '0.5';
        speakBtn.style.cursor = 'not-allowed';
        speakBtn.title = 'Audio is disabled in Typing Mode';
    }
    
    optionsContainer.innerHTML = `
        <div class="typing-input-container">
            <input type="text" id="typingInput" placeholder="Type the English word..." autocomplete="off">
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                <button id="checkAnswerBtn" class="check-answer-btn">
                    <i class="fas fa-check"></i> Check Answer
                </button>
                <button id="nextWordBtn" class="next-word-btn" style="display: none;">
                    <i class="fas fa-arrow-right"></i> Next Word (Enter)
                </button>
            </div>
            <div id="typingFeedback" class="typing-feedback"></div>
        </div>
    `;
    
    feedback.classList.add('hidden');
    timerDisplay.textContent = 'Typing Mode: Russian → English (audio disabled)';
    
    const typingInput = document.getElementById('typingInput');
    const checkBtn = document.getElementById('checkAnswerBtn');
    const nextBtn = document.getElementById('nextWordBtn');
    
    if (typingInput) {
        typingInput.disabled = false;
        typingInput.value = '';
        typingInput.classList.remove('correct-input', 'wrong-input');
        typingInput.focus();
        
        const newInput = typingInput.cloneNode(true);
        typingInput.parentNode.replaceChild(newInput, typingInput);
        newInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !newInput.disabled) {
                e.preventDefault();
                checkTypingAnswer();
            }
        });
    }
    
    if (checkBtn) {
        checkBtn.disabled = false;
        const newCheckBtn = checkBtn.cloneNode(true);
        checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);
        newCheckBtn.addEventListener('click', () => {
            const input = document.getElementById('typingInput');
            if (input && !input.disabled) {
                checkTypingAnswer();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.style.display = 'none';
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', () => {
            setupNextWordKeyboardListener(false);
            currentCardIndex++;
            if (currentCardIndex < currentDeck.length) {
                loadCard();
            } else {
                endGame();
            }
        });
    }
    
    const typingFeedback = document.getElementById('typingFeedback');
    if (typingFeedback) {
        typingFeedback.innerHTML = '';
        typingFeedback.className = 'typing-feedback';
    }
}

function checkTypingAnswer() {
    const typingInput = document.getElementById('typingInput');
    const typingFeedback = document.getElementById('typingFeedback');
    const checkBtn = document.getElementById('checkAnswerBtn');
    const nextBtn = document.getElementById('nextWordBtn');
    
    if (!typingInput || !typingFeedback) return;
    if (typingInput.disabled) return;
    
    const userAnswer = typingInput.value.trim().toLowerCase();
    const isCorrect = userAnswer === currentTypingAnswer.toLowerCase();
    
    totalAnswers++;
    
    if (isCorrect) {
        score += 10;
        correctAnswers++;
        updateScoreDisplay();
        
        typingFeedback.innerHTML = '✅ Correct! Well done! +10 points';
        typingFeedback.className = 'typing-feedback correct';
        typingInput.classList.add('correct-input');
        
        showTemporaryMessage('Correct! +10 points', 'info');
    } else {
        mistakesList.push({
            english: currentTypingAnswer,
            userAnswer: userAnswer,
            correctAnswer: currentTypingAnswer,
            partOfSpeech: currentDeck[currentCardIndex].partOfSpeech,
            pronunciation: currentDeck[currentCardIndex].pronunciation
        });
        updateMistakesCounter();
        
        typingFeedback.innerHTML = `❌ Incorrect. The correct answer is: "${currentTypingAnswer}"`;
        typingFeedback.className = 'typing-feedback wrong';
        typingInput.classList.add('wrong-input');
    }
    
    typingInput.disabled = true;
    if (checkBtn) checkBtn.disabled = true;
    
    if (nextBtn) {
        nextBtn.style.display = 'inline-block';
    }
    
    setupNextWordKeyboardListener(true);
}

function startTimer() {
    if (timer) clearInterval(timer);

    switch (gameMode) {
        case 'level1': timeLeft = 30; break;
        case 'level2': timeLeft = 15; break;
        case 'level3': timeLeft = 5; break;
        default: timeLeft = 30;
    }

    timerDisplay.textContent = `Time: ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time: ${timeLeft}s`;
        totalTimeUsed++;

        if (timeLeft <= 0) {
            clearInterval(timer);
            timeOut();
        }
    }, 1000);
}

function timeOut() {
    const card = currentDeck[currentCardIndex];
    showFeedback(null, card.russian, false);
    optionsContainer.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
}

function selectAnswer(selected, correct) {
    if (gameMode !== 'practice') {
        clearInterval(timer);
    }

    const isCorrect = selected === correct;
    totalAnswers++;
    if (isCorrect) {
        score += 10;
        correctAnswers++;
        updateScoreDisplay();
    } else {
        const currentCard = currentDeck[currentCardIndex];
        mistakesList.push({
            english: currentCard.english,
            userAnswer: selected,
            correctAnswer: correct,
            partOfSpeech: currentCard.partOfSpeech,
            pronunciation: currentCard.pronunciation
        });
        updateMistakesCounter();
    }

    showFeedback(selected, correct, isCorrect);
}

function showFeedback(selected, correct, isCorrect) {
    optionsContainer.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.textContent === correct) opt.classList.add('correct');
        if (opt.textContent === selected && !isCorrect) opt.classList.add('wrong');
    });

    if (isCorrect) {
        correctAnswerText.textContent = '✅ Correct! Well done.';
        correctAnswerText.style.color = '#28a745';
    } else {
        correctAnswerText.textContent = `❌ Incorrect. The correct answer is: ${correct}`;
        correctAnswerText.style.color = '#dc3545';
    }

    feedback.classList.remove('hidden');
}

function nextCard() {
    currentCardIndex++;
    if (currentCardIndex < currentDeck.length) {
        loadCard();
    } else {
        endGame();
    }
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function endGame() {
    clearInterval(timer);
    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    setupNextWordKeyboardListener(false);

    const accuracyPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const deckInfo = getDeckInfo(selectedDeckType);
    
    let modeName = '';
    if (gameMode === 'practice') modeName = 'Practice Mode';
    else if (gameMode === 'typing') modeName = 'Typing Mode';
    else if (gameMode === 'level1') modeName = 'Level 1 (30s)';
    else if (gameMode === 'level2') modeName = 'Level 2 (15s)';
    else if (gameMode === 'level3') modeName = 'Level 3 (5s)';
    
    const statsElement = document.getElementById('scoreSummary');
    statsElement.innerHTML = `
        <p><i class="fas fa-trophy"></i> Your Score: <strong>${score}</strong></p>
        <p><i class="fas fa-chart-bar"></i> Accuracy: <strong>${accuracyPercent}%</strong></p>
        <p><i class="fas fa-clock"></i> Total Time: <strong>${totalTimeUsed}</strong>s</p>
        <p><i class="fas fa-layer-group"></i> Deck: <strong>${deckInfo.name}</strong></p>
        <p><i class="fas fa-gamepad"></i> Mode: <strong>${modeName}</strong></p>
        <p><i class="fas fa-check-circle"></i> Correct: <strong>${correctAnswers}/${totalAnswers}</strong></p>
        <p><i class="fas fa-list-ol"></i> Deck Size: <strong>${currentDeck.length}</strong> words</p>
        ${mistakesList.length > 0 ? `<p><i class="fas fa-exclamation-triangle"></i> Mistakes: <strong>${mistakesList.length}</strong></p>` : ''}
    `;
}

function quitGame() {
    clearInterval(timer);
    if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
        backToMenu();
    }
}

function restartGame() {
    if (selectedDeckType === 'random30') updateRandomDeck();
    startGame(gameMode);
}

function backToMenu() {
    clearInterval(timer);
    gameScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    mistakesList = [];
    updateMistakesCounter();
    setupNextWordKeyboardListener(false);
}

function updateMistakesCounter() {
    if (showMistakesInGameBtn) {
        if (mistakesList.length > 0) {
            showMistakesInGameBtn.classList.remove('hidden');
            showMistakesInGameBtn.innerHTML = `<i class="fas fa-eye"></i> Mistakes (${mistakesList.length})`;
        } else {
            showMistakesInGameBtn.classList.add('hidden');
        }
    }
}

function showMistakes() {
    if (!mistakesModal || !mistakesListContainer) return;
    mistakesCountSpan.textContent = mistakesList.length;
    
    if (mistakesList.length === 0) {
        mistakesListContainer.innerHTML = `<div class="no-mistakes"><i class="fas fa-check-circle" style="font-size: 3rem;"></i><p>Perfect! No mistakes! 🎉</p></div>`;
    } else {
        mistakesListContainer.innerHTML = mistakesList.map(mistake => `
            <div class="mistake-item">
                <div class="mistake-word"><i class="fas fa-language"></i> ${escapeHtml(mistake.english)}</div>
                <div class="mistake-details"><i class="fas fa-times-circle" style="color: #dc3545;"></i> Your answer: <span class="mistake-user">"${escapeHtml(mistake.userAnswer)}"</span></div>
                <div class="mistake-details"><i class="fas fa-check-circle" style="color: #28a745;"></i> Correct: <span class="mistake-correct">"${escapeHtml(mistake.correctAnswer)}"</span></div>
            </div>
        `).join('');
    }
    mistakesModal.classList.remove('hidden');
}

function closeModal() {
    if (mistakesModal) mistakesModal.classList.add('hidden');
    if (deckEditorModal) deckEditorModal.classList.add('hidden');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadUserDecks();
    updateDeckButtonsDisplay();
    checkSpeechSupport();
    
    if (practiceBtn) practiceBtn.addEventListener('click', () => startGame('practice'));
    if (typingModeBtn) typingModeBtn.addEventListener('click', () => startGame('typing'));
    if (level1Btn) level1Btn.addEventListener('click', () => startGame('level1'));
    if (level2Btn) level2Btn.addEventListener('click', () => startGame('level2'));
    if (level3Btn) level3Btn.addEventListener('click', () => startGame('level3'));
    if (quitBtn) quitBtn.addEventListener('click', quitGame);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    if (backToMenuBtn) backToMenuBtn.addEventListener('click', backToMenu);
    if (speakBtn) speakBtn.addEventListener('click', speakWord);
    if (nextBtn) nextBtn.addEventListener('click', nextCard);
    
    if (showMistakesBtn) showMistakesBtn.addEventListener('click', showMistakes);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (showMistakesInGameBtn) showMistakesInGameBtn.addEventListener('click', showMistakes);
    
    if (mistakesModal) {
        mistakesModal.addEventListener('click', (e) => { if (e.target === mistakesModal) closeModal(); });
    }
    if (deckEditorModal) {
        deckEditorModal.addEventListener('click', (e) => { if (e.target === deckEditorModal) closeModal(); });
    }
    
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    
    if (createNewDeckBtn) createNewDeckBtn.addEventListener('click', () => openDeckEditor(null));
    if (closeEditorBtn) closeEditorBtn.addEventListener('click', closeModal);
    if (addWordBtn) addWordBtn.addEventListener('click', addWordToCurrentEditing);
    if (saveDeckBtn) saveDeckBtn.addEventListener('click', saveCurrentDeck);
    if (deleteDeckBtn) deleteDeckBtn.addEventListener('click', deleteCurrentDeck);
    if (exportDeckBtn) exportDeckBtn.addEventListener('click', exportCurrentDeck);
    if (importDeckBtn) importDeckBtn.addEventListener('click', importToCurrentDeck);
    if (refreshRandomBtn) refreshRandomBtn.addEventListener('click', () => {
        updateRandomDeck();
        showTemporaryMessage('Random deck refreshed!', 'info');
    });
    if (globalExportBtn) globalExportBtn.addEventListener('click', exportAllDecks);
    if (globalImportBtn) globalImportBtn.addEventListener('click', importAllDecks);
    
    deckButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            deckButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedDeckType = this.dataset.deck;
            if (selectedDeckType === 'random30') updateRandomDeck();
        });
    });
    
    function adjustWordSize() {
        const wordEl = document.getElementById('englishWord');
        if (!wordEl) return;
        const length = wordEl.textContent.length;
        wordEl.classList.remove('long-word', 'very-long-word', 'extremely-long-word');
        if (length > 15) wordEl.classList.add('long-word');
        if (length > 25) wordEl.classList.add('very-long-word');
        if (length > 35) wordEl.classList.add('extremely-long-word');
    }
    
    const observer = new MutationObserver(adjustWordSize);
    const wordEl = document.getElementById('englishWord');
    if (wordEl) observer.observe(wordEl, { childList: true, characterData: true, subtree: true });
    adjustWordSize();
});
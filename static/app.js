// Global Application State
let appState = {
    notes: [],
    filteredNotes: [],
    selectedNote: null,
    activeFilter: 'ALL',
    searchQuery: ''
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('btn-refresh-icon'),
    statusDot: document.querySelector('.status-dot'),
    statusText: document.getElementById('status-text'),
    
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    categoryFilters: document.getElementById('category-filters'),
    
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    errorRetryBtn: document.getElementById('error-retry-btn'),
    emptyState: document.getElementById('empty-state'),
    notesContainer: document.getElementById('notes-container'),
    
    detailPlaceholder: document.getElementById('detail-placeholder'),
    detailContent: document.getElementById('detail-content'),
    detailDate: document.getElementById('detail-date'),
    detailBadge: document.getElementById('detail-badge'),
    detailTitle: document.getElementById('detail-title'),
    detailBody: document.getElementById('detail-body'),
    
    tweetDraft: document.getElementById('tweet-draft'),
    charCounter: document.getElementById('char-counter'),
    copyTextBtn: document.getElementById('copy-text-btn'),
    tweetBtn: document.getElementById('tweet-btn'),
    sourceLink: document.getElementById('source-link'),
    toast: document.getElementById('toast')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleaseNotes();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh action
    elements.refreshBtn.addEventListener('click', fetchReleaseNotes);
    elements.errorRetryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search action
    elements.searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.trim().toLowerCase();
        
        // Show/hide clear search button
        if (appState.searchQuery.length > 0) {
            elements.searchClearBtn.style.display = 'block';
        } else {
            elements.searchClearBtn.style.display = 'none';
        }
        
        filterAndSearchNotes();
    });
    
    elements.searchClearBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        appState.searchQuery = '';
        elements.searchClearBtn.style.display = 'none';
        filterAndSearchNotes();
        elements.searchInput.focus();
    });
    
    // Category pills filter action
    elements.categoryFilters.addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-pill')) return;
        
        // Update active UI state
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update state
        appState.activeFilter = e.target.getAttribute('data-type');
        filterAndSearchNotes();
    });
    
    // Tweet composer input tracking
    elements.tweetDraft.addEventListener('input', () => {
        updateTweetBtnHref();
    });
    
    // Copy tweet text action
    elements.copyTextBtn.addEventListener('click', copyTweetDraft);
}

// Fetch Release Notes API
async function fetchReleaseNotes() {
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/release-notes');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            appState.notes = result.data;
            appState.filteredNotes = [...result.data];
            
            setLoadingState(false);
            filterAndSearchNotes();
            
            // Auto-select first note if available and nothing is selected yet
            if (appState.notes.length > 0 && !appState.selectedNote) {
                selectNote(appState.notes[0]);
            }
        } else {
            throw new Error(result.message || 'Unknown backend parsing error');
        }
        
    } catch (error) {
        console.error('Error fetching release notes:', error);
        setErrorState(error.message);
    }
}

// Update UI Loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.loadingState.style.display = 'flex';
        elements.notesContainer.style.display = 'none';
        elements.errorState.style.display = 'none';
        elements.emptyState.style.display = 'none';
        
        elements.refreshBtn.disabled = true;
        elements.refreshIcon.classList.add('spinner-icon-active');
        
        elements.statusDot.className = 'status-dot loading';
        elements.statusText.textContent = 'Syncing...';
    } else {
        elements.refreshBtn.disabled = false;
        elements.refreshIcon.classList.remove('spinner-icon-active');
        
        elements.statusDot.className = 'status-dot';
        elements.statusText.textContent = 'Connected';
    }
}

// Update UI Error state
function setErrorState(msg) {
    elements.loadingState.style.display = 'none';
    elements.notesContainer.style.display = 'none';
    elements.emptyState.style.display = 'none';
    
    elements.errorState.style.display = 'flex';
    elements.errorMessage.textContent = msg;
    
    elements.refreshBtn.disabled = false;
    elements.refreshIcon.classList.remove('spinner-icon-active');
    
    elements.statusDot.className = 'status-dot error';
    elements.statusText.textContent = 'Sync Failed';
}

// Filter and Search notes
function filterAndSearchNotes() {
    const filter = appState.activeFilter.toUpperCase();
    const query = appState.searchQuery;
    
    appState.filteredNotes = appState.notes.filter(note => {
        // 1. Filter by category type
        const matchesType = (filter === 'ALL' || note.type.toUpperCase() === filter);
        
        // 2. Filter by search query (checks date, type, html body and plain text)
        const matchesQuery = !query || 
            note.date.toLowerCase().includes(query) || 
            note.type.toLowerCase().includes(query) || 
            note.plain_text.toLowerCase().includes(query);
            
        return matchesType && matchesQuery;
    });
    
    renderNotes();
}

// Render release note cards
function renderNotes() {
    elements.notesContainer.innerHTML = '';
    
    if (appState.filteredNotes.length === 0) {
        elements.notesContainer.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.notesContainer.style.display = 'flex';
    
    appState.filteredNotes.forEach(note => {
        const card = document.createElement('article');
        card.className = `note-card ${note.type}`;
        card.id = `card-${note.id}`;
        
        if (appState.selectedNote && appState.selectedNote.id === note.id) {
            card.classList.add('selected');
        }
        
        // Clean class for badges
        const badgeClass = note.type.toLowerCase();
        
        // Slice a preview of the plain text snippet
        const snippet = note.plain_text.length > 110 
            ? note.plain_text.substring(0, 110) + '...' 
            : note.plain_text;
            
        card.innerHTML = `
            <div class="card-header">
                <span class="card-date">${note.date}</span>
                <span class="badge ${badgeClass}">${note.type}</span>
            </div>
            <h3 class="card-title">${note.type} Update</h3>
            <p class="card-snippet">${snippet}</p>
        `;
        
        card.addEventListener('click', () => {
            selectNote(note);
        });
        
        elements.notesContainer.appendChild(card);
    });
}

// Select a release note and display in details pane
function selectNote(note) {
    appState.selectedNote = note;
    
    // Highlight active card
    document.querySelectorAll('.note-card').forEach(card => {
        card.classList.remove('selected');
    });
    const activeCard = document.getElementById(`card-${note.id}`);
    if (activeCard) {
        activeCard.classList.add('selected');
    }
    
    // Switch details pane visibility
    elements.detailPlaceholder.style.display = 'none';
    elements.detailContent.style.display = 'flex';
    
    // Populate details
    elements.detailDate.textContent = note.date;
    elements.detailBadge.className = `badge ${note.type.toLowerCase()}`;
    elements.detailBadge.textContent = note.type;
    elements.detailTitle.textContent = `${note.type} Update - ${note.date}`;
    elements.detailBody.innerHTML = note.html_content;
    
    elements.sourceLink.href = note.link;
    
    // Auto-generate tweet draft
    generateDefaultTweetDraft(note);
}

// Auto-generate Tweet Draft based on selected note
function generateDefaultTweetDraft(note) {
    // Twitter character limit is 280
    // URL length is counted as 23 characters by Twitter's t.co shortener
    // Let's compute text budget: 280 - 23 (url) - 20 (formatting, spaces, hashtags)
    const tweetUrl = note.link;
    const prefix = `BigQuery ${note.type} (${note.date}):\n"`;
    const suffix = `"\n\nDetails: ${tweetUrl}`;
    
    // Length of URLs on Twitter is always formatted to 23 chars
    const urlLengthForTwitter = 23;
    const structureLength = prefix.length + 3 + urlLengthForTwitter + 2; // +3 for closing quote & spacing
    const textBudget = 280 - structureLength;
    
    let snippet = note.plain_text.trim();
    if (snippet.length > textBudget) {
        snippet = snippet.substring(0, textBudget - 3) + '...';
    }
    
    const draftText = `${prefix}${snippet}${suffix}`;
    elements.tweetDraft.value = draftText;
    
    updateTweetBtnHref();
}

// Parse current text and update Twitter Web Intent link
function updateTweetBtnHref() {
    const tweetText = elements.tweetDraft.value;
    
    // Calculate length, correcting for URL sizing (Twitter counts links as 23 chars)
    // Find URL in text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = tweetText.match(urlRegex) || [];
    
    let twitterLength = tweetText.length;
    urls.forEach(url => {
        // Subtract actual length, add standard 23 chars
        twitterLength = twitterLength - url.length + 23;
    });
    
    elements.charCounter.textContent = `${twitterLength} / 280`;
    
    // Style counter based on limit
    if (twitterLength > 280) {
        elements.charCounter.className = 'char-counter error';
        elements.tweetBtn.classList.add('disabled');
        elements.tweetBtn.style.pointerEvents = 'none';
        elements.tweetBtn.style.opacity = '0.5';
    } else {
        elements.tweetBtn.classList.remove('disabled');
        elements.tweetBtn.style.pointerEvents = 'auto';
        elements.tweetBtn.style.opacity = '1';
        
        if (twitterLength > 250) {
            elements.charCounter.className = 'char-counter warning';
        } else {
            elements.charCounter.className = 'char-counter';
        }
    }
    
    // Build Twitter/X Intent URL
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    elements.tweetBtn.href = intentUrl;
}

// Copy Tweet draft to Clipboard
function copyTweetDraft() {
    const text = elements.tweetDraft.value;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast("Draft copied to clipboard!");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        try {
            elements.tweetDraft.select();
            document.execCommand('copy');
            showToast("Draft copied to clipboard!");
        } catch (e) {
            showToast("Failed to copy. Please copy manually.");
        }
    });
}

// Show toast notification
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

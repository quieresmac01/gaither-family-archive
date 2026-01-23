// Message Board JavaScript
// Connected to Airtable for persistent storage across all users

const MESSAGES_KEY = 'gaither_family_messages';
const USE_AIRTABLE = true; // Using Airtable as backend

// DOM Elements
const messageForm = document.getElementById('messageForm');
const authorNameInput = document.getElementById('authorName');
const messageTextInput = document.getElementById('messageText');
const messagesContainer = document.getElementById('messagesContainer');
const messageSearchInput = document.getElementById('messageSearchInput');
const clearMessageSearchBtn = document.getElementById('clearMessageSearch');

// State
let allMessages = [];
let filteredMessages = [];
let messageSearchTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    setupEventListeners();
});

function setupEventListeners() {
    messageForm.addEventListener('submit', handleSubmit);
    messageSearchInput.addEventListener('input', handleMessageSearch);
    clearMessageSearchBtn.addEventListener('click', clearMessageSearch);
}

async function handleSubmit(e) {
    e.preventDefault();

    const author = authorNameInput.value.trim();
    const text = messageTextInput.value.trim();
    const imageFilename = document.getElementById('imageFilename')?.value.trim() || null;

    if (!author || !text) {
        alert('Please fill in all fields');
        return;
    }

    if (USE_AIRTABLE) {
        try {
            // Submit to Airtable
            await AirtableAPI.submitMessage(author, text, imageFilename);

            // Clear form
            messageForm.reset();

            // Reload messages
            await loadMessages();

            // Scroll to the new message
            setTimeout(() => {
                const messageCards = document.querySelectorAll('.message-card');
                if (messageCards.length > 0) {
                    messageCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);

            // Show success message
            alert('Message posted successfully!');
        } catch (error) {
            console.error('Error submitting message:', error);
            alert('Error posting message. Please try again.');
        }
    } else {
        // localStorage fallback
        const message = {
            id: Date.now(),
            author: author,
            text: text,
            timestamp: new Date().toISOString()
        };

        saveMessage(message);
        messageForm.reset();
        loadMessages();

        // Scroll to the new message
        setTimeout(() => {
            const messageCards = document.querySelectorAll('.message-card');
            if (messageCards.length > 0) {
                messageCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

function saveMessage(message) {
    const messages = getMessages();
    messages.unshift(message); // Add to beginning (newest first)
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

function getMessages() {
    const messagesJson = localStorage.getItem(MESSAGES_KEY);
    return messagesJson ? JSON.parse(messagesJson) : [];
}

async function loadMessages() {
    if (USE_AIRTABLE) {
        try {
            allMessages = await AirtableAPI.getMessages();
        } catch (error) {
            console.error('Error loading messages from Airtable:', error);
            allMessages = getMessages(); // Fallback to localStorage
        }
    } else {
        allMessages = getMessages();
    }

    filteredMessages = [...allMessages];
    renderMessages();
}

function renderMessages() {
    if (filteredMessages.length === 0) {
        if (allMessages.length === 0) {
            messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Be the first to share a memory!</div>';
        } else {
            messagesContainer.innerHTML = '<div class="no-messages">No messages found matching your search.</div>';
        }
        return;
    }

    messagesContainer.innerHTML = '';
    filteredMessages.forEach(message => {
        const messageCard = createMessageCard(message);
        messagesContainer.appendChild(messageCard);
    });
}

function handleMessageSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    // Clear previous timeout
    if (messageSearchTimeout) {
        clearTimeout(messageSearchTimeout);
    }

    // Debounce search - wait 300ms after user stops typing
    messageSearchTimeout = setTimeout(() => {
        if (searchTerm === '') {
            filteredMessages = [...allMessages];
        } else {
            filteredMessages = allMessages.filter(message =>
                message.author.toLowerCase().includes(searchTerm) ||
                message.text.toLowerCase().includes(searchTerm)
            );
        }

        renderMessages();
    }, 300);
}

function clearMessageSearch() {
    messageSearchInput.value = '';
    filteredMessages = [...allMessages];
    renderMessages();
}

function createMessageCard(message) {
    const card = document.createElement('div');
    card.className = 'message-card';

    const date = new Date(message.timestamp);
    const formattedDate = formatDate(date);

    // Process message text to convert filenames to clickable links
    const processedText = linkifyFilenames(message.text);

    card.innerHTML = `
        <div class="message-header">
            <span class="message-author">${escapeHtml(message.author)}</span>
            <span class="message-date">${formattedDate}</span>
        </div>
        <div class="message-text">${processedText}</div>
    `;

    return card;
}

function linkifyFilenames(text) {
    // Escape HTML first for security
    const escapedText = escapeHtml(text);

    // Pattern to match common image filename formats:
    // - 0001.jpg, 0001.tiff, 0001.png, etc.
    // - IMG_0001.jpg, Scan001.tif, etc.
    // - Matches 4-digit patterns and common prefixes
    const filenamePattern = /(\b\d{4}\.(jpg|jpeg|png|tiff|tif|gif|webp)\b)|(\b[a-zA-Z_-]+\d{3,4}\.(jpg|jpeg|png|tiff|tif|gif|webp)\b)/gi;

    // Replace filenames with clickable links
    return escapedText.replace(filenamePattern, (match) => {
        // Create a link that opens the image in the lightbox
        return `<a href="#" class="filename-link" data-filename="${match.toLowerCase()}">${match}</a>`;
    });
}

// Open image in catalog lightbox when filename is clicked
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('filename-link')) {
        e.preventDefault();
        const filename = e.target.getAttribute('data-filename');
        openImageFromFilename(filename);
    }
});

async function openImageFromFilename(filename) {
    try {
        // Load catalog to find the image
        const response = await fetch('data/catalog.json');
        if (!response.ok) {
            alert('Unable to load catalog. Please ensure the catalog is generated.');
            return;
        }

        const catalog = await response.json();
        const imageItem = catalog.find(item => item.filename.toLowerCase() === filename.toLowerCase());

        if (imageItem) {
            // Open in a simple lightbox
            openSimpleLightbox(imageItem.filename);
        } else {
            alert(`Image "${filename}" not found in the catalog.`);
        }
    } catch (error) {
        console.error('Error loading image:', error);
        alert('Error loading image. Please try again.');
    }
}

function openSimpleLightbox(filename) {
    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.className = 'simple-lightbox';
    lightbox.innerHTML = `
        <span class="simple-close">&times;</span>
        <div class="simple-lightbox-content">
            <img src="${SITE_CONFIG.r2.imageBaseUrl}${filename}" alt="${filename}">
        </div>
        <div class="simple-lightbox-info">
            <p>${filename}</p>
        </div>
    `;

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    // Close on click
    lightbox.addEventListener('click', (e) => {
        if (e.target.classList.contains('simple-lightbox') || e.target.classList.contains('simple-close')) {
            closeLightbox();
        }
    });

    // Close on escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    };
    document.addEventListener('keydown', escapeHandler);

    function closeLightbox() {
        document.body.removeChild(lightbox);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', escapeHandler);
    }
}

function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Note for Phase 2:
// When deploying, replace localStorage with a backend service:
// - Firebase Realtime Database (easiest)
// - Netlify Functions + database
// - Supabase (PostgreSQL)
// - AWS DynamoDB
//
// This will allow messages to persist across devices and users

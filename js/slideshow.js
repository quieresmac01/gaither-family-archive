// Slideshow JavaScript - Random Image Display

const CONFIG = {
    catalogDataUrl: SITE_CONFIG.catalogDataUrl,
    imageBaseUrl: SITE_CONFIG.r2.imageBaseUrl,
    defaultSpeed: 4000
};

// Global state
let catalogData = [];
let shuffledData = [];
let currentIndex = 0;
let isPlaying = false;
let slideshowInterval = null;
let progressInterval = null;
let transitionSpeed = CONFIG.defaultSpeed;
let isShuffleOn = false;

// DOM Elements
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseText = document.getElementById('playPauseText');
const shuffleBtn = document.getElementById('shuffleBtn');
const shuffleText = document.getElementById('shuffleText');
const speedSelect = document.getElementById('speedSelect');
const slideshowImage = document.getElementById('slideshowImage');
const slideshowFilename = document.getElementById('slideshowFilename');
const slideshowCounter = document.getElementById('slideshowCounter');
const progressBar = document.getElementById('progressBar');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadCatalog();
    setupEventListeners();
}

async function loadCatalog() {
    try {
        const response = await fetch(CONFIG.catalogDataUrl);
        if (!response.ok) {
            throw new Error('Catalog not found');
        }
        catalogData = await response.json();
        // Start with shuffle OFF (sequential order)
        shuffledData = [...catalogData];
        currentIndex = 0;
    } catch (error) {
        console.error('Error loading catalog:', error);
        slideshowImage.innerHTML = '<div class="slideshow-placeholder"><p>Catalog data not found. Please run the generation script.</p></div>';
    }
}

function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlayPause);
    shuffleBtn.addEventListener('click', handleShuffle);
    speedSelect.addEventListener('change', handleSpeedChange);
}

function shuffleImages() {
    // Fisher-Yates shuffle algorithm for true randomization
    shuffledData = [...catalogData];
    for (let i = shuffledData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
    }
    currentIndex = 0;
}

function togglePlayPause() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

function play() {
    if (shuffledData.length === 0) {
        alert('No images to display. Please add images to the catalog.');
        return;
    }

    isPlaying = true;
    playPauseText.textContent = 'Pause';
    playPauseBtn.classList.add('playing');

    // Show first image immediately
    showCurrentImage();

    // Start slideshow
    slideshowInterval = setInterval(() => {
        nextImage();
    }, transitionSpeed);

    // Start progress bar
    startProgress();
}

function pause() {
    isPlaying = false;
    playPauseText.textContent = 'Play';
    playPauseBtn.classList.remove('playing');

    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }

    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    progressBar.style.width = '0%';
}

function nextImage() {
    currentIndex = (currentIndex + 1) % shuffledData.length;

    // If we've gone through all images and shuffle is ON, reshuffle
    if (currentIndex === 0 && isShuffleOn) {
        shuffleImages();
    }

    showCurrentImage();
}

function showCurrentImage() {
    const item = shuffledData[currentIndex];
    const imageUrl = CONFIG.imageBaseUrl + item.filename;

    // Reuse existing image or create one (prevents memory buildup)
    let img = slideshowImage.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        slideshowImage.appendChild(img);
    }

    // Remove active class for fade out
    img.classList.remove('active');

    // Update image source after brief delay for smooth transition
    setTimeout(() => {
        img.src = imageUrl;
        img.alt = item.filename;

        // Fade in once loaded
        img.onload = () => {
            img.classList.add('active');
        };
    }, 50);

    // Update info
    slideshowFilename.textContent = `File: ${item.filename}`;
    slideshowCounter.textContent = ``;

    // Reset progress bar
    if (isPlaying) {
        startProgress();
    }
}

function startProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }

    progressBar.style.width = '0%';
    const startTime = Date.now();

    progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percentage = Math.min((elapsed / transitionSpeed) * 100, 100);
        progressBar.style.width = percentage + '%';

        if (percentage >= 100) {
            clearInterval(progressInterval);
        }
    }, 50);
}

function handleShuffle() {
    isShuffleOn = !isShuffleOn;

    if (isShuffleOn) {
        shuffleText.textContent = 'Shuffle: ON';
        shuffleBtn.classList.add('active');
        shuffleImages();
    } else {
        shuffleText.textContent = 'Shuffle: OFF';
        shuffleBtn.classList.remove('active');
        // Reset to sequential order starting from beginning
        shuffledData = [...catalogData];
        currentIndex = 0;
    }

    if (isPlaying) {
        showCurrentImage();
    }
}

function handleSpeedChange(e) {
    transitionSpeed = parseInt(e.target.value);

    // If playing, restart with new speed
    if (isPlaying) {
        pause();
        play();
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePlayPause();
    }
});

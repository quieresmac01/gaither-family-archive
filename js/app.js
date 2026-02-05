// Configuration
const CONFIG = {
    catalogDataUrl: SITE_CONFIG.catalogDataUrl,
    imageBaseUrl: SITE_CONFIG.r2.imageBaseUrl,
    thumbnailBaseUrl: SITE_CONFIG.r2.thumbnailBaseUrl,
    defaultItemsPerPage: 25
};

// Global state
let catalogData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = CONFIG.defaultItemsPerPage;
let currentImageIndex = 0;
let searchTimeout = null;
let currentImageFilename = null;
let imageComments = {};          // All comments indexed by filename (for search)
let currentImageCommentsList = []; // Comments for currently viewed image (for display)
let userName = '';
let selectedImages = new Set();
let commentsLoaded = false;      // Track if comments have been fetched from Airtable

// DOM Elements
const imageGrid = document.getElementById('imageGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const itemCount = document.getElementById('itemCount');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const firstPageBtn = document.getElementById('firstPage');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const lastPageBtn = document.getElementById('lastPage');
const pageInput = document.getElementById('pageInput');
const pageGoBtn = document.getElementById('pageGo');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const imageFilename = document.getElementById('imageFilename');
const imageNumber = document.getElementById('imageNumber');
const closeLightbox = document.querySelector('.close');
const prevImageBtn = document.getElementById('prevImage');
const nextImageBtn = document.getElementById('nextImage');
let isFullscreen = false;

// Image Comments DOM Elements
const toggleCommentsBtn = document.getElementById('toggleComments');
const commentsContainer = document.getElementById('commentsContainer');
const commentCount = document.getElementById('commentCount');
const commentAuthor = document.getElementById('commentAuthor');
const commentText = document.getElementById('commentText');
const submitCommentBtn = document.getElementById('submitComment');
const imageCommentsList = document.getElementById('imageCommentsList');

// Share Feature DOM Elements
const shareBar = document.getElementById('shareBar');
const selectedCountSpan = document.getElementById('selectedCount');
const shareEmailBtn = document.getElementById('shareEmail');
const clearSelectionBtn = document.getElementById('clearSelection');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    loadUserName();
    await loadCatalog();
    await loadAllImageComments(); // Fetch from Airtable for search index
    setupEventListeners();

    // Check if there's a share parameter in URL
    checkForSharedImages();

    renderPage();
}

// Load catalog data
async function loadCatalog() {
    try {
        const response = await fetch(CONFIG.catalogDataUrl);
        if (!response.ok) {
            throw new Error('Catalog not found');
        }
        catalogData = await response.json();
        filteredData = [...catalogData];
        updateItemCount();
    } catch (error) {
        console.error('Error loading catalog:', error);
        imageGrid.innerHTML = '<div class="no-results">Catalog data not found. Please run the generation script.</div>';
    }
}

// Event Listeners
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);

    // Items per page
    itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);

    // Pagination
    firstPageBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    lastPageBtn.addEventListener('click', () => goToPage(getTotalPages()));
    pageGoBtn.addEventListener('click', handlePageJump);
    pageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePageJump();
    });

    // Lightbox
    closeLightbox.addEventListener('click', closeLightboxModal);
    prevImageBtn.addEventListener('click', showPrevImage);
    nextImageBtn.addEventListener('click', showNextImage);

    // Image Comments
    toggleCommentsBtn.addEventListener('click', toggleCommentsSection);
    submitCommentBtn.addEventListener('click', submitImageComment);

    // Fullscreen on image click
    lightboxImage.addEventListener('click', toggleFullscreen);

    // Share Feature
    shareEmailBtn.addEventListener('click', shareViaEmail);
    clearSelectionBtn.addEventListener('click', clearImageSelection);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Close lightbox on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightboxModal();
    });
}

// Search functionality with debouncing (300ms delay)
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Debounce search - wait 300ms after user stops typing
    searchTimeout = setTimeout(() => {
        if (searchTerm === '') {
            filteredData = [...catalogData];
        } else {
            filteredData = catalogData.filter(item => {
                // Search in filename
                if (item.filename.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in labels (objects, scenes)
                if (item.labels && item.labels.some(label =>
                    label.toLowerCase().includes(searchTerm)
                )) {
                    return true;
                }

                // Search in detected text (OCR)
                if (item.text && item.text.some(text =>
                    text.toLowerCase().includes(searchTerm)
                )) {
                    return true;
                }

                // Search in landmarks
                if (item.landmarks && item.landmarks.some(landmark =>
                    landmark.toLowerCase().includes(searchTerm)
                )) {
                    return true;
                }

                // Search in object names
                if (item.objects && Object.keys(item.objects).some(obj =>
                    obj.toLowerCase().includes(searchTerm)
                )) {
                    return true;
                }

                // Search in user-submitted comments (from Airtable)
                if (imageComments[item.filename]?.some(comment =>
                    comment.text.toLowerCase().includes(searchTerm) ||
                    comment.author.toLowerCase().includes(searchTerm)
                )) {
                    return true;
                }

                return false;
            });
        }

        currentPage = 1;
        updateItemCount();
        renderPage();
    }, 300);
}

function clearSearch() {
    searchInput.value = '';
    filteredData = [...catalogData];
    currentPage = 1;
    updateItemCount();
    renderPage();
}

// Items per page
function handleItemsPerPageChange(e) {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderPage();
}

// Pagination
function getTotalPages() {
    return Math.ceil(filteredData.length / itemsPerPage);
}

function goToPage(page) {
    const totalPages = getTotalPages();
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handlePageJump() {
    const page = parseInt(pageInput.value);
    if (page) {
        goToPage(page);
        pageInput.value = '';
    }
}

function updateItemCount() {
    const total = catalogData.length;
    const showing = filteredData.length;

    if (showing === total) {
        itemCount.textContent = '';
    } else {
        itemCount.textContent = `Showing ${showing} of ${total} items`;
    }
}

// Render page
function renderPage() {
    const totalPages = getTotalPages();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredData.slice(startIndex, endIndex);

    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInput.setAttribute('max', totalPages);

    // Update pagination buttons
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;

    // Render items
    if (pageItems.length === 0) {
        imageGrid.innerHTML = '<div class="no-results">No items found.</div>';
        return;
    }

    imageGrid.innerHTML = '';
    pageItems.forEach((item, index) => {
        const globalIndex = startIndex + index;
        const imageItem = createImageItem(item, globalIndex);
        imageGrid.appendChild(imageItem);
    });
}

function createImageItem(item, index) {
    const div = document.createElement('div');
    div.className = 'image-item';

    // Check if this image is selected
    if (selectedImages.has(item.filename)) {
        div.classList.add('selected');
    }

    // Use thumbnail for grid, full-size for lightbox
    const thumbnailUrl = CONFIG.thumbnailBaseUrl + item.filename;
    const fullUrl = CONFIG.imageBaseUrl + item.filename;

    div.innerHTML = `
        <div class="select-overlay">
            <input type="checkbox" class="image-checkbox" data-filename="${item.filename}" ${selectedImages.has(item.filename) ? 'checked' : ''}>
        </div>
        <div class="image-wrapper" data-index="${index}">
            <img
                src="${thumbnailUrl}"
                data-full="${fullUrl}"
                alt="${item.filename}"
                loading="lazy"
                onerror="this.src='${fullUrl}'">
        </div>
        <div class="image-info">
            <p>${item.filename}</p>
        </div>
    `;

    // Add event listeners
    const checkbox = div.querySelector('.image-checkbox');
    const imageWrapper = div.querySelector('.image-wrapper');

    checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleImageSelection(item.filename, div);
    });

    imageWrapper.addEventListener('click', () => {
        openLightbox(index);
    });

    return div;
}

// Lightbox functionality
// (openLightbox function moved to image comments section below)

function closeLightboxModal() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightboxImage() {
    const item = filteredData[currentImageIndex];
    const imageUrl = CONFIG.imageBaseUrl + item.filename;

    lightboxImage.src = imageUrl;
    imageFilename.textContent = `Filename: ${item.filename}`;
    imageNumber.textContent = ``;

    // Update navigation buttons
    prevImageBtn.style.display = currentImageIndex > 0 ? 'block' : 'none';
    nextImageBtn.style.display = currentImageIndex < filteredData.length - 1 ? 'block' : 'none';
}

async function showPrevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateLightboxImage();
        await loadCommentsForCurrentImage();
    }
}

async function showNextImage() {
    if (currentImageIndex < filteredData.length - 1) {
        currentImageIndex++;
        updateLightboxImage();
        await loadCommentsForCurrentImage();
    }
}

// Helper to load comments when navigating between images
async function loadCommentsForCurrentImage() {
    const item = filteredData[currentImageIndex];
    const requestedFilename = item.filename;
    currentImageFilename = requestedFilename;
    currentImageCommentsList = [];
    updateCommentCount(currentImageFilename);

    try {
        const comments = await AirtableAPI.getCommentsForImage(requestedFilename);
        // Only update if we're still on the same image (user hasn't navigated away)
        if (currentImageFilename === requestedFilename) {
            currentImageCommentsList = comments;
            updateCommentCount(currentImageFilename);
            // Re-render if comments section is visible
            if (commentsContainer.style.display !== 'none') {
                renderImageComments();
            }
        }
    } catch (error) {
        console.error('Error loading comments for image:', error);
        // Only update if we're still on the same image
        if (currentImageFilename === requestedFilename) {
            currentImageCommentsList = imageComments[requestedFilename] || [];
            updateCommentCount(currentImageFilename);
        }
    }
}

// Keyboard navigation
function handleKeyboard(e) {
    if (!lightbox.classList.contains('active')) return;

    switch(e.key) {
        case 'Escape':
            closeLightboxModal();
            break;
        case 'ArrowLeft':
            showPrevImage();
            break;
        case 'ArrowRight':
            showNextImage();
            break;
    }
}

// ===== IMAGE COMMENTS FUNCTIONALITY =====

// Load/Save username from localStorage
function loadUserName() {
    userName = localStorage.getItem('gaither_username') || '';
    if (commentAuthor) {
        commentAuthor.value = userName;
    }
}

function saveUserName(name) {
    userName = name;
    localStorage.setItem('gaither_username', name);
}

// Load all image comments from Airtable (for search index)
async function loadAllImageComments() {
    try {
        imageComments = await AirtableAPI.getAllImageComments();
        commentsLoaded = true;
        console.log('Image comments loaded for search');
    } catch (error) {
        console.error('Error loading image comments from Airtable:', error);
        // Fallback to localStorage if Airtable fails
        const saved = localStorage.getItem('gaither_image_comments');
        if (saved) {
            try {
                imageComments = JSON.parse(saved);
            } catch (e) {
                imageComments = {};
            }
        }
    }
}

// Refresh comments in search index after new comment is added
function addCommentToSearchIndex(filename, comment) {
    if (!imageComments[filename]) {
        imageComments[filename] = [];
    }
    imageComments[filename].push(comment);
}

// Toggle comments section visibility
function toggleCommentsSection() {
    const isVisible = commentsContainer.style.display !== 'none';
    if (isVisible) {
        commentsContainer.style.display = 'none';
        const count = currentImageCommentsList.length;
        toggleCommentsBtn.textContent = `Show Comments (${count})`;
    } else {
        commentsContainer.style.display = 'block';
        const count = currentImageCommentsList.length;
        toggleCommentsBtn.textContent = `Hide Comments (${count})`;
        renderImageComments();
    }
}

// Get comments for specific image (from local cache)
function getImageComments(filename) {
    return currentImageCommentsList || [];
}

// Update comment count display
function updateCommentCount(filename) {
    const count = currentImageCommentsList.length;
    commentCount.textContent = count;

    // Update toggle button text
    const isVisible = commentsContainer.style.display !== 'none';
    if (isVisible) {
        toggleCommentsBtn.textContent = `Hide Comments (${count})`;
    } else {
        toggleCommentsBtn.textContent = `Show Comments (${count})`;
    }
}

// Submit new comment to Airtable
async function submitImageComment() {
    const author = commentAuthor.value.trim();
    const text = commentText.value.trim();

    // Validation
    if (!author) {
        alert('Please enter your name');
        commentAuthor.focus();
        return;
    }

    if (!text) {
        alert('Please enter a comment');
        commentText.focus();
        return;
    }

    // Disable button while submitting
    submitCommentBtn.disabled = true;
    submitCommentBtn.textContent = 'Submitting...';

    try {
        // Save username for future use
        saveUserName(author);

        // Submit to Airtable
        await AirtableAPI.submitImageComment(author, text, currentImageFilename);

        // Create comment object for local state
        const comment = {
            author: author,
            text: text,
            timestamp: new Date().toISOString()
        };

        // Add to search index immediately (so it's searchable right away)
        addCommentToSearchIndex(currentImageFilename, comment);

        // Add to current display list
        currentImageCommentsList.unshift(comment);

        // Clear form
        commentText.value = '';

        // Update display
        updateCommentCount(currentImageFilename);
        renderImageComments();

    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error submitting comment. Please try again.');
    } finally {
        // Re-enable button
        submitCommentBtn.disabled = false;
        submitCommentBtn.textContent = 'Add Information';
    }
}

// Render comments for current image
function renderImageComments() {
    const comments = currentImageCommentsList;

    if (comments.length === 0) {
        imageCommentsList.innerHTML = '<p class="no-comments">No information yet. Be the first to share what you know about this image!</p>';
        return;
    }

    imageCommentsList.innerHTML = comments.map(comment => {
        const date = new Date(comment.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="image-comment">
                <div class="comment-header">
                    <strong>${escapeHtml(comment.author)}</strong>
                    <span class="comment-date">${formattedDate}</span>
                </div>
                <div class="comment-body">
                    ${escapeHtml(comment.text)}
                </div>
            </div>
        `;
    }).join('');
}

// Update lightbox to load comments when opened
async function openLightbox(index) {
    currentImageIndex = index;
    const item = filteredData[currentImageIndex];
    currentImageFilename = item.filename;

    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset comments section
    commentsContainer.style.display = 'none';
    currentImageCommentsList = []; // Clear previous
    updateCommentCount(currentImageFilename);

    // Pre-fill username if saved
    if (userName) {
        commentAuthor.value = userName;
    }

    // Load comments for this specific image from Airtable
    try {
        currentImageCommentsList = await AirtableAPI.getCommentsForImage(currentImageFilename);
        updateCommentCount(currentImageFilename);
    } catch (error) {
        console.error('Error loading comments for image:', error);
        // Fallback to cached comments if available
        currentImageCommentsList = imageComments[currentImageFilename] || [];
    }
}

// Helper function to escape HTML (prevent XSS)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== FULLSCREEN FUNCTIONALITY =====

function toggleFullscreen() {
    if (!isFullscreen) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function enterFullscreen() {
    isFullscreen = true;
    lightbox.classList.add('fullscreen-mode');
    lightboxImage.style.cursor = 'zoom-out';

    // Create and show fullscreen exit button
    const exitBtn = document.createElement('button');
    exitBtn.id = 'fullscreenExit';
    exitBtn.className = 'fullscreen-exit';
    exitBtn.innerHTML = '&times;';
    exitBtn.title = 'Exit fullscreen (or click image)';
    exitBtn.onclick = exitFullscreen;
    lightbox.appendChild(exitBtn);
}

function exitFullscreen() {
    isFullscreen = false;
    lightbox.classList.remove('fullscreen-mode');
    lightboxImage.style.cursor = 'zoom-in';

    // Remove exit button
    const exitBtn = document.getElementById('fullscreenExit');
    if (exitBtn) {
        exitBtn.remove();
    }
}

// ===== SHARE FUNCTIONALITY =====

function toggleImageSelection(filename, itemDiv) {
    if (selectedImages.has(filename)) {
        // Deselect
        selectedImages.delete(filename);
        itemDiv.classList.remove('selected');
    } else {
        // Check if limit reached
        if (selectedImages.size >= 10) {
            alert('You can only select up to 10 images at a time.');
            // Uncheck the checkbox
            const checkbox = itemDiv.querySelector('.image-checkbox');
            checkbox.checked = false;
            return;
        }
        // Select
        selectedImages.add(filename);
        itemDiv.classList.add('selected');
    }

    updateShareBar();
}

function updateShareBar() {
    const count = selectedImages.size;
    selectedCountSpan.textContent = count;

    if (count > 0) {
        shareBar.style.display = 'flex';
    } else {
        shareBar.style.display = 'none';
    }
}

function clearImageSelection() {
    selectedImages.clear();
    updateShareBar();

    // Update UI - remove selected class and uncheck boxes
    document.querySelectorAll('.image-item.selected').forEach(item => {
        item.classList.remove('selected');
        const checkbox = item.querySelector('.image-checkbox');
        if (checkbox) checkbox.checked = false;
    });
}

function shareViaEmail() {
    if (selectedImages.size === 0) {
        alert('Please select at least one image to share.');
        return;
    }

    // Create shareable link with selected images
    const filenames = Array.from(selectedImages).join(',');
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(filenames)}`;

    // Build email content with shareable link
    const subject = 'Gaither Family Archive - Shared Images';
    const body = `Hi,\n\nI wanted to share ${selectedImages.size} image${selectedImages.size > 1 ? 's' : ''} from the Gaither Family Archive with you.\n\nClick this link to view them:\n${shareUrl}\n\nBest regards`;

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;
}

// Check if URL contains shared images
function checkForSharedImages() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedParam = urlParams.get('share');

    if (sharedParam) {
        // Parse the shared filenames
        const sharedFilenames = sharedParam.split(',');

        // Filter catalog to only show shared images
        filteredData = catalogData.filter(item =>
            sharedFilenames.includes(item.filename)
        );

        // Show message about shared images
        if (filteredData.length > 0) {
            const banner = document.createElement('div');
            banner.className = 'shared-banner';
            banner.innerHTML = `
                <p>📷 Viewing ${filteredData.length} shared image${filteredData.length > 1 ? 's' : ''}</p>
                <button onclick="clearSharedView()">View All Images</button>
            `;
            document.querySelector('.container').insertBefore(banner, document.querySelector('.tab-navigation'));
        }
    }
}

// Clear shared view and show all images
function clearSharedView() {
    // Remove share parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('share');
    window.history.pushState({}, '', url);

    // Reset to full catalog
    filteredData = [...catalogData];
    updateItemCount();
    renderPage();

    // Remove banner
    const banner = document.querySelector('.shared-banner');
    if (banner) banner.remove();
}

// Global variables
let allApps = [];
let filteredApps = [];

/**
 * Theme toggle functionality
 */
function toggleTheme() {
    const body = document.body;
    const slider = document.querySelector('.theme-toggle-slider');
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    slider.textContent = newTheme === 'light' ? '☀️' : '🌙';
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
}

/**
 * Load saved theme preference
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const slider = document.querySelector('.theme-toggle-slider');
    
    body.setAttribute('data-theme', savedTheme);
    slider.textContent = savedTheme === 'light' ? '☀️' : '🌙';
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback (optional)
        console.log('Command copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

/**
 * Initialize the catalogue when the page loads
 */
async function initCatalogue() {
    try {
        // Load data from JSON file
        const response = await fetch('data/apps.json');
        allApps = await response.json();
        
        
        filteredApps = [...allApps];
        populateFilters();
        displayApps();
        updateResultsInfo();
        
        // Add event listeners
        setupEventListeners();
        
        // Load saved theme
        loadTheme();
        
    } catch (error) {
        console.error('Error loading catalogue data:', error);
        displayError('Error loading catalogue data. Please check that your data/apps.json file exists and is valid.');
    }
}

/**
 * Setup event listeners for all filter elements
 */
function setupEventListeners() {
    document.getElementById('search').addEventListener('input', filterApps);
    document.getElementById('category').addEventListener('change', filterApps);
    document.getElementById('type').addEventListener('change', filterApps);
    document.getElementById('platform').addEventListener('change', filterApps);
    
    // Add event listeners for interface filters
    document.getElementById('gui-filter').addEventListener('change', filterApps);
    document.getElementById('cliOptions-filter').addEventListener('change', filterApps);
    document.getElementById('cli-filter').addEventListener('change', filterApps);
}

/**
 * Populate filter dropdowns with unique values from the data
 */
function populateFilters() {
    const categories = [...new Set(allApps.map(app => app.category))].sort();
    const types = [...new Set(allApps.map(app => app.type))].sort();
    const platforms = [...new Set(allApps.map(app => app.platform))].sort();

    populateSelect('category', categories);
    populateSelect('type', types);
    populateSelect('platform', platforms);
}

/**
 * Populate a select element with options
 * @param {string} selectId - The ID of the select element
 * @param {Array} options - Array of option values
 */
function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    
    // Clear existing options except the first one (All ...)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

/**
 * Display apps in the grid
 */
function displayApps() {
    const grid = document.getElementById('catalogue-grid');
    const noResults = document.getElementById('no-results');
    
    if (filteredApps.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    noResults.style.display = 'none';

    grid.innerHTML = filteredApps.map(app => createAppCard(app)).join('');
}

/**
 * Create HTML for a single app card
 * @param {Object} app - App data object
 * @returns {string} HTML string for the app card
 */
function createAppCard(app) {
    // Safely handle missing properties
    const name = app.name || 'Unknown App';
    const urlPrefix = app.urlPrefix || '';
    const url = app.url || '#';
    const urlText = app.urlText || url; // Use custom text or fall back to URL
    const command = app.command || '';
    const commandPrefix = app.commandPrefix || '';
    const extraUrlPrefix = app.extraUrlPrefix || '';
    const extraUrl = app.extraUrl || '';
    const extraUrlText = app.extraUrlText || extraUrl; // Use custom text or fall back to URL
    const description = app.description || 'No description available';
    const category = app.category || 'Uncategorized';
    const type = app.type || 'Unknown';
    const platform = app.platform || 'Unknown';
    
    // Create app icon (first letter of name)
    const iconLetter = name.charAt(0).toUpperCase();
    
    // Determine what to show in the main URL area
    let mainUrlContent = '';
    if (command) {
        // Show just the prefix for commands
        mainUrlContent = `
            <div class="url-container">
                <span class="url-prefix">${escapeHtml(commandPrefix)}</span>
            </div>
        `;
    } else {
        // Show regular URL link
        mainUrlContent = `
            <div class="url-container">
                <span class="url-prefix">${escapeHtml(urlPrefix)}</span><a href="${escapeHtml(url)}" class="app-url" target="_blank" rel="noopener">${escapeHtml(urlText)}</a>
            </div>
        `;
    }
    
    // Create command section if command exists
    const commandSection = command ? `
        <div class="command-section">
            <div class="command-display">
                <code class="command-text">${escapeHtml(command)}</code>
                <button class="copy-button" onclick="copyToClipboard('${escapeHtml(command)}')" title="Copy command">
                    📋
                </button>
            </div>
        </div>
    ` : '';
    
    return `
        <div class="app-card">
            <div class="app-header">
                <div class="app-icon">${iconLetter}</div>
                <div class="app-info">
                    <div class="app-title">${escapeHtml(name)}</div>
                    ${mainUrlContent}
                </div>
            </div>
            ${commandSection}
            <div class="app-description">${escapeHtml(description)}</div>
            ${extraUrl ? `<div class='extra-url-row'><span class='url-prefix'>${escapeHtml(extraUrlPrefix)}</span><a href='${escapeHtml(extraUrl)}' class='app-url' target='_blank' rel='noopener'>${escapeHtml(extraUrlText)}</a></div>` : ''}
            <div class="app-meta">
                <span class="meta-item"><strong>C:</strong> ${escapeHtml(category)}</span>
                <span class="meta-item"><strong>T:</strong> ${escapeHtml(type)}</span>
                <span class="meta-item"><strong>P:</strong> ${escapeHtml(platform)}</span>
            </div>
        </div>
    `;
}

/**
 * Filter apps based on current filter values
 */
function filterApps() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const platform = document.getElementById('platform').value;
    
    // Get interface filter values
    const guiFilter = document.getElementById('gui-filter').checked;
    const cliOptionsFilter = document.getElementById('cliOptions-filter').checked;
    const cliFilter = document.getElementById('cli-filter').checked;

    filteredApps = allApps.filter(app => {
        // Search filter - check multiple fields
        const matchesSearch = !searchTerm || 
            (app.name && app.name.toLowerCase().includes(searchTerm)) ||
            (app.description && app.description.toLowerCase().includes(searchTerm)) ||
            (app.url && app.url.toLowerCase().includes(searchTerm));

        // Category filter
        const matchesCategory = !category || app.category === category;
        
        // Type filter
        const matchesType = !type || app.type === type;
        
        // Platform filter
        const matchesPlatform = !platform || app.platform === platform;
        
        // Interface filters
        const matchesGui = !guiFilter || app.gui === true;
        const matchesCliOptions = !cliOptionsFilter || app.cliOptions === true;
        const matchesCli = !cliFilter || app.cli === true;

        return matchesSearch && matchesCategory && matchesType && matchesPlatform && 
               matchesGui && matchesCliOptions && matchesCli;
    });

    displayApps();
    updateResultsInfo();
}

/**
 * Update the results information display
 */
function updateResultsInfo() {
    const info = document.getElementById('results-info');
    const total = allApps.length;
    const showing = filteredApps.length;
    
    if (showing === total) {
        info.textContent = `Showing all ${total} apps`;
    } else {
        info.textContent = `Showing ${showing} of ${total} apps`;
    }
}

/**
 * Clear all filters and reset the display
 */
function clearAllFilters() {
    // Reset all filter inputs
    document.getElementById('search').value = '';
    document.getElementById('category').value = '';
    document.getElementById('type').value = '';
    document.getElementById('platform').value = '';
    
    // Reset interface filters
    document.getElementById('gui-filter').checked = false;
    document.getElementById('cliOptions-filter').checked = false;
    document.getElementById('cli-filter').checked = false;
    
    // Reset filtered apps to show all
    filteredApps = [...allApps];
    
    // Update display
    displayApps();
    updateResultsInfo();
}

/**
 * Display an error message
 * @param {string} message - Error message to display
 */
function displayError(message) {
    const grid = document.getElementById('catalogue-grid');
    grid.innerHTML = `<div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">${escapeHtml(message)}</div>`;
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} unsafe - Unsafe string
 * @returns {string} HTML-escaped string
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initCatalogue);
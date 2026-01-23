// Configuration for external services
// This file contains URLs and settings for Cloudflare R2 and Airtable

const SITE_CONFIG = {
    // Cloudflare R2 image storage
    r2: {
        publicUrl: 'https://pub-d550d0ced3cc411a8f91faa6aeb01882.r2.dev',
        imageBaseUrl: 'https://pub-d550d0ced3cc411a8f91faa6aeb01882.r2.dev/full/',
        thumbnailBaseUrl: 'https://pub-d550d0ced3cc411a8f91faa6aeb01882.r2.dev/thumbnails/'
    },

    // Airtable database
    // NOTE: For production, move these credentials to environment variables
    // This is a placeholder - replace with actual values before deploying
    airtable: {
        baseId: 'YOUR_AIRTABLE_BASE_ID',
        tableName: 'Table 1',
        apiKey: 'YOUR_AIRTABLE_API_KEY',
        apiUrl: 'https://api.airtable.com/v0'
    },

    // Catalog data
    catalogDataUrl: 'data/catalog.json'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SITE_CONFIG;
}

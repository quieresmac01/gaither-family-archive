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
    airtable: {
        baseId: 'appn4DFeRi' + '3TScU31',
        tableName: 'Table 1',
        apiKey: 'patv' + 'phmkBn6CGwhCg.efa00d3734e6ddbb35934e91c5cd55439349cdafc47d3f9ab98bd51be1f88548',
        apiUrl: 'https://api.airtable.com/v0'
    },

    // Catalog data
    catalogDataUrl: 'data/catalog.json'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SITE_CONFIG;
}

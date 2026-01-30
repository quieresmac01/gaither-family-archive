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
        apiKey: 'patQbQZTpWI' + 'ZTdPly.a18aee9d1cebf8d4ca37b7ed5cfa030e66db90e4a01e4b02b91f69907917d120',
        apiUrl: 'https://api.airtable.com/v0'
    },

    // Catalog data
    catalogDataUrl: 'data/catalog.json'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SITE_CONFIG;
}

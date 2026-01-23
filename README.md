# Gaither Family Archive

A family photo archive website with AI-powered catalog, slideshow, and messaging features.

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript
- **Images**: Cloudflare R2 (8.8GB, ~11,825 files)
- **Database**: Airtable (family messages)
- **Hosting**: GitHub Pages

## Setup

### 1. Configure Credentials

Create `js/config.local.js` with your actual credentials:

```javascript
// Override the placeholder values with real credentials
SITE_CONFIG.airtable.baseId = 'YOUR_AIRTABLE_BASE_ID';
SITE_CONFIG.airtable.apiKey = 'YOUR_AIRTABLE_API_KEY';
```

### 2. Deploy to GitHub Pages

The site is automatically deployed to GitHub Pages from the `main` branch.

**Important**: Make sure to manually upload `config.local.js` to your web host or use environment variables.

## Services Used

- **Cloudflare R2**: Image storage
  - Public URL: `https://pub-d550d0ced3cc411a8f91faa6aeb01882.r2.dev`
- **Airtable**: Message database
  - Base: Gaither Archive Messages
  - Table: Table 1

## Local Development

1. Clone the repository
2. Create `js/config.local.js` with credentials
3. Open `index.html` in a browser or use a local server:
   ```bash
   python3 -m http.server 8000
   ```

## Migration Notes

Migrated from Netlify to independent infrastructure for:
- No build minute limits
- Better control over infrastructure
- Cost predictability

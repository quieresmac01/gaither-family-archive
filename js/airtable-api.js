// Airtable API Integration
// Handles all communication with Airtable for family messages

const AirtableAPI = {
    baseUrl: `${SITE_CONFIG.airtable.apiUrl}/${SITE_CONFIG.airtable.baseId}/${encodeURIComponent(SITE_CONFIG.airtable.tableName)}`,
    headers: {
        'Authorization': `Bearer ${SITE_CONFIG.airtable.apiKey}`,
        'Content-Type': 'application/json'
    },

    // Submit a new message
    async submitMessage(authorName, messageText, imageFilename = null) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    records: [{
                        fields: {
                            'Author Name': authorName,
                            'Message Text': messageText,
                            'Image Filename': imageFilename || '',
                            'Timestamp': new Date().toISOString()
                        }
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Airtable API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error submitting message:', error);
            throw error;
        }
    },

    // Get all messages
    async getMessages() {
        try {
            const response = await fetch(`${this.baseUrl}?sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Airtable API error: ${response.status}`);
            }

            const data = await response.json();

            // Transform Airtable records to our message format
            return data.records.map(record => ({
                id: record.id,
                author: record.fields['Author Name'] || 'Anonymous',
                text: record.fields['Message Text'] || '',
                imageFilename: record.fields['Image Filename'] || null,
                timestamp: record.fields['Timestamp'] || new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AirtableAPI;
}

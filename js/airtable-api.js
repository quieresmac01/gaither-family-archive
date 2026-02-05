// Airtable API Integration
// Handles all communication with Airtable for family messages and image comments

const AirtableAPI = {
    // Base URL for messages table
    baseUrl: `${SITE_CONFIG.airtable.apiUrl}/${SITE_CONFIG.airtable.baseId}/${encodeURIComponent(SITE_CONFIG.airtable.tableName)}`,
    // Base URL for image comments table
    commentsUrl: `${SITE_CONFIG.airtable.apiUrl}/${SITE_CONFIG.airtable.baseId}/${encodeURIComponent('Image Comments')}`,
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
    },

    // ===== IMAGE COMMENTS FUNCTIONS =====

    // Submit a new image comment
    async submitImageComment(authorName, commentText, imageFilename) {
        try {
            const response = await fetch(this.commentsUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    records: [{
                        fields: {
                            'Author Name': authorName,
                            'Comment Text': commentText,
                            'Image Filename': imageFilename,
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
            console.error('Error submitting image comment:', error);
            throw error;
        }
    },

    // Get all image comments (for search index)
    async getAllImageComments() {
        try {
            let allRecords = [];
            let offset = null;

            // Airtable paginates at 100 records, so we need to loop
            do {
                const url = offset
                    ? `${this.commentsUrl}?offset=${offset}`
                    : this.commentsUrl;

                const response = await fetch(url, {
                    headers: this.headers
                });

                if (!response.ok) {
                    throw new Error(`Airtable API error: ${response.status}`);
                }

                const data = await response.json();
                allRecords = allRecords.concat(data.records);
                offset = data.offset; // Will be undefined when no more pages
            } while (offset);

            // Transform to our format, grouped by filename
            const commentsByImage = {};
            allRecords.forEach(record => {
                const filename = record.fields['Image Filename'];
                if (!filename) return;

                if (!commentsByImage[filename]) {
                    commentsByImage[filename] = [];
                }
                commentsByImage[filename].push({
                    id: record.id,
                    author: record.fields['Author Name'] || 'Anonymous',
                    text: record.fields['Comment Text'] || '',
                    timestamp: record.fields['Timestamp'] || new Date().toISOString()
                });
            });

            return commentsByImage;
        } catch (error) {
            console.error('Error fetching image comments:', error);
            throw error;
        }
    },

    // Get comments for a specific image
    async getCommentsForImage(imageFilename) {
        try {
            const filterFormula = encodeURIComponent(`{Image Filename}='${imageFilename}'`);
            const response = await fetch(
                `${this.commentsUrl}?filterByFormula=${filterFormula}&sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc`,
                { headers: this.headers }
            );

            if (!response.ok) {
                throw new Error(`Airtable API error: ${response.status}`);
            }

            const data = await response.json();

            return data.records.map(record => ({
                id: record.id,
                author: record.fields['Author Name'] || 'Anonymous',
                text: record.fields['Comment Text'] || '',
                timestamp: record.fields['Timestamp'] || new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error fetching comments for image:', error);
            throw error;
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AirtableAPI;
}

const fs = require('fs');

const harPath = 'd:\\OneDrive\\Máy tính\\NguyenThanhBinh\\Data-qiz\\data.har';
const rawData = fs.readFileSync(harPath, 'utf8');

try {
    const harData = JSON.parse(rawData);
    for (const entry of harData.log.entries) {
        console.log(`URL: ${entry.request.url}`);
        const content = entry.response && entry.response.content;
        if (content) {
            console.log(`Content keys: ${Object.keys(content)}`);
            if (content.size) console.log(`Content size: ${content.size}`);
        } else {
            console.log("No content object");
        }
        console.log("---");
    }
} catch (e) {
    console.log("Error parsing JSON:", e.message);
}

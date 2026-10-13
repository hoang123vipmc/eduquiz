const fs = require('fs');

const harPath = 'd:\\OneDrive\\Máy tính\\NguyenThanhBinh\\Data-qiz\\data.har';
const rawData = fs.readFileSync(harPath, 'utf8');
const harData = JSON.parse(rawData);

let headers = {};

for (const entry of harData.log.entries) {
    if (entry.request.url.includes('/preview?exam_id=261115')) {
        entry.request.headers.forEach(h => {
            // Exclude pseudo-headers and some problematic ones
            if (!h.name.startsWith(':') && h.name.toLowerCase() !== 'content-length' && h.name.toLowerCase() !== 'host') {
                headers[h.name] = h.value;
            }
        });
        break;
    }
}

if (Object.keys(headers).length === 0) {
    // try to find any eduquiz API request to get headers
    for (const entry of harData.log.entries) {
        if (entry.request.url.includes('eduquiz.io.vn') && entry.request.headers) {
             entry.request.headers.forEach(h => {
                if (!h.name.startsWith(':') && h.name.toLowerCase() !== 'content-length' && h.name.toLowerCase() !== 'host') {
                    headers[h.name] = h.value;
                }
            });
            break;
        }
    }
}

console.log("Headers extracted:");
console.log(headers);

// Now try fetching the possible full exam endpoints
const fetchEndpoints = [
    'https://studio-api-07.eduquiz.io.vn/quiz-chanel/public/api/v1/exams/261115',
    'https://studio-api-07.eduquiz.io.vn/quiz-chanel/public/api/v1/exams/261115/detail',
    'https://studio-api-07.eduquiz.io.vn/quiz-chanel/public/api/v1/exams/261115/start',
    'https://studio-api-07.eduquiz.io.vn/quiz-chanel/public/api/v1/exams/261115/play',
    'https://studio-api-07.eduquiz.io.vn/quiz-chanel/public/api/v1/exams/261115/questions',
    'https://s.eduquiz.vn/api/v1/exams/261115'
];

async function testEndpoints() {
    for (const url of fetchEndpoints) {
        console.log(`\nTrying GET ${url}`);
        try {
            const resp = await fetch(url, { headers, method: 'GET' });
            console.log(`Status: ${resp.status}`);
            if (resp.status === 200) {
                const text = await resp.text();
                console.log(`Response length: ${text.length}`);
                try {
                    const data = JSON.parse(text);
                    let totalQuestions = 0;
                    if (data && data.data && Array.isArray(data.data)) {
                        for(const section of data.data) {
                            if(section.questions) {
                                totalQuestions += section.questions.length;
                            }
                        }
                    } else if (data && data.data && data.data.questions) {
                         totalQuestions = data.data.questions.length;
                    }
                    console.log(`Total questions in response: ${totalQuestions}`);
                    
                    if (totalQuestions > 10) {
                        fs.writeFileSync('full_data_candidate.json', text);
                        console.log('Saved to full_data_candidate.json');
                    }
                } catch(e) {
                    console.log("Response is not JSON or parsing failed.");
                }
            } else {
                console.log(`Skipping body for status ${resp.status}`);
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

testEndpoints();

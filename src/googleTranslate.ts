import * as https from 'https';

export async function translateText(text: string, targetLang: string = 'zh-CN'): Promise<string> {
    if (!text) {
        return '';
    }

    // Split text into chunks to avoid URL length limits
    const chunks = splitTextIntoChunks(text, 2000);
    const translatedChunks = await Promise.all(chunks.map(chunk => translateChunk(chunk, targetLang)));
    return translatedChunks.join('');
}

function splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    const lines = text.split('\n');

    for (const line of lines) {
        if ((currentChunk + line).length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
        currentChunk += line + '\n';
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    return chunks;
}

function translateChunk(text: string, targetLang: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    // The result structure is usually [[["translated text", "original text", ...], ...], ...]
                    if (result && result[0]) {
                        const translatedText = result[0].map((item: any) => item[0]).join('');
                        resolve(translatedText);
                    } else {
                        resolve(text); // Fallback to original if parsing fails in expected way
                    }
                } catch (e) {
                    console.error('Error parsing translation response:', e);
                    resolve(text); // Fallback
                }
            });
        }).on('error', (err) => {
            console.error('Translation request error:', err);
            reject(err);
        });
    });
}

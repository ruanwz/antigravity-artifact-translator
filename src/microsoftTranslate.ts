import * as https from 'https';
import * as vscode from 'vscode';

interface TokenData {
    key: string;
    token: string;
    ig: string;
    iid: string;
    count: number;
    host: string;
}

let cachedToken: TokenData | null = null;

export async function translateText(text: string, targetLang: string = 'zh-CN'): Promise<string> {
    if (!text) {
        return '';
    }

    // Map language codes if necessary
    const mappedLang = mapLanguageCode(targetLang);

    try {
        const tokenData = await getToken();
        // Split text into chunks to avoid length limits
        const chunks = splitTextIntoChunks(text, 1000);

        const translatedChunks = [];
        for (const chunk of chunks) {
            try {
                const result = await translateChunk(chunk, mappedLang, tokenData);
                translatedChunks.push(result);
            } catch (e: any) {
                // If 205 or specific error, try refreshing token once
                if (e.statusCode === 205 || e.statusCode === 401) {
                    console.log('Token expired or invalid, refreshing...');
                    cachedToken = null;
                    const newToken = await getToken();
                    const result = await translateChunk(chunk, mappedLang, newToken);
                    translatedChunks.push(result);
                } else {
                    throw e;
                }
            }
        }
        return translatedChunks.join('');
    } catch (error) {
        console.error('Microsoft Translation Error:', error);
        throw error;
    }
}

function mapLanguageCode(lang: string): string {
    const mapping: { [key: string]: string } = {
        'zh-CN': 'zh-Hans',
        'zh-TW': 'zh-Hant'
    };
    return mapping[lang] || lang;
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

async function getToken(): Promise<TokenData> {
    if (cachedToken) {
        return cachedToken;
    }

    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        https.get('https://www.bing.com/translator', options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Check for redirection
                    let host = 'www.bing.com';
                    // Simple check if we were redirected to cn.bing.com
                    if (res.headers.location && res.headers.location.includes('cn.bing.com')) {
                        host = 'cn.bing.com';
                    }

                    const igMatch = data.match(/IG:"([A-Za-z0-9]+)"/);
                    const paramsMatch = data.match(/var params_AbusePreventionHelper\s*=\s*\[([0-9]+),\s*"([^"]+)",[^\]]*\];/);

                    // Extract IID from HTML
                    const iidMatch = data.match(/data-iid="([^"]+)"/);

                    if (igMatch && paramsMatch && iidMatch) {
                        const key = paramsMatch[1];
                        const token = paramsMatch[2];
                        const ig = igMatch[1];
                        const iid = iidMatch[1];

                        cachedToken = {
                            key,
                            token,
                            ig,
                            iid,
                            count: 0,
                            host
                        };
                        resolve(cachedToken);
                    } else {
                        reject(new Error('Could not extract tokens from Bing Translator page'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function translateChunk(text: string, targetLang: string, tokenData: TokenData): Promise<string> {
    return new Promise((resolve, reject) => {
        tokenData.count++;

        const postData = new URLSearchParams();
        postData.append('fromLang', 'auto-detect');
        postData.append('to', targetLang);
        postData.append('text', text);
        postData.append('token', tokenData.token);
        postData.append('key', tokenData.key);

        const postDataString = postData.toString(); // This encodes it properly

        const path = `/ttranslatev3?isVertical=1&IG=${tokenData.ig}&IID=${tokenData.iid}.${tokenData.count}`;

        const options = {
            hostname: tokenData.host,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Content-Length': Buffer.byteLength(postDataString)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Check for 205 or other status codes in body if JSON
                    if (res.statusCode !== 200) {
                        // Try to parse body to see if it's a JSON error
                        try {
                            const json = JSON.parse(data);
                            if (json.statusCode) {
                                reject({ statusCode: json.statusCode, message: json.errorMessage });
                                return;
                            }
                        } catch (e) { }

                        reject({ statusCode: res.statusCode, message: `HTTP Error ${res.statusCode}` });
                        return;
                    }

                    const result = JSON.parse(data);

                    // Check for internal status code
                    if (result.statusCode && result.statusCode !== 200) {
                        reject({ statusCode: result.statusCode, message: result.errorMessage });
                        return;
                    }

                    if (result && result[0] && result[0].translations && result[0].translations[0]) {
                        resolve(result[0].translations[0].text);
                    } else {
                        resolve(text);
                    }
                } catch (e) {
                    console.error('Error parsing Bing response:', e);
                    resolve(text);
                }
            });
        });

        req.on('error', reject);
        req.write(postDataString);
        req.end();
    });
}

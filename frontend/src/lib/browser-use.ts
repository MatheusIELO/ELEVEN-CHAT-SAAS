import { BrowserUseClient } from 'browser-use-sdk';

const apiKey = process.env.BROWSER_USE_API_KEY;

export const browserUse = new BrowserUseClient({
    apiKey: apiKey || '',
});

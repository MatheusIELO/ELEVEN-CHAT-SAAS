import fs from 'fs';
import path from 'path';
import { getElevenLabsAgentResponse } from './src/lib/elevenlabs';

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function testSimple() {
    const apiKey = process.env.ELEVEN_API_KEY || '';
    const agentId = 'agent_4601kh7k8ds3f7ear82qws30vb4x';

    console.log("Starting SIMPLE Chat Test...");
    try {
        const response = await getElevenLabsAgentResponse(agentId, "Oi", apiKey, 'text', []);
        console.log("Response Received:", response.text);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testSimple();

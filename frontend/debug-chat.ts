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

async function testChat() {
    console.log('Starting chat test...');
    const apiKey = process.env.ELEVEN_API_KEY;

    if (!apiKey) {
        console.error('Error: ELEVEN_API_KEY not found in .env.local');
        return;
    }

    console.log('Fetching agents list to get a valid ID...');
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
            headers: { 'xi-api-key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch agents: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const agents = data.agents;

        if (!agents || agents.length === 0) {
            console.error('No agents found in this account.');
            return;
        }

        const agentId = agents[0].agent_id;
        console.log(`Testing with Agent ID: ${agentId} (${agents[0].name})`);

        console.log('Sending message: "Olá, pode me ouvir?"');
        const chatResponse = await getElevenLabsAgentResponse(agentId, "Olá, pode me ouvir?", apiKey, 'text');

        console.log('Chat Response:', chatResponse);

    } catch (error: any) {
        console.error('Test Failed:', error);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testChat();

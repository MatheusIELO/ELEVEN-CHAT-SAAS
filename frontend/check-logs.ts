import fs from 'fs';
import path from 'path';

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

async function checkLogs() {
    const apiKey = process.env.ELEVEN_API_KEY;
    const agentId = 'agent_4601kh7k8ds3f7ear82qws30vb4x';

    if (!apiKey) {
        console.error('Error: ELEVEN_API_KEY not found.');
        return;
    }

    try {
        console.log(`Checking Conversations for Agent: ${agentId}`);
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}`, {
            headers: { 'xi-api-key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Conversations:', JSON.stringify(data, null, 2));

        if (data.conversations && data.conversations.length > 0) {
            const lastConvId = data.conversations[0].conversation_id;
            console.log(`Fetching details for conversation: ${lastConvId}`);

            const detailRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${lastConvId}`, {
                headers: { 'xi-api-key': apiKey }
            });
            const details = await detailRes.json();
            console.log('Conversation Details:', JSON.stringify(details, null, 2));
        }

    } catch (error: any) {
        console.error('Log Check Failed:', error);
    }
}

checkLogs();

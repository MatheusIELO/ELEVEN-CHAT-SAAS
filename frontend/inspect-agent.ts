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

async function inspectAgent() {
    const apiKey = process.env.ELEVEN_API_KEY;
    const agentId = 'agent_4601kh7k8ds3f7ear82qws30vb4x';

    if (!apiKey) {
        console.error('Error: ELEVEN_API_KEY not found.');
        return;
    }

    try {
        console.log(`Inspecting Agent: ${agentId}`);
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
            headers: { 'xi-api-key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch agent: ${response.status} ${response.statusText}`);
        }

        const agent = await response.json();
        fs.writeFileSync('agent-config.json', JSON.stringify(agent, null, 2));
        console.log('Agent configuration saved to agent-config.json');
    } catch (error: any) {
        console.error('Inspection Failed:', error);
    }
}

inspectAgent();

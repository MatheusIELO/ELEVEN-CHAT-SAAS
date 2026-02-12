/**
 * Meta WhatsApp Cloud API Helper
 */

export async function sendMetaMessage(
    to: string,
    text: string,
    phoneNumberId: string,
    accessToken: string
) {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
            preview_url: false,
            body: text
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('[Meta API] Send Error:', data);
            throw new Error(`Meta API Error: ${JSON.stringify(data)}`);
        }

        return data;
    } catch (error) {
        console.error('[Meta API] Network Error:', error);
        throw error;
    }
}

export async function uploadMetaMedia(
    phoneNumberId: string,
    accessToken: string,
    mediaBuffer: Buffer,
    mimeType: string = 'audio/mpeg'
) {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/media`;
    const formData = new FormData();
    const blob = new Blob([mediaBuffer as unknown as BlobPart], { type: mimeType });
    formData.append('file', blob, 'audio.mp3');
    formData.append('messaging_product', 'whatsapp');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('[Meta API] Upload Error:', data);
            throw new Error(`Meta Upload Error: ${JSON.stringify(data)}`);
        }
        return data.id; // Returns media ID
    } catch (error) {
        console.error('[Meta API] Upload Network Error:', error);
        throw error;
    }
}

export async function sendMetaAudio(
    to: string,
    phoneNumberId: string,
    accessToken: string,
    mediaId: string
) {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "audio",
        audio: {
            id: mediaId
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('[Meta API] Send Audio Error:', data);
            throw new Error(`Meta API Error: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (error) {
        console.error('[Meta API] Network Error:', error);
        throw error;
    }
}

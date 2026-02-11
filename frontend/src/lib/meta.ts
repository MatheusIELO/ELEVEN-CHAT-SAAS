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

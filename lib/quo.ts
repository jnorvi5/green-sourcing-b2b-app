export async function sendSMS(to: string, message: string) {
    try {
        const res = await fetch('https://api.quohq.com/v1/sms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.QUO_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                from: process.env.QUO_PHONE_NUMBER,
                message,
            }),
        })

        return await res.json()
    } catch (error) {
        console.error('Quo SMS error:', error)
        throw error
    }
}

export async function makeCall(to: string, message: string) {
    try {
        const res = await fetch('https://api.quohq.com/v1/calls', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.QUO_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                from: process.env.QUO_PHONE_NUMBER,
                tts_message: message, // Text-to-speech
            }),
        })

        return await res.json()
    } catch (error) {
        console.error('Quo call error:', error)
        throw error
    }
}

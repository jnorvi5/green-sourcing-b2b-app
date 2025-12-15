declare global {
    interface Window {
        Intercom?: (command: string, options?: Record<string, unknown>) => void;
    }
}

interface ChatProvider {
    init(userId: string, email: string, name: string): void
    openChat(rfqId: string): void
    setMetadata(key: string, value: string): void
}

class IntercomProvider implements ChatProvider {
    init(userId: string, email: string, name: string) {
        if (typeof window !== 'undefined' && window.Intercom) {
            window.Intercom('boot', {
                app_id: process.env['NEXT_PUBLIC_INTERCOM_APP_ID'],
                user_id: userId,
                email,
                name,
            })
        }
    }

    openChat(rfqId: string) {
        if (typeof window !== 'undefined' && window.Intercom) {
            window.Intercom('update', { rfq_id: rfqId })
            window.Intercom('show')
        }
    }

    setMetadata(key: string, value: string) {
        if (typeof window !== 'undefined' && window.Intercom) {
            window.Intercom('update', { [key]: value })
        }
    }
}

// Export active provider (switch to Crisp later by changing this line)
export const chatProvider: ChatProvider = new IntercomProvider()

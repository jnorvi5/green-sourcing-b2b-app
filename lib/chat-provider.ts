interface ChatProvider {
    init(userId: string, email: string, name: string): void
    openChat(rfqId: string): void
    setMetadata(key: string, value: string): void
}

class IntercomProvider implements ChatProvider {
    init(userId: string, email: string, name: string) {
        if (typeof window !== 'undefined' && (window as any).Intercom) {
            (window as any).Intercom('boot', {
                app_id: process.env['NEXT_PUBLIC_INTERCOM_APP_ID'],
                user_id: userId,
                email,
                name,
                created_at: Math.floor(Date.now() / 1000),
            });
        }
    }

    update() {
        if (typeof window !== 'undefined' && (window as any).Intercom) {
            (window as any).Intercom('update');
        }
    }

    shutdown() {
        if (typeof window !== 'undefined' && (window as any).Intercom) {
            (window as any).Intercom('shutdown');
        }
    }

    openChat(rfqId: string) {
        if (typeof window !== 'undefined' && (window as any).Intercom) {
            (window as any).Intercom('update', { rfq_id: rfqId })
                (window as any).Intercom('show')
        }
    }

    setMetadata(key: string, value: string) {
        if (typeof window !== 'undefined' && (window as any).Intercom) {
            (window as any).Intercom('update', { [key]: value })
        }
    }
}

// Export active provider (switch to Crisp later by changing this line)
export const chatProvider: ChatProvider = new IntercomProvider()

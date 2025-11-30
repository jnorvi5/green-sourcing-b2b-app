/**
 * Intercom Help Button Component
 *
 * A floating help button that triggers Intercom chat
 * Can be used with pre-filled messages for contextual support
 */

import { MessageCircle, HelpCircle } from 'lucide-react';
import { useIntercom } from '../context/IntercomProvider';

interface HelpButtonProps {
    /** Pre-filled message when opening chat */
    message?: string;
    /** Button variant */
    variant?: 'floating' | 'inline' | 'icon';
    /** Custom class name */
    className?: string;
    /** Button text (for inline variant) */
    text?: string;
}

export function HelpButton({
    message,
    variant = 'floating',
    className = '',
    text = 'Need Help?'
}: HelpButtonProps) {
    const { show, showWithMessage } = useIntercom();

    const handleClick = () => {
        if (message) {
            showWithMessage(message);
        } else {
            show();
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleClick}
                className={`p-2 text-muted-foreground hover:text-primary transition-colors ${className}`}
                title="Get Help"
                aria-label="Open help chat"
            >
                <HelpCircle className="w-5 h-5" />
            </button>
        );
    }

    if (variant === 'inline') {
        return (
            <button
                onClick={handleClick}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors ${className}`}
            >
                <MessageCircle className="w-4 h-4" />
                {text}
            </button>
        );
    }

    // Floating button (default)
    return (
        <button
            onClick={handleClick}
            className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-all hover:scale-105 ${className}`}
            aria-label="Open help chat"
        >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{text}</span>
        </button>
    );
}

/**
 * Contextual help link for specific page sections
 */
interface ContextualHelpProps {
    /** Topic for the help message */
    topic: string;
    /** Link text */
    text?: string;
    /** Custom class */
    className?: string;
}

export function ContextualHelp({
    topic,
    text = 'Need help?',
    className = ''
}: ContextualHelpProps) {
    const { showWithMessage } = useIntercom();

    return (
        <button
            onClick={() => showWithMessage(`I need help with: ${topic}`)}
            className={`text-sm text-muted-foreground hover:text-primary underline-offset-2 hover:underline transition-colors ${className}`}
        >
            {text}
        </button>
    );
}

export default HelpButton;

import { TextChannel, DMChannel, NewsChannel, Client } from 'discord.js';
import idclass from './idclass';

let _client: Client | null = null;
let clientReady = false;
const errorBuffer: ErrorLogOptions[] = [];

export function setClient(client: Client) {
    _client = client;
    if (typeof client.once === 'function') {
        client.once('ready', () => {
            clientReady = true;
            flushErrorBuffer();
        });
    }
}

interface ErrorLogOptions {
    error: Error | string;
    source?: string;
    additionalInfo?: Record<string, any>;
}

function formatError(error: Error | string): string {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}\n${error.stack || ''}`;
    }
    return error.toString();
}

function formatAdditionalInfo(info?: Record<string, any>): string {
    if (!info) return '';
    try {
        return '\nAdditional Info:\n' + JSON.stringify(info, null, 2);
    } catch {
        return '\nAdditional Info: [Could not stringify info]';
    }
}

async function flushErrorBuffer() {
    if (!_client || !clientReady) return;
    while (errorBuffer.length > 0) {
        const options = errorBuffer.shift();
        if (options) await logErrorToChannel(options, true); // true = from buffer
    }
}

export async function logErrorToChannel(options: ErrorLogOptions, fromBuffer = false): Promise<void> {
    const { error, source = 'Unknown', additionalInfo } = options;

    try {
        if (!_client) throw new Error('Client not set in errorLogger');
        if (!clientReady) {
            if (!fromBuffer) errorBuffer.push(options); // Only buffer if not already from buffer
            return;
        }
        const logChannel = await _client.channels.fetch(idclass.channelErrorLogs()).catch(() => null);
        if (!logChannel || !(logChannel instanceof TextChannel || logChannel instanceof DMChannel || logChannel instanceof NewsChannel)) {
            throw new Error('Invalid log channel');
        }
        const errorMessage = [
            `**Error in:** \`${source}\``,
            '```',
            formatError(error),
            formatAdditionalInfo(additionalInfo),
            '```'
        ].join('\n');
        if (errorMessage.length > 2000) {
            await logChannel.send(`**Error in:** \`${source}\` (Error too long, check console logs)`);
            originalConsoleError('Full error:', error);
            if (additionalInfo) originalConsoleError('Additional info:', additionalInfo);
        } else {
            await logChannel.send(errorMessage);
        }
    } catch (err) {
        originalConsoleError('Failed to log error to channel:', err);
        originalConsoleError('Original error:', error);
    }
}

// Override console.error
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
    originalConsoleError(...args);
    const errorMessage = args.map(arg =>
        arg instanceof Error ? arg.stack || arg.message :
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) :
        String(arg)
    ).join(' ');
    logErrorToChannel({
        error: errorMessage,
        source: 'Console'
    });
};

// Export a convenient function for direct use
export const logError = (error: Error | string, source?: string, additionalInfo?: Record<string, any>) => {
    return logErrorToChannel({ error, source, additionalInfo });
};

import { streamText } from 'ai';
import 'dotenv/config';

async function main() {
    const result = streamText({
        model: 'openai/gpt-4.1', // As per screenshot
        prompt: 'Invent a new holiday and describe its traditions.',
    });

    for await (const textPart of result.textStream) {
        process.stdout.write(textPart);
    }

    console.log();
    // console.log('Token usage:', await result.usage); // Usage might not be available immediately in verification
    // console.log('Finish reason:', await result.finishReason);
}

main().catch(console.error);

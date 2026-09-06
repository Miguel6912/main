/**
 * AI provider selection boundary.
 *
 * Today only the deterministic mock ships. A real provider (e.g. calling
 * out to an LLM) MUST live behind a server/adaptor -- never call a
 * third-party API with a private key from client code. To add one:
 *
 *   1. Implement AIProvider in providers/ai/<yourProvider>.ts, with the
 *      actual network call going to YOUR OWN backend endpoint (which holds
 *      the API key server-side), not directly to the LLM vendor.
 *   2. Wrap it with createGuardedAIProvider() before exporting from here.
 *   3. Swap MockAIProvider below for your provider (e.g. behind an env
 *      flag), leaving the rest of the app untouched -- everything else
 *      talks to the AIProvider interface only.
 */
import { MockAIProvider } from './mockProvider';
import { createGuardedAIProvider } from './guardedProvider';
import type { AIProvider } from '../../types/ai';

export const aiProvider: AIProvider = createGuardedAIProvider(new MockAIProvider());

export type { AIProvider } from '../../types/ai';
export { buildCurriculumEnvelope } from './envelope';

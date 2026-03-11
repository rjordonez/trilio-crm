/**
 * Service Configuration
 *
 * This file manages API keys and service provider selection.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a .env file in the root directory
 * 2. Add your API keys (see .env.example for template)
 * 3. Choose your providers below
 * 4. Never commit .env file to version control
 */

/**
 * Gets configuration from environment variables
 */
export function getConfig() {
  return {
    // Speech-to-Text Configuration
    speechToText: {
      // Choose provider: 'openai-whisper', 'google', 'azure', 'assemblyai', 'deepgram', 'mock'
      provider: import.meta.env.VITE_SPEECH_PROVIDER || 'mock',
      apiKey: import.meta.env.AssemblyAI_KEY || import.meta.env.VITE_SPEECH_API_KEY || '',
    },

    // AI/LLM Configuration
    ai: {
      // Choose provider: 'openai', 'anthropic', 'google', 'azure', 'mock'
      provider: import.meta.env.VITE_AI_PROVIDER || 'mock',
      // API key only needed for non-OpenAI providers (OpenAI goes through server proxy)
      apiKey: import.meta.env.VITE_AI_API_KEY || '',

      // Azure-specific settings (only needed if using Azure)
      azureEndpoint: import.meta.env.VITE_AZURE_ENDPOINT || '',
      azureDeployment: import.meta.env.VITE_AZURE_DEPLOYMENT || '',
    }
  };
}

/**
 * Validates that required configuration is present
 */
export function validateConfig() {
  const config = getConfig();
  const errors = [];

  // Check speech-to-text config
  if (config.speechToText.provider !== 'mock' && !config.speechToText.apiKey) {
    errors.push(`Speech-to-text API key is required for provider: ${config.speechToText.provider}`);
  }

  // Check AI config
  if (config.ai.provider !== 'mock' && !config.ai.apiKey) {
    errors.push(`AI API key is required for provider: ${config.ai.provider}`);
  }

  // Check Azure-specific config
  if (config.ai.provider === 'azure') {
    if (!config.ai.azureEndpoint) {
      errors.push('Azure endpoint is required when using Azure OpenAI');
    }
    if (!config.ai.azureDeployment) {
      errors.push('Azure deployment name is required when using Azure OpenAI');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets user-friendly provider names
 */
export function getProviderInfo() {
  return {
    speechToText: {
      'openai-whisper': {
        name: 'OpenAI Whisper',
        docs: 'https://platform.openai.com/docs/guides/speech-to-text',
        pricing: 'https://openai.com/pricing'
      },
      'google': {
        name: 'Google Cloud Speech-to-Text',
        docs: 'https://cloud.google.com/speech-to-text/docs',
        pricing: 'https://cloud.google.com/speech-to-text/pricing'
      },
      'azure': {
        name: 'Azure Speech Services',
        docs: 'https://docs.microsoft.com/azure/cognitive-services/speech-service/',
        pricing: 'https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/'
      },
      'assemblyai': {
        name: 'AssemblyAI',
        docs: 'https://www.assemblyai.com/docs',
        pricing: 'https://www.assemblyai.com/pricing'
      },
      'deepgram': {
        name: 'Deepgram',
        docs: 'https://developers.deepgram.com/',
        pricing: 'https://deepgram.com/pricing'
      },
      'mock': {
        name: 'Mock (Testing)',
        docs: 'No API key required',
        pricing: 'Free'
      }
    },
    ai: {
      'openai': {
        name: 'OpenAI (GPT-4, GPT-3.5)',
        docs: 'https://platform.openai.com/docs/api-reference/chat',
        pricing: 'https://openai.com/pricing',
        models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']
      },
      'anthropic': {
        name: 'Anthropic (Claude)',
        docs: 'https://docs.anthropic.com/claude/reference/messages_post',
        pricing: 'https://www.anthropic.com/pricing',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229']
      },
      'google': {
        name: 'Google (Gemini)',
        docs: 'https://ai.google.dev/api/rest',
        pricing: 'https://ai.google.dev/pricing',
        models: ['gemini-pro', 'gemini-1.5-pro']
      },
      'azure': {
        name: 'Azure OpenAI',
        docs: 'https://learn.microsoft.com/azure/ai-services/openai/',
        pricing: 'https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/'
      },
      'mock': {
        name: 'Mock (Testing)',
        docs: 'No API key required',
        pricing: 'Free'
      }
    }
  };
}

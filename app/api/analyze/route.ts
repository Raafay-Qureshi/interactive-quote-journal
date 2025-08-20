import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequest, AnalyzeResponse, AnalyzeError, OpenRouterApiRequest, OpenRouterApiResponse } from '@/lib/types/quote';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_MODEL = 'google/gemini-2.0-flash-exp:free'; // Free Gemini 2.0 Flash
const FALLBACK_MODEL = 'google/gemini-2.5-pro'; // Gemini 2.5 Pro fallback
const REQUEST_TIMEOUT = 15000; // 15 seconds

/**
 * Rate limiting middleware
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);

  if (!userRequests || now > userRequests.resetTime) {
    // Reset or initialize rate limit for this IP
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (userRequests.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userRequests.count++;
  return true;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Validate request body
 */
function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object' };
  }

  if (!body.quote || typeof body.quote !== 'string') {
    return { isValid: false, error: 'Quote field is required and must be a string' };
  }

  if (body.quote.trim().length === 0) {
    return { isValid: false, error: 'Quote cannot be empty' };
  }

  if (body.quote.length > 1000) {
    return { isValid: false, error: 'Quote is too long (maximum 1000 characters)' };
  }

  return { isValid: true };
}

/**
 * Create mood analysis messages for OpenRouter/Gemini
 */
function createMoodAnalysisMessages(quote: string): OpenRouterApiRequest['messages'] {
  return [
    {
      role: 'system',
      content: 'You are an expert emotional analyst who captures the PRECISE emotional essence of quotes. Be bold and specific - avoid generic labels. Respond with EXACTLY this format: "mood:hexcolor" where mood is ONE word from: inspirational, motivational, philosophical, humorous, melancholic, optimistic, contemplative, wise, uplifting. AVOID "reflective" - be more specific! For hexcolor, choose a BOLD, emotionally-charged color that viscerally represents the quote\'s energy. Use vibrant, saturated colors that make people FEEL the emotion. Examples: "motivational:#FF4500" (fiery orange), "melancholic:#4B0082" (deep indigo), "humorous:#FFD700" (bright gold), "wise:#8B4513" (rich brown), "optimistic:#00CED1" (electric turquoise).'
    },
    {
      role: 'user',
      content: `What is the SPECIFIC emotional essence of this quote? Be bold and precise - what exact feeling does it evoke? Quote: "${quote}"`
    }
  ];
}

/**
 * Call OpenRouter API for mood analysis with fallback
 */
async function callOpenRouterAPI(quote: string): Promise<string> {
  // Try primary model first, then fallback
  try {
    return await callOpenRouterAPIWithModel(quote, GEMINI_MODEL);
  } catch (error) {
    return await callOpenRouterAPIWithModel(quote, FALLBACK_MODEL);
  }
}

/**
 * Call OpenRouter API with specific model
 */
async function callOpenRouterAPIWithModel(quote: string, model: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const messages = createMoodAnalysisMessages(quote);
  
  const requestBody: OpenRouterApiRequest = {
    model: model,
    messages: messages,
    temperature: 0.3,
    max_tokens: 10,
    top_p: 0.8,
    stream: false
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://interactive-quote-journal.vercel.app',
        'X-Title': 'Interactive Quote Journal'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Invalid JSON response from OpenRouter API');
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    const choice = data.choices[0];
    if (!choice || !choice.message) {
      throw new Error('Invalid response structure from OpenRouter API');
    }

    const content = choice.message.content;
    if (!content || content.trim() === '') {
      throw new Error('Empty response content from OpenRouter API');
    }

    // Parse the mood:color response
    const responseText = content.trim();
    const validMoods = [
      'inspirational', 'motivational', 'philosophical',
      'humorous', 'melancholic', 'optimistic', 'contemplative',
      'wise', 'uplifting'
    ];

    // Try to parse mood:color format
    if (responseText.includes(':')) {
      const [moodPart, colorPart] = responseText.split(':');
      const mood = moodPart.trim().toLowerCase();
      const color = colorPart.trim();
      
      // Validate mood and color format
      if (validMoods.includes(mood) && color.startsWith('#') && color.length === 7) {
        return `${mood}:${color}`;
      }
    }

    // Try to extract just a valid mood from the response
    const lowerResponse = responseText.toLowerCase();
    for (const validMood of validMoods) {
      if (lowerResponse.includes(validMood)) {
        // Return mood with a vibrant default color
        const vibrantColors = {
          'inspirational': '#1E90FF',
          'motivational': '#FF4500',
          'philosophical': '#4B0082',
          'humorous': '#FFD700',
          'melancholic': '#483D8B',
          'optimistic': '#00CED1',
          'contemplative': '#8A2BE2',
          'wise': '#8B4513',
          'uplifting': '#FF69B4'
        };
        return `${validMood}:${vibrantColors[validMood as keyof typeof vibrantColors]}`;
      }
    }

    // If nothing works, use a diverse fallback based on quote characteristics
    const fallbackMoods = [
      { mood: 'inspirational', color: '#1E90FF' },
      { mood: 'motivational', color: '#FF4500' },
      { mood: 'optimistic', color: '#00CED1' },
      { mood: 'wise', color: '#8B4513' },
      { mood: 'uplifting', color: '#FF69B4' }
    ];
    
    // Use quote length and content to pick a more appropriate fallback
    const quoteLength = responseText.length;
    const fallbackIndex = quoteLength % fallbackMoods.length;
    const fallback = fallbackMoods[fallbackIndex];
    
    return `${fallback.mood}:${fallback.color}`;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

/**
 * POST handler for quote mood analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      const errorResponse: AnalyzeError = {
        error: 'Rate limit exceeded. Please try again later.'
      };
      
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      });
    }

    // Parse request body
    let body: AnalyzeRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      const errorResponse: AnalyzeError = {
        error: 'Invalid JSON in request body'
      };
      
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      const errorResponse: AnalyzeError = {
        error: validation.error!
      };
      
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Call OpenRouter Gemini API for mood analysis
    try {
      const moodColorResponse = await callOpenRouterAPI(body.quote);
      
      // Parse mood and color from response
      let mood = 'inspirational';
      let color = '#1E90FF';
      
      if (moodColorResponse.includes(':')) {
        const [moodPart, colorPart] = moodColorResponse.split(':');
        mood = moodPart.trim();
        color = colorPart.trim();
      } else {
        mood = moodColorResponse.trim();
        // Use vibrant default colors for each mood
        const vibrantDefaults = {
          'inspirational': '#1E90FF',
          'motivational': '#FF4500',
          'philosophical': '#4B0082',
          'humorous': '#FFD700',
          'melancholic': '#483D8B',
          'optimistic': '#00CED1',
          'contemplative': '#8A2BE2',
          'wise': '#8B4513',
          'uplifting': '#FF69B4'
        };
        color = vibrantDefaults[mood as keyof typeof vibrantDefaults] || '#1E90FF';
      }
      
      const successResponse: AnalyzeResponse = {
        mood: mood,
        color: color
      };

      return NextResponse.json(successResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

    } catch (apiError) {
      // Return a diverse fallback mood instead of always "reflective"
      const diverseFallbacks = [
        { mood: 'inspirational', color: '#1E90FF' },
        { mood: 'motivational', color: '#FF4500' },
        { mood: 'optimistic', color: '#00CED1' },
        { mood: 'wise', color: '#8B4513' },
        { mood: 'uplifting', color: '#FF69B4' }
      ];
      
      // Use current time to pick a different fallback each time
      const fallbackIndex = Date.now() % diverseFallbacks.length;
      const fallback = diverseFallbacks[fallbackIndex];
      
      const fallbackResponse: AnalyzeResponse = {
        mood: fallback.mood,
        color: fallback.color
      };

      return NextResponse.json(fallbackResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Fallback': 'true',
        },
      });
    }

  } catch (error) {
    const errorResponse: AnalyzeError = {
      error: 'Internal server error. Please try again later.'
    };
    
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Handle preflight requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Reject non-POST methods
 */
export async function GET(request: NextRequest) {
  const errorResponse: AnalyzeError = {
    error: 'Method not allowed. Use POST to analyze quotes.'
  };
  
  return NextResponse.json(errorResponse, {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Allow': 'POST, OPTIONS',
    },
  });
}
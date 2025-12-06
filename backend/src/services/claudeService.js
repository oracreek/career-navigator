/**
 * Claude AI Service
 * Handles all interactions with Anthropic's Claude API
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const HAIKU_MODEL = 'claude-haiku-4-20250514';
const SONNET_MODEL = 'claude-sonnet-4-20250514';

/**
 * Call Claude API with a prompt
 */
async function callClaude(apiKey, prompt, options = {}) {
  const {
    model = HAIKU_MODEL,
    maxTokens = 2000,
    temperature = 1.0,
    system = null,
  } = options;

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  if (system) {
    body.system = system;
  }

  if (temperature !== 1.0) {
    body.temperature = temperature;
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}

/**
 * Generate experience summary
 */
export async function generateSummary(apiKey, context) {
  const { jobDescription, positionTitle, company, perspectiveFocus, positions, promptTemplate } = context;

  // Build positions data string
  const positionsData = positions
    .map((pos) => {
      return `
**${pos.title} at ${pos.company}** (${pos.start_date} - ${pos.end_date || 'Present'})
${pos.raw_description || ''}

Achievements:
${JSON.parse(pos.achievements || '[]').map((a) => `- ${a}`).join('\n')}

Skills: ${JSON.parse(pos.skills_used || '[]').join(', ')}
`;
    })
    .join('\n---\n');

  // Interpolate template
  const prompt = promptTemplate
    .replace(/\{\{position_title\}\}/g, positionTitle)
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{job_description\}\}/g, jobDescription)
    .replace(/\{\{perspective_focus\}\}/g, perspectiveFocus)
    .replace(/\{\{positions_data\}\}/g, positionsData);

  const response = await callClaude(apiKey, prompt, {
    model: HAIKU_MODEL,
    maxTokens: 2000,
  });

  return response;
}

/**
 * Generate practice interview
 */
export async function generatePracticeInterview(apiKey, context) {
  const { 
    jobDescription, 
    positionTitle, 
    company, 
    jobUrl, 
    resumeContent, 
    summaryContent,
    promptTemplate 
  } = context;

  // Interpolate template
  const prompt = promptTemplate
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{position_title\}\}/g, positionTitle)
    .replace(/\{\{job_url\}\}/g, jobUrl || 'Not provided')
    .replace(/\{\{job_description\}\}/g, jobDescription)
    .replace(/\{\{resume_content\}\}/g, resumeContent)
    .replace(/\{\{summary_content\}\}/g, summaryContent);

  const response = await callClaude(apiKey, prompt, {
    model: SONNET_MODEL,
    maxTokens: 4000,
  });

  // Try to parse JSON from response
  try {
    // Extract JSON from markdown code blocks if present
    let jsonStr = response;
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse practice interview JSON:', error);
    // Return a structured error response
    return {
      gap_analysis: [
        {
          gap: 'Unable to parse AI response',
          bridge_strategy: 'Please regenerate the practice interview',
        },
      ],
      questions: [],
      culture_insights: {
        company_values: [],
        interview_tips: [],
        questions_to_ask: [],
      },
      _raw_response: response,
    };
  }
}

/**
 * Test prompt interpolation without calling API
 */
export function testPromptInterpolation(template, variables) {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

import Anthropic from '@anthropic-ai/sdk';

/**
 * Initializes Claude AI client
 * @param {string} apiKey - Anthropic API key
 * @returns {Anthropic} Anthropic client instance
 */
function initClaudeClient(apiKey) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
  return new Anthropic({ apiKey });
}

/**
 * Analyzes copywriting quality of captions using Claude AI
 * @param {Array} posts - Array of post objects with captions
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Copywriting analysis score (0-100) and feedback
 */
export async function analyzeCopywriting(posts, apiKey) {
  const client = initClaudeClient(apiKey);

  const captions = posts
    .map(post => post.caption)
    .filter(caption => caption && caption.length > 0)
    .slice(0, 10); // Analyze up to 10 captions

  if (captions.length === 0) {
    return { score: 0, feedback: 'No captions found to analyze' };
  }

  const prompt = `Analyze these Instagram captions for copywriting quality. Evaluate:
1. Tone variety (consistent vs creative vs narrative)
2. Call-to-action presence and effectiveness
3. Readability and clarity
4. Engagement potential
5. Authenticity vs generic/promotional tone

Captions:
${captions.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}

Provide:
- A score from 0-100 (0=generic/poor, 100=creative/excellent)
- Brief feedback (2-3 sentences)

Format your response as JSON:
{"score": <number>, "feedback": "<text>"}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const result = JSON.parse(responseText);

    return {
      score: Math.min(100, Math.max(0, result.score)),
      feedback: result.feedback
    };
  } catch (error) {
    console.error('Claude API error (copywriting):', error.message);
    return { score: 50, feedback: 'Analysis unavailable' };
  }
}

/**
 * Analyzes visual identity and graphic quality
 * @param {Object} profileData - Profile data with posts
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Visual analysis score (0-100) and feedback
 */
export async function analyzeVisualIdentity(profileData, apiKey) {
  const client = initClaudeClient(apiKey);

  const { biography, posts } = profileData;

  // Prepare post descriptions for analysis
  const postDescriptions = posts.slice(0, 9).map(post => ({
    type: post.type,
    caption: post.caption ? post.caption.substring(0, 100) : '',
    hasUrl: !!post.imageUrl
  }));

  const prompt = `Analyze this Instagram profile's visual identity and graphic quality:

Profile Bio: ${biography || 'No bio'}

Recent Posts (${postDescriptions.length}):
${postDescriptions.map((p, i) => `${i + 1}. Type: ${p.type}, Caption preview: ${p.caption || 'No caption'}`).join('\n')}

Content Types Distribution:
- Photos: ${posts.filter(p => p.type === 'photo').length}
- Videos: ${posts.filter(p => p.type === 'video').length}
- Carousels: ${posts.filter(p => p.type === 'carousel').length}

Evaluate:
1. Visual consistency and cohesive style
2. Professional quality (based on content types and patterns)
3. Brand identity recognizability
4. Color/theme coherence (inferred from posting patterns)

Provide:
- A score from 0-100 (0=inconsistent/low quality, 100=professional/cohesive)
- Brief feedback (2-3 sentences)

Format your response as JSON:
{"score": <number>, "feedback": "<text>"}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const result = JSON.parse(responseText);

    return {
      score: Math.min(100, Math.max(0, result.score)),
      feedback: result.feedback
    };
  } catch (error) {
    console.error('Claude API error (visual):', error.message);
    return { score: 50, feedback: 'Analysis unavailable' };
  }
}

/**
 * Analyzes content originality and differentiation
 * @param {Object} profileData - Profile data with posts
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Originality analysis score (0-100) and feedback
 */
export async function analyzeOriginality(profileData, apiKey) {
  const client = initClaudeClient(apiKey);

  const { biography, posts } = profileData;

  const captions = posts
    .map(post => post.caption)
    .filter(caption => caption && caption.length > 0)
    .slice(0, 10);

  const prompt = `Analyze this Instagram profile's originality and differentiation:

Profile Bio: ${biography || 'No bio'}

Captions sample:
${captions.map((c, i) => `${i + 1}. ${c.substring(0, 150)}...`).join('\n\n')}

Posting frequency: ${posts.length} posts analyzed
Content variety: ${new Set(posts.map(p => p.type)).size} different formats

Evaluate:
1. Unique format or recurring series/rubriche
2. Copying trends vs creating original content
3. Recognizable brand signature/voice
4. Innovation in content approach

Provide:
- A score from 0-100 (0=generic copies, 100=highly original)
- Brief feedback (2-3 sentences)

Format your response as JSON:
{"score": <number>, "feedback": "<text>"}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const result = JSON.parse(responseText);

    return {
      score: Math.min(100, Math.max(0, result.score)),
      feedback: result.feedback
    };
  } catch (error) {
    console.error('Claude API error (originality):', error.message);
    return { score: 50, feedback: 'Analysis unavailable' };
  }
}

/**
 * Generates executive summary and recommendations based on analysis results
 * @param {Object} result - Final score result with breakdown
 * @param {Object} profileData - Profile data
 * @param {Object} aiAnalysis - AI analysis results
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Executive summary with status and recommendations
 */
export async function generateExecutiveSummary(result, profileData, aiAnalysis, apiKey) {
  const client = initClaudeClient(apiKey);

  // Identify weak areas (score < 60)
  const weakAreas = Object.entries(result.breakdown)
    .filter(([_, data]) => data.score < 60)
    .map(([key, data]) => ({ metric: key, score: data.score }))
    .sort((a, b) => a.score - b.score);

  const strongAreas = Object.entries(result.breakdown)
    .filter(([_, data]) => data.score >= 75)
    .map(([key, data]) => ({ metric: key, score: data.score }))
    .sort((a, b) => b.score - a.score);

  const labels = {
    engagement_rate: 'Engagement Rate',
    follower_trend: 'Follower Growth',
    content_mix: 'Content Diversity',
    copywriting: 'Copywriting',
    visual_identity: 'Visual Identity',
    originality: 'Originality',
    qualitative_interactions: 'Community Engagement'
  };

  const prompt = `You are analyzing an Instagram profile @${profileData.username}.

Final Score: ${result.finalScore}/100

Weak Areas (need improvement):
${weakAreas.length > 0 ? weakAreas.map(a => `- ${labels[a.metric]}: ${a.score}/100`).join('\n') : 'None'}

Strong Areas:
${strongAreas.length > 0 ? strongAreas.map(a => `- ${labels[a.metric]}: ${a.score}/100`).join('\n') : 'None'}

Profile Context:
- Followers: ${profileData.followers.toLocaleString()}
- Posts: ${profileData.postsCount}
- Engagement Rate: ${result.metrics.engagement_rate}%

AI Feedback:
- Copywriting: ${aiAnalysis.copywriting.feedback}
- Visual: ${aiAnalysis.visualIdentity.feedback}
- Originality: ${aiAnalysis.originality.feedback}

Generate:
1. A status label (one of: "Excellent Performance" / "Strong Profile" / "Good Foundation" / "Needs Improvement" / "Critical Issues")
2. 3-5 specific, actionable recommendations to improve the weakest areas

Format as JSON:
{
  "status": "<status label>",
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const summary = JSON.parse(responseText);

    return {
      status: summary.status,
      recommendations: summary.recommendations,
      weakAreas: weakAreas.map(a => labels[a.metric]),
      strongAreas: strongAreas.map(a => labels[a.metric])
    };
  } catch (error) {
    console.error('Claude API error (summary):', error.message);
    // Fallback summary
    return {
      status: result.finalScore >= 75 ? 'Strong Profile' :
              result.finalScore >= 60 ? 'Good Foundation' : 'Needs Improvement',
      recommendations: [
        'Increase posting consistency',
        'Engage more with your audience',
        'Improve content variety'
      ],
      weakAreas: weakAreas.map(a => labels[a.metric]),
      strongAreas: strongAreas.map(a => labels[a.metric])
    };
  }
}

import OpenAI from 'openai';

let openaiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    const apiKey = process.env.OPENAI_API_KEY.trim();
    const config = { apiKey };

    if (process.env.OPENAI_BASE_URL) {
      config.baseURL = process.env.OPENAI_BASE_URL;
    } else if (apiKey.startsWith('sk-or-')) {
      config.baseURL = 'https://openrouter.ai/api/v1';
      config.defaultHeaders = {
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Smart Grievance Portal',
      };
    }

    openaiClient = new OpenAI(config);
  }
  return openaiClient;
};

// Available categories
const VALID_CATEGORIES = [
  'Academic',
  'Examination',
  'IT / Network',
  'Infrastructure',
  'Library',
  'Hostel',
  'Fees',
  'Faculty',
  'Administration',
  'Transport',
  'Other',
];

// Fallback heuristic keyword mapping for reliable offline/fallback AI
const CATEGORY_KEYWORDS = {
  'IT / Network': ['wifi', 'wi-fi', 'internet', 'network', 'router', 'ethernet', 'login portal', 'server', 'computer', 'lab pc', 'lan'],
  'Infrastructure': ['fan', 'light', 'bench', 'chair', 'table', 'ac', 'air conditioner', 'water', 'washroom', 'toilet', 'elevator', 'lift', 'projector', 'whiteboard', 'door', 'window', 'leakage', 'electricity', 'power'],
  'Academic': ['syllabus', 'lecture', 'attendance', 'notes', 'assignment', 'curriculum', 'timetable', 'class schedule', 'credits', 'course'],
  'Examination': ['exam', 'marks', 'grade', 'hall ticket', 'revaluation', 'result', 'paper', 'practical', 'viva', 'datesheet'],
  'Library': ['book', 'library', 'journal', 'borrow', 'fine', 'reading room', 'librarian'],
  'Hostel': ['room', 'mess', 'food', 'warden', 'hostel', 'canteen', 'hot water', 'bed', 'cleaning'],
  'Fees': ['fee', 'payment', 'receipt', 'scholarship', 'refund', 'challan', 'tuition'],
  'Faculty': ['professor', 'teacher', 'faculty', 'teaching', 'instructor', 'lecturer'],
  'Administration': ['certificate', 'id card', 'bonafide', 'transcript', 'clearance', 'office', 'admin'],
  'Transport': ['bus', 'van', 'route', 'driver', 'parking', 'transport', 'vehicle'],
};

// Priority heuristic keywords
const PRIORITY_KEYWORDS = {
  URGENT: ['emergency', 'hazard', 'spark', 'fire', 'shock', 'urgent', 'immediately', 'critical', 'injury', 'danger', 'bleeding'],
  HIGH: ['tomorrow', 'exam today', 'unable to access', 'practical tomorrow', 'broken', 'not working for days', 'severe', 'deadline'],
  LOW: ['suggestion', 'request for improvement', 'minor', 'cosmetic', 'could be better'],
};

/**
 * Heuristic fallback suggestion engine
 */
const heuristicDraftAnalysis = ({ rawTitle = '', rawDescription = '', rawLocation = '' }) => {
  const combinedText = `${rawTitle} ${rawDescription} ${rawLocation}`.toLowerCase();

  // Category determination
  let detectedCategory = 'Other';
  let maxCatMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matches = 0;
    for (const kw of keywords) {
      if (combinedText.includes(kw)) matches++;
    }
    if (matches > maxCatMatches) {
      maxCatMatches = matches;
      detectedCategory = cat;
    }
  }

  // Priority determination
  let detectedPriority = 'MEDIUM';
  for (const kw of PRIORITY_KEYWORDS.URGENT) {
    if (combinedText.includes(kw)) {
      detectedPriority = 'URGENT';
      break;
    }
  }
  if (detectedPriority !== 'URGENT') {
    for (const kw of PRIORITY_KEYWORDS.HIGH) {
      if (combinedText.includes(kw)) {
        detectedPriority = 'HIGH';
        break;
      }
    }
  }
  if (detectedPriority === 'MEDIUM') {
    for (const kw of PRIORITY_KEYWORDS.LOW) {
      if (combinedText.includes(kw)) {
        detectedPriority = 'LOW';
        break;
      }
    }
  }

  // Generate clean title
  let suggestedTitle = rawTitle.trim();
  if (!suggestedTitle || suggestedTitle.length < 5) {
    if (detectedCategory === 'IT / Network') suggestedTitle = 'Campus Network / IT Equipment Issue';
    else if (detectedCategory === 'Infrastructure') suggestedTitle = 'Classroom / Facility Infrastructure Fault';
    else suggestedTitle = `${detectedCategory} Grievance Report`;
  } else {
    // Capitalize first letter of each word
    suggestedTitle = suggestedTitle
      .split(' ')
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  }

  // Detect location if missing
  let extractedLocation = rawLocation.trim();
  if (!extractedLocation) {
    const locMatch = combinedText.match(/(?:in|at|near|block|floor|lab|room)\s+([a-z0-9\s-]+?)(?:\.|\,|$|from|since)/i);
    if (locMatch && locMatch[1]) {
      extractedLocation = locMatch[1].trim();
    }
  }

  // Missing info check
  let missingInfo = '';
  if (!extractedLocation) {
    missingInfo = 'Specific classroom, laboratory, or campus location is missing.';
  } else if (rawDescription.length < 25) {
    missingInfo = 'Please describe what you observed and when the issue started.';
  }

  return {
    suggestedTitle,
    suggestedCategory: detectedCategory,
    suggestedPriority: detectedPriority,
    suggestedLocation: extractedLocation,
    summary: rawDescription.slice(0, 160) + (rawDescription.length > 160 ? '...' : ''),
    missingInfo,
    confidence: maxCatMatches > 0 ? 0.85 : 0.6,
  };
};

/**
 * AI Draft Assistant - Analyzes user input and suggests polished title, category, priority, etc.
 */
export const analyzeGrievanceDraft = async ({ title, description, location }) => {
  const client = getOpenAIClient();

  if (!client) {
    return heuristicDraftAnalysis({ rawTitle: title, rawDescription: description, rawLocation: location });
  }

  try {
    const prompt = `You are an AI grievance intake assistant for an accredited university portal.
Analyze the following student complaint:
Title: "${title || ''}"
Description: "${description || ''}"
Location: "${location || ''}"

Valid Categories: ${VALID_CATEGORIES.join(', ')}
Valid Priorities: LOW, MEDIUM, HIGH, URGENT

Output ONLY valid JSON matching this schema:
{
  "suggestedTitle": "Professional, concise grievance headline (maximum 10 words)",
  "suggestedCategory": "One of the valid categories strictly matching the list",
  "suggestedPriority": "One of LOW, MEDIUM, HIGH, URGENT",
  "suggestedLocation": "Extracted or refined location name",
  "summary": "Clear 1-2 sentence executive summary of the issue",
  "missingInfo": "Brief tip if critical details (exact floor, lab number, equipment ID, timing) are missing, otherwise empty string",
  "confidence": 0.95
}`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 300,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      suggestedTitle: parsed.suggestedTitle || title,
      suggestedCategory: VALID_CATEGORIES.includes(parsed.suggestedCategory) ? parsed.suggestedCategory : 'Other',
      suggestedPriority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(parsed.suggestedPriority) ? parsed.suggestedPriority : 'MEDIUM',
      suggestedLocation: parsed.suggestedLocation || location,
      summary: parsed.summary || description.slice(0, 160),
      missingInfo: parsed.missingInfo || '',
      confidence: parsed.confidence || 0.9,
    };
  } catch (error) {
    console.warn('[AI Service Warning] OpenAI draft analysis failed, falling back to heuristics:', error.message);
    return heuristicDraftAnalysis({ rawTitle: title, rawDescription: description, rawLocation: location });
  }
};

/**
 * Computes Cosine Similarity between two term-frequency/embedding vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Text Tokenizer & TF vectorizer for semantic matching fallback
 */
export const computeTextSimilarity = (text1, text2) => {
  const tokenize = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const vocab = Array.from(new Set([...tokens1, ...tokens2]));
  const vec1 = vocab.map((w) => tokens1.filter((t) => t === w).length);
  const vec2 = vocab.map((w) => tokens2.filter((t) => t === w).length);

  return cosineSimilarity(vec1, vec2);
};

/**
 * Generates OpenAI Text Embeddings or TF pseudo-vector
 */
export const generateEmbedding = async (text) => {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.warn('[AI Service Warning] Embedding creation failed:', error.message);
    return null;
  }
};

/**
 * Summarizes a complex grievance with discussion messages
 */
export const summarizeGrievance = async ({ grievance, messages = [] }) => {
  const client = getOpenAIClient();

  const conversationText = messages
    .map((m) => `[${m.senderRole.toUpperCase()}] ${m.message}`)
    .join('\n');

  if (!client) {
    return `Grievance "${grievance.title}" logged in ${grievance.category} at ${grievance.location}. Current status is ${grievance.status} with ${messages.length} messages exchanged.`;
  }

  try {
    const prompt = `You are an institutional administrator summarizing a student grievance file.
Title: ${grievance.title}
Category: ${grievance.category}
Location: ${grievance.location}
Status: ${grievance.status}
Original Description: ${grievance.description}

Conversation Timeline:
${conversationText || 'No conversation messages yet.'}

Provide a concise, factual 2-3 sentence executive summary of the issue, actions taken so far, and current blocker or status. Do not invent facts.`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 250,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.warn('[AI Service Warning] Summarization failed, using basic summary:', error.message);
    return `Grievance regarding "${grievance.title}" in ${grievance.category} at ${grievance.location}. Status: ${grievance.status}.`;
  }
};

/**
 * AI Admin Insights across system-wide metrics
 */
export const generateAdminInsights = async (analyticsData) => {
  const client = getOpenAIClient();

  if (!client) {
    // Generate intelligent data-driven insights from the real metrics
    const insights = [];

    if (analyticsData.escalatedCount > 0) {
      insights.push({
        type: 'CRITICAL',
        title: 'SLA Escalations Require Immediate Attention',
        description: `${analyticsData.escalatedCount} grievance(s) have breached the 24-hour resolution SLA and been escalated to administration.`,
      });
    }

    if (analyticsData.categoryBreakdown && analyticsData.categoryBreakdown.length > 0) {
      const topCat = analyticsData.categoryBreakdown[0];
      insights.push({
        type: 'TREND',
        title: `Highest Grievance Volume: ${topCat._id}`,
        description: `${topCat._id} accounts for ${topCat.count} complaints (${Math.round((topCat.count / (analyticsData.totalGrievances || 1)) * 100)}% of total volume). Departmental audit recommended.`,
      });
    }

    if (analyticsData.commonIssuesCount > 0) {
      insights.push({
        type: 'CLUSTER',
        title: 'Active Clustered Campus Issues',
        description: `${analyticsData.commonIssuesCount} common campus incidents are affecting multiple students concurrently.`,
      });
    }

    if (analyticsData.averageRating && analyticsData.averageRating < 3.5) {
      insights.push({
        type: 'QUALITY',
        title: 'Student Satisfaction Below Target',
        description: `Average resolution satisfaction score is ${analyticsData.averageRating.toFixed(1)}/5.0. Review resolution turnaround and communication.`,
      });
    } else {
      insights.push({
        type: 'STABILITY',
        title: 'Institutional SLA Compliance',
        description: `Active resolution rate is currently ${Math.round(((analyticsData.resolvedCount + analyticsData.closedCount) / (analyticsData.totalGrievances || 1)) * 100)}%.`,
      });
    }

    return insights;
  }

  try {
    const prompt = `You are a university dean of student affairs and operations analyst.
Analyze these REAL grievance database metrics:
Total Grievances: ${analyticsData.totalGrievances}
Pending: ${analyticsData.pendingCount}
In Progress: ${analyticsData.inProgressCount}
Escalated (24h breached): ${analyticsData.escalatedCount}
Resolved: ${analyticsData.resolvedCount}
Closed: ${analyticsData.closedCount}
Average Feedback Rating: ${analyticsData.averageRating || 'N/A'}/5
Categories Breakdown: ${JSON.stringify(analyticsData.categoryBreakdown)}
Common Issues: ${analyticsData.commonIssuesCount}

Generate 3-4 concise, high-value, actionable institutional insights based STRICTLY on these real numbers.
Return JSON array with schema:
[
  {
    "type": "CRITICAL" | "TREND" | "CLUSTER" | "QUALITY" | "STABILITY",
    "title": "Short title",
    "description": "Specific 1-2 sentence observation and operational recommendation based on the data"
  }
]`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return Array.isArray(parsed) ? parsed : parsed.insights || [];
  } catch (error) {
    console.warn('[AI Service Warning] Admin insights AI failed, using metric heuristics:', error.message);
    return [
      {
        type: 'TREND',
        title: 'System Activity Monitoring',
        description: `Total of ${analyticsData.totalGrievances} grievances recorded with ${analyticsData.escalatedCount} escalations requiring administrative review.`,
      },
    ];
  }
};

/**
 * Contextual Student Chat Assistant grounded strictly in student's own data
 */
export const studentAssistantChat = async ({ student, grievances = [], query }) => {
  const client = getOpenAIClient();

  const grievanceSummaryList = grievances.map((g) => ({
    trackingId: g.trackingId,
    title: g.title,
    category: g.category,
    location: g.location,
    status: g.status,
    priority: g.priority,
    dueAt: g.dueAt,
  }));

  if (!client) {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('status')) {
      if (grievances.length === 0) return `You currently have no active grievances submitted in the portal.`;
      const latest = grievances[0];
      return `Your latest grievance "${latest.title}" (${latest.trackingId}) is currently in "${latest.status}" status under ${latest.category}.`;
    }
    if (lowerQuery.includes('escalat')) {
      return `A grievance is automatically escalated to university administration if it is not resolved within the strict 24-hour SLA deadline. This ensures senior administrative oversight.`;
    }
    if (lowerQuery.includes('submit') || lowerQuery.includes('how')) {
      return `To submit a grievance, click "Submit Grievance" in the top bar or sidebar, fill in the title, description, category, and location. Our AI assistant can suggest improvements and check for duplicate complaints.`;
    }
    return `Hello ${student.name}! I am your university grievance assistant. You currently have ${grievances.length} grievance(s) on record. You can ask me about your grievance statuses, how the 24-hour escalation works, or how to report an issue.`;
  }

  try {
    const prompt = `You are the Smart Grievance Portal Student Assistant for ${student.name} (University ID: ${student.institutionalId}, Department: ${student.department}).
Student's authorized grievances:
${JSON.stringify(grievanceSummaryList, null, 2)}

User Question: "${query}"

Guidelines:
1. Ground answers strictly on the student's authorized grievances above.
2. Explain portal concepts (SLA 24h deadline, pending, assigned, in progress, escalated, feedback, reopening) clearly.
3. Be professional, polite, helpful, and concise (2-4 sentences).
4. Never expose internal database IDs or hallucinate grievances.`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.warn('[AI Service Warning] Student chat assistant failed:', error.message);
    return `Hello ${student.name}. You have ${grievances.length} grievances tracked in the system. Please feel free to check the dashboard for real-time status and 24-hour SLA timers.`;
  }
};

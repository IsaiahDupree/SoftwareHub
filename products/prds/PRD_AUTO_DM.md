# PRD: Auto DM (Multi-Platform)

**Product Name**: Auto DM  
**Version**: 1.0  
**Status**: 80% Complete - Needs Refinement  
**Priority**: HIGH  
**Platforms**: Instagram, TikTok, Twitter/X

---

## 1. Executive Summary

### Problem Statement
Creators monetizing through DMs face scaling challenges:
- 50-200+ DMs/day is impossible to handle manually
- Late responses = lost sales
- Inconsistent follow-up = missed opportunities
- VAs cost $500-2000/mo and lack context

### Solution
AI-powered DM automation that:
- Responds to DMs 24/7 in the user's voice
- Qualifies leads through conversational flows
- Injects payment links at optimal moments
- Syncs with CRM for relationship tracking

### Target Users
- Course creators selling through DMs
- Coaches booking discovery calls
- Service providers (designers, VAs, consultants)
- Creators with 10K+ followers getting 50+ DMs/day

---

## 2. Technical Assessment

### Current Status: 80% Complete

**Codebase Location**: `/Safari Automation/packages/`

### Package Structure
```
packages/
├── instagram-dm/
│   └── src/
│       ├── automation/
│       │   ├── dm-operations.ts (11,469 bytes) ✅
│       │   ├── safari-driver.ts (6,002 bytes) ✅
│       │   └── types.ts ✅
│       ├── api/ (needs work)
│       └── utils/ (needs work)
├── tiktok-dm/
│   └── src/ ✅
├── twitter-dm/
│   └── src/ ✅
└── unified-dm/
    └── src/
        ├── cli.ts (4,846 bytes) ✅
        ├── client.ts (7,562 bytes) ✅
        └── types.ts ✅
```

### Features Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| DM reading | ✅ | All platforms |
| DM sending | ✅ | All platforms |
| AI response generation | ✅ | Voice matching |
| Lead qualification | ✅ | Basic flows |
| Payment link injection | ✅ | Configurable triggers |
| Rate limiting | ✅ | Platform-specific |
| Basic CRM sync | ✅ | Contact creation |

### What's Remaining

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| Multi-account sessions | P0 | 3 days | Handle 3+ accounts simultaneously |
| Conversation threading | P1 | 2 days | Better context in long conversations |
| Image/media handling | P1 | 2 days | Process and respond to images |
| Scheduled sequences | P1 | 2 days | Multi-message nurture flows |
| Advanced lead scoring | P1 | 1 day | Scoring based on conversation |
| Web dashboard UI | P2 | 5 days | Visual management interface |
| Error recovery | P1 | 2 days | Robust failure handling |
| High volume testing | P0 | 2 days | Test with 50+ DMs/day |

---

## 3. Product Requirements

### 3.1 Core Features

#### DM Management
| Feature | Priority | Description |
|---------|----------|-------------|
| Inbox monitoring | P0 | Watch for new DMs in real-time |
| Unread prioritization | P0 | Process unread messages first |
| Conversation history | P0 | Maintain full conversation context |
| Media support | P1 | Handle images, voice messages |
| Message requests | P1 | Handle non-follower DMs |

#### AI Response System
| Feature | Priority | Description |
|---------|----------|-------------|
| Voice cloning | P0 | Match user's writing style |
| Context awareness | P0 | Understand conversation history |
| Intent detection | P0 | Identify buyer intent signals |
| Objection handling | P1 | Pre-configured responses |
| Escalation triggers | P1 | When to notify human |

#### Lead Qualification
| Feature | Priority | Description |
|---------|----------|-------------|
| Qualification flows | P0 | Multi-step question sequences |
| Lead scoring | P0 | Score based on responses |
| CRM integration | P0 | Sync qualified leads |
| Tagging system | P1 | Auto-tag conversations |
| Pipeline stages | P1 | Track lead progress |

#### Sales Automation
| Feature | Priority | Description |
|---------|----------|-------------|
| Payment link injection | P0 | Insert at right moment |
| Calendar booking | P1 | Integrate with Cal.com, Calendly |
| Follow-up sequences | P1 | Nurture non-converters |
| Abandoned cart recovery | P2 | Re-engage interested leads |

### 3.2 Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUTO DM SYSTEM                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Inbox     │  │     AI      │  │   Safari    │                │
│  │   Monitor   │──│   Engine    │──│   Driver    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│        │                │                │                          │
│        ▼                ▼                ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Conversation Manager                        │   │
│  │  • Context tracking   • Intent detection   • Flow routing   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│        │                │                │                          │
│        ▼                ▼                ▼                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   CRM    │  │ Payment/Cal  │  │  Analytics   │                 │
│  │   Sync   │  │ Integration  │  │   Engine     │                 │
│  └──────────┘  └──────────────┘  └──────────────┘                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        Supabase                              │   │
│  │  • Conversations   • Contacts   • Analytics   • Config      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Model

```typescript
interface Conversation {
  id: string;
  platform: 'instagram' | 'tiktok' | 'twitter';
  platformConversationId: string;
  contactId: string;
  status: 'active' | 'qualified' | 'converted' | 'closed' | 'escalated';
  leadScore: number;
  tags: string[];
  currentStage: string; // qualification flow stage
  lastMessageAt: Date;
  lastResponseAt: Date;
  messageCount: number;
  metadata: {
    source?: string; // how they found you
    interests?: string[];
    budget?: string;
    timeline?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  contentType: 'text' | 'image' | 'voice' | 'video' | 'link';
  mediaUrl?: string;
  intent?: {
    type: 'question' | 'interest' | 'objection' | 'purchase' | 'other';
    confidence: number;
  };
  generatedBy: 'ai' | 'human' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: Date;
  readAt?: Date;
}

interface QualificationFlow {
  id: string;
  name: string;
  triggers: {
    keywords?: string[];
    intents?: string[];
    isDefault?: boolean;
  };
  steps: QualificationStep[];
  outcomes: {
    qualified: { action: string; tags: string[] };
    notQualified: { action: string; message: string };
  };
}

interface QualificationStep {
  id: string;
  question: string;
  expectedResponses: {
    pattern: string;
    score: number;
    nextStep?: string;
    setMetadata?: Record<string, string>;
  }[];
  fallbackResponse: string;
  maxAttempts: number;
}

interface Contact {
  id: string;
  platform: string;
  platformUserId: string;
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  bio?: string;
  followerCount?: number;
  leadScore: number;
  tags: string[];
  customFields: Record<string, string>;
  crmSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. AI Response Generation

### Voice Training

```typescript
interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  // Example messages in user's voice
  samples: {
    context: string;
    response: string;
  }[];
  // Learned characteristics
  characteristics: {
    greetingStyle: string;
    signOffStyle: string;
    emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
    formalityLevel: 'casual' | 'friendly' | 'professional';
    avgResponseLength: number;
    commonPhrases: string[];
    avoidPhrases: string[];
  };
  // Business context
  businessContext: {
    productName: string;
    productDescription: string;
    pricing: string;
    targetAudience: string;
    uniqueSellingPoints: string[];
    commonObjections: { objection: string; response: string }[];
  };
}
```

### Response Generation

```typescript
const generateResponse = async (
  conversation: Conversation,
  inboundMessage: Message,
  voiceProfile: VoiceProfile,
  currentFlow?: QualificationFlow
): Promise<string> => {
  // Build conversation context
  const recentMessages = await getRecentMessages(conversation.id, 10);
  
  const prompt = `
You are ${voiceProfile.name}, responding to DMs on behalf of a ${voiceProfile.businessContext.productDescription}.

YOUR VOICE:
- Style: ${voiceProfile.characteristics.formalityLevel}
- Emoji usage: ${voiceProfile.characteristics.emojiUsage}
- Common phrases you use: ${voiceProfile.characteristics.commonPhrases.join(', ')}
- Phrases to avoid: ${voiceProfile.characteristics.avoidPhrases.join(', ')}

EXAMPLE RESPONSES IN YOUR VOICE:
${voiceProfile.samples.map(s => `Context: ${s.context}\nYou said: ${s.response}`).join('\n\n')}

BUSINESS CONTEXT:
- Product: ${voiceProfile.businessContext.productName}
- Price: ${voiceProfile.businessContext.pricing}
- Key benefits: ${voiceProfile.businessContext.uniqueSellingPoints.join(', ')}

CONVERSATION HISTORY:
${recentMessages.map(m => `${m.direction === 'inbound' ? 'Them' : 'You'}: ${m.content}`).join('\n')}

THEIR LATEST MESSAGE:
${inboundMessage.content}

${currentFlow ? `
CURRENT GOAL: ${currentFlow.steps[0]?.question}
Guide the conversation toward qualifying them.
` : ''}

LEAD CONTEXT:
- Score: ${conversation.leadScore}/100
- Tags: ${conversation.tags.join(', ')}
- Stage: ${conversation.currentStage}

Generate a single response that:
1. Directly addresses their message
2. Moves the conversation toward a sale (if appropriate)
3. Stays in character with your voice
4. Is ${voiceProfile.characteristics.avgResponseLength} words or less

Response:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0].message.content;
};
```

### Intent Detection

```typescript
const detectIntent = async (message: string): Promise<{
  type: string;
  confidence: number;
  signals: string[];
}> => {
  const prompt = `
Analyze this DM and classify the intent:

MESSAGE: "${message}"

INTENT CATEGORIES:
- purchase_ready: Ready to buy, asking for link/price
- high_interest: Strongly interested, asking detailed questions
- mild_interest: Curious, browsing
- objection: Raising concern about price, timing, need
- question: General question, not purchase-related
- spam: Irrelevant, promotional
- other: Doesn't fit other categories

Also identify specific signals like:
- price_mention, timeline_urgency, comparison_shopping, social_proof_request, etc.

Respond in JSON format:
{
  "type": "purchase_ready",
  "confidence": 0.9,
  "signals": ["price_mention", "urgency"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
};
```

---

## 5. Qualification Flows

### Example Flow: Course Sales

```typescript
const courseQualificationFlow: QualificationFlow = {
  id: 'course-sales',
  name: 'Course Sales Qualification',
  triggers: {
    keywords: ['course', 'program', 'learn', 'how do you', 'teach me'],
    intents: ['high_interest', 'purchase_ready'],
  },
  steps: [
    {
      id: 'step-1',
      question: "What's your biggest challenge with [topic] right now?",
      expectedResponses: [
        { pattern: '.*', score: 10, nextStep: 'step-2', setMetadata: { challenge: '$0' } },
      ],
      fallbackResponse: "I'd love to help! What specifically brought you to my page?",
      maxAttempts: 2,
    },
    {
      id: 'step-2',
      question: "Have you tried learning [topic] before? What happened?",
      expectedResponses: [
        { pattern: 'yes|tried|course|program', score: 20, nextStep: 'step-3' },
        { pattern: 'no|never|first time', score: 10, nextStep: 'step-3' },
      ],
      fallbackResponse: "No worries! Everyone starts somewhere.",
      maxAttempts: 2,
    },
    {
      id: 'step-3',
      question: "If you could solve this in the next 30 days, would that be worth investing in?",
      expectedResponses: [
        { pattern: 'yes|absolutely|definitely|for sure', score: 30, nextStep: 'close' },
        { pattern: 'maybe|depends|not sure', score: 10, nextStep: 'objection-handler' },
        { pattern: 'no|not really', score: -20, nextStep: 'nurture' },
      ],
      fallbackResponse: "I totally understand wanting to think about it.",
      maxAttempts: 2,
    },
  ],
  outcomes: {
    qualified: {
      action: 'send_payment_link',
      tags: ['qualified', 'hot-lead'],
    },
    notQualified: {
      action: 'add_to_nurture',
      message: "No problem! I'll send you some free resources to get started.",
    },
  },
};
```

---

## 6. Course Structure

### Module 1: Introduction (30 min)
- The DM sales opportunity
- Why automation (and when not to)
- Auto DM overview
- Setting expectations

### Module 2: Setup & Configuration (45 min)
- Installation guide
- Safari WebDriver setup
- Connecting accounts
- Initial configuration

### Module 3: Voice Training (45 min)
- The importance of authentic voice
- Gathering sample responses
- Training your AI voice
- Testing and refining

### Module 4: Qualification Flows (60 min)
- Designing your sales flow
- Writing effective questions
- Scoring responses
- Handling objections

### Module 5: Payment Integration (30 min)
- Setting up payment links
- Optimal injection timing
- Stripe/Gumroad integration
- Calendar booking setup

### Module 6: CRM & Lead Management (40 min)
- Understanding lead scores
- Tagging strategies
- CRM sync setup
- Pipeline management

### Module 7: Multi-Account Management (35 min)
- Managing multiple accounts
- Session handling
- Scaling safely
- Team workflows

### Module 8: Analytics & Optimization (35 min)
- Key metrics to track
- Conversion optimization
- A/B testing flows
- Scaling what works

**Total Course Duration**: ~5.5 hours

---

## 7. Pricing Strategy

### Tier Structure

| Tier | Price | Accounts | DMs/mo | Features |
|------|-------|----------|--------|----------|
| **Starter** | $49/mo | 1 | 500 | Basic flows |
| **Pro** | $99/mo | 3 | 2,000 | All features, CRM sync |
| **Agency** | $249/mo | 10 | Unlimited | Multi-user, API |

### ROI Calculator
```
Average course price: $500
DMs handled/month: 500
Conversion rate: 5% (25 sales)
Revenue: $12,500/mo
Tool cost: $99/mo
ROI: 126x
```

---

## 8. Development Roadmap

### Week 1: Core Refinement
- [ ] Multi-account session handling
- [ ] Conversation threading improvements
- [ ] Error recovery system
- [ ] High volume testing (50+ DMs/day)

### Week 2: Features & Integration
- [ ] Image/media handling
- [ ] Scheduled sequences
- [ ] Advanced lead scoring
- [ ] Payment link automation

### Week 3: UI & Documentation
- [ ] Web dashboard (basic)
- [ ] License integration
- [ ] Documentation
- [ ] Course recording

### Week 4: Launch
- [ ] Beta release
- [ ] Bug fixes
- [ ] Marketing materials
- [ ] Full launch

---

## 9. Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Beta users | 50 | Week 3 |
| DMs processed | 25K | Month 1 |
| Response accuracy | >90% | Ongoing |
| Conversion lift | +50% | Month 2 |
| MRR | $7,500 | Month 2 |
| Churn rate | <5%/mo | Month 3+ |

---

## 10. Competitive Analysis

| Competitor | Price | Platforms | Pros | Cons |
|------------|-------|-----------|------|------|
| **ManyChat** | $15-65/mo | IG, FB Messenger | Reliable, supported | Template-based, no AI |
| **MobileMonkey** | $19-299/mo | Multi | Feature-rich | Complex, expensive |
| **Customers.ai** | $199+/mo | Multi | Enterprise | Overkill for creators |
| **Manual VA** | $500-2000/mo | Any | Human judgment | Expensive, inconsistent |
| **Ours** | $49-249/mo | IG, TikTok, Twitter | AI voice + course | Mac only |

### Our Differentiators
1. **AI voice matching** - Sounds like you, not a bot
2. **Safari-based** - Undetectable, no API limits
3. **Multi-platform** - IG + TikTok + Twitter in one
4. **Course included** - Strategy + tool
5. **Qualification flows** - Built-in sales process

---

*Last Updated: February 5, 2026*

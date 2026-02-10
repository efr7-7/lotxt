// Newsletter Content Structure Templates
// Based on proven newsletter formats used by top publications.
// These define the CONTENT STRUCTURE (sections, word counts, reading time),
// not visual design templates.

export interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  archetype:
    | "analyst"
    | "curator"
    | "expert"
    | "reporter"
    | "writer"
    | "listicle"
    | "case-study"
    | "how-to"
    | "interview"
    | "hybrid";
  icon: string; // lucide icon name
  targetReadTime: number; // minutes
  targetWordCount: number;
  sections: {
    id: string;
    name: string;
    description: string;
    placeholder: string; // starter text
    targetWords: number;
    required: boolean;
    type: "heading" | "paragraph" | "list" | "blockquote" | "divider";
  }[];
  tips: string[];
  examples: string[]; // Example newsletters that use this format
}

/* ────────────────────────────────────────────────────────────────────────────
   1. THE CURATOR
   ──────────────────────────────────────────────────────────────────────────── */

const curatorTemplate: NewsletterTemplate = {
  id: "curator",
  name: "The Curator",
  description:
    "Hand-picked links with sharp commentary. You are the filter your readers trust. Each story gets a brief take that tells them why it matters and what to do about it.",
  archetype: "curator",
  icon: "library",
  targetReadTime: 3,
  targetWordCount: 800,
  sections: [
    {
      id: "curator-intro",
      name: "Intro Hook",
      description:
        "A punchy 2-3 sentence opener that frames today's theme or sets the tone. Build a habit loop so readers know what to expect.",
      placeholder:
        "Happy Wednesday. This week the entire industry is buzzing about one thing, and it is not what you would expect. Below: the five stories worth your time today, plus a tool that just saved me three hours of work.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
    {
      id: "curator-story-1",
      name: "Story 1 (Lead)",
      description:
        "Your strongest pick of the day. Summarize the key point, add your unique take, and link to the source. This story earns the open.",
      placeholder:
        "OpenAI just released a new reasoning model that outperforms every benchmark we track. The real story is not the model itself but what it signals about the speed of iteration in the space. Six months ago this level of performance was a research paper. Now it is an API call. If you build on top of these models, your roadmap just got shorter. Read the full breakdown here.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "curator-story-2",
      name: "Story 2",
      description:
        "A strong secondary pick. Different topic or angle from the lead story. Summarize, add commentary, and link out.",
      placeholder:
        "Stripe published their annual letter and buried inside is a stat that every SaaS founder should screenshot. Median time-to-revenue for new Stripe accounts dropped to 11 days in 2024, down from 28 days in 2021. Translation: the barrier to launching a paid product has never been lower. The winners will be the ones who ship fastest, not the ones who plan longest. Read the letter.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "curator-story-3",
      name: "Story 3",
      description:
        "Third curated story. Can be a contrarian take, an emerging trend, or a must-read resource.",
      placeholder:
        "A thread on X went viral this week arguing that email newsletters are dying. The irony is not lost on me. The data says otherwise: newsletter ad revenue grew 22% year-over-year according to LiveIntent's latest report. The people declaring email dead are the ones who never figured out how to write a good subject line. Here is the full report.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "curator-story-4",
      name: "Story 4",
      description:
        "Optional fourth story. Keep it concise. One key insight plus the link.",
      placeholder:
        "Notion just launched a native email feature that lets you send campaigns straight from your workspace. It is early, but if they nail the integration with their databases, it could be a serious play against Mailchimp for small teams. Worth watching. Details here.",
      targetWords: 70,
      required: false,
      type: "paragraph",
    },
    {
      id: "curator-story-5",
      name: "Story 5",
      description:
        "Optional fifth story. Short and sharp. Best for a lighter or more niche pick.",
      placeholder:
        "For something lighter: a designer recreated the interfaces of 10 iconic sci-fi movies using modern UI frameworks. The Minority Report one is surprisingly usable. See the project.",
      targetWords: 50,
      required: false,
      type: "paragraph",
    },
    {
      id: "curator-divider-sponsor",
      name: "Sponsor Divider",
      description: "Visual break before sponsor content.",
      placeholder: "",
      targetWords: 0,
      required: false,
      type: "divider",
    },
    {
      id: "curator-sponsor",
      name: "Sponsored Spotlight",
      description:
        "A brief, clearly-labeled sponsor mention. Write it in your own voice to maintain trust. Focus on why the product is relevant to your audience.",
      placeholder:
        "Today's issue is brought to you by Beehiiv, the newsletter platform built by the Morning Brew team. I switched six months ago and the deliverability improvement alone was worth it. If you are running a newsletter on a legacy platform, give their free plan a try and see the difference.",
      targetWords: 60,
      required: false,
      type: "paragraph",
    },
    {
      id: "curator-divider-close",
      name: "Closing Divider",
      description: "Visual break before closing CTA.",
      placeholder: "",
      targetWords: 0,
      required: false,
      type: "divider",
    },
    {
      id: "curator-cta",
      name: "Closing CTA",
      description:
        "End with a question, a request to share, or a teaser for next issue. Build the habit of engagement.",
      placeholder:
        "That is all for today. If one of these stories made you think, forward this to a colleague who needs to see it. And hit reply to tell me which story was your favorite. I read every response. See you Thursday.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Spend 80% of your time finding great sources and 20% writing commentary. Your curation taste IS the product.",
    "Add a personal take to every link. Never just paste a headline and URL.",
    "Create a consistent format readers can scan. Number your stories or use bold headers.",
    "Batch your reading. Use an RSS reader or saved-links workflow so you are not context-switching all day.",
    "Your intro should be skippable but rewarding. Respect the reader's time.",
  ],
  examples: ["TLDR", "Dense Discovery", "Sidebar", "Hacker Newsletter"],
};

/* ────────────────────────────────────────────────────────────────────────────
   2. THE ANALYST
   ──────────────────────────────────────────────────────────────────────────── */

const analystTemplate: NewsletterTemplate = {
  id: "analyst",
  name: "The Analyst",
  description:
    "A deep-dive on a single topic that leaves the reader smarter than when they opened it. You bring the research, the data, and the so-what that nobody else is connecting.",
  archetype: "analyst",
  icon: "scan-search",
  targetReadTime: 5,
  targetWordCount: 1200,
  sections: [
    {
      id: "analyst-hook",
      name: "Hook / Headline",
      description:
        "Open with a surprising fact, a bold claim, or a question that makes the reader need to keep going. This is your subject-line energy carried into the body.",
      placeholder:
        "Last quarter, Shopify merchants processed more gross merchandise value than eBay. Read that again. A company that started as a snowboard store's side project now moves more product than one of the original internet marketplaces. That shift did not happen overnight, and understanding why it happened now tells us something important about where e-commerce is headed next.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "analyst-context",
      name: "Context / Background",
      description:
        "Give the reader the essential backstory. Assume they are smart but not specialists. Answer: what happened, and why should I care?",
      placeholder:
        "For most of the 2010s, marketplace giants like Amazon and eBay dominated online retail. The conventional wisdom was simple: go where the buyers already are. Merchants listed on marketplaces because that is where the traffic lived. But starting around 2020, a quiet inversion began. Direct-to-consumer brands started outgrowing their marketplace-dependent competitors. Tools like Shopify, BigCommerce, and WooCommerce made it trivially easy to stand up a branded storefront. Social media gave brands free distribution. And customers started caring more about who they bought from, not just what they bought.",
      targetWords: 150,
      required: true,
      type: "paragraph",
    },
    {
      id: "analyst-analysis",
      name: "Analysis",
      description:
        "This is the meat. Break down the topic with original thinking. Connect dots the reader has not connected. Use frameworks, comparisons, or first-principles reasoning.",
      placeholder:
        "Three structural forces explain why the power shift accelerated in the last 18 months. First, customer acquisition costs on marketplaces have risen 40% since 2022 as more sellers compete for the same buyer pool. The marketplace tax is no longer invisible. Second, email and SMS marketing tools have matured to the point where a solo founder can run retention campaigns that rival a Fortune 500 CRM team. Owning your customer list went from nice-to-have to existential. Third, and most overlooked, AI-powered product discovery is flattening the playing field. When a chatbot can recommend a niche brand as easily as a household name, the advantage of being listed on a giant marketplace shrinks. The implication is not that marketplaces die. It is that they become one channel among many, not the default.",
      targetWords: 250,
      required: true,
      type: "paragraph",
    },
    {
      id: "analyst-data",
      name: "Data / Evidence",
      description:
        "Back up your analysis with numbers, charts, quotes, or case studies. Specificity builds credibility.",
      placeholder:
        "The numbers tell a clear story. Shopify's Q3 2024 GMV hit $69.7 billion, a 24% year-over-year jump. Meanwhile eBay's GMV for the same quarter was $18.3 billion, essentially flat. More telling is the merchant retention data: Shopify's dollar-based net revenue retention rate is above 110%, meaning existing merchants are spending more over time, not less. A survey by Klaviyo found that 67% of DTC brands now consider their owned storefront their primary revenue channel, up from 41% in 2021. And advertising data from Meta shows that cost-per-acquisition for DTC brands running traffic to their own stores dropped 15% year-over-year, while marketplace ad costs rose.",
      targetWords: 200,
      required: true,
      type: "paragraph",
    },
    {
      id: "analyst-so-what",
      name: "So What / Implications",
      description:
        "Translate the analysis into consequences. What should the reader do, believe, or watch for? This is where you earn the subscription.",
      placeholder:
        "If you are a brand selling primarily through marketplaces, this is your signal to diversify. The math is shifting and it will not shift back. Marketplaces will continue raising take rates because they can and because Wall Street demands it. Every dollar you invest in owned channels, your email list, your site experience, your content, compounds in a way that marketplace spend never will. For investors, the Shopify-versus-eBay divergence is a proxy for a larger theme: infrastructure companies that empower independent operators will outperform aggregators that extract from them. Watch for this pattern in media, services, and SaaS next.",
      targetWords: 150,
      required: true,
      type: "paragraph",
    },
    {
      id: "analyst-takeaway",
      name: "Key Takeaway",
      description:
        "Distill the entire piece into one memorable sentence or short paragraph. This is the thing they will remember tomorrow.",
      placeholder:
        "The bottom line: owning your customer relationship is no longer a luxury strategy. It is table stakes. The brands that figured this out three years ago are pulling away, and the gap is only getting wider.",
      targetWords: 50,
      required: true,
      type: "blockquote",
    },
    {
      id: "analyst-cta",
      name: "CTA",
      description:
        "Close with a question to drive replies, a referral ask, or a teaser for the next deep dive.",
      placeholder:
        "What is your take? Are you seeing this shift in your own business or investing? Hit reply and let me know. I will feature the best responses in Friday's edition. If this analysis was useful, share it with one person who would benefit.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Pick ONE topic and go deep. The temptation to cover three things at surface level kills the analyst format.",
    "Lead with the insight, not the chronology. Readers want the so-what before the backstory.",
    "Use concrete numbers. Vague claims like 'growing fast' lose credibility; '24% year-over-year' earns trust.",
    "Write the takeaway first, then reverse-engineer the supporting argument.",
    "End with a question that makes the reader want to reply. Replies are your best engagement signal.",
  ],
  examples: [
    "Stratechery",
    "The Hustle",
    "Not Boring",
    "Packy McCormick",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   3. THE REPORTER
   ──────────────────────────────────────────────────────────────────────────── */

const reporterTemplate: NewsletterTemplate = {
  id: "reporter",
  name: "The Reporter",
  description:
    "Fast, scannable news briefing that respects your reader's time. A top story, secondary coverage, and rapid-fire hits they can skim in under three minutes.",
  archetype: "reporter",
  icon: "newspaper",
  targetReadTime: 3,
  targetWordCount: 600,
  sections: [
    {
      id: "reporter-top-story",
      name: "Top Story",
      description:
        "The most important story of the day in your niche. Cover the what, why, and what-it-means in 3-4 tight paragraphs. Write like a wire service reporter with opinions.",
      placeholder:
        "Google announced it will begin charging enterprise customers for AI features in Workspace starting next quarter. The move ends a year-long free preview period and signals that Google is serious about monetizing its Gemini integration. Pricing starts at $10 per user per month on top of existing Workspace subscriptions. For context, Microsoft has been charging a similar premium for Copilot since early 2024. The real question is whether enterprises that adopted the free tools will pay to keep them. Early surveys suggest about 60% plan to continue. The other 40% say they never built it into their workflows deeply enough to justify the cost. Watch for a wave of AI tool audits inside large companies this quarter.",
      targetWords: 150,
      required: true,
      type: "paragraph",
    },
    {
      id: "reporter-story-2",
      name: "Secondary Story 1",
      description:
        "Second-tier story. Important but not the lead. Keep it to 2-3 sentences: what happened and why it matters.",
      placeholder:
        "Stripe acquired a small identity verification startup for an undisclosed amount. The deal signals that Stripe is building toward a full-stack onboarding product, not just payments. If you are using a separate KYC provider alongside Stripe, expect that to become redundant within a year.",
      targetWords: 60,
      required: true,
      type: "paragraph",
    },
    {
      id: "reporter-story-3",
      name: "Secondary Story 2",
      description:
        "Another secondary story. Different sector or angle from the first to keep coverage balanced.",
      placeholder:
        "The EU passed new regulations requiring all AI-generated content to carry visible watermarks by 2026. Enforcement details are still vague, but the market reacted fast: shares of content authentication startups spiked and Adobe announced accelerated development of its Content Credentials feature.",
      targetWords: 60,
      required: true,
      type: "paragraph",
    },
    {
      id: "reporter-story-4",
      name: "Secondary Story 3",
      description:
        "Optional third secondary story. Include if there is a strong enough news hook.",
      placeholder:
        "Substack reported that newsletters with paid subscriptions now collectively generate over $50 million in annual revenue on the platform. The top 10 writers account for roughly 40% of that, which tells you the distribution is still very top-heavy. But the long tail is growing faster than the top, which is the healthier signal.",
      targetWords: 60,
      required: false,
      type: "paragraph",
    },
    {
      id: "reporter-divider-quickhits",
      name: "Quick Hits Divider",
      description: "Visual break before the quick hits section.",
      placeholder: "",
      targetWords: 0,
      required: true,
      type: "divider",
    },
    {
      id: "reporter-quick-hits",
      name: "Quick Hits",
      description:
        "5-7 one-line news items. Each should be one sentence with a link. Think of these as headlines with just enough context.",
      placeholder:
        "Apple is testing a foldable iPhone prototype with a 7.5-inch display (link)\nSpotify raised its premium subscription price by $1 in 23 markets (link)\nNotion acquired a calendar app startup to bolster its scheduling features (link)\nUS job openings in tech rose 12% month-over-month, the first increase since September (link)\nOpenAI's latest model can now browse the web and execute code in a single session (link)\nTikTok Shop surpassed $20 billion in global GMV for 2024 (link)\nA new study found that 45% of Gen Z prefers email newsletters over social feeds for news (link)",
      targetWords: 100,
      required: true,
      type: "list",
    },
    {
      id: "reporter-divider-sponsor",
      name: "Sponsor Divider",
      description: "Visual break before sponsor.",
      placeholder: "",
      targetWords: 0,
      required: false,
      type: "divider",
    },
    {
      id: "reporter-sponsor",
      name: "Sponsor",
      description:
        "Brief sponsor mention. Keep it to 2-3 sentences in your voice.",
      placeholder:
        "Today's newsletter is powered by ConvertKit. If you are a creator who wants to own your audience and actually get paid for your work, ConvertKit makes it dead simple. Free up to 1,000 subscribers. Try it here.",
      targetWords: 40,
      required: false,
      type: "paragraph",
    },
    {
      id: "reporter-what-to-watch",
      name: "What to Watch",
      description:
        "Forward-looking section. 2-3 upcoming events, earnings, product launches, or deadlines your reader should have on their radar.",
      placeholder:
        "On our radar this week: Meta reports Q4 earnings on Wednesday, expect questions about Threads monetization and Reality Labs losses. The FTC is expected to issue new guidelines on AI-generated advertising by Friday. And Y Combinator's Winter 2025 demo day kicks off Thursday, where we will be tracking the AI and climate cohorts closely.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "reporter-cta",
      name: "CTA",
      description:
        "Short closing line. Ask for a share or reply. Keep it under two sentences.",
      placeholder:
        "If this briefing saved you time today, share it with one person who is still doom-scrolling for news. See you tomorrow morning.",
      targetWords: 30,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Speed is your advantage. Send early in the morning before your readers check other sources.",
    "Write in short paragraphs. No paragraph should be more than 3 sentences in this format.",
    "Use bolded lead-ins for each story so readers can scan and choose what to read.",
    "Quick hits should be genuinely quick. If it takes more than one sentence, it belongs in a secondary story slot.",
    "Consistency is everything. Same time, same format, every day. Train the habit.",
  ],
  examples: [
    "1440 Media",
    "Morning Brew",
    "The Hustle Daily",
    "TLDR",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   4. THE EXPERT HOW-TO
   ──────────────────────────────────────────────────────────────────────────── */

const howToTemplate: NewsletterTemplate = {
  id: "how-to",
  name: "The Expert How-To",
  description:
    "A tactical, step-by-step guide that solves a specific problem. Your reader should be able to follow along and get a result by the time they finish reading.",
  archetype: "how-to",
  icon: "graduation-cap",
  targetReadTime: 4,
  targetWordCount: 1000,
  sections: [
    {
      id: "howto-problem",
      name: "Problem Statement",
      description:
        "Name the exact problem you are solving. Be specific. The more precisely you describe the pain, the more the right reader feels seen.",
      placeholder:
        "You have 2,000 newsletter subscribers but your open rate has been dropping for three months straight. You are writing good content, your subject lines seem fine, and you have not changed anything obvious. Yet every week fewer people open, fewer people click, and you are starting to wonder if the algorithm gods have abandoned you. The problem is almost certainly not your content. It is your sender reputation, and most newsletter operators have no idea it is the thing quietly killing their growth.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "howto-why-matters",
      name: "Why It Matters",
      description:
        "Connect the problem to a bigger consequence. What happens if they do not fix this? What becomes possible if they do?",
      placeholder:
        "Sender reputation determines whether your email lands in the inbox or the promotions tab or, worst case, the spam folder. Gmail and Outlook use engagement signals like opens, clicks, and replies to decide where to route your emails. If your reputation drops below a certain threshold, your emails start disappearing. No unsubscribe, no bounce, just silence. And here is the part that stings: once your reputation tanks, it can take months to recover. Every issue you send to a disengaged list makes it worse. This is the most fixable problem in the newsletter business, yet most people do not know it exists until the damage is done.",
      targetWords: 120,
      required: true,
      type: "paragraph",
    },
    {
      id: "howto-steps",
      name: "Step-by-Step Guide",
      description:
        "The core of the piece. 3-7 clear, actionable steps. Each step should have a bolded title and 2-4 sentences of explanation. Be specific enough that the reader can execute without Googling.",
      placeholder:
        "Step 1: Audit your list health. Export your subscriber list and sort by last-opened date. Anyone who has not opened in 90 days goes into a re-engagement segment. This is usually 20 to 40 percent of your list, and they are actively hurting your deliverability.\n\nStep 2: Run a re-engagement sequence. Send your inactive segment a 3-email sequence over 10 days. Email one: a direct subject line like 'Still want to hear from me?' Email two: your single best-performing piece of content. Email three: a final notice that you are cleaning your list and they will be removed unless they click.\n\nStep 3: Remove the unresponsive subscribers. Anyone who did not open or click any of the three re-engagement emails gets removed. This feels painful but your metrics will improve immediately. A smaller, engaged list always outperforms a large, dead one.\n\nStep 4: Set up automated list hygiene. Configure your email platform to automatically suppress subscribers who have not opened in 60 days. Most platforms like ConvertKit, Beehiiv, and Mailchimp have this feature built in. Turn it on and never think about it again.\n\nStep 5: Warm up your sending with engagement bait. For the next two weeks, focus on content designed to get replies and clicks. Ask questions, run polls, include a 'click here if you agree' link. These engagement signals tell Gmail and Outlook that your subscribers want your emails.",
      targetWords: 350,
      required: true,
      type: "list",
    },
    {
      id: "howto-pro-tips",
      name: "Pro Tips",
      description:
        "2-3 insider tips that separate beginners from experts. These should feel like secrets earned through experience.",
      placeholder:
        "Pro tip one: Check your sender reputation for free using Google Postmaster Tools. It takes five minutes to set up and gives you a dashboard showing exactly how Gmail views your domain. If your reputation shows 'Low' or 'Bad' you need to act immediately.\n\nPro tip two: Send your most important emails on Tuesday or Wednesday mornings. Open rates are highest mid-week, and starting with strong engagement sets a positive signal for the rest of the week.\n\nPro tip three: Your very first email to a new subscriber is the most important email you will ever send them. If they do not open your welcome email, the relationship is already in trouble. Make it short, valuable, and reply-worthy.",
      targetWords: 150,
      required: false,
      type: "paragraph",
    },
    {
      id: "howto-mistakes",
      name: "Common Mistakes",
      description:
        "2-3 mistakes that are easy to make and costly. Framing advice as mistakes-to-avoid increases retention.",
      placeholder:
        "Mistake one: Buying or importing cold email lists. Nothing tanks your sender reputation faster than emailing people who never opted in. Even if you got the list from a 'legitimate' source, those subscribers will ignore or spam-report your emails.\n\nMistake two: Sending to your full list every time without segmentation. If 30 percent of your list has not opened in months, you are telling email providers that most people do not want your content. Segment and protect your reputation.\n\nMistake three: Changing your from-name or sending domain frequently. Consistency builds recognition. When readers see an unfamiliar sender name, they do not open, and the algorithm notices.",
      targetWords: 130,
      required: false,
      type: "paragraph",
    },
    {
      id: "howto-next-action",
      name: "Your Next Action",
      description:
        "Give them ONE thing to do right now. Lower the activation energy. Make it so easy they cannot say no.",
      placeholder:
        "Here is your homework: open your email platform right now and sort your subscribers by last-opened date. Just look at the numbers. How many people have not opened in 90 days? That single number will tell you whether you have a deliverability problem. If it is more than 25 percent of your list, come back to this guide and start at Step 1.",
      targetWords: 70,
      required: true,
      type: "blockquote",
    },
    {
      id: "howto-cta",
      name: "CTA",
      description:
        "Ask for a reply with their results, a share, or tease the next tactical guide.",
      placeholder:
        "If you run through these steps and see your open rate jump, reply and tell me by how much. I collect these wins and they genuinely make my week. Next Tuesday I am covering how to write subject lines that get 50 percent open rates. Do not miss it.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Solve ONE specific problem per issue. Broad advice feels generic. Narrow advice feels actionable.",
    "Test every step yourself before publishing. If you cannot follow your own instructions, neither can your reader.",
    "Use numbered steps, not bullet points. Numbers create a sense of progress and completion.",
    "Screenshots and examples dramatically increase the perceived value of tactical content.",
    "End with the smallest possible next action. The goal is to get them started, not to overwhelm them.",
  ],
  examples: [
    "Newsletter Operator",
    "Growth Design",
    "Demand Curve",
    "Marketing Examples",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   5. THE LISTICLE
   ──────────────────────────────────────────────────────────────────────────── */

const listicleTemplate: NewsletterTemplate = {
  id: "listicle",
  name: "The Listicle",
  description:
    "A numbered list format that is inherently scannable and shareable. Each item delivers a self-contained insight. Readers can jump to what interests them most.",
  archetype: "listicle",
  icon: "list-ordered",
  targetReadTime: 4,
  targetWordCount: 900,
  sections: [
    {
      id: "listicle-intro",
      name: "Intro (Why This List)",
      description:
        "Explain why you created this list and what criteria you used. Give the reader a reason to trust your selections.",
      placeholder:
        "Every week I test new tools, read pitch decks, and talk to founders. Most of what I see is noise. But occasionally something makes me stop and pay attention. Here are the seven tools that actually changed how I work this quarter. No affiliate links, no sponsor deals, just the stuff I genuinely use and would miss if it disappeared.",
      targetWords: 70,
      required: true,
      type: "paragraph",
    },
    {
      id: "listicle-item-1",
      name: "Item 1",
      description:
        "Your strongest list item. Lead with the best to hook the reader into scrolling through the rest.",
      placeholder:
        "1. Granola (AI meeting notes). I was skeptical about AI note-takers until I tried Granola. It sits quietly in the background during calls, captures the conversation, and then reorganizes the notes into structured summaries with action items. The key difference from Otter or Fireflies: it does not record or transcribe. It just enhances your own notes with the AI context. That means no awkward bot joining your Zoom and no privacy concerns with clients.",
      targetWords: 90,
      required: true,
      type: "paragraph",
    },
    {
      id: "listicle-item-2",
      name: "Item 2",
      description: "Second list item. Different category or use case from item one.",
      placeholder:
        "2. Cursor (AI code editor). Even if you are not a developer, Cursor is worth watching because it represents where all software is headed. It is VS Code with an AI pair programmer built in. I used it to build a complete internal dashboard in a weekend with minimal coding knowledge. The tab-completion alone saves hours. If you have ever wanted to build something but 'I cannot code' stopped you, that excuse is gone.",
      targetWords: 90,
      required: true,
      type: "paragraph",
    },
    {
      id: "listicle-item-3",
      name: "Item 3",
      description: "Third list item. Keep the momentum going with a strong pick.",
      placeholder:
        "3. Typefully (Twitter/X scheduling). I tried every social scheduling tool and most of them feel like they were designed by people who do not actually post. Typefully is different. The drafting interface is clean, the analytics are useful without being overwhelming, and the thread composer alone is worth the price. My engagement went up 35 percent after switching, mostly because I started posting more consistently.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "listicle-item-4",
      name: "Item 4",
      description: "Fourth list item. Can be a more niche or surprising pick.",
      placeholder:
        "4. Readwise Reader (read-it-later app). Pocket and Instapaper had a good run but Readwise Reader is a generational leap. It handles articles, PDFs, email newsletters, YouTube transcripts, and Twitter threads all in one place. The highlight-and-export workflow sends everything to your notes app automatically. I read 3x more since switching because everything is in one feed.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "listicle-item-5",
      name: "Item 5",
      description: "Fifth list item. Maintain quality. If you do not have a strong fifth pick, stop at four.",
      placeholder:
        "5. Tally (form builder). Google Forms works but looks like it was designed in 2012. Tally is a modern form builder with a Notion-like editing experience. The free tier is generous, conditional logic works beautifully, and the forms actually look good enough to embed on a landing page without embarrassment. I use it for reader surveys, sponsorship intake, and event registrations.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "listicle-item-6",
      name: "Item 6",
      description: "Optional sixth item. Only include if it earns its spot.",
      placeholder:
        "6. Descript (video and podcast editing). Editing video by editing text sounds like a gimmick until you try it. Descript transcribes your recording and lets you delete words from the transcript to remove them from the video. Filler word removal is automatic. If you produce any video or audio content, this cuts editing time by at least half.",
      targetWords: 70,
      required: false,
      type: "paragraph",
    },
    {
      id: "listicle-item-7",
      name: "Item 7",
      description: "Optional seventh item. End the main list on a strong note.",
      placeholder:
        "7. Arc Browser. I switched from Chrome six months ago and have not looked back. The sidebar-based tab management, split-screen browsing, and built-in Spaces for different projects make it feel like someone finally redesigned the browser for people who have 47 tabs open. The boost feature lets you customize any website's CSS, which is absurdly useful.",
      targetWords: 70,
      required: false,
      type: "paragraph",
    },
    {
      id: "listicle-honorable",
      name: "Honorable Mentions",
      description:
        "3-5 quick mentions that did not make the main list but are worth a look. One sentence each.",
      placeholder:
        "Honorable mentions: Raycast (Spotlight replacement for Mac power users), Perplexity (AI search that cites its sources), Loom (async video messaging that saves meetings), and Excalidraw (the whiteboard tool that looks hand-drawn and is somehow perfect for that).",
      targetWords: 50,
      required: false,
      type: "paragraph",
    },
    {
      id: "listicle-divider-sponsor",
      name: "Sponsor Divider",
      description: "Visual break before sponsor.",
      placeholder: "",
      targetWords: 0,
      required: false,
      type: "divider",
    },
    {
      id: "listicle-sponsor",
      name: "Sponsor",
      description: "Brief sponsor message in your own voice.",
      placeholder:
        "This issue is brought to you by Notion. I use it to run my entire content calendar and it is the only tool that has survived my annual productivity purge three years running. Try their new AI features free for 30 days.",
      targetWords: 40,
      required: false,
      type: "paragraph",
    },
    {
      id: "listicle-cta",
      name: "CTA",
      description:
        "Ask readers what they would add to the list or which item they are going to try first.",
      placeholder:
        "What tool would you add to this list? I am always looking for recommendations from readers who are deeper in specific niches than I am. Hit reply with your pick and I will compile the best reader suggestions into a follow-up issue next month.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Lead with your strongest item, not your weakest. First impressions determine whether they read the rest.",
    "Every item should pass the 'would I recommend this to a friend' test. Filler items devalue the whole list.",
    "Use odd numbers for your list count. Research shows odd-numbered lists feel more authentic and less manufactured.",
    "Add a personal anecdote to each item. 'I use this' beats 'this is good' every time.",
    "Make the list shareable by giving it a clear, specific title. '7 Tools I Actually Use' beats 'Some Cool Tools'.",
  ],
  examples: [
    "CB Insights",
    "The Profile",
    "Product Hunt Daily",
    "Superhuman (newsletter)",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   6. THE CASE STUDY
   ──────────────────────────────────────────────────────────────────────────── */

const caseStudyTemplate: NewsletterTemplate = {
  id: "case-study",
  name: "The Case Study",
  description:
    "A detailed breakdown of how a business, creator, or product achieved a specific result. Readers get the strategy, the moves, and the lessons they can steal.",
  archetype: "case-study",
  icon: "file-bar-chart",
  targetReadTime: 5,
  targetWordCount: 1100,
  sections: [
    {
      id: "case-subject-intro",
      name: "Subject Intro",
      description:
        "Introduce the subject with a hook that highlights the impressive result. Make the reader think: how did they do that?",
      placeholder:
        "In 2021, Sahil Bloom had zero newsletter subscribers and no media presence outside of Twitter. By the end of 2024, The Curiosity Chronicle had over 700,000 subscribers, was generating mid-seven-figures in annual revenue, and had become one of the most recognizable personal brands in the business newsletter space. He did it without a media company behind him, without venture funding, and without any background in journalism. Here is exactly how.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "case-background",
      name: "Background / Metrics",
      description:
        "Set the stage with context. Where did the subject start? What were the key metrics at the beginning? This establishes the before picture.",
      placeholder:
        "Sahil's starting point was a Twitter account with around 50,000 followers built by sharing threads about business frameworks and mental models. He had no email list, no website, and no content system beyond posting threads when inspiration struck. His background was in private equity, not media. The initial metrics: zero subscribers, zero revenue, one person operation. He launched the newsletter in January 2021 using a basic Substack setup with no paid promotion.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "case-strategy",
      name: "The Strategy",
      description:
        "Explain the overall approach. What was the thesis or bet they were making? What made their strategy different from the obvious playbook?",
      placeholder:
        "Sahil's core strategy was deceptively simple: use Twitter as a top-of-funnel discovery engine and convert followers into email subscribers with a consistent value proposition. But the execution had three elements that set it apart. First, he treated every Twitter thread as a standalone piece of content that could go viral independently, not just a promotion for the newsletter. Second, he developed a signature content format, the visual framework breakdown, that was instantly recognizable in a feed. Third, he focused on conversion mechanics obsessively, testing different CTAs, landing pages, and lead magnets weekly rather than monthly.",
      targetWords: 130,
      required: true,
      type: "paragraph",
    },
    {
      id: "case-timeline",
      name: "Key Moves Timeline",
      description:
        "Chronological breakdown of the 3-5 most important decisions or inflection points. Timelines make abstract strategies concrete.",
      placeholder:
        "January 2021: Launched newsletter on Substack. Added a 'subscribe' CTA to every Twitter thread. Hit 5,000 subscribers in the first month purely from organic Twitter traffic.\n\nJune 2021: Crossed 50,000 subscribers. Started a referral program using SparkLoop that offered exclusive content at 3 and 10 referral milestones. This single move drove 30 percent of all new subscriptions for the next year.\n\nJanuary 2022: Migrated from Substack to ConvertKit for better segmentation and automation. Launched a welcome sequence that converted free subscribers to engaged readers at a 75 percent open-rate for the first five emails.\n\nSeptember 2022: Introduced the first sponsor. Priced at $5,000 per issue, which seemed high at the time but established a premium positioning. The sponsor slot sold out within two months of opening it.\n\nMarch 2023: Hit 500,000 subscribers. Launched a paid community tier at $150 per year. By this point, newsletter revenue alone exceeded his previous salary in private equity.",
      targetWords: 200,
      required: true,
      type: "list",
    },
    {
      id: "case-results",
      name: "Results",
      description:
        "Hard numbers on the outcome. Revenue, growth rate, audience size, or whatever metric best illustrates the success.",
      placeholder:
        "The numbers speak clearly. Over 700,000 free subscribers with a 47 percent average open rate, which is roughly double the industry average for newsletters of that size. Sponsorship revenue exceeding $3 million annually with a waitlist of advertisers. A paid community generating an additional six figures per year. And perhaps most importantly, the newsletter became the foundation for a broader business including courses, speaking, and advisory work that collectively generates mid-seven-figures.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "case-lessons",
      name: "Lessons Learned",
      description:
        "Distill the case into 3-5 transferable lessons. These should be actionable insights the reader can apply regardless of their niche.",
      placeholder:
        "Lesson 1: Your distribution channel matters more than your content platform. Sahil built on Twitter first and newsletter second. The content was great, but without the distribution engine, nobody would have seen it.\n\nLesson 2: Referral programs work when the incentive is content, not swag. His most effective referral reward was an exclusive weekly essay, not a t-shirt. Match the incentive to what your audience actually values.\n\nLesson 3: Premium sponsor pricing attracts premium sponsors. By starting at $5,000 instead of $500, he signaled quality and attracted brands that were serious about the channel.\n\nLesson 4: Consistency compounds. He shipped every single week for three years without missing an issue. In a world of sporadic creators, reliability is a competitive advantage.",
      targetWords: 180,
      required: true,
      type: "list",
    },
    {
      id: "case-apply",
      name: "Apply to Your Business",
      description:
        "Bridge from the case study to the reader's situation. Give them a specific starting point.",
      placeholder:
        "You do not need 700,000 subscribers to apply these lessons. Start with the one that maps to your current stage. If you are under 1,000 subscribers, focus entirely on Lesson 1: find your distribution channel and post there consistently before worrying about your newsletter format. If you are between 1,000 and 10,000, implement a referral program this week. If you are above 10,000 and not monetizing, set your sponsor price higher than you think you should and see what happens.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "case-cta",
      name: "CTA",
      description:
        "Close with a question about their own business or tease the next case study.",
      placeholder:
        "Which lesson resonates most with where you are right now? Reply and tell me. Next week I am breaking down how a newsletter in the finance niche went from zero to $1 million ARR in 14 months with a completely different strategy. You will not want to miss it.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Always include specific numbers. A case study without metrics is just a story.",
    "Show the timeline, not just the result. Readers need to see the progression to believe it.",
    "Include at least one thing that did NOT work. It makes the success more credible.",
    "End each lesson with a sentence that starts with 'If you...' to make it immediately applicable.",
    "Get permission or use public information. Never speculate about private metrics.",
  ],
  examples: [
    "Starter Story",
    "Milk Road",
    "Indie Hackers",
    "How They Grow",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   7. THE INTERVIEW / Q&A
   ──────────────────────────────────────────────────────────────────────────── */

const interviewTemplate: NewsletterTemplate = {
  id: "interview",
  name: "The Interview / Q&A",
  description:
    "A structured conversation with an expert or interesting person. The Q&A format is easy to read and lets the guest's voice shine while your questions guide the reader through a logical arc.",
  archetype: "interview",
  icon: "messages-square",
  targetReadTime: 4,
  targetWordCount: 1000,
  sections: [
    {
      id: "interview-guest-intro",
      name: "Guest Introduction",
      description:
        "Introduce the guest with their most relevant credential and why the reader should care about what they have to say. Keep it tight.",
      placeholder:
        "This week I sat down with Elena Rodriguez, the head of growth at Beehiiv who previously scaled Morning Brew's subscriber base from 100,000 to 4 million. If anyone understands what separates newsletters that grow from newsletters that stall, it is Elena. She shared her framework for thinking about growth, the biggest mistakes she sees newsletter operators make, and the one tactic she would prioritize if she were starting from zero today.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "interview-context",
      name: "Context",
      description:
        "Brief context on why this conversation is happening now. Tie it to a trend, a recent event, or a question your readers have been asking.",
      placeholder:
        "I wanted to have this conversation because the most common question I get from readers is some version of: 'I have been writing for six months and I am stuck at 500 subscribers. What am I doing wrong?' Rather than give you my answer, I went to someone who has seen the data behind thousands of newsletters and knows what actually moves the needle versus what feels productive but is not.",
      targetWords: 80,
      required: true,
      type: "paragraph",
    },
    {
      id: "interview-divider-qa",
      name: "Q&A Divider",
      description: "Visual break before the Q&A begins.",
      placeholder: "",
      targetWords: 0,
      required: true,
      type: "divider",
    },
    {
      id: "interview-qa-1",
      name: "Q&A 1 (Opening Question)",
      description:
        "Start with a broad question that establishes the guest's worldview. This sets the frame for the rest of the conversation.",
      placeholder:
        "Q: You have seen the growth data for thousands of newsletters. What is the single biggest difference between ones that grow consistently and ones that plateau?\n\nA: It is almost always distribution consistency, not content quality. The newsletters that grow are the ones that have a reliable, repeatable way to get in front of new people every week. Content quality determines whether people stay, but distribution determines whether they find you in the first place. I see so many talented writers who spend 10 hours on the perfect essay and zero hours on getting it in front of new readers. That ratio needs to flip, at least in the early stages.",
      targetWords: 120,
      required: true,
      type: "paragraph",
    },
    {
      id: "interview-qa-2",
      name: "Q&A 2",
      description:
        "Follow up on the opening answer. Dig deeper into the most interesting thing they said.",
      placeholder:
        "Q: When you say distribution consistency, what does that actually look like in practice for a small newsletter operator?\n\nA: It means having at least one channel where you post something designed to attract new subscribers at least three times a week. For most people that is Twitter or LinkedIn. The key word is 'designed to attract.' A random tweet is not distribution. A thread that ends with a CTA to your newsletter is distribution. A LinkedIn post that teases what you wrote about this week is distribution. You need intentional, repeated touchpoints.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "interview-qa-3",
      name: "Q&A 3",
      description:
        "Shift to a more specific or tactical topic. Give the reader something they can act on.",
      placeholder:
        "Q: What is the biggest mistake you see newsletter operators make when they are trying to grow?\n\nA: Trying to be everything to everyone. The newsletters that grow fastest have a brutally clear value proposition you can explain in one sentence. 'Five minutes of tech news every morning' is clear. 'A newsletter about interesting things' is not. When I audit struggling newsletters, the number one issue is that if I showed the landing page to a stranger, they could not tell me exactly what they would get and why they would want it.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "interview-qa-4",
      name: "Q&A 4",
      description:
        "Ask about a contrarian opinion or something the guest believes that most people disagree with.",
      placeholder:
        "Q: What is something you believe about newsletter growth that most people would disagree with?\n\nA: That paid growth works and is underrated. There is a cult of organic-only growth in the newsletter world that I think holds people back. If you have strong content and good retention, paying one to three dollars per subscriber through Meta ads or cross-promotions is one of the best investments you can make. The math is simple. If a subscriber is worth ten dollars per year in ad revenue and you acquire them for two dollars, that is a 5x return. People spend thousands on design and tools but refuse to spend money on the thing that actually grows the business.",
      targetWords: 120,
      required: true,
      type: "paragraph",
    },
    {
      id: "interview-qa-5",
      name: "Q&A 5 (Closing Question)",
      description:
        "End with a forward-looking question or a practical recommendation the reader can use immediately.",
      placeholder:
        "Q: If you were starting a newsletter from scratch today with zero audience, what would your first 30 days look like?\n\nA: Day 1 through 7: pick a niche, write my landing page, and send the first issue to 20 friends and colleagues. Day 8 through 14: post on Twitter and LinkedIn every day, each post ending with a soft CTA to subscribe. Day 15 through 21: reach out to 10 newsletter operators in adjacent niches for cross-promotion swaps. Day 22 through 30: analyze what is working, double down on the best channel, and set up a referral program. The goal for month one is 500 engaged subscribers, not 5,000 vanity subscribers.",
      targetWords: 130,
      required: true,
      type: "paragraph",
    },
    {
      id: "interview-divider-quotes",
      name: "Key Quotes Divider",
      description: "Visual break before key quotes section.",
      placeholder: "",
      targetWords: 0,
      required: false,
      type: "divider",
    },
    {
      id: "interview-key-quotes",
      name: "Key Quotes Callout",
      description:
        "Pull 2-3 of the most memorable or shareable quotes from the conversation. These become the social media soundbites.",
      placeholder:
        "\"Content quality determines whether people stay, but distribution determines whether they find you in the first place.\"\n\n\"If I showed the landing page to a stranger, they could not tell me exactly what they would get and why they would want it.\"\n\n\"The goal for month one is 500 engaged subscribers, not 5,000 vanity subscribers.\"",
      targetWords: 60,
      required: false,
      type: "blockquote",
    },
    {
      id: "interview-recommendations",
      name: "Guest's Recommendations",
      description:
        "Ask the guest for 2-3 resources, tools, or people they recommend. Readers love curated recommendations from experts.",
      placeholder:
        "Elena's recommendations for newsletter operators: Read 'Newsletter Operator' by Matt McGarry for tactical growth advice. Use SparkLoop for referral programs, it is the best in class. Follow Chenell Basilio on Twitter for deep dives on how specific newsletters grew. And sign up for 10 newsletters outside your niche to study what works across different audiences.",
      targetWords: 60,
      required: false,
      type: "paragraph",
    },
    {
      id: "interview-cta",
      name: "CTA",
      description:
        "Thank the guest, link to their work, and ask readers who they want interviewed next.",
      placeholder:
        "Huge thanks to Elena for the candid conversation. You can follow her work at Beehiiv and find her on Twitter @elenagrowthnerd. If there is someone you want me to interview next, reply with their name and one question you would want me to ask them. I read every suggestion.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Prepare 10 questions but only use 5-8. Let the conversation breathe and follow interesting tangents.",
    "Edit for clarity, not for length. Remove filler words and tighten answers while keeping the guest's voice authentic.",
    "Front-load the most valuable Q&A. If question 6 has the best answer, move it to position 2.",
    "Always ask one contrarian question. The best soundbites come from unexpected opinions.",
    "Pull key quotes into a callout section. These become your social promotion clips.",
  ],
  examples: [
    "The Profile",
    "My First Million (newsletter version)",
    "Indie Hackers interviews",
    "Creator Science",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   8. THE HYBRID (CURATOR + ORIGINAL)
   ──────────────────────────────────────────────────────────────────────────── */

const hybridTemplate: NewsletterTemplate = {
  id: "hybrid",
  name: "The Hybrid (Curator + Original)",
  description:
    "The best of both worlds: an original insight or mini-essay paired with curated links. You get to showcase your thinking while still providing the scannable value of curated content.",
  archetype: "hybrid",
  icon: "layers",
  targetReadTime: 3,
  targetWordCount: 800,
  sections: [
    {
      id: "hybrid-essay",
      name: "Original Insight / Mini-Essay",
      description:
        "A short, original piece that shares one idea, observation, or framework. This is what makes your newsletter irreplaceable. Keep it under 300 words so it does not overwhelm the curated section.",
      placeholder:
        "I have been thinking a lot about the concept of 'content debt' this week. We talk about technical debt in software, the cost of shortcuts that compound over time. But content creators have their own version. Every piece of mediocre content you publish trains your audience to expect less. Every week you skip teaches subscribers that your schedule is unreliable. Every clickbait subject line that does not deliver erodes trust by a fraction of a percent. None of these things kill you individually. But they compound. A newsletter with content debt feels sluggish even when the individual issue is good, because the audience has been trained to disengage. The fix is the same as technical debt: you have to stop accumulating it before you can start paying it down. That means publishing nothing instead of publishing something you are not proud of. It means sending a short, honest note when you cannot write a full issue instead of going silent. It means treating every subject line as a promise and every issue as proof that you keep your promises. The newsletters that grow fastest are not necessarily the best written. They are the ones with zero content debt. Every issue delivers exactly what the reader expected or better. Trust compounding is the most underrated growth strategy in media.",
      targetWords: 220,
      required: true,
      type: "paragraph",
    },
    {
      id: "hybrid-divider-sponsor",
      name: "Sponsor Divider",
      description: "Visual break before sponsor.",
      placeholder: "",
      targetWords: 0,
      required: false,
      type: "divider",
    },
    {
      id: "hybrid-sponsor",
      name: "Sponsor",
      description:
        "Brief sponsor mention. Position it between the essay and curated links for maximum visibility.",
      placeholder:
        "This issue is supported by Riverside, the recording platform that makes your podcast and video interviews look studio-quality even on a terrible WiFi connection. I have used it for the last 20 interviews and the difference from Zoom recordings is night and day. Try it free for your next recording.",
      targetWords: 50,
      required: false,
      type: "paragraph",
    },
    {
      id: "hybrid-divider-links",
      name: "Links Divider",
      description: "Visual break before curated links section.",
      placeholder: "",
      targetWords: 0,
      required: true,
      type: "divider",
    },
    {
      id: "hybrid-link-1",
      name: "Curated Link 1",
      description:
        "First curated pick with 2-3 sentences of commentary. Connect it to a theme or your original essay if possible.",
      placeholder:
        "Speaking of trust, this piece from Kyla Scanlon on 'vibecessions' and the gap between economic data and public sentiment is one of the best things I read this week. Her argument that feelings are economic indicators, not just reactions to them, reframes how we should think about consumer confidence data. A must-read for anyone in media or marketing. Link here.",
      targetWords: 70,
      required: true,
      type: "paragraph",
    },
    {
      id: "hybrid-link-2",
      name: "Curated Link 2",
      description:
        "Second curated link with brief commentary.",
      placeholder:
        "Packy McCormick published a deep dive on the 'creator middle class' and whether it actually exists. The short answer is yes, but it looks different than people expect. Most sustainable creator businesses are making $100K to $300K from boring, consistent content rather than viral hits. His data on revenue per subscriber across different niches is eye-opening. Read it here.",
      targetWords: 70,
      required: true,
      type: "paragraph",
    },
    {
      id: "hybrid-link-3",
      name: "Curated Link 3",
      description:
        "Third curated link. Vary the format: could be a thread, podcast episode, or tool.",
      placeholder:
        "A Twitter thread from Lenny Rachitsky breaking down the exact referral program structure that grew his newsletter to 500K subscribers. He shares the specific milestones, the rewards at each tier, and the conversion rates. If you are thinking about launching a referral program, screenshot this thread before you do anything else. Thread link.",
      targetWords: 60,
      required: true,
      type: "paragraph",
    },
    {
      id: "hybrid-link-4",
      name: "Curated Link 4",
      description: "Optional fourth link. Keep it short.",
      placeholder:
        "Notion released a new feature called Notion Mail that turns your workspace into an email client. Early reviews are mixed but the vision is interesting: what if your email, docs, and project management lived in one tool? I am cautiously optimistic. Details here.",
      targetWords: 50,
      required: false,
      type: "paragraph",
    },
    {
      id: "hybrid-link-5",
      name: "Curated Link 5",
      description: "Optional fifth link. Can be lighter in tone.",
      placeholder:
        "For fun: someone built a website that generates fake startup landing pages using AI and they are disturbingly convincing. Try to guess which ones are real. Play here.",
      targetWords: 30,
      required: false,
      type: "paragraph",
    },
    {
      id: "hybrid-tool",
      name: "Tool / Resource of the Week",
      description:
        "A single tool, book, podcast episode, or resource recommendation. Brief and specific about why it is useful.",
      placeholder:
        "Tool of the week: Hemingway Editor (hemingwayapp.com). Paste in your draft and it highlights complex sentences, passive voice, and readability issues. I run every newsletter through it before hitting send. Free and takes 30 seconds. Your readers' attention spans will thank you.",
      targetWords: 50,
      required: false,
      type: "paragraph",
    },
    {
      id: "hybrid-quote",
      name: "Quote of the Week",
      description:
        "A short, relevant quote that ties back to the theme of the issue or inspires the reader.",
      placeholder:
        "\"The best time to start was yesterday. The second best time is today, but only if you actually ship something instead of just planning.\" -- a sign I should probably hang above my desk.",
      targetWords: 30,
      required: false,
      type: "blockquote",
    },
    {
      id: "hybrid-cta",
      name: "CTA",
      description:
        "Close with an engaging question or share ask.",
      placeholder:
        "What are you shipping this week? Hit reply and tell me. I will give you a virtual high-five and hold you accountable next issue. If this newsletter adds value to your week, the best way to support it is to share it with one person who would enjoy it. See you next Wednesday.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Your original essay should be opinionated enough to generate replies. Lukewarm takes do not earn subscriptions.",
    "Keep the essay and curated sections visually distinct. Use a divider and different formatting so readers can navigate easily.",
    "The essay does not need to connect to the curated links, but when it does, the issue feels more cohesive.",
    "Tool of the week and quote of the week are low-effort, high-value sections. Readers love them.",
    "This format works best on a weekly cadence. Daily is too much original thinking; monthly loses the curation freshness.",
  ],
  examples: [
    "Lenny's Newsletter",
    "The Generalist",
    "Exploding Topics",
    "Exec Sum",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   9. THE WRITER / ESSAY
   ──────────────────────────────────────────────────────────────────────────── */

const writerTemplate: NewsletterTemplate = {
  id: "writer",
  name: "The Writer / Essay",
  description:
    "Long-form personal essay that blends storytelling with insight. You are not reporting the news or curating links. You are making the reader see the world differently through the lens of your experience and thinking.",
  archetype: "writer",
  icon: "pen-line",
  targetReadTime: 6,
  targetWordCount: 1500,
  sections: [
    {
      id: "writer-hook",
      name: "Opening Hook",
      description:
        "The first 2-3 sentences that make the reader commit to the whole essay. Start in the middle of the action, with a surprising statement, or with a vivid scene. Never start with throat-clearing.",
      placeholder:
        "I almost quit writing this newsletter three months ago. I had 12,000 subscribers, decent open rates, sponsors reaching out, and absolutely no idea what I was doing anymore. The metrics said keep going. My gut said something was broken. I spent a weekend staring at a blank screen trying to write the next issue and realized the problem: I had been writing for my audience for so long that I forgot why I started writing in the first place.",
      targetWords: 100,
      required: true,
      type: "paragraph",
    },
    {
      id: "writer-story",
      name: "Personal Story / Anecdote",
      description:
        "Expand the hook into a fuller narrative. Include specific details: names, places, dialogue, sensory descriptions. The story is the vehicle for the idea, not decoration.",
      placeholder:
        "It started the way these things always start, gradually and then all at once. The first year of this newsletter was electric. I wrote about whatever fascinated me that week. Some issues were about technology, some about philosophy, one memorable one was about why I think grocery stores are the most underrated design achievement of the 20th century. The audience grew because the writing had energy. People could feel that I was writing what I wanted to write, not what I thought they wanted to read.\n\nThen the sponsors came. And with sponsors came the subtle pressure to maintain a niche. Readers started replying with requests: 'More posts about productivity.' 'Can you do a series on AI tools?' 'Your best posts are the ones about startups.' Each request was reasonable. Each one pulled me slightly toward a version of this newsletter that was more predictable and less alive.\n\nBy month 18, I had optimized myself into a corner. Every issue followed the same structure. The topics were safe. The voice was professional. The open rates were fine but the replies had dried up. Nobody was forwarding issues to friends anymore. Nobody was quoting me on Twitter. The newsletter was competent and forgettable, which in a world of infinite content is the same as dead.",
      targetWords: 300,
      required: true,
      type: "paragraph",
    },
    {
      id: "writer-argument",
      name: "Core Argument",
      description:
        "Transition from the personal to the universal. What is the broader truth your story illustrates? State your thesis clearly but let it emerge naturally from the narrative.",
      placeholder:
        "Here is what I learned from that weekend of staring at a blank screen: the most dangerous thing that can happen to a creative project is for it to become successful enough to constrain you but not successful enough to free you. There is a zone between 'nobody is watching so I can do whatever I want' and 'I have enough runway to experiment freely' where most creators get stuck. In that zone, every decision is about preservation instead of exploration. You write to keep subscribers instead of writing to discover ideas. You optimize for open rates instead of optimizing for the sentence that makes someone stop scrolling and think.\n\nI call this the 'content treadmill' and it has a specific mechanism. When you start, your identity as a writer is larger than your newsletter. You bring your whole self to the page. As the newsletter grows, it starts to develop its own identity separate from yours. And slowly, imperceptibly, you start serving the newsletter's identity instead of your own. The newsletter becomes the master and you become the employee.",
      targetWords: 250,
      required: true,
      type: "paragraph",
    },
    {
      id: "writer-examples",
      name: "Supporting Examples",
      description:
        "Strengthen your argument with 2-3 examples from outside your personal experience. These can be other writers, historical parallels, research, or cultural references.",
      placeholder:
        "This is not a new phenomenon. David Bowie talked about it with music. Every time an album succeeded, the temptation was to make the same album again. His solution was to change personas entirely, to burn down what worked and start over. Most artists cannot do that because they are afraid of losing the audience they have built. But Bowie understood that an audience attracted to predictability is an audience you can never surprise, and surprise is the engine of creative work.\n\nYou see this pattern in newsletters too. Tim Urban of Wait But Why posted infrequently and only when he had something that genuinely excited him. The result was that every post felt like an event. Contrast that with newsletters that publish on a rigid schedule regardless of whether they have something worth saying. Consistency is valuable, but consistency without conviction is just noise.\n\nThe research backs this up. A study from Wharton found that creative output quality does not correlate with volume above a certain threshold. Past a tipping point, more output means lower average quality and, critically, lower audience engagement per piece. The creators who maintain quality at scale are the ones who have a strong internal filter for 'is this worth publishing' versus 'is it Tuesday so I need to publish something.'",
      targetWords: 280,
      required: true,
      type: "paragraph",
    },
    {
      id: "writer-conclusion",
      name: "Conclusion / Revelation",
      description:
        "Return to the personal story from the opening and reveal what changed or what you now understand. The best essays end somewhere different from where they began.",
      placeholder:
        "So what did I do during that weekend of staring at the blank screen? I scrapped the issue I was supposed to write, a perfectly serviceable piece about content marketing trends, and instead I wrote about grocery stores again. Not because it was strategic or niche-appropriate. Because it was what I actually wanted to write about.\n\nThe response was the best I had gotten in months. Not in open rates, those were about the same. But in replies. Dozens of people wrote back to tell me about their favorite grocery stores, about the design details they had never noticed, about how the essay made them see a mundane part of their day differently. One person said it was the first newsletter in months that they read twice.\n\nI do not have a neat framework to offer you. I cannot give you five steps to escape the content treadmill. What I can tell you is this: if you are a writer and you have not surprised yourself with your own work recently, that is the signal. Not your open rate, not your growth curve, not your sponsor revenue. The question is whether you are still writing things that make you think 'I did not know I believed that until I wrote it.' If the answer is no, it might be time to stare at a blank screen for a weekend.",
      targetWords: 250,
      required: true,
      type: "paragraph",
    },
    {
      id: "writer-cta",
      name: "CTA",
      description:
        "Keep it simple and personal. The essay should do the selling. A quiet invitation to share or reply is enough.",
      placeholder:
        "If this resonated with you, I would love to hear your version of the story. When was the last time you surprised yourself with your own work? Hit reply. No need for a long response. Even one sentence is enough. And if you know a writer or creator who needs to hear this, send it their way. Sometimes the right essay at the right time changes the trajectory.",
      targetWords: 60,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Write the first draft for yourself, then edit for the reader. The best essays start as self-exploration.",
    "Specific details make writing believable. 'A coffee shop' is forgettable. 'The corner booth at Diner on 14th Street at 7 AM when it smells like burnt toast' is vivid.",
    "Your conclusion should not just restate your opening. The reader should arrive somewhere new.",
    "Read your essay out loud before publishing. If a sentence sounds unnatural spoken, rewrite it.",
    "Long-form essays need breathing room. Use paragraph breaks generously and vary sentence length.",
    "Do not over-explain. Trust the reader to draw their own connections from the story.",
  ],
  examples: [
    "Wait But Why",
    "Paul Graham",
    "The Marginalian (Brain Pickings)",
    "Morgan Housel",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   10. THE PLAYBOOK
   ──────────────────────────────────────────────────────────────────────────── */

const playbookTemplate: NewsletterTemplate = {
  id: "playbook",
  name: "The Playbook",
  description:
    "A structured framework or system the reader can implement. Unlike a how-to that solves one problem, a playbook gives them a reusable mental model or operating system for a category of problems.",
  archetype: "how-to",
  icon: "book-open",
  targetReadTime: 5,
  targetWordCount: 1200,
  sections: [
    {
      id: "playbook-problem",
      name: "Problem / Opportunity",
      description:
        "Frame the problem or opportunity this framework addresses. Make the reader feel the pain or see the potential before you introduce the solution.",
      placeholder:
        "Most newsletter operators treat monetization as a single decision: free or paid. But the creators earning the most from their newsletters are not choosing one model. They are running a monetization stack, layered revenue streams that compound on each other. A newsletter with only sponsorships leaves money on the table. A newsletter with only paid subscriptions caps its growth. The operators who build sustainable businesses have three to five revenue streams working simultaneously, and they add them in a specific order. Here is the framework I use to think about newsletter monetization, and the sequence that maximizes revenue without burning out your audience.",
      targetWords: 120,
      required: true,
      type: "paragraph",
    },
    {
      id: "playbook-framework",
      name: "The Framework Overview",
      description:
        "Introduce the framework by name and give a high-level overview of its 3-5 pillars or components. A visual or numbered list helps the reader see the whole system before diving into parts.",
      placeholder:
        "I call it the Newsletter Revenue Ladder. It has five rungs, and you climb them in order. Each rung builds on the audience trust and infrastructure you created at the rung below. Skip a rung and the math breaks. The five rungs, from bottom to top:\n\n1. Sponsorships (the foundation: monetize attention)\n2. Affiliate and referral income (monetize trust)\n3. Digital products (monetize expertise)\n4. Premium subscriptions (monetize access)\n5. Services and consulting (monetize relationships)\n\nMost creators try to start at rung 4 or 5 and wonder why it does not work. The sequence matters because each rung teaches you something about your audience that makes the next rung possible.",
      targetWords: 150,
      required: true,
      type: "list",
    },
    {
      id: "playbook-pillar-1",
      name: "Pillar 1 Deep Dive",
      description:
        "Detailed breakdown of the first pillar. Include the what, the when (stage or size), and the how.",
      placeholder:
        "Rung 1: Sponsorships. Start here when you reach 1,000 to 2,000 subscribers with consistent open rates above 40 percent. Sponsorships are the best first revenue stream because they do not require your audience to pay anything. You are monetizing the attention you have already earned. Pricing formula: start at $25 to $50 per 1,000 subscribers per issue for a single sponsor slot. A newsletter with 5,000 subscribers can charge $125 to $250 per issue. At weekly cadence, that is $500 to $1,000 per month. Not life-changing but it proves the business model and gives you data. The key insight: do not sell CPM-based ads. Sell a sponsor 'slot' that includes a brief native-voice mention. This positions you as a media company, not a billboard. Sponsors who get personal endorsements from the writer see 3 to 5x higher click-through rates than display ads.",
      targetWords: 170,
      required: true,
      type: "paragraph",
    },
    {
      id: "playbook-pillar-2",
      name: "Pillar 2 Deep Dive",
      description:
        "Detailed breakdown of the second pillar.",
      placeholder:
        "Rung 2: Affiliate and referral income. Add this once you have a track record of recommending tools and products your audience uses. Referral programs like SparkLoop and Beehiiv's recommendation network pay you $1 to $3 per subscriber you send to partner newsletters. This is nearly passive income once set up. Affiliate links for tools you already use and recommend like ConvertKit, Notion, and Canva typically pay $50 to $200 per conversion. The trick is authenticity: only recommend products you genuinely use. Your audience can smell a cash-grab recommendation and it destroys the trust you need for rungs 3 through 5. A well-optimized affiliate strategy can add $500 to $2,000 per month without any additional content creation. Just weave honest recommendations into your existing writing.",
      targetWords: 150,
      required: true,
      type: "paragraph",
    },
    {
      id: "playbook-pillar-3",
      name: "Pillar 3 Deep Dive",
      description:
        "Detailed breakdown of the third pillar.",
      placeholder:
        "Rung 3: Digital products. This is where the economics start to change. Once you understand your audience's problems from the questions and replies you have received through rungs 1 and 2, you can create targeted digital products. Start simple: a $29 to $49 template pack, a $79 to $149 mini-course, or a $19 to $39 ebook. The product should solve a specific problem your readers have asked you about repeatedly. Your newsletter becomes the distribution channel. A launch to 10,000 subscribers with a 2 percent conversion rate on a $49 product generates $9,800 from a single email. Most creators can create and launch a digital product in 2 to 4 weeks. The marginal cost after creation is zero, which makes this the highest-margin rung on the ladder.",
      targetWords: 150,
      required: true,
      type: "paragraph",
    },
    {
      id: "playbook-pillar-4",
      name: "Pillar 4 Deep Dive",
      description:
        "Detailed breakdown of the fourth pillar. Optional if your framework has only 3 pillars.",
      placeholder:
        "Rung 4: Premium subscriptions. Notice this is rung 4, not rung 1. By the time you introduce a paid tier, you should already have a proven content track record, a deep understanding of what your audience values most, and revenue from other sources so you are not desperate. Price between $10 and $20 per month or $100 to $150 per year. The paid tier should offer exclusive content, community access, or both. Conversion rates from free to paid typically range from 2 to 8 percent depending on your niche and content depth. The subscribers who convert at this stage are your true fans. They will stay for years if you deliver consistently. A newsletter with 20,000 free subscribers converting 5 percent at $150 per year generates $150,000 in recurring revenue.",
      targetWords: 150,
      required: false,
      type: "paragraph",
    },
    {
      id: "playbook-pillar-5",
      name: "Pillar 5 Deep Dive",
      description:
        "Detailed breakdown of the fifth pillar if applicable.",
      placeholder:
        "Rung 5: Services and consulting. The top of the ladder. Your newsletter has established you as a domain expert, and the most valuable thing you can sell is direct access to your thinking. Consulting, advisory retainers, workshops, or speaking engagements. These are high-ticket, low-volume revenue streams. A single consulting client at $5,000 to $10,000 per month can match or exceed all your other revenue streams combined. The newsletter is your lead generation engine. You never have to cold pitch again because inbound leads come from people who have read your thinking for months or years. Not every creator wants to do services, and that is fine. But for those who do, this rung often becomes the largest single revenue source.",
      targetWords: 150,
      required: false,
      type: "paragraph",
    },
    {
      id: "playbook-checklist",
      name: "Implementation Checklist",
      description:
        "A scannable checklist the reader can use to start implementing the framework immediately.",
      placeholder:
        "Your implementation checklist:\n\nThis week: Audit where you are on the Revenue Ladder. Which rung are you on? Which rung should you add next?\n\nThis month: If you are pre-revenue, set up your first sponsor outreach. Create a one-page media kit with your subscriber count, open rate, and audience demographics. Reach out to 10 companies your readers already use.\n\nThis quarter: Layer on your next rung. If you have sponsorships, add affiliate links for 3 to 5 tools you genuinely recommend. If you have affiliate income flowing, survey your readers to identify the number one problem you could solve with a digital product.\n\nOngoing: Track revenue per subscriber across all streams. Your goal is to increase this number by adding rungs, not by squeezing more from existing ones. Healthy newsletters generate $2 to $5 per subscriber per year across all revenue streams combined.",
      targetWords: 160,
      required: true,
      type: "list",
    },
    {
      id: "playbook-divider-sponsor",
      name: "Sponsor Divider",
      description: "Visual break before sponsor.",
      placeholder: "",
      targetWords: 0,
      required: false,
      type: "divider",
    },
    {
      id: "playbook-sponsor",
      name: "Sponsor",
      description: "Brief sponsor mention.",
      placeholder:
        "Today's framework is brought to you by Beehiiv, the newsletter platform built for operators who want to grow and monetize. Their built-in ad network, referral program, and recommendation engine cover rungs 1 and 2 out of the box. If you are serious about newsletter revenue, start here. Free plan available.",
      targetWords: 50,
      required: false,
      type: "paragraph",
    },
    {
      id: "playbook-resources",
      name: "Resources",
      description:
        "3-5 links to tools, articles, or further reading that help the reader implement the framework.",
      placeholder:
        "Resources to go deeper:\n\nSparkLoop (referral and recommendation network for newsletters)\nGumroad or Lemon Squeezy (for selling digital products with zero setup)\nGoogle Postmaster Tools (monitor your sender reputation for free)\n'Newsletter Operator' by Matt McGarry (the single best tactical resource on newsletter growth and monetization)\nSponsor pricing calculator (link to a spreadsheet you can copy and customize for your own rates)",
      targetWords: 60,
      required: false,
      type: "list",
    },
    {
      id: "playbook-cta",
      name: "CTA",
      description:
        "Invite readers to share which rung they are on or ask a question about implementation.",
      placeholder:
        "Which rung of the Revenue Ladder are you on right now, and which one are you adding next? Reply and tell me. I respond to every email and I am always curious where readers are in their journey. If this framework was useful, share it with a fellow newsletter operator who is thinking about monetization. See you next week.",
      targetWords: 50,
      required: true,
      type: "paragraph",
    },
  ],
  tips: [
    "Name your framework. A named framework is 10x more shareable and memorable than generic advice.",
    "The overview should make the whole system visible before you deep-dive. Readers need the map before the territory.",
    "Each pillar should be independently valuable but more powerful when combined. This creates natural 'aha' moments.",
    "Include a checklist. Frameworks without implementation steps feel academic. Checklists make them actionable.",
    "Use real numbers wherever possible. Revenue ranges, conversion rates, and time estimates make the framework credible.",
  ],
  examples: [
    "Newsletter Operator",
    "First 1000",
    "Nathan Barry (ConvertKit)",
    "Sahil Bloom",
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   EXPORTS
   ──────────────────────────────────────────────────────────────────────────── */

export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  curatorTemplate,
  analystTemplate,
  reporterTemplate,
  howToTemplate,
  listicleTemplate,
  caseStudyTemplate,
  interviewTemplate,
  hybridTemplate,
  writerTemplate,
  playbookTemplate,
];

/* ────────────────────────────────────────────────────────────────────────────
   HELPER: getTemplateHtml
   Returns HTML with placeholder content for each section, styled with
   headings, paragraphs, lists, blockquotes, and horizontal rules.
   ──────────────────────────────────────────────────────────────────────────── */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSectionHtml(
  section: NewsletterTemplate["sections"][number],
): string {
  const escaped = escapeHtml(section.placeholder);

  switch (section.type) {
    case "heading":
      return `<h2>${escapeHtml(section.name)}</h2>`;

    case "divider":
      return "<hr />";

    case "blockquote":
      return `<h2>${escapeHtml(section.name)}</h2>\n<blockquote><p>${escaped.replace(/\n\n/g, "</p></blockquote>\n<blockquote><p>").replace(/\n/g, "<br />")}</p></blockquote>`;

    case "list": {
      const items = escaped.split("\n").filter((line) => line.trim() !== "");
      const listItems = items.map((item) => `  <li>${item}</li>`).join("\n");
      return `<h2>${escapeHtml(section.name)}</h2>\n<ul>\n${listItems}\n</ul>`;
    }

    case "paragraph":
    default: {
      const paragraphs = escaped
        .split("\n\n")
        .filter((p) => p.trim() !== "")
        .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
        .join("\n");
      return `<h2>${escapeHtml(section.name)}</h2>\n${paragraphs}`;
    }
  }
}

export function getTemplateHtml(templateId: string): string {
  const template = NEWSLETTER_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return "<p>Template not found.</p>";
  }

  const sectionsHtml = template.sections
    .map((section) => renderSectionHtml(section))
    .join("\n\n");

  return sectionsHtml;
}

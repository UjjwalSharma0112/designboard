import type { QuestionRecord } from "../types/index";

export interface AICall {
  system: string;
  prompt: string;
  json: boolean;
}

export interface PromptDomainConfig {
  interviewType: string;
  interviewerRole: string;
  contextLabel: string;
  questionFocusAreas: string[];
  reportPerformanceLabel: string;
}

export const TECH_INTERVIEW_PROMPT_DOMAIN: PromptDomainConfig = {
  interviewType: "structured tech interview",
  interviewerRole: "experienced technical interviewer",
  contextLabel: "candidate-provided interview context",
  questionFocusAreas: [
    "Their stated topics, preferences, and experience level",
    "Core concepts behind the requested interview areas",
    "Practical problem solving and trade-off reasoning",
    "Edge cases, constraints, and operational concerns where relevant",
    "How they compare alternatives and justify technical choices",
  ],
  reportPerformanceLabel: "technical interview performance",
};

export const SYSTEM_DESIGN_PROMPT_DOMAIN: PromptDomainConfig = {
  interviewType: "system design interview",
  interviewerRole: "distinguished systems architect",
  contextLabel: "system design requirements and architecture diagram description",
  questionFocusAreas: [
    "The components, databases, queues, and gateways the candidate drew in their architecture diagram",
    "How data flows between these components, the APIs, and communication protocols (e.g. gRPC, HTTP, WebSockets)",
    "Scalability, caching, load balancing, CDNs, and database read/write throughput",
    "Reliability, replication, partitioning/sharding, consensus, and fault tolerance",
    "Trade-offs in their choices (e.g. SQL vs NoSQL, consistency vs availability, pull vs push model)",
  ],
  reportPerformanceLabel: "system design architecture and interview performance",
};

const DIFFICULTY_CONTEXT = {
  easy: "The candidate is a junior engineer or student. Keep questions foundational.",
  medium: "The candidate is a mid-level engineer with 2-4 years experience.",
  hard: "The candidate is a senior engineer. Probe deep trade-offs and edge cases.",
};

function difficultyContext(difficulty: string): string {
  return (
    DIFFICULTY_CONTEXT[difficulty as keyof typeof DIFFICULTY_CONTEXT] ??
    "Adapt the depth of the interview to the stated difficulty."
  );
}

function parseSystemDesignContext(interviewContext: string): string {
  try {
    const trimmed = interviewContext.trim();
    if (trimmed.startsWith("{") && trimmed.includes("nodes") && trimmed.includes("edges")) {
      const data = JSON.parse(trimmed);
      const nodes = data.nodes || [];
      const edges = data.edges || [];

      if (nodes.length === 0) {
        return "The candidate started the system design session without adding any components to the canvas.";
      }

      let formattedNodes = "Components in the architecture:\n";
      const idToLabel: Record<string, string> = {};

      nodes.forEach((n: any) => {
        const type = n.data?.type || n.type || "Component";
        const label = n.data?.label || n.id;
        const tag = n.data?.tag || n.tag || "";
        idToLabel[n.id] = label;
        formattedNodes += `- ${label} (Type: ${type}${tag ? `, Tag: ${tag}` : ""})\n`;
      });

      let formattedEdges = "\nConnections and Data Flow:\n";
      if (edges.length === 0) {
        formattedEdges += "No connections between components were drawn by the candidate.\n";
      } else {
        edges.forEach((e: any) => {
          const sourceId = e.source || e.from;
          const targetId = e.target || e.to;
          const descriptor = e.label || e.descriptor || "";
          const tag = e.tag || "";
          
          const sourceLabel = idToLabel[sourceId] || sourceId;
          const targetLabel = idToLabel[targetId] || targetId;
          
          let edgeDetails = "";
          if (descriptor && tag) {
            edgeDetails = ` via ${descriptor} [${tag}]`;
          } else if (descriptor) {
            edgeDetails = ` via ${descriptor}`;
          } else if (tag) {
            edgeDetails = ` [${tag}]`;
          }
          
          formattedEdges += `- ${sourceLabel} connects to ${targetLabel}${edgeDetails}\n`;
        });
      }

      return `The candidate drew a system architecture diagram with the following configuration:\n\n${formattedNodes}${formattedEdges}`;
    }
  } catch (e) {
    // Return original if parsing fails
  }
  return interviewContext;
}

function formatCandidateContext(
  interviewContext: string,
  domain: PromptDomainConfig,
): string {
  return `The candidate has provided the following ${domain.contextLabel}. It may include components, connections, preferred topics, role goals, constraints, or areas they want to be interviewed on:\n\`\`\`text\n${interviewContext}\n\`\`\``;
}

function formatFocusAreas(domain: PromptDomainConfig): string {
  return domain.questionFocusAreas
    .map((focusArea, index) => `${index + 1}. ${focusArea}`)
    .join("\n");
}

function formatHistory(history: QuestionRecord[]): string {
  return history
    .map((r, i) => {
      const followUpLines = r.followUps
        .map(
          (f, j) =>
            `  Follow-up ${j + 1}: ${f.question}\n  Answer: ${f.answer}`,
        )
        .join("\n");

      return [
        `Q${i + 1}: ${r.question}`,
        `Answer: ${r.answer}`,
        followUpLines,
        `Score: ${r.evaluation?.score ?? "N/A"}/10`,
        `Strengths: ${r.evaluation?.strengths.join(", ") ?? "-"}`,
        `Gaps: ${r.evaluation?.gaps.join(", ") ?? "-"}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export function buildIntroPrompt(
  topic: string,
  difficulty: string,
  interviewContext: string,
  questionCount: number,
  domain = SYSTEM_DESIGN_PROMPT_DOMAIN,
): AICall {
  const parsedContext = parseSystemDesignContext(interviewContext);
  return {
    system: `You are an ${domain.interviewerRole} conducting a ${domain.interviewType}.
Be professional but conversational. Do not ask any questions yet; this is only the introduction.`,
    prompt: `${formatCandidateContext(parsedContext, domain)}

Topic: ${topic}
Difficulty: ${difficulty} - ${difficultyContext(difficulty)}

Write a short interview introduction (3-4 sentences):
- Acknowledge the candidate's provided system design topic and architecture diagram
- Frame what the system design interview will cover based on the topic, components they drew, and difficulty
- Set expectations (you will ask ${questionCount} questions to probe their design, they should think out loud)
- Keep it encouraging but professional`,
    json: false,
  };
}

export function buildQuestionsPrompt(
  topic: string,
  difficulty: string,
  interviewContext: string,
  count: number,
  domain = SYSTEM_DESIGN_PROMPT_DOMAIN,
): AICall {
  const parsedContext = parseSystemDesignContext(interviewContext);
  return {
    system: `You are an ${domain.interviewerRole} conducting a ${domain.interviewType}.
You must return ONLY a JSON array of strings; no markdown, no explanation, no preamble.`,
    prompt: `${formatCandidateContext(parsedContext, domain)}

Topic: ${topic}
Difficulty: ${difficulty} - ${difficultyContext(difficulty)}

Generate exactly ${count} system design interview questions tailored to the candidate's drawn architecture and topic.
Questions should progress from high-level system requirements to deeper technical details:
${formatFocusAreas(domain)}

Rules:
- Questions MUST directly reference the components, connections, and structure the candidate drew in their architecture diagram.
- Challenge their architecture: ask about bottlenecks, data flow, failure modes, caching, databases, scaling, or edge cases.
- Do not ask generic questions that ignore the candidate's diagram.
- Each question must be answerable verbally.
- Difficulty: ${difficulty}

Return format: ["question 1", "question 2", ...]`,
    json: true,
  };
}

export function buildAnswerEvaluationPrompt(
  question: string,
  answer: string,
  followUps: Array<{ question: string; answer: string }>,
  topic: string,
  interviewContext: string,
  diagramSummary?: string,
  domain = SYSTEM_DESIGN_PROMPT_DOMAIN,
): AICall {
  const parsedContext = parseSystemDesignContext(interviewContext);
  const followUpContext =
    followUps.length > 0
      ? `\nFollow-up exchanges so far:\n${followUps
          .map(
            (f, i) =>
              `Follow-up ${i + 1}: ${f.question}\nAnswer: ${f.answer}`,
          )
          .join("\n")}`
      : "";

  const summaryString = diagramSummary
    ? `\nArchitectural Summary of Drawn Diagram:\n${diagramSummary}\n`
    : "";

  return {
    system: `You are an ${domain.interviewerRole} evaluating a candidate's answer to a system design question.
You must return ONLY valid JSON; no markdown, no explanation, no preamble.`,
    prompt: `${formatCandidateContext(parsedContext, domain)}
${summaryString}
Topic: ${topic}

Question asked: ${question}
Candidate's answer: ${answer}${followUpContext}

Evaluate the answer and return this exact JSON shape:
{
  "score": <integer 1-10>,
  "strengths": [<string>, ...],
  "gaps": [<string>, ...],
  "needsFollowUp": <boolean>,
  "followUpQuestion": <string | null>
}

Scoring guide:
1-3: Missing core systems concepts, incorrect data flow, or critical bottleneck ignored.
4-5: Partial understanding of scalability, important components or connections missing.
6-7: Solid design choices, minor gaps worth probing (e.g. cache invalidation, database index).
8-9: Strong architecture with detailed trade-off analysis and bottleneck remediation.
10: Exceptional system architecture; nothing meaningful to add.

Rules for needsFollowUp:
- true if score <= 6 AND a specific gap exists in their system design explanation worth probing
- false if score >= 7 OR follow-ups already covered the gap
- followUpQuestion must be a single focused question targeting the biggest gap in their architecture explanation, or null if needsFollowUp is false
- followUpQuestion must be grounded in the system design diagram or topic, not generic`,
    json: true,
  };
}

export function buildDiagramSummaryPrompt(interviewContext: string): AICall {
  const parsedContext = parseSystemDesignContext(interviewContext);
  return {
    system: `You are a distinguished systems architect conducting a system design interview.
Provide a high-level, clear architectural summary of the candidate's drawn diagram.
Keep it extremely concise (2-3 sentences max). Summarize the main components and how data flows between them.`,
    prompt: `Candidate's Drawn Architecture:\n${parsedContext}\n\nProvide the architectural summary:`,
    json: false,
  };
}

export function buildReportPrompt(
  topic: string,
  interviewContext: string,
  history: QuestionRecord[],
  domain = SYSTEM_DESIGN_PROMPT_DOMAIN,
): AICall {
  const parsedContext = parseSystemDesignContext(interviewContext);
  return {
    system: `You are an ${domain.interviewerRole} writing a post-interview evaluation report for a system design candidate.
You must return ONLY valid JSON; no markdown, no explanation, no preamble.`,
    prompt: `${formatCandidateContext(parsedContext, domain)}

Topic: ${topic}

Full interview transcript:
${formatHistory(history)}

Write a consolidated report and return this exact JSON shape:
{
  "summary": <2-3 sentence overall assessment of the candidate's ${domain.reportPerformanceLabel}>,
  "strengths": [<string>, ...],
  "improvements": [<string>, ...]
}

Rules:
- summary must reference their actual system design choices, component selection, and trade-off explanations.
- strengths: 3-5 items, specific to the architectural understanding they demonstrated.
- improvements: 3-5 items, concrete and actionable suggestions for scaling, reliability, or design patterns.
- Base everything on the full transcript, not just individual scores.
- Do not mention scores in the output`,
    json: true,
  };
}

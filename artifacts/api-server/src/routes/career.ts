import { Router, type IRouter } from "express";
import {
  AddCareerDocumentBody,
  AddCareerDocumentResponse,
  AnalyzeResumeBody,
  AnalyzeResumeResponse,
  AskCareerQuestionBody,
  AskCareerQuestionResponse,
  GenerateImprovedResumeBody,
  GenerateImprovedResumeResponse,
  GenerateInterviewPrepBody,
  GenerateInterviewPrepResponse,
  GenerateSkillPlanBody,
  GenerateSkillPlanResponse,
  GetCareerDashboardResponse,
  GetCareerProfileResponse,
  ListCareerActivityResponse,
  ListCareerDocumentsResponse,
  UpdateCareerProfileBody,
  UpdateCareerProfileResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  careerActivities,
  careerDocuments,
  careerProfiles,
  resumeAnalyses,
} from "@workspace/db/schema";
import { and, count, desc, eq } from "drizzle-orm";

const router: IRouter = Router();

type Profile = {
  id: number;
  name: string;
  headline: string;
  education: string;
  skills: string[];
  interests: string[];
  goals: string[];
  targetRoles: string[];
  updatedAt: string;
};

type Role = { title: string; fit: number; reason: string; nextStep: string };
type Gap = { skill: string; priority: string; rationale: string; action: string };

const sampleProfile = {
  name: "Aarav Mehta",
  headline: "Computer Science student exploring data, product, and intelligent systems",
  education: "B.Tech Computer Science · graduating 2026",
  skills: ["Python", "SQL", "React", "Git", "Data analysis"],
  interests: ["Responsible AI", "Developer tools", "Climate technology"],
  goals: ["Land a data or AI internship", "Build a portfolio with measurable impact", "Become interview-ready in 90 days"],
  targetRoles: ["Data Analyst", "AI Product Intern", "Machine Learning Intern"],
};

const roleCatalog: Role[] = [
  {
    title: "Data Analyst",
    fit: 91,
    reason: "Your SQL, Python, and analysis projects already map well to entry-level analytics work.",
    nextStep: "Add one portfolio case study with a clear business recommendation.",
  },
  {
    title: "AI Product Intern",
    fit: 84,
    reason: "Your blend of technical curiosity and product-oriented goals is a strong foundation.",
    nextStep: "Practice writing a one-page product brief for an AI feature.",
  },
  {
    title: "Machine Learning Intern",
    fit: 76,
    reason: "You have the programming base; strengthening model evaluation will close the gap.",
    nextStep: "Ship a small end-to-end model with error analysis and a readable README.",
  },
];

const defaultGaps: Gap[] = [
  { skill: "Cloud fundamentals", priority: "High", rationale: "Common internship postings expect candidates to deploy or explain a basic service.", action: "Complete a small API deployment and document the architecture." },
  { skill: "Model evaluation", priority: "High", rationale: "Evaluation and trade-offs distinguish a tutorial project from production thinking.", action: "Add precision, recall, baseline comparison, and error analysis to one project." },
  { skill: "Impact storytelling", priority: "Medium", rationale: "Your experience is technically clear but needs stronger outcome language.", action: "Rewrite three bullets using action, method, and measurable result." },
];

function iso(value: Date | null | undefined): string {
  return (value ?? new Date()).toISOString();
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function formatProfile(row: typeof careerProfiles.$inferSelect): Profile {
  return {
    id: row.id,
    name: row.name,
    headline: row.headline,
    education: row.education,
    skills: asStringArray(row.skills),
    interests: asStringArray(row.interests),
    goals: asStringArray(row.goals),
    targetRoles: asStringArray(row.targetRoles),
    updatedAt: iso(row.updatedAt),
  };
}

async function ensureProfile(): Promise<Profile> {
  const [existing] = await db.select().from(careerProfiles).orderBy(careerProfiles.id).limit(1);
  if (existing) return formatProfile(existing);
  const [created] = await db.insert(careerProfiles).values(sampleProfile).returning();
  await db.insert(careerActivities).values({
    type: "memory",
    title: "Student memory initialized",
    detail: "Saved skills, interests, goals, and target roles for personalized guidance.",
  });
  return formatProfile(created);
}

async function addActivity(type: string, title: string, detail: string) {
  await db.insert(careerActivities).values({ type, title, detail });
}

async function runAgent(prompt: string, system = "You are a precise career coach for university students.") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        max_completion_tokens: 1600,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? raw;
    return JSON.parse(fenced.trim()) as T;
  } catch {
    return null;
  }
}

function inferGaps(text: string, targetRole: string): Gap[] {
  const lower = text.toLowerCase();
  const candidates = [
    { skill: "Cloud fundamentals", terms: ["aws", "azure", "gcp", "docker"], priority: "High", rationale: `Most ${targetRole} internships expect some cloud or deployment literacy.`, action: "Deploy one project and add the architecture plus outcome to your resume." },
    { skill: "Model evaluation", terms: ["precision", "recall", "f1", "auc", "evaluation"], priority: "High", rationale: "Evaluation language makes technical work more credible and easier to assess.", action: "Add a baseline, evaluation metrics, and error analysis to a project." },
    { skill: "Impact storytelling", terms: ["increased", "reduced", "%", "users", "impact"], priority: "Medium", rationale: "Several bullets describe activity but do not yet show measurable outcomes.", action: "Rewrite three bullets with action, method, and measurable result." },
  ];
  return candidates.filter((candidate) => !candidate.terms.some((term) => lower.includes(term))).map(({ terms: _terms, ...gap }) => gap);
}

router.get("/career/profile", async (_req, res) => {
  const profile = await ensureProfile();
  res.json(GetCareerProfileResponse.parse(profile));
});

router.put("/career/profile", async (req, res) => {
  const input = UpdateCareerProfileBody.parse(req.body);
  const profile = await ensureProfile();
  const [updated] = await db.update(careerProfiles).set({ ...input, updatedAt: new Date() }).where(eq(careerProfiles.id, profile.id)).returning();
  await addActivity("memory", "Student memory updated", "The assistant refreshed your profile so future recommendations stay personal.");
  res.json(UpdateCareerProfileResponse.parse(formatProfile(updated)));
});

router.get("/career/dashboard", async (_req, res) => {
  const profile = await ensureProfile();
  const [latest] = await db.select().from(resumeAnalyses).orderBy(desc(resumeAnalyses.createdAt)).limit(1);
  const [docCount] = await db.select({ value: count() }).from(careerDocuments);
  const activities = await db.select().from(careerActivities).orderBy(desc(careerActivities.createdAt)).limit(5);
  const coverage = Math.min(96, Math.max(52, Math.round((profile.skills.length / 8) * 100)));
  const dashboard = {
    profile,
    resumeScore: latest?.score ?? 76,
    skillCoverage: coverage,
    indexedDocuments: Number(docCount?.value ?? 0),
    interviewReadiness: latest ? Math.min(94, latest.score + 7) : 68,
    topRoles: latest?.roleMatches ?? roleCatalog,
    skillGaps: latest?.missingSkills ?? defaultGaps,
    recentActivity: activities.map((item) => ({ id: item.id, type: item.type, title: item.title, detail: item.detail, createdAt: iso(item.createdAt) })),
  };
  res.json(GetCareerDashboardResponse.parse(dashboard));
});

router.post("/career/resume/analyze", async (req, res) => {
  const input = AnalyzeResumeBody.parse(req.body);
  const profile = await ensureProfile();
  const targetRole = input.targetRole || profile.targetRoles[0] || "Data Analyst";
  const lower = input.resumeText.toLowerCase();
  const fallback = {
    score: Math.min(96, Math.max(58, 62 + Math.min(24, Math.floor(input.resumeText.length / 160)))),
    summary: `A promising early-career resume for ${targetRole}. It shows a solid technical base; the next lift is to make outcomes and role alignment easier to scan.`,
    strengths: ["Clear technical foundation across Python, SQL, and web development.", "Evidence of curiosity through hands-on project work.", "Education and interests align with a data and AI career path."],
    improvements: ["Lead each project bullet with the measurable result, not the task.", "Add a short technology line so recruiters can scan the stack quickly.", "Tailor the opening summary to the target role and mirror the role's language."],
    missingSkills: inferGaps(input.resumeText, targetRole),
    roleMatches: roleCatalog,
  };
  const ai = await runAgent(`Analyze this student resume for ${targetRole}. Return JSON only with keys score (integer 0-100), summary (string), strengths (string[]), improvements (string[]), missingSkills (array of {skill,priority,rationale,action}), and roleMatches (array of {title,fit,reason,nextStep}). Resume:\n${input.resumeText.slice(0, 12000)}`);
  const generated = parseJson<typeof fallback>(ai) ?? fallback;
  const [saved] = await db.insert(resumeAnalyses).values({
    filename: input.filename,
    score: generated.score,
    summary: generated.summary,
    strengths: generated.strengths,
    improvements: generated.improvements,
    missingSkills: generated.missingSkills,
    roleMatches: generated.roleMatches,
    agentTrace: ["Memory: loaded student profile and target role", "Analyzer: extracted evidence from resume text", "Gap detector: compared evidence with role expectations", ai ? "LLM: refined recommendations with OpenAI" : "Fallback: used transparent career heuristics"],
  }).returning();
  await addActivity("analysis", "Resume analyzed", `${input.filename} scored ${generated.score}/100 with ${generated.missingSkills.length} priority gaps identified.`);
  res.json(AnalyzeResumeResponse.parse({
    id: saved.id,
    filename: saved.filename,
    score: saved.score,
    summary: saved.summary,
    strengths: saved.strengths,
    improvements: saved.improvements,
    missingSkills: saved.missingSkills,
    roleMatches: saved.roleMatches,
    agentTrace: saved.agentTrace,
    createdAt: iso(saved.createdAt),
  }));
});

router.get("/career/documents", async (_req, res) => {
  await ensureProfile();
  const docs = await db.select().from(careerDocuments).orderBy(desc(careerDocuments.createdAt));
  res.json(ListCareerDocumentsResponse.parse(docs.map((doc) => ({
    id: doc.id, filename: doc.filename, kind: doc.kind, excerpt: doc.excerpt, chunks: doc.chunks, createdAt: iso(doc.createdAt),
  }))));
});

router.post("/career/documents", async (req, res) => {
  const input = AddCareerDocumentBody.parse(req.body);
  const chunks = Math.max(1, Math.ceil(input.content.length / 800));
  const [doc] = await db.insert(careerDocuments).values({
    filename: input.filename,
    kind: input.kind,
    content: input.content.slice(0, 30000),
    excerpt: input.content.replace(/\s+/g, " ").trim().slice(0, 240),
    chunks,
  }).returning();
  await addActivity("knowledge", "Resource indexed", `${input.filename} is ready for grounded career questions.`);
  res.status(201).json(AddCareerDocumentResponse.parse({
    id: doc.id, filename: doc.filename, kind: doc.kind, excerpt: doc.excerpt, chunks: doc.chunks, createdAt: iso(doc.createdAt),
  }));
});

router.post("/career/chat", async (req, res) => {
  const input = AskCareerQuestionBody.parse(req.body);
  const profile = await ensureProfile();
  const docs = await db.select().from(careerDocuments).orderBy(desc(careerDocuments.createdAt)).limit(8);
  const tokens = input.question.toLowerCase().split(/\W+/).filter((token) => token.length > 3);
  const relevant = docs.filter((doc) => tokens.some((token) => doc.content.toLowerCase().includes(token)));
  const sources = (relevant.length ? relevant : docs.slice(0, 2)).map((doc) => doc.filename);
  const context = (relevant.length ? relevant : docs.slice(0, 2)).map((doc) => `[${doc.filename}] ${doc.content.slice(0, 2400)}`).join("\n");
  const ai = await runAgent(`Answer the student's question using only the provided resources when they contain relevant evidence. Be practical and concise. Mention uncertainty if sources do not cover something. Return plain text, no markdown JSON.\nStudent profile: ${JSON.stringify(profile)}\nQuestion: ${input.question}\nResources:\n${context || "No resources have been indexed yet."}`);
  const answer = ai ?? (context
    ? `Based on ${sources.join(" and ")}, start by connecting your existing ${profile.skills.slice(0, 2).join(" and ")} experience to a small, measurable project. For your goal of ${profile.goals[0]?.toLowerCase() ?? "career growth"}, prioritize one portfolio artifact, document the decision-making, and practice explaining trade-offs. The indexed resources are a useful starting point, but tailor the plan to the role description you are targeting.`
    : `I do not have a matching resource in the knowledge base yet. Add a career guide, role description, or interview rubric and I can ground the answer in it. Based on your saved goal, a strong next move is to turn one project into a measurable case study.`);
  await addActivity("rag", "Grounded career answer", `Answered “${input.question.slice(0, 70)}${input.question.length > 70 ? "…" : ""}” using ${sources.length} resource${sources.length === 1 ? "" : "s"}.`);
  res.json(AskCareerQuestionResponse.parse({
    question: input.question,
    answer,
    sources,
    agentTrace: ["Memory: loaded saved career goals", `Retriever: selected ${sources.length} relevant resource${sources.length === 1 ? "" : "s"}`, ai ? "Generator: synthesized a grounded answer with OpenAI" : "Generator: used a transparent grounded fallback"],
  }));
});

router.post("/career/tools/resume", async (req, res) => {
  const input = GenerateImprovedResumeBody.parse(req.body);
  const profile = await ensureProfile();
  const fallback = {
    title: `${input.targetRole} resume draft`,
    content: `${profile.name}\n${input.targetRole} Candidate\n\nSUMMARY\n${profile.headline}. Combining ${profile.skills.slice(0, 4).join(", ")} to build practical, measurable solutions.\n\nSELECTED PROJECTS\n• Built a project that translated a real user need into a working prototype, documenting decisions and outcomes.\n• Analyzed structured data with Python and SQL to identify patterns and communicate a clear recommendation.\n\nSKILLS\n${profile.skills.join(" · ")}\n\nFOCUS\n${input.focus}`,
    highlights: ["Role-aligned opening summary", "Outcome-first project bullets", "Scannable skill grouping"],
  };
  const ai = await runAgent(`Create a concise improved resume draft for ${input.targetRole}. Use this student profile: ${JSON.stringify(profile)}. Focus: ${input.focus}. Return JSON only with keys title, content, highlights (string[]). Do not invent employers, dates, metrics, or degrees.`);
  const generated = parseJson<typeof fallback>(ai) ?? fallback;
  await addActivity("tool", "Resume tool completed", `Generated a ${input.targetRole} draft with focus on ${input.focus}.`);
  res.json(GenerateImprovedResumeResponse.parse({ ...generated, toolTrace: ["Tool: resume improver", "Memory: used saved skills and headline", ai ? "LLM: generated a tailored draft" : "Fallback: generated a safe editable draft"] }));
});

router.post("/career/tools/skills", async (req, res) => {
  const input = GenerateSkillPlanBody.parse(req.body);
  const profile = await ensureProfile();
  const fallback = {
    targetRole: input.targetRole,
    plan: [
      { week: "Weeks 1–2", skill: "Cloud fundamentals", why: "Move from local projects to deployable proof.", project: "Deploy a small API and write a one-page architecture note." },
      { week: "Weeks 3–5", skill: "Model evaluation", why: "Show you can reason about quality, not just train a model.", project: "Compare a baseline and improved model with precision, recall, and error analysis." },
      { week: "Weeks 6–8", skill: "Impact storytelling", why: "Make your work memorable to a recruiter and interviewer.", project: "Turn one project into a STAR story with a measurable before/after." },
      { week: "Weeks 9–12", skill: "Interview fluency", why: "Convert preparation into confident, structured answers.", project: `Run three mock interviews for ${input.targetRole} and review your gaps.` },
    ],
  };
  const ai = await runAgent(`Build a ${input.timeframe} learning plan for ${input.targetRole} using this student profile: ${JSON.stringify(profile)}. Return JSON only with targetRole and plan, where plan has week, skill, why, project.`);
  const generated = parseJson<typeof fallback>(ai) ?? fallback;
  await addActivity("tool", "Skill plan generated", `Created a ${input.timeframe} plan for ${input.targetRole}.`);
  res.json(GenerateSkillPlanResponse.parse({ ...generated, toolTrace: ["Tool: skill recommender", "Memory: matched plan to goals and current skills", ai ? "LLM: prioritized the learning path" : "Fallback: used role-based skill heuristics"] }));
});

router.post("/career/tools/interview", async (req, res) => {
  const input = GenerateInterviewPrepBody.parse(req.body);
  const profile = await ensureProfile();
  const fallback = {
    targetRole: input.targetRole,
    questions: [
      { category: "Motivation", question: `Why are you interested in the ${input.targetRole} role?`, coaching: `Connect the role to ${profile.interests[0] ?? "your interests"} and one project where you practiced the work.` },
      { category: "Technical", question: "Walk me through a project where the first approach did not work.", coaching: "Use context, decision, trade-off, and what you changed after seeing the evidence." },
      { category: "Behavioral", question: "Tell me about a time you had to learn something quickly.", coaching: "Show the learning loop: goal, resource, practice, feedback, and result." },
      { category: "Case", question: "How would you decide whether an AI feature is ready to ship?", coaching: "Cover user value, evaluation, safety, monitoring, and a rollback plan." },
    ],
  };
  const ai = await runAgent(`Create interview prep for a student applying to ${input.targetRole} at ${input.difficulty} difficulty. Profile: ${JSON.stringify(profile)}. Return JSON only with targetRole and questions, each with category, question, coaching.`);
  const generated = parseJson<typeof fallback>(ai) ?? fallback;
  await addActivity("tool", "Interview prep generated", `Created ${generated.questions.length} questions for ${input.targetRole}.`);
  res.json(GenerateInterviewPrepResponse.parse({ ...generated, toolTrace: ["Tool: interview coach", "Memory: personalized prompts from student interests", ai ? "LLM: adapted questions to difficulty" : "Fallback: used a structured interview set"] }));
});

router.get("/career/activity", async (_req, res) => {
  const activities = await db.select().from(careerActivities).orderBy(desc(careerActivities.createdAt)).limit(12);
  res.json(ListCareerActivityResponse.parse(activities.map((item) => ({
    id: item.id, type: item.type, title: item.title, detail: item.detail, createdAt: iso(item.createdAt),
  }))));
});

export default router;
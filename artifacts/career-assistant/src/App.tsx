import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowUpRight, Award, BookOpen, BriefcaseBusiness, Check, ChevronRight, CircleHelp,
  FileText, FolderOpen, LayoutDashboard, Lightbulb, Loader2, Menu,
  MessageSquareText, Plus, Radar, RefreshCw, Search, Send, Settings2,
  Sparkles, Target, TrendingUp, Upload, UserRound, X, Zap
} from 'lucide-react';
import {
  getGetCareerDashboardQueryKey, getGetCareerProfileQueryKey,
  getListCareerDocumentsQueryKey, useAddCareerDocument, useAnalyzeResume, useAskCareerQuestion,
  useGenerateImprovedResume, useGenerateInterviewPrep, useGenerateSkillPlan,
  useGetCareerDashboard, useGetCareerProfile, useListCareerActivity, useListCareerDocuments,
  useUpdateCareerProfile
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/resume', label: 'Resume lab', icon: FileText },
  { href: '/career', label: 'Career path', icon: Radar },
  { href: '/interview', label: 'Interview room', icon: MessageSquareText },
  { href: '/knowledge', label: 'Knowledge base', icon: BookOpen },
];

const sampleResume = `Maya Chen
Computer Science student · maya.chen@email.com · github.com/mayac

EDUCATION
B.S. Computer Science, Northeastern University — May 2025

EXPERIENCE
Product Engineering Intern, Brightwell — May 2024 to Aug 2024
• Built a React dashboard used by 4 operations teams to track delivery exceptions.
• Partnered with design and data teams to ship weekly improvements.
• Wrote API integrations and improved page load time by 28%.

PROJECTS
Campus Cart — React, TypeScript, Node.js
• Built a campus marketplace with search, saved listings, and seller messaging.
• Presented product decisions and usability findings to a 40-person student group.

SKILLS
TypeScript, React, Node.js, SQL, Git, Figma`;

function Initials({ name = 'Maya Chen', small = false }: { name?: string; small?: boolean }) {
  const letters = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <span data-testid="avatar-initials" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))] font-display font-bold text-[hsl(var(--foreground))] ${small ? 'h-8 w-8 text-[11px]' : 'h-11 w-11 text-sm'}`}>{letters || 'MC'}</span>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileQuery = useGetCareerProfile();
  const profile = profileQuery.data;
  const firstName = profile?.name?.split(' ')[0] || 'Maya';

  return (
    <div className="noise min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[246px] flex-col border-r border-[hsl(var(--sidebar-foreground)/.1)] bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Sparkles size={17} strokeWidth={2.5} /></span>
            <span className="font-display text-[15px] font-bold tracking-[-.03em]">northstar<span className="text-[hsl(var(--accent))]">.</span></span>
          </Link>
          <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation" className="rounded-lg p-1 text-white/55 hover:bg-white/10 md:hidden"><X size={18} /></button>
        </div>
        <div className="mt-12">
          <p className="mb-3 px-3 font-mono-ui text-[10px] uppercase tracking-[.16em] text-white/38">Your studio</p>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${active ? 'bg-white/10 text-white' : 'text-white/58 hover:bg-white/[.06] hover:text-white'}`}>
                <Icon size={17} className={active ? 'text-[hsl(var(--accent))]' : 'text-white/45 group-hover:text-white/75'} /> {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />}
              </Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[.06] p-4">
            <div className="mb-3 flex items-center gap-2 text-[hsl(var(--accent))]"><Zap size={14} /><span className="font-mono-ui text-[10px] uppercase tracking-[.14em]">Agent online</span></div>
            <p className="text-[12px] leading-5 text-white/58">Your workspace remembers what matters and keeps the next move close.</p>
          </div>
          <Link href="/profile" data-testid="link-sidebar-profile" className="flex items-center gap-3 rounded-xl border border-white/10 p-2.5 transition-colors hover:bg-white/[.06]">
            <Initials name={profile?.name} small />
            <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-bold text-white">{profile?.name || 'Set up your profile'}</span><span className="block truncate text-[10px] text-white/45">{profile?.headline || 'Tell us where you are headed'}</span></span>
            <Settings2 size={14} className="text-white/35" />
          </Link>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation backdrop" data-testid="button-navigation-backdrop" className="fixed inset-0 z-30 bg-[hsl(var(--foreground)/.35)] md:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="md:pl-[246px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/75 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <button onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation" className="rounded-lg p-2 hover:bg-muted md:hidden"><Menu size={20} /></button>
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" /> Studio / <span className="text-foreground">{nav.find((item) => item.href === location)?.label || 'Overview'}</span></div>
          <div className="ml-auto flex items-center gap-4"><span className="hidden font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground sm:inline">Fall 2024 workspace</span><Link href="/profile" data-testid="link-header-profile"><Initials name={profile?.name} small /></Link></div>
        </header>
        <main className="mx-auto max-w-[1480px] px-5 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div className="reveal"><p className="mb-3 flex items-center gap-2 font-mono-ui text-[10px] font-medium uppercase tracking-[.18em] text-[hsl(var(--primary))]"><span className="h-px w-5 bg-[hsl(var(--primary))]" />{eyebrow}</p><h1 className="font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[.98] tracking-[-.06em]">{title}</h1>{description && <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted-foreground">{description}</p>}</div>
    {action && <div className="reveal reveal-delay-1 shrink-0">{action}</div>}
  </div>;
}

function Button({ children, variant = 'primary', onClick, type = 'button', disabled = false, testId }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; testId: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-55 ${variant === 'primary' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_8px_18px_hsl(var(--primary)/.16)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_hsl(var(--primary)/.24)]' : variant === 'secondary' ? 'border border-border bg-card text-foreground hover:border-[hsl(var(--primary)/.45)] hover:bg-muted' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{children}</button>;
}

function Card({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return <section data-testid={testId} className={`card-lift rounded-2xl border border-border bg-card p-5 shadow-[0_3px_15px_hsl(224_32%_18%/.025)] ${className}`}>{children}</section>;
}

function SectionHeading({ title, meta, href }: { title: string; meta?: string; href?: string }) {
  return <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-[17px] font-bold tracking-[-.035em]">{title}</h2>{meta && <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>}</div>{href && <Link href={href} data-testid={`link-view-${title.toLowerCase().replaceAll(' ', '-')}`} className="flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--primary))] hover:underline">View all <ArrowUpRight size={13} /></Link>}</div>;
}

function Metric({ label, value, note, accent = false }: { label: string; value: string | number; note?: string; accent?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${accent ? 'border-[hsl(var(--primary)/.2)] bg-[hsl(var(--primary)/.06)]' : 'border-border bg-card'}`}><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</p><p data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="mt-3 font-display text-3xl font-bold tracking-[-.06em]">{value}</p>{note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}</div>;
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof FileText; title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-5 text-center"><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-card text-[hsl(var(--primary))] shadow-sm"><Icon size={19} /></span><h3 className="text-[13px] font-bold">{title}</h3><p className="mt-1 max-w-xs text-[11px] leading-5 text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return <div className="animate-pulse space-y-3" data-testid="loading-state">{Array.from({ length: lines }).map((_, index) => <div key={index} className={`h-3 rounded bg-muted ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}</div>;
}

function QueryError({ retry }: { retry: () => void }) {
  return <div data-testid="status-query-error" className="flex items-center gap-3 rounded-xl border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] p-4 text-[12px] text-[hsl(var(--destructive))]"><CircleHelp size={17} /><span className="flex-1">We could not load this part of your studio.</span><button onClick={retry} data-testid="button-retry-query" className="font-bold underline">Try again</button></div>;
}

function ActivityList({ items }: { items: Array<{ id: number; type: string; title: string; detail: string; createdAt: string }> }) {
  if (!items?.length) return <EmptyState icon={Zap} title="Your trail starts here" description="Use the resume lab or ask a grounded question to create your first agent activity." />;
  return <div className="space-y-1">{items.slice(0, 5).map((activity, index) => <div key={activity.id || index} data-testid={`activity-row-${activity.id || index}`} className="flex gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"><span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${index === 0 ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'bg-muted text-muted-foreground'}`}><Sparkles size={13} /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-bold">{activity.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{activity.detail}</p></div><span className="whitespace-nowrap pt-1 font-mono-ui text-[9px] text-muted-foreground">{formatDate(activity.createdAt)}</span></div>)}</div>;
}

function formatDate(value?: string) {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Home() {
  const dashboardQuery = useGetCareerDashboard();
  const activityQuery = useListCareerActivity();
  const dashboard = dashboardQuery.data;
  const activity = dashboard?.recentActivity || activityQuery.data || [];
  if (dashboardQuery.isLoading) return <><PageIntro eyebrow="Your north star" title="Good work takes direction." description="Loading your career studio..." /><div className="grid gap-4 md:grid-cols-4"><LoadingBlock lines={2} /><LoadingBlock lines={2} /><LoadingBlock lines={2} /><LoadingBlock lines={2} /></div><div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><Card><LoadingBlock lines={7} /></Card><Card><LoadingBlock lines={7} /></Card></div></>;
  if (dashboardQuery.isError || !dashboard) return <><PageIntro eyebrow="Your north star" title="Good work takes direction." /><QueryError retry={() => dashboardQuery.refetch()} /></>;
  const profile = dashboard.profile;
  return <div className="space-y-7">
    <PageIntro eyebrow="Your north star" title={`Good morning, ${profile?.name?.split(' ')[0] || 'Maya'}.`} description="A clear view of what is working, what is missing, and the next move worth making." action={<Link href="/resume" data-testid="link-home-resume-cta"><Button testId="button-home-resume-cta"><FileText size={15} /> Review my resume <ArrowUpRight size={14} /></Button></Link>} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Resume health" value={`${dashboard.resumeScore}/100`} note="A strong foundation" accent />
      <Metric label="Skill coverage" value={`${dashboard.skillCoverage}%`} note="Against your target roles" />
      <Metric label="Interview readiness" value={`${dashboard.interviewReadiness}%`} note="Build confidence next" />
      <Metric label="Indexed resources" value={dashboard.indexedDocuments} note="Grounding your answers" />
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <Card className="reveal reveal-delay-1 overflow-hidden" testId="card-profile-memory">
        <SectionHeading title="What I remember about you" meta="Your career context, kept in one place." href="/profile" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl bg-[hsl(var(--primary)/.07)] p-4"><div className="mb-3 flex items-center gap-2 text-[hsl(var(--primary))]"><UserRound size={15} /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Profile</span></div><p className="font-display text-lg font-bold">{profile?.headline || 'Your next chapter'}</p><p className="mt-1 text-[12px] text-muted-foreground">{profile?.education || 'Add your education to make recommendations sharper.'}</p></div>
          <div className="space-y-3"><TagGroup label="Target roles" values={profile?.targetRoles || []} /><TagGroup label="Interests" values={profile?.interests || []} /></div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="font-mono-ui text-[10px] text-muted-foreground">Last updated {formatDate(profile?.updatedAt)}</span><Link href="/profile" data-testid="link-edit-memory" className="flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--primary))]">Edit memory <ChevronRight size={14} /></Link></div>
      </Card>
      <Card className="reveal reveal-delay-2" testId="card-next-step"><SectionHeading title="Your next best step" /><div className="rounded-xl border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.1)] p-4"><div className="flex items-start justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent))]"><Target size={16} /></span><span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">Recommended</span></div><h3 className="mt-5 font-display text-[19px] font-bold tracking-[-.04em]">{dashboard.skillGaps?.[0]?.action || 'Analyze your resume against a target role'}</h3><p className="mt-2 text-[12px] leading-5 text-muted-foreground">{dashboard.skillGaps?.[0]?.rationale || 'Start with a focused review so your plan is based on your actual experience.'}</p><Link href="/resume" data-testid="link-next-step" className="mt-5 flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--primary))]">Take me there <ArrowUpRight size={14} /></Link></div></Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card className="reveal reveal-delay-2" testId="card-skill-gaps"><SectionHeading title="Skill gaps" meta="The highest-leverage places to invest." href="/career" /><div className="space-y-4">{dashboard.skillGaps?.length ? dashboard.skillGaps.slice(0, 4).map((gap, i) => <div key={gap.skill} data-testid={`gap-row-${i}`}><div className="mb-1.5 flex justify-between text-[12px]"><span className="font-bold">{gap.skill}</span><span className={`font-mono-ui text-[9px] uppercase ${gap.priority === 'high' ? 'text-[hsl(var(--accent-foreground))]' : 'text-muted-foreground'}`}>{gap.priority} priority</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${gap.priority === 'high' ? 'w-[32%] bg-[hsl(var(--accent))]' : 'w-[56%] bg-[hsl(var(--primary))]'}`} /></div><p className="mt-1.5 text-[11px] text-muted-foreground">{gap.action}</p></div>) : <EmptyState icon={Check} title="No gaps yet" description="Analyze your resume to discover the highest-leverage skills." />}</div></Card>
      <Card className="reveal reveal-delay-3" testId="card-role-recommendations"><SectionHeading title="Roles with momentum" meta="Matches based on your profile and recent signals." href="/career" /><div className="grid gap-3 sm:grid-cols-2">{dashboard.topRoles?.length ? dashboard.topRoles.slice(0, 4).map((role, i) => <div key={role.title} data-testid={`role-card-${i}`} className="group rounded-xl border border-border p-4 transition-colors hover:border-[hsl(var(--primary)/.4)] hover:bg-muted/35"><div className="flex items-start justify-between gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-[hsl(var(--primary))]"><BriefcaseBusiness size={15} /></span><span className="font-mono-ui text-[11px] font-medium text-[hsl(var(--primary))]">{role.fit}% fit</span></div><h3 className="mt-4 text-[13px] font-bold">{role.title}</h3><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{role.reason}</p><p className="mt-3 text-[10px] font-bold text-foreground/70 group-hover:text-[hsl(var(--primary))]">{role.nextStep}</p></div>) : <EmptyState icon={BriefcaseBusiness} title="Role matches are forming" description="Complete your profile and resume analysis for tailored role matches." />}</div></Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card className="reveal reveal-delay-3" testId="card-resources"><SectionHeading title="Indexed resources" meta={`${dashboard.indexedDocuments} resources grounding your agent`} href="/knowledge" /><ResourcePreview /></Card>
      <Card className="reveal reveal-delay-4" testId="card-activity"><SectionHeading title="Recent agent activity" meta="A quiet record of work done together." /><ActivityList items={activity} /></Card>
    </div>
  </div>;
}

function TagGroup({ label, values }: { label: string; values: string[] }) {
  return <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</p><div className="flex flex-wrap gap-1.5">{values?.length ? values.slice(0, 5).map((value) => <span key={value} className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold">{value}</span>) : <span className="text-[11px] text-muted-foreground">Nothing added yet</span>}</div></div>;
}

function ResourcePreview() {
  const query = useListCareerDocuments();
  if (query.isLoading) return <LoadingBlock lines={4} />;
  if (query.isError) return <QueryError retry={() => query.refetch()} />;
  if (!query.data?.length) return <EmptyState icon={FolderOpen} title="No resources indexed" description="Add a syllabus, job description, or career center guide to ground your answers." action={<Link href="/knowledge" data-testid="link-add-first-resource"><Button variant="secondary" testId="button-add-first-resource"><Plus size={14} /> Add resource</Button></Link>} />;
  return <div className="space-y-2">{query.data.slice(0, 4).map((doc, i) => <div key={doc.id || i} data-testid={`resource-preview-${doc.id || i}`} className="flex items-center gap-3 rounded-xl border border-border p-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary)/.08)] text-[hsl(var(--primary))]"><FileText size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-bold">{doc.filename}</span><span className="block text-[10px] text-muted-foreground">{doc.chunks} indexed chunks · {doc.kind}</span></span><Check size={14} className="text-[hsl(var(--primary))]" /></div>)}</div>;
}

function ResumePage() {
  const analyze = useAnalyzeResume();
  const generate = useGenerateImprovedResume();
  const [filename, setFilename] = useState('my-resume.txt');
  const [resumeText, setResumeText] = useState('');
  const [fileNotice, setFileNotice] = useState('');
  const [targetRole, setTargetRole] = useState('Product engineer');
  const [analysis, setAnalysis] = useState<any>(null);
  const [improved, setImproved] = useState<any>(null);
  const readResumeFile = (file?: File) => {
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setResumeText(String(reader.result ?? ''));
      setFileNotice(`${file.name} loaded. Review the text, then run the analysis.`);
    };
    reader.onerror = () => setFileNotice('This file could not be read. Paste the resume text instead.');
    reader.readAsText(file);
  };
  const analyzeResume = () => analyze.mutate({ data: { filename, resumeText, targetRole } }, { onSuccess: (result) => setAnalysis(result) });
  return <div className="space-y-7">
    <PageIntro eyebrow="Resume lab" title="Make your experience legible." description="Your agent reads for signal, then translates feedback into edits you can actually make." action={<Button onClick={() => setResumeText(sampleResume)} variant="secondary" testId="button-load-sample-resume"><Sparkles size={15} /> Load sample resume</Button>} />
    {!analysis ? <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <Card className="reveal" testId="card-resume-input"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-[18px] font-bold tracking-[-.04em]">Bring your current draft</h2><p className="mt-1 text-[12px] text-muted-foreground">Upload a text resume or paste it for the clearest read.</p></div><Upload size={18} className="text-[hsl(var(--primary))]" /></div>
        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.04)] px-3 py-3 text-[11px] font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/.08)]"><Upload size={15} /><span className="flex-1">Choose a .txt, .md, .json, or .csv file</span><input type="file" accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json,text/csv" onChange={(event) => readResumeFile(event.target.files?.[0])} data-testid="input-resume-file" className="sr-only" /></label>
        {fileNotice && <p className="mb-4 text-[11px] text-muted-foreground">{fileNotice}</p>}
        <label className="mb-4 block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">File name<input value={filename} onChange={(e) => setFilename(e.target.value)} data-testid="input-resume-filename" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] font-normal outline-none transition-colors focus:border-[hsl(var(--primary))]" /></label>
        <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Resume text<textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} data-testid="textarea-resume-text" placeholder="Paste your resume here, or load the sample to explore the flow." className="mt-2 min-h-[360px] w-full resize-y rounded-xl border border-input bg-background p-4 text-[12px] leading-5 outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[hsl(var(--primary))]" /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Target role<select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} data-testid="select-resume-role" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] font-normal outline-none focus:border-[hsl(var(--primary))]"><option>Product engineer</option><option>Frontend engineer</option><option>Data analyst</option><option>UX researcher</option></select></label><Button onClick={analyzeResume} disabled={!resumeText.trim() || analyze.isPending} testId="button-analyze-resume">{analyze.isPending ? <><Loader2 size={15} className="animate-spin" /> Reading draft</> : <><Radar size={15} /> Analyze resume</>}</Button></div>
        {analyze.isError && <p data-testid="status-resume-error" className="mt-3 text-[11px] text-[hsl(var(--destructive))]">The analysis did not complete. Check your draft and try again.</p>}
      </Card>
      <Card className="shell-grid reveal reveal-delay-1 flex min-h-[540px] flex-col justify-between overflow-hidden bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]" testId="card-resume-agent"><div><div className="mb-6 flex items-center gap-2 text-[hsl(var(--accent))]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><Sparkles size={16} /></span><span className="font-mono-ui text-[10px] uppercase tracking-[.15em]">Agent trace</span></div><h2 className="max-w-sm font-display text-[31px] font-bold leading-[1.02] tracking-[-.055em]">Feedback with a point of view.</h2><p className="mt-4 max-w-sm text-[13px] leading-6 text-white/55">We look for evidence, not buzzwords. Load your draft and see where the signal is already strong.</p></div><div className="space-y-2 border-t border-white/10 pt-5 text-[11px] text-white/58"><TraceItem text="Parse experience and projects" /><TraceItem text="Compare signal to your target role" /><TraceItem text="Prioritize edits by leverage" /></div></Card>
    </div> : <ResumeResult analysis={analysis} improved={improved} setImproved={setImproved} generate={generate} targetRole={targetRole} onReset={() => { setAnalysis(null); setImproved(null); }} />}
  </div>;
}

function TraceItem({ text }: { text: string }) {
  return <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />{text}</div>;
}

function ResumeResult({ analysis, improved, setImproved, generate, targetRole, onReset }: { analysis: any; improved: any; setImproved: (value: any) => void; generate: any; targetRole: string; onReset: () => void }) {
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">Analysis complete</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-.05em]">{analysis.filename}</h2></div><div className="flex gap-2"><Button onClick={onReset} variant="secondary" testId="button-new-resume"><RefreshCw size={14} /> New analysis</Button><Button onClick={() => generate.mutate({ data: { targetRole, focus: analysis.improvements?.join('; ') || 'clarity and evidence' } }, { onSuccess: setImproved })} disabled={generate.isPending} testId="button-generate-resume">{generate.isPending ? <><Loader2 size={14} className="animate-spin" /> Drafting</> : <><Sparkles size={14} /> Generate improved draft</>}</Button></div></div>
    <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><Card className="bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]" testId="card-resume-score"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/48">Resume signal</p><div className="mt-5 flex items-end gap-2"><span data-testid="text-resume-score" className="font-display text-6xl font-bold tracking-[-.1em] text-[hsl(var(--accent))]">{analysis.score}</span><span className="mb-2 text-[12px] text-white/45">/ 100</span></div><p className="mt-5 text-[13px] leading-6 text-white/65">{analysis.summary}</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[hsl(var(--accent))]" style={{ width: `${analysis.score}%` }} /></div></Card><Card testId="card-resume-strengths"><SectionHeading title="What is already working" meta="Keep this signal visible." /><div className="grid gap-3 sm:grid-cols-2">{analysis.strengths?.map((item: string, i: number) => <div key={i} className="flex gap-3 rounded-xl bg-[hsl(var(--primary)/.06)] p-3 text-[12px] leading-5"><Check size={15} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" />{item}</div>)}</div></Card></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card testId="card-resume-improvements"><SectionHeading title="Edits with leverage" meta="A short queue, not a rewrite of your identity." /><div className="space-y-3">{analysis.improvements?.map((item: string, i: number) => <div key={i} className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><span className="font-mono-ui text-[10px] text-[hsl(var(--accent-foreground))]">0{i + 1}</span><p className="text-[12px] leading-5">{item}</p></div>)}</div></Card><Card testId="card-role-fit"><SectionHeading title="Role fit" meta="Where this draft is already speaking the language." /><div className="space-y-3">{analysis.roleMatches?.map((role: any, i: number) => <div key={i} className="flex items-center gap-3"><span className="flex-1 text-[12px] font-bold">{role.title}</span><div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${role.fit}%` }} /></div><span className="w-9 text-right font-mono-ui text-[10px] text-[hsl(var(--primary))]">{role.fit}%</span></div>)}</div></Card></div>
    <Card testId="card-agent-trace"><SectionHeading title="Agent trace" meta="A transparent look at how the recommendation was formed." /><div className="grid gap-3 md:grid-cols-3">{analysis.agentTrace?.map((step: string, i: number) => <div key={i} className="flex gap-3 rounded-xl border border-border p-3"><span className="font-mono-ui text-[10px] text-[hsl(var(--primary))]">0{i + 1}</span><span className="text-[11px] leading-5 text-muted-foreground">{step}</span></div>)}</div></Card>
    {improved && <Card className="border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.045)]" testId="card-improved-resume"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--primary))]">Tool output</p><h2 className="mt-1 font-display text-xl font-bold">{improved.title}</h2></div><Check size={19} className="text-[hsl(var(--primary))]" /></div><div className="mt-5 rounded-xl border border-border bg-card p-5"><pre className="whitespace-pre-wrap font-sans text-[12px] leading-6">{improved.content}</pre></div><div className="mt-4 flex flex-wrap gap-2">{improved.highlights?.map((item: string, i: number) => <span key={i} className="rounded-full bg-card px-3 py-1.5 text-[10px] font-semibold">{item}</span>)}</div></Card>}
  </div>;
}

function CareerPage() {
  const dashboardQuery = useGetCareerDashboard();
  const generate = useGenerateSkillPlan();
  const [role, setRole] = useState('');
  const [timeframe, setTimeframe] = useState('90 days');
  const [plan, setPlan] = useState<any>(null);
  const dashboard = dashboardQuery.data;
  const targetRole = role || dashboard?.profile?.targetRoles?.[0] || 'Product engineer';
  if (dashboardQuery.isLoading) return <><PageIntro eyebrow="Career path" title="Turn ambition into a route." /><Card><LoadingBlock lines={8} /></Card></>;
  if (dashboardQuery.isError || !dashboard) return <><PageIntro eyebrow="Career path" title="Turn ambition into a route." /><QueryError retry={() => dashboardQuery.refetch()} /></>;
  return <div className="space-y-7">
    <PageIntro eyebrow="Career path" title="Turn ambition into a route." description="See the roles that fit, then ask the agent to lay down a practical 30 / 60 / 90 day path." />
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><Card className="reveal" testId="card-role-map"><SectionHeading title="Roles with momentum" meta="Not a personality quiz. A signal map." /><div className="space-y-3">{dashboard.topRoles?.map((item, i) => <div key={item.title} data-testid={`career-role-${i}`} className={`rounded-xl border p-4 transition-colors ${i === 0 ? 'border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary)/.05)]' : 'border-border'}`}><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted font-mono-ui text-[10px] text-[hsl(var(--primary))]">0{i + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-[13px] font-bold">{item.title}</h3><span className="font-mono-ui text-[10px] text-[hsl(var(--primary))]">{item.fit}% fit</span></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.reason}</p><p className="mt-2 text-[10px] font-bold">{item.nextStep}</p></div></div></div>)}</div></Card><Card className="reveal reveal-delay-1" testId="card-skill-gaps-plan"><SectionHeading title="Where to invest next" meta="Small gaps compound into range." /><div className="space-y-4">{dashboard.skillGaps?.map((gap, i) => <div key={gap.skill} className="flex gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${gap.priority === 'high' ? 'bg-[hsl(var(--accent)/.4)]' : 'bg-muted'}`}><TrendingUp size={13} /></span><div><div className="flex items-center gap-2"><h3 className="text-[12px] font-bold">{gap.skill}</h3><span className="font-mono-ui text-[9px] uppercase text-muted-foreground">{gap.priority}</span></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{gap.rationale}</p><p className="mt-1 text-[11px] font-semibold">{gap.action}</p></div></div>)}</div></Card></div>
    <Card className="reveal reveal-delay-2" testId="card-generate-plan"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 text-[hsl(var(--primary))]"><Lightbulb size={16} /><span className="font-mono-ui text-[10px] uppercase tracking-[.14em]">Tool-generated plan</span></div><h2 className="font-display text-2xl font-bold tracking-[-.05em]">Give your next 90 days a shape.</h2><p className="mt-2 max-w-xl text-[12px] leading-5 text-muted-foreground">A project-first plan that turns a gap into evidence you can use in applications and conversations.</p></div><div className="flex flex-col gap-2 sm:flex-row"><select value={role} onChange={(e) => setRole(e.target.value)} data-testid="select-career-role" className="rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] outline-none"><option value="">Use {targetRole}</option>{dashboard.topRoles?.map((r) => <option key={r.title} value={r.title}>{r.title}</option>)}</select><select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} data-testid="select-career-timeframe" className="rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] outline-none"><option>30 days</option><option>60 days</option><option>90 days</option></select><Button onClick={() => generate.mutate({ data: { targetRole, timeframe } }, { onSuccess: setPlan })} disabled={generate.isPending} testId="button-generate-plan">{generate.isPending ? <><Loader2 size={14} className="animate-spin" /> Building</> : <><Sparkles size={14} /> Build my plan</>}</Button></div></div>
      {plan && <div className="mt-7 border-t border-border pt-6"><div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg font-bold">{plan.targetRole} · {timeframe}</h3><span className="font-mono-ui text-[9px] uppercase tracking-[.13em] text-[hsl(var(--primary))]">Ready to work</span></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{plan.plan?.map((item: any, i: number) => <div key={i} data-testid={`plan-item-${i}`} className="rounded-xl border border-border bg-muted/30 p-4"><span className="font-mono-ui text-[10px] text-[hsl(var(--primary))]">{item.week}</span><h4 className="mt-3 text-[13px] font-bold">{item.skill}</h4><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.why}</p><div className="mt-4 border-t border-border pt-3 text-[10px] font-semibold">{item.project}</div></div>)}</div><div className="mt-5 flex flex-wrap gap-2">{plan.toolTrace?.map((step: string, i: number) => <span key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Check size={12} className="text-[hsl(var(--primary))]" />{step}</span>)}</div></div>}
    </Card>
  </div>;
}

function InterviewPage() {
  const dashboardQuery = useGetCareerDashboard();
  const generate = useGenerateInterviewPrep();
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('Focused');
  const [prep, setPrep] = useState<any>(null);
  const dashboard = dashboardQuery.data;
  const targetRole = role || dashboard?.profile?.targetRoles?.[0] || 'Product engineer';
  return <div className="space-y-7"><PageIntro eyebrow="Interview room" title="Practice the conversation." description="Get questions tuned to the role you want, then use the coaching to sharpen the story underneath your answer." />
    <Card className="reveal" testId="card-interview-controls"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-[hsl(var(--primary))]"><MessageSquareText size={16} /><span className="font-mono-ui text-[10px] uppercase tracking-[.14em]">Interview simulator</span></div><h2 className="font-display text-2xl font-bold tracking-[-.05em]">What are you preparing for?</h2></div><div className="grid gap-2 sm:grid-cols-3"><select value={role} onChange={(e) => setRole(e.target.value)} data-testid="select-interview-role" className="rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] outline-none"><option value="">Use {targetRole}</option>{dashboard?.topRoles?.map((r) => <option key={r.title} value={r.title}>{r.title}</option>)}</select><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} data-testid="select-interview-difficulty" className="rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] outline-none"><option>Warm-up</option><option>Focused</option><option>Stretch</option></select><Button onClick={() => generate.mutate({ data: { targetRole, difficulty } }, { onSuccess: setPrep })} disabled={generate.isPending} testId="button-generate-interview">{generate.isPending ? <><Loader2 size={14} className="animate-spin" /> Preparing</> : <><Sparkles size={14} /> Start prep</>}</Button></div></div></Card>
    {!prep ? <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><Card className="shell-grid reveal reveal-delay-1 min-h-[300px] bg-[hsl(var(--sidebar))] text-white" testId="card-interview-empty"><div className="flex h-full flex-col justify-between gap-12"><div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[hsl(var(--accent))]"><Award size={18} /></span><h2 className="mt-8 max-w-md font-display text-3xl font-bold leading-[1] tracking-[-.06em]">Good answers are built, not discovered.</h2><p className="mt-4 max-w-sm text-[12px] leading-5 text-white/55">The room is ready when you are. Generate a set of questions and reveal the coaching one card at a time.</p></div><div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.12em] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />{difficulty} mode</div></div></Card><Card className="reveal reveal-delay-2" testId="card-interview-tips"><SectionHeading title="Before you begin" /><div className="space-y-3">{['Use one specific project as your anchor.', 'Name the tradeoff, not only the outcome.', 'Close with what you would do next.'].map((tip, i) => <div key={i} className="flex gap-3 rounded-xl bg-muted/45 p-3"><span className="font-mono-ui text-[10px] text-[hsl(var(--primary))]">0{i + 1}</span><span className="text-[12px] leading-5">{tip}</span></div>)}</div></Card></div> : <InterviewResult prep={prep} onReset={() => setPrep(null)} />}
  </div>;
}

function InterviewResult({ prep, onReset }: { prep: any; onReset: () => void }) {
  const [open, setOpen] = useState(0);
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--primary))]">Room ready</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-.05em]">{prep.targetRole}</h2></div><Button variant="secondary" onClick={onReset} testId="button-reset-interview"><RefreshCw size={14} /> New set</Button></div><div className="grid gap-6 lg:grid-cols-[1fr_.7fr]"><div className="space-y-3">{prep.questions?.map((item: any, i: number) => <div key={i} data-testid={`interview-question-${i}`} className={`rounded-2xl border bg-card transition-colors ${open === i ? 'border-[hsl(var(--primary)/.42)]' : 'border-border'}`}><button onClick={() => setOpen(open === i ? -1 : i)} data-testid={`button-open-question-${i}`} className="flex w-full items-start gap-4 p-5 text-left"><span className="font-mono-ui text-[10px] text-[hsl(var(--primary))]">0{i + 1}</span><span className="flex-1"><span className="mb-2 block font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">{item.category}</span><span className="block text-[14px] font-bold leading-5">{item.question}</span></span><ChevronRight size={17} className={`mt-1 transition-transform ${open === i ? 'rotate-90' : ''}`} /></button>{open === i && <div className="mx-5 mb-5 rounded-xl bg-[hsl(var(--primary)/.07)] p-4"><div className="mb-2 flex items-center gap-2 text-[hsl(var(--primary))]"><Lightbulb size={14} /><span className="font-mono-ui text-[10px] uppercase tracking-[.12em]">Coach's note</span></div><p className="text-[12px] leading-6">{item.coaching}</p></div>}</div>)}</div><Card className="h-fit bg-[hsl(var(--sidebar))] text-white"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-white/45">A useful frame</p><h3 className="mt-4 font-display text-xl font-bold tracking-[-.04em]">Context. Choice. Consequence.</h3><p className="mt-3 text-[12px] leading-6 text-white/60">Strong answers let the listener follow your thinking. Start with the constraint, name the choice you made, and close with the result or lesson.</p><div className="mt-6 space-y-2 border-t border-white/10 pt-5">{prep.toolTrace?.map((step: string, i: number) => <TraceItem key={i} text={step} />)}</div></Card></div></div>;
}

function KnowledgePage() {
  const docsQuery = useListCareerDocuments();
  const add = useAddCareerDocument();
  const ask = useAskCareerQuestion();
  const queryClient = useQueryClient();
  const [filename, setFilename] = useState('');
  const [kind, setKind] = useState('Job description');
  const [content, setContent] = useState('');
  const [fileNotice, setFileNotice] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const readResourceFile = (file?: File) => {
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result ?? ''));
      setFileNotice(`${file.name} loaded. Review the text, then index it.`);
    };
    reader.onerror = () => setFileNotice('This file could not be read. Paste the resource text instead.');
    reader.readAsText(file);
  };
  const addResource = () => add.mutate({ data: { filename: filename || 'career-resource.txt', kind, content } }, { onSuccess: () => { setFilename(''); setContent(''); queryClient.invalidateQueries({ queryKey: getListCareerDocumentsQueryKey() }); } });
  return <div className="space-y-7"><PageIntro eyebrow="Knowledge base" title="Give your questions somewhere to land." description="Index the resources you trust. Every answer here is grounded in those sources, with the trail left visible." />
     <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><Card className="reveal" testId="card-add-resource"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-bold tracking-[-.04em]">Add a resource</h2><p className="mt-1 text-[11px] text-muted-foreground">Job descriptions, syllabi, guides, notes.</p></div><Plus size={18} className="text-[hsl(var(--primary))]" /></div><label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.04)] px-3 py-3 text-[11px] font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/.08)]"><Upload size={15} /><span className="flex-1">Upload a text resource</span><input type="file" accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json,text/csv" onChange={(event) => readResourceFile(event.target.files?.[0])} data-testid="input-resource-file" className="sr-only" /></label>{fileNotice && <p className="mb-4 text-[11px] text-muted-foreground">{fileNotice}</p>}<label className="mb-3 block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Resource name<input value={filename} onChange={(e) => setFilename(e.target.value)} data-testid="input-resource-name" placeholder="e.g. Stripe product internship" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] font-normal outline-none focus:border-[hsl(var(--primary))]" /></label><label className="mb-3 block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Type<select value={kind} onChange={(e) => setKind(e.target.value)} data-testid="select-resource-kind" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] font-normal outline-none focus:border-[hsl(var(--primary))]"><option>Job description</option><option>Career center guide</option><option>Course notes</option><option>Personal research</option></select></label><label className="block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Content<textarea value={content} onChange={(e) => setContent(e.target.value)} data-testid="textarea-resource-content" placeholder="Paste the text you want the agent to remember." className="mt-2 min-h-[150px] w-full resize-y rounded-xl border border-input bg-background p-3 text-[12px] leading-5 outline-none focus:border-[hsl(var(--primary))]" /></label><Button onClick={addResource} disabled={!content.trim() || add.isPending} testId="button-add-resource" >{add.isPending ? <><Loader2 size={14} className="animate-spin" /> Indexing</> : <><Upload size={14} /> Index resource</>}</Button>{add.isSuccess && <p data-testid="status-resource-added" className="mt-3 flex items-center gap-1.5 text-[11px] text-[hsl(var(--primary))]"><Check size={13} /> Resource indexed and ready.</p>}</Card>
      <Card className="reveal reveal-delay-1" testId="card-ask-agent"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-bold tracking-[-.04em]">Ask a grounded question</h2><p className="mt-1 text-[11px] text-muted-foreground">The agent will cite the resources it used.</p></div><Search size={18} className="text-[hsl(var(--primary))]" /></div><div className="flex gap-2"><input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && question.trim()) ask.mutate({ data: { question } }, { onSuccess: setAnswer }); }} data-testid="input-career-question" placeholder="What should I prioritize for a product internship?" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] outline-none focus:border-[hsl(var(--primary))]" /><Button onClick={() => ask.mutate({ data: { question } }, { onSuccess: setAnswer })} disabled={!question.trim() || ask.isPending} testId="button-ask-question">{ask.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}</Button></div>{answer ? <div className="mt-6 space-y-5 border-t border-border pt-5" data-testid="card-career-answer"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-[hsl(var(--primary))]">Grounded answer</p><p className="mt-2 text-[14px] leading-7">{answer.answer}</p></div><div><p className="mb-2 font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground">Sources</p><div className="flex flex-wrap gap-2">{answer.sources?.map((source: string, i: number) => <span key={i} className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-[10px] font-semibold"><BookOpen size={11} className="text-[hsl(var(--primary))]" />{source}</span>)}</div></div><div className="flex flex-wrap gap-2 border-t border-border pt-4">{answer.agentTrace?.map((trace: string, i: number) => <span key={i} className="text-[10px] text-muted-foreground"><Check size={11} className="mr-1 inline text-[hsl(var(--primary))]" />{trace}</span>)}</div></div> : <div className="mt-6 rounded-xl bg-muted/45 p-4 text-[11px] leading-5 text-muted-foreground">Try asking how one of your target roles maps to the resources you have indexed.</div>}</Card></div>
    <Card className="reveal reveal-delay-2" testId="card-resource-list"><SectionHeading title="Your indexed shelf" meta="The references your agent can search." />{docsQuery.isLoading ? <LoadingBlock lines={4} /> : docsQuery.isError ? <QueryError retry={() => docsQuery.refetch()} /> : docsQuery.data?.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{docsQuery.data.map((doc, i) => <div key={doc.id || i} data-testid={`resource-card-${doc.id || i}`} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary)/.08)] text-[hsl(var(--primary))]"><FileText size={14} /></span><span className="font-mono-ui text-[9px] uppercase text-muted-foreground">{doc.kind}</span></div><h3 className="mt-4 truncate text-[12px] font-bold">{doc.filename}</h3><p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{doc.excerpt}</p><p className="mt-4 font-mono-ui text-[9px] text-muted-foreground">{doc.chunks} chunks · added {formatDate(doc.createdAt)}</p></div>)}</div> : <EmptyState icon={FolderOpen} title="Your shelf is waiting" description="Start with a job description or a career center guide. Your agent gets more useful as context accumulates." />}</Card>
  </div>;
}

function ProfilePage() {
  const profileQuery = useGetCareerProfile();
  const update = useUpdateCareerProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(null);
  const profile = profileQuery.data;
  if (profileQuery.isLoading) return <><PageIntro eyebrow="Profile memory" title="Tell the studio what matters." /><Card><LoadingBlock lines={10} /></Card></>;
  if (profileQuery.isError || !profile) return <><PageIntro eyebrow="Profile memory" title="Tell the studio what matters." /><QueryError retry={() => profileQuery.refetch()} /></>;
  const values = form || { name: profile.name, headline: profile.headline, education: profile.education, skills: profile.skills?.join(', '), interests: profile.interests?.join(', '), goals: profile.goals?.join(', '), targetRoles: profile.targetRoles?.join(', ') };
  const setField = (key: string, value: string) => setForm({ ...values, [key]: value });
  const save = () => update.mutate({ data: { name: values.name, headline: values.headline, education: values.education, skills: splitList(values.skills), interests: splitList(values.interests), goals: splitList(values.goals), targetRoles: splitList(values.targetRoles) } }, { onSuccess: (result) => { setForm(null); queryClient.setQueryData(getGetCareerProfileQueryKey(), result); queryClient.invalidateQueries({ queryKey: getGetCareerDashboardQueryKey() }); } });
  return <div className="space-y-7"><PageIntro eyebrow="Profile memory" title="Tell the studio what matters." description="This is the context your agent carries into resume reviews, career answers, and practice sessions." action={<Button onClick={save} disabled={update.isPending} testId="button-save-profile">{update.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving</> : <><Check size={14} /> Save memory</>}</Button>} />
    <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><Card className="reveal bg-[hsl(var(--sidebar))] text-white" testId="card-profile-summary"><Initials name={values.name} /><h2 className="mt-5 font-display text-2xl font-bold tracking-[-.05em]">{values.name || 'Your name'}</h2><p className="mt-1 text-[12px] text-white/55">{values.headline || 'Your professional headline'}</p><div className="mt-8 space-y-4 border-t border-white/10 pt-5"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.13em] text-white/42">North star roles</p><p className="mt-2 text-[12px] leading-5 text-white/70">{values.targetRoles || 'Add roles you are curious about.'}</p></div><div><p className="font-mono-ui text-[9px] uppercase tracking-[.13em] text-white/42">Current focus</p><p className="mt-2 text-[12px] leading-5 text-white/70">{values.goals || 'Add a goal to give your next steps context.'}</p></div></div></Card><Card className="reveal reveal-delay-1" testId="card-profile-form"><div className="grid gap-5 md:grid-cols-2">{[['name', 'Name'], ['headline', 'Headline'], ['education', 'Education'], ['skills', 'Skills'], ['interests', 'Interests'], ['goals', 'Goals'], ['targetRoles', 'Target roles']].map(([key, label]) => <label key={key} className={`${key === 'headline' || key === 'education' ? 'md:col-span-2' : ''} block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground`}>{label}<input value={values[key] || ''} onChange={(e) => setField(key, e.target.value)} data-testid={`input-profile-${key}`} placeholder={key === 'skills' ? 'TypeScript, research, storytelling' : key === 'targetRoles' ? 'Product engineer, UX researcher' : ''} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-[12px] font-normal outline-none transition-colors focus:border-[hsl(var(--primary))]" />{['skills', 'interests', 'goals', 'targetRoles'].includes(key) && <span className="mt-1 block text-[10px] font-normal text-muted-foreground">Separate items with commas.</span>}</label>)}</div>{update.isSuccess && <p data-testid="status-profile-saved" className="mt-5 flex items-center gap-1.5 text-[11px] text-[hsl(var(--primary))]"><Check size={13} /> Your memory is up to date.</p>}</Card></div>
  </div>;
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={Home} /><Route path="/resume" component={ResumePage} /><Route path="/career" component={CareerPage} /><Route path="/interview" component={InterviewPage} /><Route path="/knowledge" component={KnowledgePage} /><Route path="/profile" component={ProfilePage} /><Route component={NotFound} /></Switch></AppShell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
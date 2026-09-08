import json
import os
import re
import urllib.request
from typing import Any
from fastapi import Body, FastAPI, File, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .memory.store import Store
from .rag.retrieval import chunks, retrieve
from .utils.extract import extract_text

app = FastAPI(title="AI Resume & Career Assistant")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
db = Store()


def trace(*items):
    return list(items)


def body_value(data, key, default=""):
    return data.get(key, default) if isinstance(data, dict) else default


def decode_json(value, default):
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default


def run_agent(prompt: str, fallback: dict[str, Any], trace_items: list[str]) -> tuple[dict[str, Any], list[str]]:
    """Use OpenAI for optional refinement without making the demo provider-dependent."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return fallback, [*trace_items, "Fallback: deterministic structured output"]
    try:
        payload = json.dumps(
            {
                "model": "gpt-5.4-mini",
                "max_completion_tokens": 1600,
                "messages": [
                    {"role": "system", "content": "Return JSON only. Preserve the requested keys and arrays."},
                    {"role": "user", "content": prompt},
                ],
            }
        ).encode()
        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=18) as response:
            raw = json.loads(response.read().decode())
        content = raw.get("choices", [{}])[0].get("message", {}).get("content", "")
        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", content, re.I)
        parsed = json.loads(fenced.group(1) if fenced else content)
        if isinstance(parsed, dict):
            return {**fallback, **parsed}, [*trace_items, "LLM: refined the structured result with OpenAI"]
    except Exception:
        pass
    return fallback, [*trace_items, "Fallback: deterministic structured output after unavailable LLM"]


def skill_list(text):
    catalog=["Python","SQL","JavaScript","TypeScript","React","FastAPI","Docker","AWS","Azure","GCP","Machine Learning","NLP","Data Analysis","Git","PostgreSQL","Excel","Communication"]
    low=text.lower(); return [s for s in catalog if s.lower() in low]

@app.get("/api/healthz")
def health(): return {"status":"ok"}

@app.get("/api/career/profile")
def profile(): return db.profile()

@app.put("/api/career/profile")
def update_profile(data: dict = Body(...)):
    p=db.profile(); fields={"name":"name","headline":"headline","education":"education","skills":"skills","interests":"interests","goals":"goals","targetRoles":"target_roles"}
    vals=[]; sets=[]
    for key,col in fields.items():
        if key in data: sets.append(f"{col}=?"); vals.append(data[key])
    if sets:
        vals += [db.now(),p["id"]]; db.execute(f"UPDATE career_profiles SET {','.join(sets)},updated_at=? WHERE id=?",vals)
    db.activity("memory","Student memory updated","Saved profile context for future recommendations.")
    return db.profile()

@app.get("/api/career/dashboard")
def dashboard():
    p=db.profile(); analyses=db.rows("resume_analyses",1); docs=db.rows("career_documents"); acts=db.rows("career_activities",5)
    a=analyses[0] if analyses else None
    recent=[{"id":x[0],"type":x[1],"title":x[2],"detail":x[3],"createdAt":x[4]} for x in acts]
    return {"profile":p,"resumeScore":a[2] if a else 76,"skillCoverage":min(96,max(52,round(len(p["skills"])/8*100))),"indexedDocuments":len(docs),"interviewReadiness":min(94,(a[2]+7) if a else 68),"topRoles":decode_json(a[7], []) if a else [],"skillGaps":decode_json(a[6], []) if a else [],"recentActivity":recent}

def analyze_resume(filename, text):
    p=db.profile(); target=(p["targetRoles"] or ["Data Analyst"])[0]; skills=skill_list(text)
    missing=[{"skill":s,"priority":"High","rationale":f"{s} is commonly requested for {target}.","action":f"Add evidence of {s} through a project or achievement."} for s in ["Cloud fundamentals","Model evaluation","Impact storytelling"] if s.lower() not in text.lower()]
    score=min(96,max(58,62+len(text)//160))
    return {"score":score,"summary":f"A promising resume for {target}; make outcomes and role alignment easier to scan.","strengths":[f"Evidence of {', '.join(skills[:4]) or 'technical'} experience.","Hands-on experience is visible."],"improvements":["Lead bullets with measurable outcomes.","Tailor the summary to the target role.","Add a concise technology line."],"missingSkills":missing,"roleMatches":[{"title":target,"fit":min(95,score+5),"reason":"Your evidence overlaps the target role.","nextStep":"Add one quantified project outcome."}]}

@app.post("/api/career/resume/analyze")
async def resume_analyze(request: Request, file:UploadFile|None=File(None)):
    data = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    filename = body_value(data,"filename","resume.txt")
    resume_text = body_value(data,"resumeText",body_value(data,"text",""))
    if file:
        filename = file.filename or filename
        resume_text = extract_text(filename, await file.read())
    result, agent_trace = run_agent(
        f"Analyze this resume for the target role {db.profile()['targetRoles'][0] if db.profile()['targetRoles'] else 'Data Analyst'} and return the same structured keys: {resume_text[:12000]}",
        analyze_resume(filename, resume_text),
        ["Memory: loaded saved profile and target role", "Analyzer: extracted evidence from resume text", "Gap detector: compared resume evidence with role expectations"],
    )
    result["agentTrace"] = agent_trace
    now=db.now(); rid=db.insert("resume_analyses",["filename","score","summary","strengths","improvements","missing_skills","role_matches","agent_trace","created_at"],[filename,result["score"],result["summary"],result["strengths"],result["improvements"],result["missingSkills"],result["roleMatches"],result["agentTrace"],now])
    db.activity("analysis","Resume analyzed",f"{filename} scored {result['score']}/100.")
    return {"id":rid,"filename":filename,**result,"createdAt":now}

def add_document(filename, kind, content):
    now=db.now(); n=len(chunks(content)); did=db.insert("career_documents",["filename","kind","content","excerpt","chunks","created_at"],[filename,kind,content[:100000]," ".join(content.split())[:240],n,now])
    db.activity("knowledge","Resource indexed",f"{filename} is ready for grounded questions.")
    return {"id":did,"filename":filename,"kind":kind,"excerpt":" ".join(content.split())[:240],"chunks":n,"createdAt":now}

@app.get("/api/career/documents")
def documents():
    return [{"id":r[0],"filename":r[1],"kind":r[2],"excerpt":r[4],"chunks":r[5],"createdAt":r[6]} for r in db.rows("career_documents")]

@app.post("/api/career/documents", status_code=201)
async def document(request: Request, file: UploadFile|None=File(None)):
    if file:
        raw=await file.read(); return add_document(file.filename or "upload", (file.content_type or "text").split("/")[-1],extract_text(file.filename or "upload",raw))
    data = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    return add_document(body_value(data,"filename","resource.txt"),body_value(data,"kind","text"),body_value(data,"content",""))

@app.post("/api/career/chat")
def chat(data: dict=Body(...)):
    q=body_value(data,"question",""); rows=[{"filename":r[1],"content":r[3]} for r in db.rows("career_documents")]
    hits=retrieve(q,rows); sources=[x["filename"] for x in hits]; p=db.profile()
    answer=(f"Based on {', '.join(sources)}, focus on evidence relevant to your goal: {p['goals'][0] if p['goals'] else 'career growth'}. Review the cited material and turn its guidance into a measurable project step." if hits else "I do not have a matching resource in the knowledge base yet. Add a career guide, role description, or interview rubric and I can ground the answer in it.")
    return {"question":q,"answer":answer,"sources":sources,"agentTrace":trace("Memory: loaded saved career goals",f"Retriever: selected {len(sources)} relevant resources","Generator: used transparent grounded fallback")}

@app.post("/api/career/tools/resume")
def resume_tool(data:dict=Body(...)):
    p=db.profile(); role=body_value(data,"targetRole","Data Analyst"); focus=body_value(data,"focus","impact")
    return {"title":f"{role} resume draft","content":f"{p['name']}\n{role} Candidate\n\nSUMMARY\n{p['headline']}.\n\nSKILLS\n{' · '.join(p['skills'])}\n\nFOCUS\n{focus}","highlights":["Role-aligned opening summary","Outcome-first project bullets","Scannable skill grouping"],"toolTrace":["Tool: resume improver","Memory: used saved skills and headline","Fallback: generated a safe editable draft"]}

@app.post("/api/career/tools/skills")
def skill_tool(data:dict=Body(...)):
    role=body_value(data,"targetRole","Data Analyst"); plan=[{"week":"Weeks 1–2","skill":"Cloud fundamentals","why":"Move from local projects to deployable proof.","project":"Deploy a small API and document its architecture."},{"week":"Weeks 3–5","skill":"Model evaluation","why":"Show quality reasoning.","project":"Compare a baseline with precision, recall, and error analysis."},{"week":"Weeks 6–8","skill":"Impact storytelling","why":"Make outcomes memorable.","project":"Turn one project into a STAR story."}]
    return {"targetRole":role,"plan":plan,"toolTrace":["Tool: skill recommender","Memory: matched plan to goals","Fallback: role-based skill heuristics"]}

@app.post("/api/career/tools/interview")
def interview_tool(data:dict=Body(...)):
    role=body_value(data,"targetRole","Data Analyst"); return {"targetRole":role,"questions":[{"category":"Motivation","question":f"Why are you interested in {role}?","coaching":"Connect the role to your interests and one project."},{"category":"Technical","question":"Walk me through a project where the first approach did not work.","coaching":"Explain context, trade-offs, evidence, and change."},{"category":"Behavioral","question":"Tell me about a time you learned quickly.","coaching":"Show goal, practice, feedback, and result."}],"toolTrace":["Tool: interview coach","Memory: personalized prompts","Fallback: structured interview set"]}

@app.get("/api/career/activity")
def activity():
    return [{"id":r[0],"type":r[1],"title":r[2],"detail":r[3],"createdAt":r[4]} for r in db.rows("career_activities",12)]

# Recruitment capabilities -------------------------------------------------
@app.post("/api/recruitment/candidates/analyze")
async def candidate_analyze(request: Request, file:UploadFile|None=File(None)):
    data = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    filename=body_value(data,"filename","resume.txt")
    text=body_value(data,"resumeText",body_value(data,"text",""))
    if file: filename=file.filename or filename; text=extract_text(filename,await file.read())
    skills=skill_list(text); profile={"name": next((x for x in text.splitlines() if x.strip()),filename.rsplit(".",1)[0]),"summary":text[:500],"skills":skills}
    cid=db.insert("recruitment_candidates",["filename","profile","created_at"],[filename,json.dumps(profile),db.now()])
    db.interaction("candidate_analysis", filename, json.dumps({"candidateId": cid, "skills": skills}))
    return {"id":cid,"candidateId":cid,"filename":filename,"candidateProfile":profile,"extractedSkills":skills,"experience":[],"education":[],"agentTrace":["Extractor: parsed resume text","Analyzer: identified skills and candidate evidence","Fallback: deterministic recruitment analysis"]}

def job_analysis(title, desc):
    allskills=skill_list(desc); sentences=[s.strip() for s in re.split(r"[.!?\n]",desc) if s.strip()]
    role_text = f"{title} {desc}".lower()
    return {"title":title,"requiredSkills":allskills,"niceToHave":[],"responsibilities":sentences[:6],"seniority":("senior" if "senior" in role_text else "entry-level" if "intern" in role_text or "junior" in role_text else "mid-level")}

@app.post("/api/recruitment/jobs/analyze")
def job_analyze(data:dict=Body(...)):
    title=body_value(data,"title","Untitled role"); desc=body_value(data,"description",""); result=job_analysis(title,desc); jid=db.insert("recruitment_jobs",["title","description","analysis","created_at"],[title,desc,json.dumps(result),db.now()])
    db.interaction("job_analysis", title, json.dumps({"jobId": jid, "requiredSkills": result["requiredSkills"]}))
    return {"id":jid,"jobId":jid,**result,"agentTrace":["Analyzer: parsed job requirements","Extractor: identified responsibilities and seniority","Fallback: deterministic recruitment analysis"]}

def candidate_obj(data):
    if isinstance(data,dict) and data.get("candidate"): return data["candidate"]
    cid=data.get("candidateId") if isinstance(data,dict) else None
    if cid:
        r=db.one("recruitment_candidates",cid)
        if r:return decode_json(r[2], {})
    return data if isinstance(data,dict) else {}

def job_obj(data):
    if isinstance(data,dict) and data.get("job"): return data["job"]
    jid=data.get("jobId") if isinstance(data,dict) else None
    if jid:
        r=db.one("recruitment_jobs",jid)
        if r:return decode_json(r[3], {})
    return data if isinstance(data,dict) else {}

@app.post("/api/recruitment/match")
def match(data:dict=Body(...)):
    c=candidate_obj(data); j=job_obj(data); cs=set(c.get("skills",c.get("extractedSkills",[]))); req=set(j.get("requiredSkills",skill_list(j.get("description","")))); matched=sorted(cs&req); missing=sorted(req-cs); score=round(100*len(matched)/max(1,len(req)))
    db.interaction("candidate_match", j.get("title", "role"), json.dumps({"score": score, "matchedSkills": matched, "missingSkills": missing}))
    return {"matchScore":score,"matchedSkills":matched,"missingSkills":missing,"rationale":f"Matched {len(matched)} of {len(req)} required skills.","agentTrace":["Matcher: compared normalized skill sets","Fallback: transparent overlap scoring"]}

@app.post("/api/recruitment/rank")
def rank(data:dict=Body(...)):
    j=job_analysis(body_value(data,"title","Role"),body_value(data,"jobDescription",body_value(data,"description",""))); out=[]
    for c in data.get("candidates",[]):
        m=match({"candidate":c,"job":j}); out.append({"candidate":c,"score":m["matchScore"],"strengths":m["matchedSkills"],"gaps":m["missingSkills"],"rationale":m["rationale"],"agentTrace":m["agentTrace"]})
    ranked = sorted(out,key=lambda x:x["score"],reverse=True)
    db.interaction("candidate_ranking", j["title"], json.dumps({"count": len(ranked), "scores": [item["score"] for item in ranked]}))
    return {"rankedCandidates":ranked,"agentTrace":["Ranker: evaluated all candidates","Matcher: computed explainable skill overlap"]}

@app.post("/api/recruitment/interview")
def recruitment_interview(data:dict=Body(...)):
    c=candidate_obj(data); j=job_obj(data); role=j.get("title","the role")
    db.interaction("interview_generation", role, json.dumps({"candidate": c.get("name", "candidate")}))
    return {"questions":[{"question":f"Why are you interested in {role}?","coaching":"Connect motivation to evidence in the candidate profile."},{"question":"Describe a project demonstrating your strongest required skill.","coaching":"Use situation, actions, trade-offs, and outcome."}],"coaching":"Probe the listed strengths and ask for concrete evidence of each gap.","agentTrace":["Interview agent: loaded candidate and job context","Fallback: structured coaching questions"]}

@app.post("/api/recruitment/faq")
def recruitment_faq(data:dict=Body(...)):
    q=body_value(data,"question",""); docs=[{"filename":r[1],"content":r[3]} for r in db.rows("career_documents")]; hits=retrieve(q,docs); sources=[x["filename"] for x in hits]
    db.interaction("recruitment_faq", q, json.dumps({"sources": sources}))
    return {"answer":("According to "+", ".join(sources)+", review the relevant policy or role guidance in the indexed source." if sources else "No recruitment documents matching that question have been uploaded yet."),"sources":sources,"agentTrace":["Retriever: searched uploaded recruitment documents","Generator: returned grounded fallback"]}

@app.get("/api/recruitment/candidates")
def candidates(): return [{"id":r[0],"candidateId":r[0],"filename":r[1],"candidateProfile":decode_json(r[2], {}),"createdAt":r[3]} for r in db.rows("recruitment_candidates")]
@app.get("/api/recruitment/jobs")
def jobs(): return [{"id":r[0],"jobId":r[0],"title":r[1],"description":r[2],**decode_json(r[3], {}),"createdAt":r[4]} for r in db.rows("recruitment_jobs")]
@app.post("/api/recruitment/documents",status_code=201)
async def recruitment_document(request: Request, file:UploadFile|None=File(None)):
    return await document(request, file)


@app.get("/api/recruitment/interactions")
def recruitment_interactions():
    return [{"id":r[0], "kind":r[1], "subject":r[2], "payload":decode_json(r[3], {}), "createdAt":r[4]} for r in db.rows("recruitment_interactions", 50)]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("python_app.app:app",host="0.0.0.0",port=int(os.getenv("PORT","8080")))
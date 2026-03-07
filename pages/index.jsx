import { useState } from "react";
import dynamic from "next/dynamic";
import { Upload, Download, CheckCircle, Edit3, Eye, Sparkles, AlertTriangle, Home, Plus, Trash2, ChevronRight } from "lucide-react";

// ── DATA SCHEMA ──────────────────────────────────────────────
const EMPTY = {
  name:"", title:"", phone:"", email:"", address:"", linkedin:"", github:"",
  about:"",
  education:    [{ degree:"", institution:"", year:"", grade:"" }],
  experience:   [{ title:"", company:"", duration:"", bullets:"" }],
  technical_skills:"", soft_skills:"", languages:"",
  projects:     [{ name:"", tech:"", description:"" }],
  certifications:[{ name:"", issuer:"", description:"" }],
  activities:"",
};

const DEMO = {
  name:"Sivanesh S", title:"B.Com Graduate · Automation & AI",
  phone:"7558137381", email:"ssivanesh544@gmail.com",
  address:"Chennai, Tamil Nadu",
  linkedin:"linkedin.com/in/sivanesh-s-711a92380",
  github:"github.com/kuruvi689",
  about:"B.Com graduate with practical experience in workflow automation, AI tooling, and logical system design. Built production-grade automation workflows using n8n and Claude API. Seeking a role to apply analytical and automation skills in a structured environment.",
  education:[
    { degree:"B.Com General", institution:"S.I.V.E.T College, University of Madras", year:"2023 – 2026", grade:"Current · 69%" },
    { degree:"HSC", institution:"St. Paul's Matriculation Higher Secondary School", year:"2023", grade:"87%" },
  ],
  experience:[{ title:"", company:"", duration:"", bullets:"" }],
  technical_skills:"Microsoft Excel, Python (Basics), n8n, VS Code, Claude API, Canva",
  soft_skills:"Logical thinking, Workflow automation, System design, Team coordination",
  languages:"Tamil, English",
  projects:[
    { name:"Project Karen", tech:"n8n, Claude API", description:"Designed a multi-step workflow automation system to reduce manual task overhead" },
    { name:"Nutrition Agent", tech:"Prompt engineering", description:"Built an AI assistant generating personalised nutrition plans using structured prompt logic" },
    { name:"Autonomous Script Writer", tech:"n8n, Claude API", description:"Developed an AI pipeline to generate structured scripts from single-line topic inputs" },
  ],
  certifications:[{ name:"College to Corporate Workshop", issuer:"Aasan Memorial College", description:"Professional communication and workplace readiness training" }],
  activities:"Rotaract Club Member – Active member for 3 years\nClass Event Manager – Coordinated 4 academic events\nNSS Volunteer – Community service 2022–2024",
};

// ── TEMPLATE DEFINITIONS ──────────────────────────────────────
const TEMPLATES = [
  { id:"apex",    name:"Apex",    tag:"Consulting · Big 4", desc:"McKinsey / Deloitte style. Serif, single column, ruled sections.", accent:"#1a1a1a" },
  { id:"horizon", name:"Horizon", tag:"Tech · Product",     desc:"Google / Microsoft style. Clean grid, blue accent line, ATS-optimised.", accent:"#1a56db" },
  { id:"vault",   name:"Vault",   tag:"Finance · Banking",  desc:"JP Morgan / HDFC style. Navy header band, structured two-column.", accent:"#0a2463" },
  { id:"prism",   name:"Prism",   tag:"IT · Fresher",       desc:"Infosys / TCS style. Teal sidebar, campus placement ready.", accent:"#0d7377" },
  { id:"canvas",  name:"Canvas",  tag:"Marketing · Creative",desc:"Unilever / ITC style. Purple accent, modern header.", accent:"#7c3aed" },
];

const A4_W = 794, A4_H = 1123;
const SCALE_CARD = 0.28;
const SCALE_PREV = 0.44;
const PREV_W = Math.round(A4_W * SCALE_PREV);
const PREV_H = Math.round(A4_H * SCALE_PREV);

// ── SECTION MAP ───────────────────────────────────────────────
const SECTION_MAP = {
  about:           ["ABOUT ME","ABOUT","SUMMARY","PROFILE","OBJECTIVE","CAREER OBJECTIVE","PROFESSIONAL SUMMARY"],
  education:       ["EDUCATION","ACADEMIC","QUALIFICATION","ACADEMIC BACKGROUND"],
  experience:      ["EXPERIENCE","WORK EXPERIENCE","INTERNSHIP","INTERNSHIP EXPERIENCE","EMPLOYMENT","PROFESSIONAL EXPERIENCE"],
  technical_skills:["TECHNICAL SKILLS","TOOLS & TECHNOLOGIES","TOOLS AND TECHNOLOGIES","TOOLS","TECHNOLOGIES","SOFTWARE"],
  soft_skills:     ["SOFT SKILLS","SKILLS","CORE COMPETENCIES","KEY SKILLS","COMPETENCIES"],
  languages:       ["LANGUAGES","LANGUAGE SKILLS"],
  projects:        ["PROJECTS","PROJECT","KEY PROJECTS","PERSONAL PROJECTS"],
  certifications:  ["CERTIFICATIONS","CERTIFICATION","CERTIFICATES","CERTIFICATIONS & WORKSHOPS","WORKSHOPS","ACHIEVEMENTS","TRAINING"],
  activities:      ["ACTIVITIES","EXTRA-CURRICULAR","EXTRACURRICULAR","VOLUNTEERING","INTERESTS","CO-CURRICULAR"],
};

// ── DOCX PARSER ───────────────────────────────────────────────
function ppText(xml) {
  const paras = [];
  const re = /<w:p[ >]([\s\S]*?)<\/w:p>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const p = m[1];
    const txt = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(x=>x[1]).join("").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();
    if (!txt) continue;
    paras.push({ text:txt, bold:/<w:b\/>/.test(p), caps:/<w:caps\/>/.test(p), italic:/<w:i\/>/.test(p), bullet:/<w:numId/.test(p), sizePt:(()=>{const s=(p.match(/<w:sz w:val="(\d+)"/) ||[])[1];return s?Math.round(+s/2):11;})() });
  }
  return paras;
}

function isHdr(p) {
  if (!p.text.trim()||p.bullet) return false;
  return (p.bold&&p.caps)||(p.bold&&p.text===p.text.toUpperCase()&&p.text.length<60&&/^[A-Z0-9\s&\/,()\-+]+$/.test(p.text));
}

function identifySection(text) {
  const u = text.toUpperCase().trim();
  for (const [k,vs] of Object.entries(SECTION_MAP)) if (vs.some(v=>u===v||u.includes(v))) return k;
  return null;
}

function extractData(paras) {
  const out = { name:"",title:"",phone:"",email:"",address:"",linkedin:"",github:"",about:"",education:[],experience:[],technical_skills:"",soft_skills:"",languages:"",projects:[],certifications:[],activities:"" };
  const bySize=[...paras].sort((a,b)=>b.sizePt-a.sizePt);
  if (bySize[0]) out.name=bySize[0].text;
  const nameIdx=paras.findIndex(p=>p.text===out.name);
  for (let i=nameIdx+1;i<Math.min(nameIdx+4,paras.length);i++) {
    const p=paras[i];
    if (!out.title&&p.bold&&!isHdr(p)&&!p.text.includes("@")&&!/\d{7,}/.test(p.text)){out.title=p.text;break;}
  }
  for (const p of paras.slice(0,8)) {
    const t=p.text;
    if (t===out.name||t===out.title) continue;
    if (t.includes("@")){const m=t.match(/[\w.+\-]+@[\w.\-]+\.\w+/);if(m)out.email=m[0];}
    if (/\d{7,}/.test(t)&&!t.includes("@")){const m=t.match(/[\d\s\-+]{8,}/);if(m)out.phone=m[0].trim();}
    if (/linkedin/i.test(t)){const m=t.match(/linkedin\.com\/in\/[\w\-]+/i);if(m)out.linkedin=m[0];}
    if (/github/i.test(t)){const m=t.match(/github\.com\/[\w\-]+/i);if(m)out.github=m[0];}
    if (!out.address&&!t.includes("@")&&!/\d{7,}/.test(t)&&!/linkedin|github/i.test(t)&&t.length>3&&t.length<80&&!isHdr(p)) out.address=t;
  }
  const raw={};let cur=null;
  for (const p of paras) {
    if (p.text===out.name||p.text===out.title) continue;
    if (isHdr(p)){cur=identifySection(p.text);if(cur&&!raw[cur])raw[cur]=[];}
    else if(cur)(raw[cur]=raw[cur]||[]).push(p);
  }
  if(raw.about?.length)out.about=raw.about.map(p=>p.text).join(" ");
  if(raw.technical_skills?.length)out.technical_skills=raw.technical_skills.map(p=>p.text).join(", ");
  if(raw.soft_skills?.length)out.soft_skills=raw.soft_skills.map(p=>p.text).join(", ");
  if(raw.languages?.length)out.languages=raw.languages.map(p=>p.text).join(", ");
  if(raw.activities?.length)out.activities=raw.activities.map(p=>p.text).join("\n");
  if(raw.education?.length){let c=null;const e=[];for(const p of raw.education){if(p.bold&&p.text.length>4){if(c)e.push(c);c={degree:p.text,institution:"",year:"",grade:""};}else if(c){if(!c.institution)c.institution=p.text;else if(!c.year&&(/\d{4}/.test(p.text)||/year|final/i.test(p.text)))c.year=p.text;else if(!c.grade&&(/\d+%|cgpa|gpa/i.test(p.text)))c.grade=p.text;else if(!c.year)c.year=p.text;}}if(c)e.push(c);if(e.length)out.education=e;}
  if(raw.experience?.length){let c=null;const e=[];for(const p of raw.experience){if(p.bold&&!p.bullet&&p.text.length>2){if(c)e.push(c);c={title:p.text,company:"",duration:"",bullets:""};}else if(c){if(!c.company)c.company=p.text;else if(!c.duration)c.duration=p.text;else c.bullets=(c.bullets?c.bullets+"\n":"")+p.text;}}if(c)e.push(c);if(e.length)out.experience=e;}
  if(raw.projects?.length){let c=null;const e=[];for(const p of raw.projects){if(p.bold&&!p.bullet){if(c)e.push(c);c={name:p.text,tech:"",description:""};}else if(c){if(!c.tech&&p.text.length<100)c.tech=p.text;else c.description=(c.description?c.description+" ":"")+p.text;}}if(c)e.push(c);if(e.length)out.projects=e;}
  if(raw.certifications?.length){let c=null;const e=[];for(const p of raw.certifications){if(p.bold&&!p.bullet){if(c)e.push(c);c={name:p.text,issuer:"",description:""};}else if(c){if(!c.issuer)c.issuer=p.text;else c.description=(c.description?c.description+" ":"")+p.text;}}if(c)e.push(c);if(e.length)out.certifications=e;}
  return out;
}

async function parseDocx(file) {
  const buf = await file.arrayBuffer();
  const logs = [];
  let data = { ...EMPTY, education:[{degree:"",institution:"",year:"",grade:""}], experience:[{title:"",company:"",duration:"",bullets:""}], projects:[{name:"",tech:"",description:""}], certifications:[{name:"",issuer:"",description:""}] };
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buf.slice(0));
    const xml = await zip.file("word/document.xml")?.async("string");
    if (!xml) throw new Error("No document.xml");
    const hasTbl = /<w:tbl[\s>]/.test(xml);
    let allParas = [];
    if (hasTbl) {
      const preTbl = xml.split(/<w:tbl[\s>]/)[0];
      const cells = [...xml.matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)].map(m=>m[1]);
      allParas = ppText(preTbl);
      for (const c of cells) allParas = [...allParas, ...ppText(c)];
    } else allParas = ppText(xml);
    data = extractData(allParas);
    logs.push(`✅ Extracted data from ${file.name}`);
  } catch (ex) {
    logs.push(`⚠️ ${ex.message}`);
    try {
      const mammoth = (await import("mammoth")).default;
      const r = await mammoth.extractRawText({ arrayBuffer: buf.slice(0) });
      const lines = r.value.split("\n").filter(l=>l.trim());
      if (lines[0]) data.name = lines[0];
      logs.push("✅ Extracted name via text fallback");
    } catch {}
  }
  if (!data.education?.length)     data.education     = [{degree:"",institution:"",year:"",grade:""}];
  if (!data.experience?.length)    data.experience    = [{title:"",company:"",duration:"",bullets:""}];
  if (!data.projects?.length)      data.projects      = [{name:"",tech:"",description:""}];
  if (!data.certifications?.length)data.certifications= [{name:"",issuer:"",description:""}];
  return { data, logs };
}

// ── GROK ANALYSIS (via /api/analyze) ─────────────────────────
async function agentAnalyze(data) {
  const parts = [
    data.name, data.title, data.phone, data.email, data.address,
    data.about,
    ...(data.education||[]).flatMap(e=>[e.degree,e.institution,e.year,e.grade]),
    ...(data.experience||[]).flatMap(e=>[e.title,e.company,e.duration,e.bullets]),
    data.technical_skills, data.soft_skills, data.languages,
    ...(data.projects||[]).flatMap(p=>[p.name,p.tech,p.description]),
    ...(data.certifications||[]).flatMap(c=>[c.name,c.issuer,c.description]),
    data.activities,
  ].filter(Boolean).join("\n");

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText: parts }),
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}

// ── UTILITIES ─────────────────────────────────────────────────
function esc(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
const Bullet=({text,style={}})=>(<div style={{paddingLeft:"14px",lineHeight:1.55,marginBottom:"2px",...style}}>• {text}</div>);

// ── TEMPLATES ─────────────────────────────────────────────────
function ApexTemplate({data:d}){
  const H=({children})=>(<div style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:"9.5pt",fontWeight:700,textTransform:"uppercase",letterSpacing:"1.8px",color:"#111",borderBottom:"1.5px solid #111",paddingBottom:"3px",marginTop:"16px",marginBottom:"7px"}}>{children}</div>);
  const Sub=({children})=>(<div style={{fontWeight:700,lineHeight:1.5}}>{children}</div>);
  const ed=(d.education||[]).filter(e=>e.degree||e.institution);
  const ex=(d.experience||[]).filter(e=>e.title||e.company);
  const pr=(d.projects||[]).filter(p=>p.name||p.description);
  const ce=(d.certifications||[]).filter(c=>c.name);
  const ac=(d.activities||"").split("\n").filter(Boolean);
  return(
    <div style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:"10pt",color:"#111",background:"#fff",padding:"52px 62px",width:`${A4_W}px`,minHeight:`${A4_H}px`,boxSizing:"border-box",lineHeight:1.55}}>
      <div style={{borderBottom:"2px solid #111",paddingBottom:"10px",marginBottom:"6px"}}>
        <div style={{fontSize:"22pt",fontWeight:700,letterSpacing:"1px",lineHeight:1}}>{d.name||"YOUR NAME"}</div>
        {d.title&&<div style={{fontSize:"10.5pt",color:"#333",marginTop:"4px",fontStyle:"italic"}}>{d.title}</div>}
        <div style={{fontSize:"9pt",color:"#444",marginTop:"5px"}}>{[d.phone,d.email,d.address,d.linkedin,d.github].filter(Boolean).join("   ·   ")}</div>
      </div>
      {d.about&&<><H>Profile</H><div style={{lineHeight:1.6}}>{d.about}</div></>}
      {ed.length>0&&<><H>Education</H>{ed.map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"6px"}}><div><Sub>{e.degree}</Sub><div style={{fontSize:"9.5pt",color:"#333"}}>{e.institution}</div></div><div style={{textAlign:"right",flexShrink:0,marginLeft:"16px",fontSize:"9.5pt",color:"#444"}}>{e.year}{e.grade&&<><br/>{e.grade}</>}</div></div>))}</>}
      {ex.length>0&&<><H>Experience</H>{ex.map((e,i)=>(<div key={i} style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><Sub>{e.title}{e.company&&<span style={{fontWeight:400}}> · {e.company}</span>}</Sub><span style={{fontSize:"9.5pt",color:"#555",flexShrink:0,marginLeft:"12px",fontStyle:"italic"}}>{e.duration}</span></div>{(e.bullets||"").split("\n").filter(Boolean).map((b,j)=><Bullet key={j} text={b} style={{fontSize:"9.5pt"}}/>)}</div>))}</>}
      {pr.length>0&&<><H>Projects</H>{pr.map((p,i)=>(<div key={i} style={{marginBottom:"8px"}}><Sub>{p.name}{p.tech&&<span style={{fontWeight:400,fontSize:"9.5pt"}}> — {p.tech}</span>}</Sub>{p.description&&<div style={{fontSize:"9.5pt",lineHeight:1.5}}>{p.description}</div>}</div>))}</>}
      {(d.technical_skills||d.soft_skills||d.languages)&&<><H>Skills & Languages</H>
        {d.technical_skills&&<div style={{marginBottom:"3px"}}><span style={{fontWeight:700,fontSize:"9.5pt"}}>Technical: </span>{d.technical_skills}</div>}
        {d.soft_skills&&<div style={{marginBottom:"3px"}}><span style={{fontWeight:700,fontSize:"9.5pt"}}>Professional: </span>{d.soft_skills}</div>}
        {d.languages&&<div><span style={{fontWeight:700,fontSize:"9.5pt"}}>Languages: </span>{d.languages}</div>}
      </>}
      {ce.length>0&&<><H>Certifications</H>{ce.map((c,i)=>(<div key={i} style={{marginBottom:"5px"}}><Sub>{c.name}</Sub>{c.issuer&&<div style={{fontSize:"9.5pt",color:"#444"}}>{c.issuer}</div>}{c.description&&<div style={{fontSize:"9.5pt"}}>{c.description}</div>}</div>))}</>}
      {ac.length>0&&<><H>Activities</H>{ac.map((a,i)=><Bullet key={i} text={a} style={{fontSize:"9.5pt"}}/>)}</>}
    </div>
  );
}

function HorizonTemplate({data:d}){
  const AC="#1a56db";
  const H=({children})=>(<div style={{fontFamily:"Calibri,Arial,sans-serif",fontSize:"10pt",fontWeight:700,color:AC,borderBottom:`2px solid ${AC}`,paddingBottom:"2px",marginTop:"16px",marginBottom:"7px",letterSpacing:"0.3px"}}>{children}</div>);
  const ed=(d.education||[]).filter(e=>e.degree||e.institution);
  const ex=(d.experience||[]).filter(e=>e.title||e.company);
  const pr=(d.projects||[]).filter(p=>p.name||p.description);
  const ce=(d.certifications||[]).filter(c=>c.name);
  const ac=(d.activities||"").split("\n").filter(Boolean);
  const ts=(d.technical_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const ss=(d.soft_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const Chip=({v})=>(<span style={{display:"inline-block",background:"#e8f0fe",color:AC,border:`1px solid ${AC}30`,borderRadius:"3px",padding:"2px 8px",fontSize:"9pt",margin:"2px 2px 2px 0"}}>{v}</span>);
  return(
    <div style={{fontFamily:"Calibri,Arial,sans-serif",fontSize:"10.5pt",color:"#1e293b",background:"#fff",width:`${A4_W}px`,minHeight:`${A4_H}px`,boxSizing:"border-box",lineHeight:1.55}}>
      <div style={{borderLeft:`5px solid ${AC}`,padding:"28px 50px 16px 45px",borderBottom:"1px solid #e2e8f0"}}>
        <div style={{fontSize:"24pt",fontWeight:700,color:"#0f172a",letterSpacing:"0.5px",lineHeight:1.1}}>{d.name||"YOUR NAME"}</div>
        {d.title&&<div style={{fontSize:"11pt",color:AC,fontWeight:600,marginTop:"3px"}}>{d.title}</div>}
        <div style={{fontSize:"9.5pt",color:"#475569",marginTop:"6px",display:"flex",flexWrap:"wrap",gap:"14px"}}>{[d.phone,d.email,d.address,d.linkedin,d.github].filter(Boolean).map((v,i)=><span key={i}>{v}</span>)}</div>
      </div>
      <div style={{padding:"4px 50px 50px 50px"}}>
        {d.about&&<><H>Summary</H><div style={{lineHeight:1.65,color:"#334155"}}>{d.about}</div></>}
        {ed.length>0&&<><H>Education</H>{ed.map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><div><div style={{fontWeight:700}}>{e.degree}</div><div style={{color:"#475569",fontSize:"10pt"}}>{e.institution}</div>{e.grade&&<div style={{color:"#64748b",fontSize:"9.5pt"}}>{e.grade}</div>}</div><div style={{color:"#64748b",fontSize:"9.5pt",flexShrink:0,marginLeft:"16px",textAlign:"right"}}>{e.year}</div></div>))}</>}
        {ex.length>0&&<><H>Experience</H>{ex.map((e,i)=>(<div key={i} style={{marginBottom:"12px"}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:700}}>{e.title}</div><div style={{color:"#64748b",fontSize:"9.5pt",flexShrink:0,marginLeft:"12px"}}>{e.duration}</div></div>{e.company&&<div style={{color:AC,fontSize:"10pt",fontWeight:600}}>{e.company}</div>}{(e.bullets||"").split("\n").filter(Boolean).map((b,j)=><Bullet key={j} text={b} style={{color:"#334155",fontSize:"10pt"}}/>)}</div>))}</>}
        {pr.length>0&&<><H>Projects</H>{pr.map((p,i)=>(<div key={i} style={{marginBottom:"8px"}}><div style={{display:"flex",gap:"8px",alignItems:"baseline"}}><div style={{fontWeight:700}}>{p.name}</div>{p.tech&&<div style={{color:AC,fontSize:"9.5pt"}}>· {p.tech}</div>}</div>{p.description&&<div style={{color:"#334155",fontSize:"10pt"}}>{p.description}</div>}</div>))}</>}
        {(ts.length>0||ss.length>0)&&<><H>Skills</H>
          {ts.length>0&&<div style={{marginBottom:"6px"}}><span style={{fontSize:"9.5pt",fontWeight:700,color:"#475569",marginRight:"6px"}}>Technical</span>{ts.map((v,i)=><Chip key={i} v={v}/>)}</div>}
          {ss.length>0&&<div><span style={{fontSize:"9.5pt",fontWeight:700,color:"#475569",marginRight:"6px"}}>Professional</span>{ss.map((v,i)=><Chip key={i} v={v}/>)}</div>}
          {d.languages&&<div style={{marginTop:"4px",fontSize:"9.5pt"}}><span style={{fontWeight:700,color:"#475569"}}>Languages: </span>{d.languages}</div>}
        </>}
        {ce.length>0&&<><H>Certifications</H>{ce.map((c,i)=>(<div key={i} style={{marginBottom:"6px"}}><div style={{fontWeight:700}}>{c.name}</div>{c.issuer&&<div style={{color:AC,fontSize:"9.5pt"}}>{c.issuer}</div>}{c.description&&<div style={{color:"#334155",fontSize:"10pt"}}>{c.description}</div>}</div>))}</>}
        {ac.length>0&&<><H>Activities</H>{ac.map((a,i)=><Bullet key={i} text={a} style={{color:"#334155",fontSize:"10pt"}}/>)}</>}
      </div>
    </div>
  );
}

function VaultTemplate({data:d}){
  const NAVY="#0a2463",LIGHT="#e8edf7";
  const LH=({children})=>(<div style={{fontSize:"9pt",fontWeight:700,textTransform:"uppercase",letterSpacing:"1.2px",color:"#fff",borderBottom:"1px solid rgba(255,255,255,0.25)",paddingBottom:"3px",marginTop:"14px",marginBottom:"6px"}}>{children}</div>);
  const RH=({children})=>(<div style={{fontSize:"10pt",fontWeight:700,color:NAVY,textTransform:"uppercase",letterSpacing:"1px",borderBottom:`2px solid ${NAVY}`,paddingBottom:"2px",marginTop:"14px",marginBottom:"6px"}}>{children}</div>);
  const ed=(d.education||[]).filter(e=>e.degree||e.institution);
  const ex=(d.experience||[]).filter(e=>e.title||e.company);
  const pr=(d.projects||[]).filter(p=>p.name||p.description);
  const ce=(d.certifications||[]).filter(c=>c.name);
  const ac=(d.activities||"").split("\n").filter(Boolean);
  const ts=(d.technical_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const ss=(d.soft_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const lg=(d.languages||"").split(",").map(s=>s.trim()).filter(Boolean);
  return(
    <div style={{fontFamily:"Calibri,Arial,sans-serif",fontSize:"10pt",color:"#1a1a2e",background:"#fff",width:`${A4_W}px`,minHeight:`${A4_H}px`,boxSizing:"border-box",lineHeight:1.5}}>
      <div style={{background:NAVY,padding:"28px 48px 22px",color:"#fff"}}>
        <div style={{fontSize:"22pt",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",lineHeight:1}}>{d.name||"YOUR NAME"}</div>
        {d.title&&<div style={{fontSize:"10.5pt",color:LIGHT,marginTop:"5px",fontStyle:"italic"}}>{d.title}</div>}
        <div style={{fontSize:"9pt",color:"rgba(255,255,255,0.7)",marginTop:"7px",display:"flex",gap:"16px",flexWrap:"wrap"}}>{[d.phone,d.email,d.address,d.linkedin,d.github].filter(Boolean).map((v,i)=><span key={i}>{v}</span>)}</div>
      </div>
      <div style={{display:"flex"}}>
        <div style={{width:"30%",background:LIGHT,padding:"16px 18px",flexShrink:0}}>
          {ts.length>0&&<><LH>Technical Skills</LH>{ts.map((v,i)=><div key={i} style={{color:"#1a1a2e",fontSize:"9.5pt",padding:"2px 0"}}>• {v}</div>)}</>}
          {ss.length>0&&<><LH>Soft Skills</LH>{ss.map((v,i)=><div key={i} style={{color:"#1a1a2e",fontSize:"9.5pt",padding:"2px 0"}}>• {v}</div>)}</>}
          {lg.length>0&&<><LH>Languages</LH>{lg.map((v,i)=><div key={i} style={{color:"#1a1a2e",fontSize:"9.5pt",padding:"2px 0"}}>• {v}</div>)}</>}
          {ac.length>0&&<><LH>Activities</LH>{ac.map((a,i)=><div key={i} style={{color:"#1a1a2e",fontSize:"9pt",lineHeight:1.5,marginBottom:"4px"}}>{a}</div>)}</>}
        </div>
        <div style={{flex:1,padding:"16px 24px 24px 20px"}}>
          {d.about&&<><RH>Profile</RH><div style={{lineHeight:1.65,fontSize:"10pt"}}>{d.about}</div></>}
          {ed.length>0&&<><RH>Education</RH>{ed.map((e,i)=>(<div key={i} style={{marginBottom:"8px"}}><div style={{fontWeight:700}}>{e.degree}</div><div style={{color:"#334155"}}>{e.institution}</div><div style={{color:"#64748b",fontSize:"9.5pt"}}>{[e.year,e.grade].filter(Boolean).join("  ·  ")}</div></div>))}</>}
          {ex.length>0&&<><RH>Experience</RH>{ex.map((e,i)=>(<div key={i} style={{marginBottom:"10px"}}><div style={{fontWeight:700}}>{e.title}</div><div style={{color:NAVY,fontWeight:600,fontSize:"10pt"}}>{[e.company,e.duration].filter(Boolean).join("  ·  ")}</div>{(e.bullets||"").split("\n").filter(Boolean).map((b,j)=><Bullet key={j} text={b} style={{fontSize:"9.5pt"}}/>)}</div>))}</>}
          {pr.length>0&&<><RH>Projects</RH>{pr.map((p,i)=>(<div key={i} style={{marginBottom:"8px"}}><div style={{fontWeight:700}}>{p.name}{p.tech&&<span style={{fontWeight:400,color:"#64748b",fontSize:"9.5pt"}}> · {p.tech}</span>}</div>{p.description&&<div style={{fontSize:"9.5pt",color:"#334155"}}>{p.description}</div>}</div>))}</>}
          {ce.length>0&&<><RH>Certifications</RH>{ce.map((c,i)=>(<div key={i} style={{marginBottom:"6px"}}><div style={{fontWeight:700}}>{c.name}</div>{c.issuer&&<div style={{color:NAVY,fontSize:"9.5pt"}}>{c.issuer}</div>}{c.description&&<div style={{fontSize:"9.5pt"}}>{c.description}</div>}</div>))}</>}
        </div>
      </div>
    </div>
  );
}

function PrismTemplate({data:d}){
  const TEAL="#0d7377",DARK="#0a4d52";
  const LH=({children})=>(<div style={{fontSize:"9pt",fontWeight:700,textTransform:"uppercase",letterSpacing:"1.2px",color:"rgba(255,255,255,0.9)",borderBottom:"1px solid rgba(255,255,255,0.3)",paddingBottom:"3px",marginTop:"14px",marginBottom:"6px"}}>{children}</div>);
  const RH=({children})=>(<div style={{fontSize:"10pt",fontWeight:700,color:TEAL,textTransform:"uppercase",letterSpacing:"1px",borderBottom:`2px solid ${TEAL}`,paddingBottom:"2px",marginTop:"14px",marginBottom:"6px"}}>{children}</div>);
  const ed=(d.education||[]).filter(e=>e.degree||e.institution);
  const ex=(d.experience||[]).filter(e=>e.title||e.company);
  const pr=(d.projects||[]).filter(p=>p.name||p.description);
  const ce=(d.certifications||[]).filter(c=>c.name);
  const ac=(d.activities||"").split("\n").filter(Boolean);
  const ts=(d.technical_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const ss=(d.soft_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const lg=(d.languages||"").split(",").map(s=>s.trim()).filter(Boolean);
  return(
    <div style={{fontFamily:"Calibri,Arial,sans-serif",fontSize:"10pt",color:"#1a1a1a",background:"#fff",width:`${A4_W}px`,minHeight:`${A4_H}px`,boxSizing:"border-box",display:"flex",lineHeight:1.5}}>
      <div style={{width:"28%",background:`linear-gradient(180deg,${TEAL},${DARK})`,padding:"36px 16px",flexShrink:0,color:"#fff"}}>
        <div style={{fontSize:"16pt",fontWeight:700,lineHeight:1.2,marginBottom:"3px",wordBreak:"break-word"}}>{d.name||"YOUR NAME"}</div>
        {d.title&&<div style={{fontSize:"9pt",opacity:0.8,marginBottom:"14px",lineHeight:1.4}}>{d.title}</div>}
        <LH>Contact</LH>
        {[d.phone,d.email,d.address,d.linkedin,d.github].filter(Boolean).map((v,i)=><div key={i} style={{fontSize:"8.5pt",marginBottom:"4px",wordBreak:"break-all",opacity:0.9}}>{v}</div>)}
        {ts.length>0&&<><LH>Technical Skills</LH>{ts.map((v,i)=><div key={i} style={{fontSize:"9pt",padding:"2px 0",opacity:0.9}}>• {v}</div>)}</>}
        {ss.length>0&&<><LH>Soft Skills</LH>{ss.map((v,i)=><div key={i} style={{fontSize:"9pt",padding:"2px 0",opacity:0.9}}>• {v}</div>)}</>}
        {lg.length>0&&<><LH>Languages</LH>{lg.map((v,i)=><div key={i} style={{fontSize:"9pt",padding:"2px 0",opacity:0.9}}>• {v}</div>)}</>}
      </div>
      <div style={{flex:1,padding:"36px 28px"}}>
        {d.about&&<><RH>About Me</RH><div style={{lineHeight:1.65,color:"#334155"}}>{d.about}</div></>}
        {ed.length>0&&<><RH>Education</RH>{ed.map((e,i)=>(<div key={i} style={{marginBottom:"8px"}}><div style={{fontWeight:700}}>{e.degree}</div><div style={{color:"#475569"}}>{e.institution}</div><div style={{color:"#64748b",fontSize:"9.5pt"}}>{[e.year,e.grade].filter(Boolean).join("  |  ")}</div></div>))}</>}
        {ex.length>0&&<><RH>Internship / Experience</RH>{ex.map((e,i)=>(<div key={i} style={{marginBottom:"10px"}}><div style={{fontWeight:700}}>{e.title}</div><div style={{color:TEAL,fontWeight:600}}>{[e.company,e.duration].filter(Boolean).join("  ·  ")}</div>{(e.bullets||"").split("\n").filter(Boolean).map((b,j)=><Bullet key={j} text={b} style={{fontSize:"9.5pt"}}/>)}</div>))}</>}
        {pr.length>0&&<><RH>Projects</RH>{pr.map((p,i)=>(<div key={i} style={{marginBottom:"8px"}}><div style={{fontWeight:700}}>{p.name}{p.tech&&<span style={{fontWeight:400,color:TEAL,fontSize:"9.5pt"}}> · {p.tech}</span>}</div>{p.description&&<div style={{fontSize:"9.5pt",color:"#334155"}}>{p.description}</div>}</div>))}</>}
        {ce.length>0&&<><RH>Certifications</RH>{ce.map((c,i)=>(<div key={i} style={{marginBottom:"6px"}}><div style={{fontWeight:700}}>{c.name}</div>{c.issuer&&<div style={{color:TEAL,fontSize:"9.5pt"}}>{c.issuer}</div>}{c.description&&<div style={{fontSize:"9.5pt"}}>{c.description}</div>}</div>))}</>}
        {ac.length>0&&<><RH>Activities</RH>{ac.map((a,i)=><Bullet key={i} text={a} style={{fontSize:"9.5pt"}}/>)}</>}
      </div>
    </div>
  );
}

function CanvasTemplate({data:d}){
  const PU="#7c3aed",PL="#f5f3ff";
  const H=({children})=>(<div style={{fontSize:"10pt",fontWeight:700,color:PU,textTransform:"uppercase",letterSpacing:"1.5px",display:"flex",alignItems:"center",gap:"8px",marginTop:"16px",marginBottom:"7px"}}><span style={{display:"inline-block",width:"22px",height:"2px",background:PU}}/>{children}<span style={{flex:1,height:"1px",background:"#e9d5ff"}}/></div>);
  const ed=(d.education||[]).filter(e=>e.degree||e.institution);
  const ex=(d.experience||[]).filter(e=>e.title||e.company);
  const pr=(d.projects||[]).filter(p=>p.name||p.description);
  const ce=(d.certifications||[]).filter(c=>c.name);
  const ac=(d.activities||"").split("\n").filter(Boolean);
  const ts=(d.technical_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const ss=(d.soft_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const Chip=({v,dark})=>(<span style={{display:"inline-block",background:dark?PU:PL,color:dark?"#fff":PU,borderRadius:"999px",padding:"3px 10px",fontSize:"9pt",margin:"2px 3px 2px 0",fontWeight:dark?600:400}}>{v}</span>);
  return(
    <div style={{fontFamily:"Calibri,Arial,sans-serif",fontSize:"10.5pt",color:"#1e1b4b",background:"#fff",width:`${A4_W}px`,minHeight:`${A4_H}px`,boxSizing:"border-box",lineHeight:1.55}}>
      <div style={{background:PL,padding:"32px 52px 22px",borderBottom:`3px solid ${PU}`}}>
        <div style={{fontSize:"24pt",fontWeight:700,color:PU,letterSpacing:"1px",lineHeight:1}}>{d.name||"YOUR NAME"}</div>
        {d.title&&<div style={{fontSize:"11pt",color:"#4c1d95",fontWeight:600,marginTop:"4px"}}>{d.title}</div>}
        <div style={{fontSize:"9.5pt",color:"#6b21a8",marginTop:"8px",display:"flex",flexWrap:"wrap",gap:"14px"}}>{[d.phone,d.email,d.address,d.linkedin,d.github].filter(Boolean).map((v,i)=><span key={i}>{v}</span>)}</div>
      </div>
      <div style={{padding:"6px 52px 52px"}}>
        {d.about&&<><H>Summary</H><div style={{lineHeight:1.65,color:"#312e81"}}>{d.about}</div></>}
        {ed.length>0&&<><H>Education</H>{ed.map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><div><div style={{fontWeight:700,color:"#1e1b4b"}}>{e.degree}</div><div style={{color:"#4c1d95"}}>{e.institution}</div>{e.grade&&<div style={{color:"#7c3aed",fontSize:"9.5pt"}}>{e.grade}</div>}</div><div style={{color:"#7c3aed",fontSize:"9.5pt",flexShrink:0,marginLeft:"16px",textAlign:"right"}}>{e.year}</div></div>))}</>}
        {ex.length>0&&<><H>Experience</H>{ex.map((e,i)=>(<div key={i} style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:700}}>{e.title}</div><div style={{color:"#7c3aed",fontSize:"9.5pt",flexShrink:0,marginLeft:"12px"}}>{e.duration}</div></div>{e.company&&<div style={{color:PU,fontWeight:600,fontSize:"10pt"}}>{e.company}</div>}{(e.bullets||"").split("\n").filter(Boolean).map((b,j)=><Bullet key={j} text={b} style={{color:"#312e81",fontSize:"10pt"}}/>)}</div>))}</>}
        {pr.length>0&&<><H>Projects</H>{pr.map((p,i)=>(<div key={i} style={{marginBottom:"8px"}}><div style={{fontWeight:700}}>{p.name}</div>{p.tech&&<div style={{marginBottom:"2px"}}>{p.tech.split(",").map((t,idx)=><Chip key={idx} v={t.trim()} dark/>)}</div>}{p.description&&<div style={{color:"#312e81",fontSize:"10pt"}}>{p.description}</div>}</div>))}</>}
        {(ts.length>0||ss.length>0)&&<><H>Skills</H>
          {ts.length>0&&<div style={{marginBottom:"6px"}}><span style={{fontSize:"9.5pt",color:"#4c1d95",fontWeight:700}}>Tools: </span>{ts.map((v,i)=><Chip key={i} v={v}/>)}</div>}
          {ss.length>0&&<div style={{marginBottom:"4px"}}><span style={{fontSize:"9.5pt",color:"#4c1d95",fontWeight:700}}>Professional: </span>{ss.map((v,i)=><Chip key={i} v={v}/>)}</div>}
          {d.languages&&<div style={{fontSize:"9.5pt"}}><span style={{fontWeight:700,color:"#4c1d95"}}>Languages: </span>{d.languages}</div>}
        </>}
        {ce.length>0&&<><H>Certifications</H>{ce.map((c,i)=>(<div key={i} style={{marginBottom:"6px"}}><div style={{fontWeight:700}}>{c.name}</div>{c.issuer&&<div style={{color:PU,fontSize:"9.5pt"}}>{c.issuer}</div>}{c.description&&<div style={{fontSize:"9.5pt",color:"#312e81"}}>{c.description}</div>}</div>))}</>}
        {ac.length>0&&<><H>Activities</H>{ac.map((a,i)=><Bullet key={i} text={a} style={{color:"#312e81",fontSize:"10pt"}}/>)}</>}
      </div>
    </div>
  );
}

function ResumeRenderer({data,templateId}){
  switch(templateId){
    case"apex":    return <ApexTemplate data={data}/>;
    case"horizon": return <HorizonTemplate data={data}/>;
    case"vault":   return <VaultTemplate data={data}/>;
    case"prism":   return <PrismTemplate data={data}/>;
    case"canvas":  return <CanvasTemplate data={data}/>;
    default:       return <HorizonTemplate data={data}/>;
  }
}

// ── WORD DOC BUILDER ─────────────────────────────────────────
function buildWordDoc(data,templateId){
  const d=data;
  const t=TEMPLATES.find(t=>t.id===templateId)||TEMPLATES[1];
  const AC=t.accent;
  const A4CSS=`@page WordSection1{size:595.3pt 841.9pt;margin:1.8cm} div.WordSection1{page:WordSection1} body{margin:0;font-family:Calibri,Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#111} p{margin:2px 0} table{width:100%;border-collapse:collapse} td{vertical-align:top;border:none}`;
  const NS=`xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'`;
  const wrap=b=>`<!DOCTYPE html><html ${NS}><head><meta charset="UTF-8"><style>${A4CSS}</style></head><body><div class="WordSection1">${b}</div></body></html>`;
  const H=(label,color=AC)=>`<div style="font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${color};border-bottom:2px solid ${color};padding-bottom:2px;margin:14px 0 6px">${esc(label)}</div>`;
  const Sub=t=>`<div style="font-weight:bold">${esc(t)}</div>`;
  const Blt=t=>`<p style="padding-left:12px">• ${esc(t)}</p>`;
  const Ln=(t,s="")=>`<p${s?` style="${s}"`:""}>${esc(t)}</p>`;
  const ed=(d.education||[]).filter(e=>e.degree||e.institution);
  const ex=(d.experience||[]).filter(e=>e.title||e.company);
  const pr=(d.projects||[]).filter(p=>p.name||p.description);
  const ce=(d.certifications||[]).filter(c=>c.name);
  const ac=(d.activities||"").split("\n").filter(Boolean);
  const ts=(d.technical_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const ss=(d.soft_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const lg=(d.languages||"").split(",").map(s=>s.trim()).filter(Boolean);
  const header=`<div style="margin-bottom:8px"><div style="font-size:22pt;font-weight:bold;color:${AC}">${esc(d.name||"")}</div>${d.title?`<div style="font-size:10.5pt;font-style:italic">${esc(d.title)}</div>`:""}<p style="color:#555;font-size:9.5pt">${[d.phone,d.email,d.address,d.linkedin,d.github].filter(Boolean).map(esc).join("   ·   ")}</p></div>`;
  const aboutH=d.about?H("Summary")+Ln(d.about):"";
  const edH=ed.length?H("Education")+ed.map(e=>Sub(e.degree)+Ln(e.institution)+Ln([e.year,e.grade].filter(Boolean).join("  ·  "),"color:#555")).join(""):"";
  const exH=ex.length?H("Experience")+ex.map(e=>Sub(e.title)+(e.company?Ln([e.company,e.duration].filter(Boolean).join("  ·  "),"color:"+AC):"")+(e.bullets||"").split("\n").filter(Boolean).map(Blt).join("")).join(""):"";
  const prH=pr.length?H("Projects")+pr.map(p=>Sub(p.name)+(p.tech?Ln(p.tech,"color:"+AC):"")+(p.description?Ln(p.description):"")).join(""):"";
  const skH=(ts.length||ss.length||lg.length)?H("Skills")+(ts.length?Ln("<b>Technical:</b> "+ts.map(esc).join(", ")):"")+(ss.length?Ln("<b>Professional:</b> "+ss.map(esc).join(", ")):"")+(lg.length?Ln("<b>Languages:</b> "+lg.map(esc).join(", ")):""):"";
  const ceH=ce.length?H("Certifications")+ce.map(c=>Sub(c.name)+(c.issuer?Ln(c.issuer,"color:"+AC):"")+(c.description?Ln(c.description):"")).join(""):"";
  const acH=ac.length?H("Activities")+ac.map(Blt).join(""):"";
  if(templateId==="vault"||templateId==="prism"){
    const leftH=H("Technical Skills","#fff")+ts.map(v=>`<p style="font-size:9.5pt">• ${esc(v)}</p>`).join("")+H("Soft Skills","#fff")+ss.map(v=>`<p style="font-size:9.5pt">• ${esc(v)}</p>`).join("")+(lg.length?H("Languages","#fff")+lg.map(v=>`<p style="font-size:9.5pt">• ${esc(v)}</p>`).join(""):"")+(ac.length?H("Activities","#fff")+ac.map(v=>`<p style="font-size:9.5pt">${esc(v)}</p>`).join(""):"");
    const rightH=aboutH+edH+exH+prH+ceH;
    const bg=templateId==="vault"?"background:#0a2463;color:white;padding:20px 36px;":"background:#0d7377;color:white;padding:20px 30px;";
    return wrap(`<div style="${bg}"><div style="font-size:20pt;font-weight:bold">${esc(d.name||"")}</div>${d.title?`<div style="font-size:10pt;opacity:0.8">${esc(d.title)}</div>`:""}<p style="font-size:9pt;opacity:0.7">${[d.phone,d.email,d.address].filter(Boolean).map(esc).join("  ·  ")}</p></div><table><tr><td style="width:30%;background:${templateId==="vault"?"#e8edf7":"#e0f5f5"};padding:12px">${leftH}</td><td style="padding:12px 18px">${rightH}</td></tr></table>`);
  }
  return wrap(header+aboutH+edH+exH+prH+skH+ceH+acH);
}

function triggerDownload(data,templateId){
  const html=buildWordDoc(data,templateId);
  const blob=new Blob(["\uFEFF"+html],{type:"application/msword;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`${(data.name||"Resume").replace(/\s+/g,"_")}_Resume.doc`;
  a.style.display="none";document.body.appendChild(a);a.click();
  setTimeout(()=>{try{document.body.removeChild(a)}catch{};URL.revokeObjectURL(url);},4000);
}

// ── FORM COMPONENTS ───────────────────────────────────────────
const iSty={width:"100%",border:"1px solid #e2e8f0",borderRadius:"7px",padding:"8px 11px",fontSize:"12.5px",outline:"none",background:"white",fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.5};
function Field({label,value,onChange,type="text",rows,placeholder,hint}){
  return(
    <div>
      <label style={{display:"block",fontSize:"10px",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:"4px"}}>{label}</label>
      {rows?<textarea value={value||""} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder||""} style={{...iSty,resize:"vertical"}}/>:<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={iSty}/>}
      {hint&&<p style={{fontSize:"10px",color:"#94a3b8",margin:"3px 0 0"}}>{hint}</p>}
    </div>
  );
}

function ScoreRing({score,label,lowerIsBetter}){
  const sz=76,r=(sz-12)/2,circ=2*Math.PI*r;
  const color=lowerIsBetter?score<=30?"#16a34a":score<=60?"#f59e0b":"#ef4444":score>=75?"#16a34a":score>=50?"#f59e0b":"#ef4444";
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
      <div style={{position:"relative",width:sz,height:sz}}>
        <svg width={sz} height={sz} style={{transform:"rotate(-90deg)"}}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7}/>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={7} strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:"17px",fontWeight:800,color,lineHeight:1}}>{score}</span>
          <span style={{fontSize:"8px",color:"#9ca3af"}}>/100</span>
        </div>
      </div>
      <span style={{fontSize:"9px",fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</span>
    </div>
  );
}

function TemplateCard({tmpl,selected,onSelect,previewData}){
  const AC=tmpl.accent;
  const renderData=previewData?.name?.trim()?previewData:DEMO;
  return(
    <div onClick={onSelect} style={{cursor:"pointer",borderRadius:"12px",border:`2px solid ${selected?AC:"#e2e8f0"}`,background:selected?"#fafafa":"white",overflow:"hidden",transition:"all 0.15s",boxShadow:selected?`0 0 0 3px ${AC}22`:"none"}}>
      <div style={{height:"170px",background:"#f1f5f9",overflow:"hidden",position:"relative"}}>
        <div style={{width:`${A4_W}px`,transformOrigin:"top left",transform:`scale(${SCALE_CARD})`,pointerEvents:"none"}}>
          <ResumeRenderer data={renderData} templateId={tmpl.id}/>
        </div>
        {selected&&<div style={{position:"absolute",top:"8px",right:"8px",width:"22px",height:"22px",borderRadius:"50%",background:AC,display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle size={13} color="#fff"/></div>}
      </div>
      <div style={{padding:"10px 12px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"3px"}}>
          <span style={{fontWeight:700,fontSize:"13px",color:"#0f172a"}}>{tmpl.name}</span>
          <span style={{fontSize:"9px",background:`${AC}15`,color:AC,padding:"2px 7px",borderRadius:"999px",fontWeight:600}}>{tmpl.tag}</span>
        </div>
        <p style={{fontSize:"11px",color:"#64748b",margin:0,lineHeight:1.4}}>{tmpl.desc}</p>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function ResumeBuilder(){
  const [phase,setPhase]=useState("upload");
  const [data,setData]=useState({...EMPTY,education:[{degree:"",institution:"",year:"",grade:""}],experience:[{title:"",company:"",duration:"",bullets:""}],projects:[{name:"",tech:"",description:""}],certifications:[{name:"",issuer:"",description:""}]});
  const [templateId,setTemplateId]=useState("horizon");
  const [analysis,setAnalysis]=useState(null);
  const [logs,setLogs]=useState([]);
  const [fileName,setFileName]=useState(null);
  const [uploading,setUploading]=useState(false);
  const [downloaded,setDownloaded]=useState(false);
  const [err,setErr]=useState(null);
  const [activeTab,setActiveTab]=useState("edit");

  const upd=(k,v)=>setData(d=>({...d,[k]:v}));
  const addEntry=(k,tmpl)=>setData(d=>({...d,[k]:[...(d[k]||[]),{...tmpl}]}));
  const removeEntry=(k,i)=>setData(d=>({...d,[k]:d[k].filter((_,j)=>j!==i)}));
  const updEntry=(k,i,f,v)=>setData(d=>({...d,[k]:d[k].map((e,j)=>j===i?{...e,[f]:v}:e)}));

  function goHome(){
    setPhase("upload");setData({...EMPTY,education:[{degree:"",institution:"",year:"",grade:""}],experience:[{title:"",company:"",duration:"",bullets:""}],projects:[{name:"",tech:"",description:""}],certifications:[{name:"",issuer:"",description:""}]});
    setTemplateId("horizon");setAnalysis(null);setLogs([]);setFileName(null);setUploading(false);setDownloaded(false);setErr(null);setActiveTab("edit");
  }

  async function handleUpload(e){
    const file=e.target.files?.[0];
    if(!file)return;
    setUploading(true);setFileName(file.name);setErr(null);setLogs([]);
    setLogs(["📎 Reading: "+file.name]);
    try{
      if(file.name.match(/\.(docx|doc)$/i)){
        const{data:extracted,logs:el}=await parseDocx(file);
        setLogs(el);setData(extracted);
      } else if(file.type.startsWith("image/")){
        setLogs(["🖼️ Image detected — please fill in your details below"]);
      } else throw new Error("Upload a .docx/.doc file");
    }catch(ex){setLogs([`⚠️ ${ex.message}`]);setErr(ex.message);}
    finally{setUploading(false);setTimeout(()=>setPhase("pick"),600);}
  }

  async function handleAnalyze(){
    setPhase("analyzing");setLogs([]);setAnalysis(null);setDownloaded(false);setErr(null);
    try{
      setLogs(["🤖 Sending to Grok AI...","🔬 Scanning for generic boilerplate...","🎯 Scoring ATS keyword density..."]);
      const result=await agentAnalyze(data);
      setAnalysis(result);
      setLogs(prev=>[...prev,"──────────────────────",`📊 Plag: ${result.plagScore}/100 → ${result.plagVerdict}${result.plagScore>60?" ⛔ BLOCKED":""}`,`🎯 ATS: ${result.atsScore}/100`,`🏁 Verdict: ${result.verdict}`]);
      setPhase("fill");setActiveTab("analysis");
    }catch(ex){setErr(ex.message);setPhase("fill");}
  }

  function handleDownload(){
    if(analysis?.plagScore>60)return;
    triggerDownload(data,templateId);setDownloaded(true);
  }

  const plagBlocked=!!(analysis?.plagScore>60);
  const selectedTmpl=TEMPLATES.find(t=>t.id===templateId)||TEMPLATES[1];
  const tAccent=selectedTmpl.accent;

  // UPLOAD PHASE
  if(phase==="upload") return(
    <div style={{minHeight:"100vh",background:"#070d1a",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:"520px",width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:"22px"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#0e1e36",border:"1px solid #1e3a5f",borderRadius:"999px",padding:"5px 14px",marginBottom:"14px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/>
            <span style={{color:"#64748b",fontSize:"10px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase"}}>5 MNC-grade templates · Powered by Grok AI</span>
          </div>
          <h1 style={{fontSize:"26px",fontWeight:800,color:"#f1f5f9",margin:"0 0 8px",lineHeight:1.2}}>Upload Your Resume<br/><span style={{color:"#38bdf8"}}>Pick a Template · Download</span></h1>
          <p style={{color:"#475569",fontSize:"12.5px",margin:0}}>Upload any .docx resume — your data is extracted and shown inside each template. Pick, edit, download.</p>
        </div>
        <div style={{background:"#0e1e36",borderRadius:"16px",padding:"20px",border:"1px solid #1e293b"}}>
          <label style={{display:"block",cursor:uploading?"default":"pointer"}}>
            <input type="file" accept=".docx,.doc" onChange={handleUpload} style={{display:"none"}} disabled={uploading}/>
            <div style={{border:`2px dashed ${uploading?"#1e293b":"#38bdf8"}`,borderRadius:"10px",padding:"24px 20px",textAlign:"center",background:"#070d1a"}}>
              {uploading?(
                <div>
                  <div style={{width:"26px",height:"26px",border:"3px solid #38bdf8",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 10px"}}/>
                  <div style={{background:"#04080f",borderRadius:"7px",padding:"10px 12px",textAlign:"left"}}>
                    {logs.map((l,i)=><div key={i} style={{color:i===logs.length-1?"#38bdf8":"#334155",fontSize:"11px",fontFamily:"monospace",padding:"2px 0"}}>{l}</div>)}
                  </div>
                </div>
              ):(
                <>
                  <Upload size={24} color="#38bdf8" style={{margin:"0 auto 9px",display:"block"}}/>
                  <p style={{fontWeight:700,fontSize:"13px",color:"#f1f5f9",margin:"0 0 3px"}}>Drop your .docx resume here</p>
                  <p style={{color:"#475569",fontSize:"11px",margin:"0 0 10px"}}>Your data extracts automatically and previews in all 5 templates</p>
                  <div style={{display:"flex",justifyContent:"center",gap:"6px",flexWrap:"wrap"}}>
                    {["📋 Name & Contact","🎓 Education","💼 Experience","⚡ Skills","🗂️ Projects"].map(f=><span key={f} style={{fontSize:"9.5px",background:"#0e1e36",color:"#38bdf8",border:"1px solid #1e3a5f",padding:"2px 8px",borderRadius:"999px"}}>{f}</span>)}
                  </div>
                </>
              )}
            </div>
          </label>
          {err&&<div style={{marginTop:"10px",background:"#1c0a0a",border:"1px solid #7f1d1d",borderRadius:"7px",padding:"7px 12px",color:"#fca5a5",fontSize:"11px",display:"flex",gap:"6px"}}><AlertTriangle size={12} style={{flexShrink:0,marginTop:"1px"}}/>{err}</div>}
          <div style={{margin:"14px 0",display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{flex:1,height:"1px",background:"#1e293b"}}/>
            <span style={{color:"#334155",fontSize:"11px"}}>or start without a resume</span>
            <div style={{flex:1,height:"1px",background:"#1e293b"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <button onClick={()=>setPhase("pick")} style={{background:"#0e1e36",color:"#94a3b8",border:"1px solid #1e293b",borderRadius:"9px",padding:"10px",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>✏️ Start from scratch</button>
            <button onClick={()=>{setData(DEMO);setPhase("pick");}} style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"white",border:"none",borderRadius:"9px",padding:"10px",fontSize:"12px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><Sparkles size={12}/>Load demo</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // TEMPLATE PICKER PHASE
  if(phase==="pick") return(
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"#070d1a",borderBottom:"1px solid #1e293b",padding:"0 24px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:"50px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <button onClick={goHome} style={{display:"flex",alignItems:"center",gap:"5px",background:"#1e3a5f",border:"1px solid #38bdf8",color:"#38bdf8",borderRadius:"7px",padding:"5px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}><Home size={12}/>← Home</button>
            <span style={{color:"#f1f5f9",fontWeight:700,fontSize:"13px"}}>Choose Your Template</span>
            {fileName&&<span style={{fontSize:"9px",background:"#0f2d1a",color:"#22c55e",border:"1px solid #166534",padding:"2px 7px",borderRadius:"99px"}}>📎 {fileName}</span>}
          </div>
          <button onClick={()=>setPhase("fill")} style={{display:"flex",alignItems:"center",gap:"6px",background:"#38bdf8",color:"#070d1a",border:"none",borderRadius:"7px",padding:"7px 16px",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>Use {selectedTmpl.name} <ChevronRight size={14}/></button>
        </div>
      </div>
      <div style={{maxWidth:"1100px",margin:"0 auto",padding:"28px 24px"}}>
        <p style={{textAlign:"center",color:"#64748b",fontSize:"13px",marginBottom:"24px",marginTop:0}}>
          {data.name?.trim()?<><span style={{color:"#16a34a",fontWeight:700}}>✓ Your data is loaded</span> — previews show your actual resume in each template.</>:"All templates are ATS-friendly. Previews use sample data."}
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"14px"}}>
          {TEMPLATES.map(tmpl=><TemplateCard key={tmpl.id} tmpl={tmpl} selected={templateId===tmpl.id} onSelect={()=>setTemplateId(tmpl.id)} previewData={data}/>)}
        </div>
        <div style={{marginTop:"24px",textAlign:"center"}}>
          <button onClick={()=>setPhase("fill")} style={{background:selectedTmpl.accent,color:"#fff",border:"none",borderRadius:"10px",padding:"12px 32px",fontSize:"14px",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"8px"}}>Continue with {selectedTmpl.name} <ChevronRight size={16}/></button>
        </div>
      </div>
    </div>
  );

  // ANALYZING PHASE
  if(phase==="analyzing") return(
    <div style={{minHeight:"100vh",background:"#070d1a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:"440px",width:"100%",padding:"20px"}}>
        <div style={{background:"#0e1e36",borderRadius:"16px",padding:"28px",border:"1px solid #1e293b"}}>
          <div style={{textAlign:"center",marginBottom:"16px"}}>
            <div style={{width:"42px",height:"42px",border:"4px solid #38bdf8",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .9s linear infinite",margin:"0 auto 12px"}}/>
            <div style={{color:"#f1f5f9",fontSize:"15px",fontWeight:700}}>Analyzing with Grok AI</div>
            <div style={{color:"#475569",fontSize:"11px"}}>~10 seconds</div>
          </div>
          <div style={{background:"#04080f",borderRadius:"8px",padding:"10px 12px",fontFamily:"monospace",fontSize:"11px",minHeight:"80px"}}>
            {logs.map((l,i)=><div key={i} style={{color:i===logs.length-1?"#38bdf8":"#334155",padding:"2px 0"}}>{l}</div>)}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // FILL PHASE
  return(
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"#070d1a",borderBottom:"1px solid #1e293b",padding:"0 18px",position:"sticky",top:0,zIndex:99}}>
        <div style={{maxWidth:"1340px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:"50px",gap:"10px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
            <button onClick={goHome} style={{display:"flex",alignItems:"center",gap:"5px",background:"#1e3a5f",border:"1px solid #38bdf8",color:"#38bdf8",borderRadius:"7px",padding:"5px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}><Home size={12}/>← Home</button>
            <span style={{fontWeight:800,fontSize:"13px",color:"#f1f5f9"}}>Resume Builder</span>
            <button onClick={()=>setPhase("pick")} style={{display:"flex",alignItems:"center",gap:"5px",background:"#0e1e36",border:`1px solid ${tAccent}`,color:tAccent,borderRadius:"7px",padding:"4px 10px",fontSize:"11px",fontWeight:600,cursor:"pointer"}}>
              <span style={{width:"7px",height:"7px",borderRadius:"50%",background:tAccent}}/>{selectedTmpl.name} · Change
            </button>
            {fileName&&<span style={{fontSize:"9px",background:"#0f2d1a",color:"#22c55e",border:"1px solid #166534",padding:"2px 7px",borderRadius:"99px"}}>📎 {fileName}</span>}
          </div>
          <div style={{display:"flex",background:"#0e1e36",borderRadius:"8px",padding:"3px",gap:"2px"}}>
            {[["edit",<Edit3 size={11}/>,"Edit"],["preview",<Eye size={11}/>,"Preview"],["analysis",<Sparkles size={11}/>,"Analysis"]].map(([t,ic,lb])=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 12px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:600,background:activeTab===t?"#38bdf8":"transparent",color:activeTab===t?"#070d1a":"#64748b"}}>
                {ic}{lb}{t==="analysis"&&analysis&&<span style={{width:"6px",height:"6px",borderRadius:"50%",background:analysis.atsScore>=75?"#22c55e":analysis.atsScore>=50?"#f59e0b":"#ef4444",marginLeft:"2px"}}/>}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:"6px",alignItems:"center",flexShrink:0}}>
            {analysis&&<>
              <span style={{fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"5px",background:analysis.atsScore>=75?"#052e16":analysis.atsScore>=50?"#431407":"#3b0000",color:analysis.atsScore>=75?"#22c55e":analysis.atsScore>=50?"#fb923c":"#f87171",border:`1px solid ${analysis.atsScore>=75?"#166534":analysis.atsScore>=50?"#9a3412":"#7f1d1d"}`}}>ATS {analysis.atsScore}</span>
              <span style={{fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"5px",background:analysis.plagScore<=30?"#052e16":analysis.plagScore<=60?"#431407":"#3b0000",color:analysis.plagScore<=30?"#22c55e":analysis.plagScore<=60?"#fb923c":"#f87171",border:`1px solid ${analysis.plagScore<=30?"#166534":analysis.plagScore<=60?"#9a3412":"#7f1d1d"}`}}>{analysis.plagScore>60?"⛔ ":""}Plag {analysis.plagScore}</span>
            </>}
            {data.name?.trim()&&<button onClick={handleDownload} disabled={plagBlocked} style={{display:"flex",alignItems:"center",gap:"5px",background:plagBlocked?"#3b0000":downloaded?"#052e16":"#16a34a",color:plagBlocked?"#f87171":downloaded?"#22c55e":"white",border:"none",borderRadius:"7px",padding:"6px 12px",fontSize:"11px",fontWeight:700,cursor:plagBlocked?"not-allowed":"pointer"}}>
              {plagBlocked?<><AlertTriangle size={12}/>Blocked</>:downloaded?<><CheckCircle size={12}/>Downloaded</>:<><Download size={12}/>Download .doc</>}
            </button>}
            <button onClick={handleAnalyze} disabled={!data.name?.trim()} style={{display:"flex",alignItems:"center",gap:"5px",background:data.name?.trim()?"#38bdf8":"#1e293b",color:data.name?.trim()?"#070d1a":"#475569",border:"none",borderRadius:"7px",padding:"6px 12px",fontSize:"11px",fontWeight:700,cursor:data.name?.trim()?"pointer":"not-allowed"}}>
              <Sparkles size={12}/>{analysis?"Re-analyze":"Check ATS"}
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:"1340px",margin:"0 auto",padding:"14px 18px",display:"grid",gridTemplateColumns:`1fr ${PREV_W+28}px`,gap:"14px",alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

          {activeTab==="edit"&&<>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>👤 Personal Info</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>
                <div style={{gridColumn:"1/-1"}}><Field label="Full Name *" value={data.name} onChange={v=>upd("name",v)} placeholder="As it should appear on the resume"/></div>
                <div style={{gridColumn:"1/-1"}}><Field label="Professional Title / Role" value={data.title} onChange={v=>upd("title",v)} placeholder="B.Com Graduate · Banking Professional · Software Engineer"/></div>
                <Field label="Phone" value={data.phone} onChange={v=>upd("phone",v)} placeholder="+91 9876543210"/>
                <Field label="Email" value={data.email} onChange={v=>upd("email",v)} type="email" placeholder="you@email.com"/>
                <div style={{gridColumn:"1/-1"}}><Field label="City / Address" value={data.address} onChange={v=>upd("address",v)} placeholder="Chennai, Tamil Nadu"/></div>
                <Field label="LinkedIn" value={data.linkedin} onChange={v=>upd("linkedin",v)} placeholder="linkedin.com/in/yourname"/>
                <Field label="GitHub / Portfolio" value={data.github} onChange={v=>upd("github",v)} placeholder="github.com/yourname"/>
              </div>
            </div>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>📝 About / Summary</h3>
              <Field label="Career Summary" value={data.about} onChange={v=>upd("about",v)} rows={4} placeholder="2–3 sentences: who you are, what you bring, what you want." hint="HR spends 6 seconds on this. Be specific."/>
            </div>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>🎓 Education</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {data.education.map((e,i)=>(
                  <div key={i} style={{background:"#f8fafc",borderRadius:"8px",padding:"12px",border:"1px solid #e2e8f0",position:"relative"}}>
                    {data.education.length>1&&<button onClick={()=>removeEntry("education",i)} style={{position:"absolute",top:"8px",right:"8px",background:"none",border:"none",cursor:"pointer",color:"#ef4444"}}><Trash2 size={13}/></button>}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                      <div style={{gridColumn:"1/-1"}}><Field label="Degree / Course" value={e.degree} onChange={v=>updEntry("education",i,"degree",v)} placeholder="B.Com General · B.Tech CSE"/></div>
                      <div style={{gridColumn:"1/-1"}}><Field label="College / University" value={e.institution} onChange={v=>updEntry("education",i,"institution",v)} placeholder="S.I.V.E.T College, University of Madras"/></div>
                      <Field label="Year / Duration" value={e.year} onChange={v=>updEntry("education",i,"year",v)} placeholder="2021–2024"/>
                      <Field label="Grade / CGPA / %" value={e.grade} onChange={v=>updEntry("education",i,"grade",v)} placeholder="CGPA: 8.5  or  78%"/>
                    </div>
                  </div>
                ))}
                <button onClick={()=>addEntry("education",{degree:"",institution:"",year:"",grade:""})} style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"1px dashed #cbd5e1",borderRadius:"7px",padding:"7px 14px",color:"#64748b",fontSize:"11px",cursor:"pointer"}}><Plus size={12}/>Add qualification</button>
              </div>
            </div>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>💼 Experience / Internship</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {data.experience.map((e,i)=>(
                  <div key={i} style={{background:"#f8fafc",borderRadius:"8px",padding:"12px",border:"1px solid #e2e8f0",position:"relative"}}>
                    {data.experience.length>1&&<button onClick={()=>removeEntry("experience",i)} style={{position:"absolute",top:"8px",right:"8px",background:"none",border:"none",cursor:"pointer",color:"#ef4444"}}><Trash2 size={13}/></button>}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                      <Field label="Job Title" value={e.title} onChange={v=>updEntry("experience",i,"title",v)} placeholder="Banking Operations Intern"/>
                      <Field label="Company" value={e.company} onChange={v=>updEntry("experience",i,"company",v)} placeholder="Suryoday Small Finance Bank"/>
                      <div style={{gridColumn:"1/-1"}}><Field label="Duration" value={e.duration} onChange={v=>updEntry("experience",i,"duration",v)} placeholder="May 2025 · 1 Month"/></div>
                      <div style={{gridColumn:"1/-1"}}><Field label="Responsibilities (one per line)" value={e.bullets} onChange={v=>updEntry("experience",i,"bullets",v)} rows={4} placeholder={"Assisted in KYC documentation\nSupported financial record processing"} hint="Start with action verb: Assisted · Developed · Managed"/></div>
                    </div>
                  </div>
                ))}
                <button onClick={()=>addEntry("experience",{title:"",company:"",duration:"",bullets:""})} style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"1px dashed #cbd5e1",borderRadius:"7px",padding:"7px 14px",color:"#64748b",fontSize:"11px",cursor:"pointer"}}><Plus size={12}/>Add role</button>
              </div>
            </div>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>⚡ Skills</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <Field label="Technical Skills / Tools" value={data.technical_skills} onChange={v=>upd("technical_skills",v)} rows={2} placeholder="MS Excel, Python, n8n, VS Code, Canva" hint="Comma-separated. Real tools only."/>
                <Field label="Soft Skills" value={data.soft_skills} onChange={v=>upd("soft_skills",v)} rows={2} placeholder="KYC Compliance, Financial Documentation, Customer Relations"/>
                <Field label="Languages" value={data.languages} onChange={v=>upd("languages",v)} placeholder="Tamil, English, Hindi"/>
              </div>
            </div>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>🗂️ Projects</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {data.projects.map((p,i)=>(
                  <div key={i} style={{background:"#f8fafc",borderRadius:"8px",padding:"12px",border:"1px solid #e2e8f0",position:"relative"}}>
                    {data.projects.length>1&&<button onClick={()=>removeEntry("projects",i)} style={{position:"absolute",top:"8px",right:"8px",background:"none",border:"none",cursor:"pointer",color:"#ef4444"}}><Trash2 size={13}/></button>}
                    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                      <Field label="Project Name" value={p.name} onChange={v=>updEntry("projects",i,"name",v)} placeholder="Project Karen"/>
                      <Field label="Tech / Tools" value={p.tech} onChange={v=>updEntry("projects",i,"tech",v)} placeholder="n8n, Claude API, Python"/>
                      <Field label="What you built" value={p.description} onChange={v=>updEntry("projects",i,"description",v)} rows={2} placeholder="Built an AI workflow to automate multi-step data collection"/>
                    </div>
                  </div>
                ))}
                <button onClick={()=>addEntry("projects",{name:"",tech:"",description:""})} style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"1px dashed #cbd5e1",borderRadius:"7px",padding:"7px 14px",color:"#64748b",fontSize:"11px",cursor:"pointer"}}><Plus size={12}/>Add project</button>
              </div>
            </div>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>🏆 Certifications</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {data.certifications.map((c,i)=>(
                  <div key={i} style={{background:"#f8fafc",borderRadius:"8px",padding:"12px",border:"1px solid #e2e8f0",position:"relative"}}>
                    {data.certifications.length>1&&<button onClick={()=>removeEntry("certifications",i)} style={{position:"absolute",top:"8px",right:"8px",background:"none",border:"none",cursor:"pointer",color:"#ef4444"}}><Trash2 size={13}/></button>}
                    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                      <Field label="Certificate Name" value={c.name} onChange={v=>updEntry("certifications",i,"name",v)} placeholder="AWS Cloud Practitioner"/>
                      <Field label="Issued by" value={c.issuer} onChange={v=>updEntry("certifications",i,"issuer",v)} placeholder="Amazon Web Services"/>
                      <Field label="What you learned" value={c.description} onChange={v=>updEntry("certifications",i,"description",v)} rows={2} placeholder="Cloud fundamentals, security, architecture basics"/>
                    </div>
                  </div>
                ))}
                <button onClick={()=>addEntry("certifications",{name:"",issuer:"",description:""})} style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"1px dashed #cbd5e1",borderRadius:"7px",padding:"7px 14px",color:"#64748b",fontSize:"11px",cursor:"pointer"}}><Plus size={12}/>Add certification</button>
              </div>
            </div>
            <div style={{background:"white",borderRadius:"10px",padding:"14px 16px",border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"11px",fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.8px"}}>🏅 Activities</h3>
              <Field label="One per line" value={data.activities} onChange={v=>upd("activities",v)} rows={4} placeholder={"Rotaract Club Member – 3 years\nClass Event Manager – Coordinated 4 events\nNSS Volunteer – 2022–2024"} hint="Role · Organisation · brief outcome"/>
            </div>
          </>}

          {activeTab==="preview"&&(
            <div style={{background:"white",borderRadius:"10px",padding:"14px",border:"1px solid #e2e8f0",display:"flex",justifyContent:"center"}}>
              <div style={{width:`${PREV_W}px`,height:`${PREV_H}px`,overflow:"hidden",background:"#e5e7eb",border:"1px solid #d1d5db"}}>
                <div style={{width:`${A4_W}px`,transformOrigin:"top left",transform:`scale(${SCALE_PREV})`}}>
                  <ResumeRenderer data={data} templateId={templateId}/>
                </div>
              </div>
            </div>
          )}

          {activeTab==="analysis"&&(
            <div style={{background:"white",borderRadius:"10px",padding:"16px",border:"1px solid #e2e8f0"}}>
              {!analysis?(
                <div style={{textAlign:"center",padding:"32px",color:"#94a3b8"}}>
                  <Sparkles size={28} style={{margin:"0 auto 10px",display:"block",opacity:0.3}}/>
                  <p style={{fontSize:"13px",margin:0}}>Click "Check ATS" to analyze with Grok AI</p>
                </div>
              ):<>
                {plagBlocked&&(
                  <div style={{background:"#fff1f1",border:"2px solid #f87171",borderRadius:"9px",padding:"12px",marginBottom:"14px"}}>
                    <div style={{fontWeight:800,color:"#dc2626",fontSize:"12px",marginBottom:"8px"}}>⛔ Download Blocked — Plag Score: {analysis.plagScore}/100</div>
                    {(analysis.plagPhrases||[]).map((ph,i)=>(
                      <div key={i} style={{background:"#fee2e2",borderRadius:"5px",padding:"5px 9px",marginBottom:"4px"}}>
                        <div style={{color:"#dc2626",fontWeight:700,fontSize:"10px"}}>❌ "{ph}"</div>
                        {analysis.plagFixes?.[i]&&<div style={{color:"#7f1d1d",fontSize:"10px",marginTop:"2px"}}>→ {analysis.plagFixes[i]}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-around",padding:"8px 0 14px",borderBottom:"1px solid #f1f5f9",marginBottom:"14px"}}>
                  <ScoreRing score={analysis.atsScore} label="ATS Score"/>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:"28px"}}>{analysis.verdict==="STRONG"?"🏆":analysis.verdict==="GOOD"?"✅":analysis.verdict==="NEEDS_WORK"?"⚠️":"❌"}</div>
                    <div style={{fontSize:"9px",fontWeight:800,color:"#0f172a",textTransform:"uppercase"}}>{(analysis.verdict||"").replace("_"," ")}</div>
                  </div>
                  <ScoreRing score={analysis.plagScore} label="Plag Score" lowerIsBetter/>
                </div>
                {analysis.atsTips?.length>0&&<div style={{marginBottom:"12px"}}>
                  <div style={{fontSize:"9px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:"#0f172a",marginBottom:"6px"}}>🎯 ATS Improvements</div>
                  {analysis.atsTips.map((t,i)=><div key={i} style={{fontSize:"11px",color:"#374151",padding:"5px 8px",background:"#f0fdf4",borderRadius:"5px",marginBottom:"4px",borderLeft:"3px solid #22c55e",lineHeight:1.4}}>{t}</div>)}
                </div>}
                {analysis.atsStrengths?.length>0&&<div style={{marginBottom:"12px"}}>
                  <div style={{fontSize:"9px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:"#0f172a",marginBottom:"6px"}}>✅ Strong Points</div>
                  {analysis.atsStrengths.map((s,i)=><div key={i} style={{fontSize:"11px",color:"#374151",padding:"5px 8px",background:"#f8fafc",borderRadius:"5px",marginBottom:"3px",borderLeft:"3px solid #38bdf8"}}>{s}</div>)}
                </div>}
                {!plagBlocked&&analysis.plagPhrases?.length>0&&<div>
                  <div style={{fontSize:"9px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:"#0f172a",marginBottom:"6px"}}>⚠️ Generic Phrases</div>
                  {analysis.plagPhrases.slice(0,3).map((ph,i)=>(
                    <div key={i} style={{background:"#fffbeb",borderRadius:"5px",padding:"5px 8px",marginBottom:"4px",borderLeft:"3px solid #f59e0b"}}>
                      <div style={{fontSize:"10px",color:"#92400e"}}>"{ph}"</div>
                      {analysis.plagFixes?.[i]&&<div style={{fontSize:"10px",color:"#78350f",marginTop:"1px"}}>→ {analysis.plagFixes[i]}</div>}
                    </div>
                  ))}
                </div>}
                <button onClick={handleDownload} disabled={plagBlocked} style={{marginTop:"14px",width:"100%",background:plagBlocked?"#fee2e2":downloaded?"#f0fdf4":"#2563eb",color:plagBlocked?"#dc2626":downloaded?"#16a34a":"white",border:downloaded?"1px solid #bbf7d0":"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:700,cursor:plagBlocked?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"7px"}}>
                  {plagBlocked?<><AlertTriangle size={14}/>Fix Plagiarism First</>:downloaded?<><CheckCircle size={14}/>Downloaded!</>:<><Download size={14}/>Download Resume (.doc)</>}
                </button>
              </>}
            </div>
          )}
        </div>

        <div style={{position:"sticky",top:"62px",display:"flex",flexDirection:"column",gap:"10px"}}>
          <div style={{background:"white",borderRadius:"12px",padding:"11px",border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
              <span style={{fontSize:"10px",fontWeight:700,color:"#0f172a"}}>A4 Preview <span style={{color:tAccent,marginLeft:"5px",fontSize:"9px"}}>· {selectedTmpl.name}</span></span>
              <button onClick={()=>setPhase("pick")} style={{fontSize:"9px",color:tAccent,background:`${tAccent}15`,border:`1px solid ${tAccent}30`,borderRadius:"5px",padding:"2px 7px",cursor:"pointer",fontWeight:600}}>Change</button>
            </div>
            <div style={{width:`${PREV_W}px`,height:`${PREV_H}px`,overflow:"hidden",background:"#e5e7eb",border:"1px solid #d1d5db",borderRadius:"2px"}}>
              <div style={{width:`${A4_W}px`,transformOrigin:"top left",transform:`scale(${SCALE_PREV})`}}>
                <ResumeRenderer data={data} templateId={templateId}/>
              </div>
            </div>
          </div>
          {data.name?.trim()&&<button onClick={handleDownload} disabled={plagBlocked} style={{width:"100%",background:plagBlocked?"#fee2e2":downloaded?"#f0fdf4":"#16a34a",color:plagBlocked?"#dc2626":downloaded?"#16a34a":"white",border:downloaded?"1px solid #bbf7d0":"none",borderRadius:"9px",padding:"11px",fontSize:"12px",fontWeight:700,cursor:plagBlocked?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"7px"}}>
            {plagBlocked?<><AlertTriangle size={14}/>Blocked</>:downloaded?<><CheckCircle size={14}/>Downloaded!</>:<><Download size={14}/>Download Resume (.doc)</>}
          </button>}
        </div>
      </div>
    </div>
  );
}

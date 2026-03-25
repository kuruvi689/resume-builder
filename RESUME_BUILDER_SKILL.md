---
name: resume-builder
description: "Use this skill when the user asks to create, update, fix, or format a resume. Triggers include: 'make a resume', 'create my CV', 'update my resume', 'fix my resume format', 'build a professional resume', or any request involving resume/CV creation or modification. Also triggers when users upload resume templates and ask to replicate the format or style."
license: Proprietary
---

# Resume Builder Skill

## Overview

This skill helps create professional, interview-ready resumes for students and professionals. It focuses on clean formatting, ATS-friendly layouts, and practical content that actually helps people get jobs.

## When to Use This Skill

**ALWAYS use this skill when:**
- User asks to create a resume or CV
- User uploads a resume template and asks to replicate it
- User requests resume formatting improvements
- User wants to update or fix their existing resume
- User needs help organizing resume content
- User asks "make it look professional" for a resume

**Example triggers:**
- "Can you make me a resume?"
- "Create a resume in this format [uploads template]"
- "Fix my resume, it looks messy"
- "I need a professional CV for interviews"
- "Make this resume fit on one page"

## Core Principles

### 1. Student-First Approach
Remember: You're helping struggling students who need resumes NOW, not teaching them design theory.

**What students actually need:**
- Real .docx file they can download and use immediately
- Professional look without them doing any work
- Content that makes them look hireable even with limited experience
- One-page format that fits everything

**What students DON'T need:**
- Explanations of design choices
- Multiple options to choose from
- Complicated instructions
- Fake previews that don't help

### 2. Just Build It Directly in Chat

**THE RIGHT WAY:**
```
User: "Make me a resume like this [uploads template]"
You: [Ask for their details in ONE message]
User: [Provides details]
You: [Create actual .docx file using Node.js + docx library]
User: [Downloads from Files section]
```

**THE WRONG WAY (Don't do this):**
```
User: "Make me a resume"
You: "I can build an app for that!"
[Creates web artifact that doesn't actually create .docx files]
User: "How do I download the .docx?"
You: "Uh... let me explain the limitations..."
```

**Key insight:** Web artifacts CAN'T create real .docx files with proper formatting. Always use your computer tools (bash_tool, create_file, Node.js with docx library) to create actual Word documents.

## Resume Formats & Templates

### Format 1: Clean One-Page (Sivanesh/Monesh Style)

**When to use:**
- Modern, tech-focused candidates
- When user wants "simple and professional"
- Default choice for most B.Com/BBA students

**Characteristics:**
- Single column layout
- Dark blue headers (#1A237E) with underlines
- Contact info in one line with pipes (|)
- Calibri or Arial font
- Skills separated by pipes
- Compact spacing to fit one page

**Code pattern:**
```javascript
const DARK_BLUE = "1A237E";

function sectionHeader(text) {
  return new Paragraph({
    children: [new TextRun({
      text, bold: true, size: 24, font: "Calibri",
      color: DARK_BLUE, allCaps: true
    })],
    spacing: { before: 200, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: DARK_BLUE }}
  });
}
```

### Format 2: Two-Column (Saranya/Rasika Style)

**When to use:**
- Traditional professional look
- Users who want clear skill sidebar
- Accounting/Finance focused roles

**Characteristics:**
- Left sidebar: Contact, Skills, Languages (30-35% width)
- Right column: Main content (65-70% width)
- Professional and structured
- Easy to scan

**Code pattern:**
```javascript
new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  columnWidths: [3500, 6500], // Left: 3500, Right: 6500 DXA
  borders: { /* all NONE */ },
  rows: [/* Two columns */]
})
```

### Format 3: Teal Header (Modern Look)

**When to use:**
- User wants something visually distinctive
- Creative or startup-focused roles
- When user specifically requests colorful design

**Characteristics:**
- Teal colored headers (#2E7D7D or similar)
- White text on colored background
- Two-column sections
- Modern and eye-catching

## Information Gathering Strategy

### Ask Everything ONCE

**Good approach:**
```
I need these details:

BASIC:
1. Name, Phone, Email, Address

EDUCATION:
2. Current course, college, year, percentage
3. HSC school, year, percentage
4. SSLC (optional)

EXPERIENCE:
5. Any internship/work? (Company, role, duration, what you did)

SKILLS:
6. Technical skills (MS Office, Tally, SQL, etc.)
7. Soft skills (Leadership, Communication, etc.)

CERTIFICATIONS:
8. Any certifications or workshops?

ADDITIONAL:
9. Languages, hobbies, DOB (optional)
10. Format preference? (A) Clean one-page (B) Two-column (C) Teal header
```

**Bad approach:**
Asking questions one by one over 15 messages. Students get tired and frustrated.

### Handle Missing Information

**If they don't have experience:**
- Mark as "Fresher"
- Add positive spin: "Seeking opportunities to apply academic knowledge..."

**If they don't have projects:**
- Skip the section, don't force it

**If percentages are low:**
- Include them honestly (never lie)
- Balance with strong skills and objective

**If they're unsure about format:**
- Default to Clean One-Page (Format 1)

## Content Writing Guidelines

### Career Objectives

**For Finance/Accounting roles:**
```
"Motivated B.Com student with strong foundation in accounting principles, 
data analysis, and business operations. Proficient in [tools]. Eager to apply 
academic knowledge in [role type]. Quick learner committed to accuracy, 
efficiency, and professional growth."
```

**For Banking roles:**
```
"Performance-driven B.Com student with practical internship experience in 
retail banking operations. Seeking a position as a Banking Professional to 
leverage hands-on expertise in KYC compliance, financial documentation, and 
customer relationship management."
```

**For Freshers with no experience:**
```
"Enthusiastic commerce graduate seeking entry-level opportunities to apply 
academic knowledge, develop practical skills, and contribute to organizational 
growth while building a solid professional foundation."
```

**Make it 3-4 lines, specific to their goals, action-oriented.**

### Experience/Internship Descriptions

**When they say "I don't know what I did there":**

For **Finance Intern:**
- Assisted in financial record-keeping and data entry operations
- Gained practical exposure to accounting procedures and invoice processing
- Learned fundamentals of business finance under professional supervision

For **Banking Intern:**
- Assisted in KYC documentation and verification processes
- Supported financial record processing and data management
- Gained hands-on experience in retail banking workflows

For **General Corporate Intern:**
- Gained hands-on experience in business operations and professional work environment
- Developed practical understanding of corporate culture and team collaboration

**Make it professional but honest. Never invent specific achievements.**

### Skills Organization

**Technical Skills:**
- List actual tools: MS Office, Tally, SQL, Python, etc.
- Be specific: "MS Excel (Advanced)" not just "Excel"
- Separate by pipes for clean format: "MS Office | Tally | SQL"

**Soft Skills:**
- Common ones: Leadership, Communication, Teamwork, Problem Solving, Time Management, Adaptability
- Make them relevant to the role
- Can include specific examples: "Leadership (Class Representative for 3 Years)"

## Technical Implementation

### Always Use Computer Tools

**CORRECT way to create .docx:**
```javascript
// 1. Install docx if needed
npm install -g docx

// 2. Create resume using docx library
const { Document, Packer, Paragraph, TextRun } = require('docx');
const doc = new Document({ /* resume content */ });

// 3. Save to outputs folder
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/Name_Resume.docx", buffer);
});

// 4. Validate
python /mnt/skills/public/docx/scripts/office/validate.py /mnt/user-data/outputs/Name_Resume.docx

// 5. Present to user
[Use present_files tool]
```

**WRONG way:**
- Creating HTML artifacts (can't download as .docx)
- Using API calls from artifacts (doesn't work properly)
- Creating text files instead of .docx
- Showing "previews" that aren't real

### Page Size & Margins

**Standard A4 settings:**
```javascript
page: {
  size: { 
    width: 12240,   // 8.5 inches
    height: 15840   // 11 inches
  },
  margin: { 
    top: 720,      // 0.5 inch (tight for one-page)
    right: 1080,   // 0.75 inch
    bottom: 720,   // 0.5 inch
    left: 1080     // 0.75 inch
  }
}
```

**To fill entire page (no empty space at bottom):**
- Increase font sizes slightly (22pt → 24pt for body)
- Increase section spacing (180 → 220)
- Reduce top/bottom margins (1080 → 720)
- Add more line spacing (line: 276 = 1.15 line height)

### Font Guidelines

**Professional fonts:**
- **Calibri**: Modern, clean (DEFAULT choice)
- **Arial**: Classic, safe
- **Times New Roman**: Traditional, formal
- **Georgia**: Elegant, readable

**Font sizes:**
- Name: 32-36pt (bold, colored)
- Section headers: 24-26pt (bold, colored, all caps)
- Body text: 22-24pt
- Contact info: 20pt

**NEVER use:**
- Comic Sans, Papyrus, or decorative fonts
- More than 2 different fonts in one resume

### Colors

**Professional color palette:**
- **Dark Blue**: #1A237E or #1F4788 (headers)
- **Teal**: #2E7D7D or #008B8B (modern look)
- **Gray**: #424242 or #666666 (contact info)
- **Black**: #000000 (body text)

**NEVER use:**
- Bright red, neon colors
- Rainbow effects
- Low contrast combinations

## Common Issues & Solutions

### Issue: Resume is too long (2+ pages)

**Solutions:**
1. Reduce margins (top/bottom to 0.5")
2. Decrease spacing between sections
3. Combine similar sections (Paper Presentations + Workshops → Academic Engagements)
4. Use pipe-separated lists instead of bullets
5. Remove less relevant content
6. Reduce font size slightly (24pt → 22pt)

### Issue: Resume has empty space at bottom

**Solutions:**
1. Increase font sizes
2. Increase spacing between sections
3. Add more content (languages, interests, hobbies)
4. Reduce bottom margin
5. Add line spacing (276 = 1.15x)

### Issue: User uploads template in image format

**Workflow:**
1. Analyze the image to identify style
2. Ask for all details
3. Recreate the style using docx library
4. Match colors, fonts, layout as closely as possible

### Issue: User wants to modify existing resume

**Workflow:**
1. Unpack the .docx: `python scripts/office/unpack.py input.docx output_folder/`
2. Make changes to XML files
3. Pack it back: `python scripts/office/pack.py output_folder/ final.docx --original input.docx`
4. Validate and present

### Issue: Name spacing (e.g., "Monesh Kannan" vs "Moneshkannan")

**Always confirm with user:**
- "Should I write 'R. Monesh Kannan' or 'R. Moneshkannan'?"
- Never assume - spacing in names matters

## Quality Checklist

Before presenting any resume, verify:

- [ ] All personal details are correct (name, phone, email, address)
- [ ] Education percentages and years are accurate
- [ ] Career objective is relevant to their goals (3-4 lines)
- [ ] Experience/internship has professional descriptions
- [ ] Skills are organized and relevant
- [ ] Everything fits on ONE page (unless specifically requested otherwise)
- [ ] No spelling or grammar errors
- [ ] Consistent formatting throughout
- [ ] Professional font and colors
- [ ] Declaration section included (if requested)
- [ ] File validates successfully
- [ ] File is saved to /mnt/user-data/outputs/
- [ ] File is presented using present_files tool

## Communication Style

### DO:
- Be direct and helpful
- Confirm all details before building
- Create the actual file immediately
- Use clear, simple language
- Show empathy for students' stress

### DON'T:
- Over-explain technical details
- Ask too many clarifying questions
- Create fake previews or demos
- Suggest complicated workflows
- Make them wait unnecessarily

### Example Good Interaction:

```
User: "I need a resume for tomorrow's interview"

You: "I'll create a professional resume for you right now! Let me get your details:

[Lists all needed information in ONE message]

Please provide these and I'll have your resume ready in minutes."

User: [Provides details]

You: [Creates actual .docx file]
"Done! Your professional resume is ready. Download it from the file below."
[Presents file]

User: "Can you change my phone number?"

You: [Updates file]
"Updated! Here's the new version."
[Presents updated file]
```

## Special Cases

### For Students with Low Percentages
- Include percentage honestly (never lie)
- Emphasize skills, certifications, experience
- Write strong career objective
- Highlight any achievements or positions held

### For Freshers (No Experience)
- Create positive "Fresher" section
- Focus on academic projects if any
- Emphasize skills and certifications
- Include volunteer work, positions held
- Write enthusiastic career objective

### For Name in Multiple Formats
- Always ask: "How should I write your name on the resume?"
- Confirm spacing, initials, etc.
- Examples: "R. Monesh Kannan" vs "R. Moneshkannan" vs "Ramkumar V"

### For Company Name Restrictions
- If user says "don't mention company name"
- Use generic: "Corporate Internship", "Finance Intern", "IT Company"
- Keep descriptions professional but vague

## Remember

**The goal is NOT to:**
- Build fancy apps
- Show off technical skills
- Create beautiful demos
- Explain limitations

**The goal IS to:**
- Give students a working resume they can use RIGHT NOW
- Make them look hireable
- Reduce their stress
- Actually help them get jobs

**You're successful when:**
- Student downloads a .docx file
- It looks professional and clean
- It helps them in their job search
- They don't have to do any extra work

## Files to Reference

- `/mnt/skills/public/docx/SKILL.md` - For advanced Word document manipulation
- Your own created resumes as examples of good formatting
- User-uploaded templates as style guides

---

**Bottom line:** Be the Claude that actually helps students get jobs, not the Claude that builds impressive-but-useless apps. Direct resume creation in chat using computer tools = happy students with actual resumes.

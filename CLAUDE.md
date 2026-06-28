You are the lead software engineer of this project.

Project: ATM AI Dashboard

Core Objective:
Build a web application that allows users to generate EUROCONTROL-compliant TPL (Trajectory/Flight Plan) files for Air Traffic Management.

The system must:
- Take natural language input from the user via a UI prompt
- Convert the request into a structured ATM flight plan
- Generate a valid TPL file following EUROCONTROL formatting rules
- Allow users to download or export the generated TPL file
- Provide validation and error checking before generation

---

Architecture Requirements:

Frontend:
- Next.js
- UI with a prompt input (natural language request)
- Display generated TPL file preview
- Allow download/export of file

Backend:
- Python FastAPI
- API endpoint: /generate-tpl
- Receives user prompt
- Converts prompt into structured flight plan data
- Generates TPL file content
- Returns file or structured output

AI Layer:
- Use LLM (OpenAI or similar) to interpret user request
- Convert natural language → structured ATM flight parameters
- Ensure output respects EUROCONTROL TPL format constraints

---

Rules:
- Always follow EUROCONTROL formatting standards for TPL
- Validate output before returning file
- Do not break existing features
- Write production-ready, modular code
- Separate concerns (UI / API / logic / generator)
- Commit after each feature
- Keep explanations short in commit messages

---

Key Features (MVP):
1. Input prompt in UI (example: "Flight from Paris to Singapore at FL350")
2. Backend interprets request
3. Generate structured flight plan
4. Output valid TPL file
5. Download button in frontend

---

Future Improvements:
- Real-time validation against ATM rules
- Route optimization
- Conflict detection between trajectories
- Integration with radar/anomaly system


Backend FastAPI for ATM TPL Generator

Quick start

1. Create a virtualenv and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. (Optional) Set your OpenAI API key:

```bash
export OPENAI_API_KEY=sk-...
```

3. Run the server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The endpoint is `POST /generate-tpl` expecting JSON `{ "prompt": "..." }`.

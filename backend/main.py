import os
import uuid
import re
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
import docx
from docxtpl import DocxTemplate
import jinja2

app = FastAPI(title="AI Document Constructor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DeepSeek Configuration
client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "your-deepseek-api-key-here"),
    base_url="https://api.deepseek.com"
)

class EditRequest(BaseModel):
    placeholder_id: str
    user_message: str
    chat_history: Optional[List[Dict[str, str]]] = []
    document_context: Optional[Dict[str, str]] = {}

class ExportRequest(BaseModel):
    placeholder_values: Dict[str, str]

def extract_placeholders_list(docx_path: str):
    """Simple extraction of placeholders using <<name>> syntax."""
    doc = docx.Document(docx_path)
    pattern = re.compile(r"<<([^>]+)>>")
    placeholders = []
    seen = set()

    # Search in paragraphs
    for para in doc.paragraphs:
        matches = pattern.findall(para.text)
        for match in matches:
            name = match.split('|')[0].strip()
            if name not in seen:
                placeholders.append({
                    "id": name,
                    "raw": f"<<{match}>>",
                    "constraints": _parse_constraints(match)
                })
                seen.add(name)
    
    # Search in tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    matches = pattern.findall(para.text)
                    for match in matches:
                        name = match.split('|')[0].strip()
                        if name not in seen:
                            placeholders.append({
                                "id": name,
                                "raw": f"<<{match}>>",
                                "constraints": _parse_constraints(match)
                            })
                            seen.add(name)
    return placeholders

def _parse_constraints(match_str: str) -> Dict[str, str]:
    parts = match_str.split('|')
    constraints = {}
    for part in parts[1:]:
        if ':' in part:
            k, v = part.split(':', 1)
            constraints[k.strip()] = v.strip()
    return constraints

@app.post("/api/v1/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="En esta versión, solo se aceptan archivos .docx para garantizar formato.")
    
    file_id = f"doc_{uuid.uuid4().hex[:8]}"
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file_id}_{file.filename}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    try:
        placeholders = extract_placeholders_list(file_path)
    except Exception as e:
        print(f"Error parsing: {e}")
        placeholders = []

    return {
        "document_id": file_id,
        "filename": file.filename,
        "placeholders": placeholders
    }

@app.post("/api/v1/documents/{document_id}/edit")
async def edit_placeholder(document_id: str, request: EditRequest):
    try:
        system_content = f"Eres un asistente redactor profesional. Tu tarea es generar el contenido para la sección: {request.placeholder_id}."
        
        if request.document_context:
            context_str = "\n".join([f"- {k}: {v}" for k, v in request.document_context.items() if v])
            if context_str:
                system_content += f"\n\nContexto global de la propuesta:\n{context_str}"

        messages = [{"role": "system", "content": system_content}]
        for msg in request.chat_history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": request.user_message})

        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        return {
            "placeholder_id": request.placeholder_id,
            "generated_content": response.choices[0].message.content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/documents/{document_id}/export")
async def export_document(document_id: str, request: ExportRequest):
    files = [f for f in os.listdir("uploads") if f.startswith(f"{document_id}_")]
    if not files: raise HTTPException(status_code=404, detail="Doc not found")
    
    tpl_path = os.path.join("uploads", files[0])
    doc = DocxTemplate(tpl_path)
    
    # Configure Jinja to use << >> instead of {{ }} to match user syntax
    jinja_env = jinja2.Environment(
        variable_start_string='<<', 
        variable_end_string='>>'
    )
    
    # Render with values, preserving all formatting
    doc.render(request.placeholder_values, jinja_env)
    
    out_path = f"uploads/{document_id}_final.docx"
    doc.save(out_path)
    
    return FileResponse(
        out_path, 
        filename=f"Propuesta_Final_{files[0].split('_', 1)[1]}",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

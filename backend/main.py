import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import re
from openai import AsyncOpenAI
import docx

app = FastAPI(title="AI Document Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DeepSeek Configuration mapping
client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "your-deepseek-api-key-here"),
    base_url="https://api.deepseek.com"
)

class EditRequest(BaseModel):
    placeholder_id: str
    user_message: str
    chat_history: Optional[List[Dict[str, str]]] = []
    document_context: Optional[Dict[str, str]] = {}

def extract_placeholders_and_chunks(docx_path: str):
    doc = docx.Document(docx_path)
    pattern = re.compile(r"<<([^>]+)>>")
    unique_placeholders = []
    seen = set()
    chunks = []

    for para in doc.paragraphs:
        if not para.text.strip():
            continue
        parts = re.split(r"(<<[^>]+>>)", para.text)
        para_chunks = []
        for part in parts:
            if not part: continue
            if part.startswith("<<") and part.endswith(">>"):
                inner = part[2:-2]
                inner_parts = inner.split('|')
                name = inner_parts[0].strip()
                constraints = {}
                for c in inner_parts[1:]:
                    if ':' in c:
                        k, v = c.split(':', 1)
                        constraints[k.strip()] = v.strip()
                
                if name not in seen:
                    unique_placeholders.append({
                        "id": name,
                        "raw": part,
                        "constraints": constraints,
                        "current_value": None
                    })
                    seen.add(name)
                para_chunks.append({"type": "placeholder", "id": name, "raw": part})
            else:
                para_chunks.append({"type": "text", "text": part})
        chunks.append(para_chunks)
            
    return unique_placeholders, chunks

@app.post("/api/v1/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith((".docx", ".pptx")):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .docx y .pptx")
    
    file_id = f"doc_{uuid.uuid4().hex[:8]}"
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file_id}_{file.filename}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    placeholders = []
    chunks = []
    if file.filename.endswith(".docx"):
        try:
            placeholders, chunks = extract_placeholders_and_chunks(file_path)
        except Exception as e:
            print("Error parsing docx:", e)

    return {
        "document_id": file_id,
        "filename": file.filename,
        "format": file.filename.split('.')[-1],
        "placeholders": placeholders,
        "chunks": chunks,
        "preview_url": f"/api/v1/documents/{file_id}/preview" # Not fully implemented visually yet
    }

@app.post("/api/v1/documents/{document_id}/edit")
async def edit_placeholder(document_id: str, request: EditRequest):
    try:
        # Prompting logic
        system_content = f"Eres un asistente redactor. Escribe el contenido para la sección: {request.placeholder_id}. Mantente directo y conciso al requerimiento."
        
        if request.document_context:
            context_str = "\n".join([f"- {k}: {v}" for k, v in request.document_context.items() if v])
            if context_str:
                system_content += f"\n\nContexto previo del documento ya acordado (úsalo para mantener coherencia narrativa si corresponde):\n{context_str}"

        messages = [{"role": "system", "content": system_content}]
        
        # Add history if provided
        for msg in request.chat_history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            
        # Add the currect request prompt
        messages.append({"role": "user", "content": request.user_message})

        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            max_tokens=600,
            temperature=0.7
        )
        
        generated_content = response.choices[0].message.content

        return {
            "placeholder_id": request.placeholder_id,
            "generated_content": generated_content,
            "char_count": len(generated_content),
            "model_used": "deepseek-chat",
            "warnings": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse

class ExportRequest(BaseModel):
    placeholder_values: Dict[str, str]

@app.post("/api/v1/documents/{document_id}/export")
async def export_document(document_id: str, request: ExportRequest):
    files = [f for f in os.listdir("uploads") if f.startswith(f"{document_id}_")]
    if not files:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = os.path.join("uploads", files[0])
    doc = docx.Document(file_path)
    pattern = re.compile(r"<<([^>]+)>>")

    for para in doc.paragraphs:
        matches = pattern.findall(para.text)
        if matches:
            new_text = para.text
            for match in matches:
                name = match.split('|')[0].strip()
                val = request.placeholder_values.get(name) or f"<<{match}>>"
                new_text = new_text.replace(f"<<{match}>>", val)
            para.text = new_text

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    matches = pattern.findall(para.text)
                    if matches:
                        new_text = para.text
                        for match in matches:
                            name = match.split('|')[0].strip()
                            val = request.placeholder_values.get(name) or f"<<{match}>>"
                            new_text = new_text.replace(f"<<{match}>>", val)
                        para.text = new_text
                        
    out_path = f"uploads/{document_id}_export.docx"
    doc.save(out_path)
    return FileResponse(out_path, filename=f"export_{files[0].split('_', 1)[1]}", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

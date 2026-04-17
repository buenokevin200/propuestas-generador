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

def extract_placeholders(docx_path: str):
    doc = docx.Document(docx_path)
    placeholders = []
    # Simplified regex for <<placeholder_name|max:500>>
    pattern = re.compile(r"<<([^>]+)>>")
    
    for para in doc.paragraphs:
        matches = pattern.findall(para.text)
        for match in matches:
            parts = match.split('|')
            name = parts[0].strip()
            constraints = {}
            for part in parts[1:]:
                if ':' in part:
                    k, v = part.split(':', 1)
                    constraints[k.strip()] = v.strip()
            placeholders.append({
                "id": name,
                "raw": f"<<{match}>>",
                "constraints": constraints,
                "current_value": None
            })
            
    # Remove duplicates but preserve order
    seen = set()
    unique_placeholders = []
    for p in placeholders:
        if p["id"] not in seen:
            seen.add(p["id"])
            unique_placeholders.append(p)
            
    return unique_placeholders

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
    if file.filename.endswith(".docx"):
        try:
            placeholders = extract_placeholders(file_path)
        except Exception as e:
            print("Error parsing docx:", e)

    return {
        "document_id": file_id,
        "filename": file.filename,
        "format": file.filename.split('.')[-1],
        "placeholders": placeholders,
        "preview_url": f"/api/v1/documents/{file_id}/preview" # Not fully implemented visually yet
    }

@app.post("/api/v1/documents/{document_id}/edit")
async def edit_placeholder(document_id: str, request: EditRequest):
    try:
        # Prompting logic
        messages = [
            {"role": "system", "content": f"Eres un asistente redactor. Escribe el contenido para la sección: {request.placeholder_id}. Mantente directo y conciso al requerimiento."}
        ]
        
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

@app.get("/api/v1/documents/{document_id}/status")
async def document_status(document_id: str):
    return {
        "document_id": document_id,
        "total_placeholders": 3,
        "completed": 0,
        "pending": [],
        "last_edited_at": None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid

app = FastAPI(title="AI Document Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EditRequest(BaseModel):
    placeholder_id: str
    user_message: str
    chat_history: Optional[List[Dict[str, str]]] = []

@app.post("/api/v1/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith((".docx", ".pptx")):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .docx y .pptx")
    
    # Mock response based on the design doc
    return {
        "document_id": f"doc_{uuid.uuid4().hex[:8]}",
        "filename": file.filename,
        "format": file.filename.split('.')[-1],
        "placeholders": [
            {
                "id": "nombre_cliente",
                "raw": "<<nombre_cliente>>",
                "constraints": {},
                "current_value": None
            },
            {
                "id": "descripcion_problema",
                "raw": "<<descripcion_problema|max:500>>",
                "constraints": {"max_chars": 500},
                "current_value": None
            },
            {
                "id": "descripcion_solucion",
                "raw": "<<descripcion_solucion|tone:formal>>",
                "constraints": {"tone": "formal"},
                "current_value": None
            }
        ],
        "preview_url": "/api/v1/documents/preview"
    }

@app.post("/api/v1/documents/{document_id}/edit")
async def edit_placeholder(document_id: str, request: EditRequest):
    # This would integrate with Claude/GPT in reality
    return {
        "placeholder_id": request.placeholder_id,
        "generated_content": f"Contenido generado para {request.placeholder_id} basado en: '{request.user_message}'",
        "char_count": len(request.user_message) * 2,
        "model_used": "claude-sonnet-4-20250514",
        "warnings": []
    }

@app.get("/api/v1/documents/{document_id}/status")
async def document_status(document_id: str):
    return {
        "document_id": document_id,
        "total_placeholders": 3,
        "completed": 0,
        "pending": ["nombre_cliente", "descripcion_problema", "descripcion_solucion"],
        "last_edited_at": None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import DocumentViewer from './components/DocumentViewer';
import ChatPanel from './components/ChatPanel';

export type Placeholder = {
  id: string;
  raw: string;
  constraints: Record<string, string>;
};

export type ChunkItem = { type: 'text', text: string } | { type: 'placeholder', id: string, raw: string };
export type ParagraphChunk = ChunkItem[];

export default function App() {
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ParagraphChunk[]>([]);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setDocumentId(data.document_id);
      setChunks(data.chunks || []);
      setDocumentLoaded(true);
    } catch (error) {
      alert("Uh oh! Failed to upload document. Is the backend running?");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    if (!documentId) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/v1/documents/${documentId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeholder_values: placeholderValues })
      });
      if (!res.ok) throw new Error("Fallo exportando el documento");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Documento_Generado_${documentId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Editor Section */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <h1 className="font-semibold text-lg">AI Document Generator</h1>
          </div>
          <div className="flex gap-3">
            {documentLoaded && (
              <button 
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${previewMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {previewMode ? 'Edit Mode' : 'Preview'}
              </button>
            )}
            <button 
              onClick={handleExport}
              disabled={exporting || !documentLoaded}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm flex gap-2 items-center disabled:opacity-50"
            >
              {exporting && <Loader2 size={16} className="animate-spin" />}
              Export Word
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center">
          {!documentLoaded ? (
            <div className="max-w-md w-full my-auto bg-white p-8 rounded-xl border shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload Template</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Carga tu archivo .docx que contiene marcadores como &lt;&lt;nombre_empresa&gt;&gt;
              </p>
              
              <input 
                type="file" 
                accept=".docx,.pptx"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Cargando...</>
                ) : (
                  'Seleccionar Archivo'
                )}
              </button>
            </div>
          ) : (
            <DocumentViewer 
              chunks={chunks}
              placeholderValues={placeholderValues}
              activePlaceholder={activePlaceholder} 
              onSelect={setActivePlaceholder} 
              previewMode={previewMode}
            />
          )}
        </main>
      </div>

      {/* Chat / AI Panel */}
      {documentLoaded && documentId && !previewMode && (
        <ChatPanel 
          documentId={documentId}
          activePlaceholder={activePlaceholder} 
          placeholderValues={placeholderValues}
          onAccept={(id, content) => setPlaceholderValues(prev => ({ ...prev, [id]: content }))}
        />
      )}
    </div>
  );
}

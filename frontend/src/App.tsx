import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import RequirementBoard from './components/RequirementBoard';
import ChatPanel from './components/ChatPanel';

export type Placeholder = {
  id: string;
  raw: string;
  constraints: Record<string, string>;
};

export default function App() {
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
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

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setDocumentId(data.document_id);
      setPlaceholders(data.placeholders || []);
      setDocumentLoaded(true);
    } catch (error) {
      alert("Error al cargar la plantilla.");
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
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Propuesta_Generada.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar.");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const progress = placeholders.length > 0 
    ? Math.round((Object.keys(placeholderValues).length / placeholders.length) * 100) 
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight text-lg">AI Document Constructor</h1>
              {documentLoaded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {progress}% Completado
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleExport}
              disabled={exporting || !documentLoaded}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex gap-2 items-center"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Generar Documento Final
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-auto bg-slate-50 p-10 flex justify-center">
          {!documentLoaded ? (
            <div className="max-w-md w-full my-auto bg-white p-10 rounded-3xl border shadow-xl text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload size={32} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-3">Carga tu Plantilla</h2>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed px-4">
                Sube tu archivo .docx con marcadores tipo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 text-[12px] font-bold">&lt;&lt;seccion&gt;&gt;</code> para empezar.
              </p>
              
              <input type="file" accept=".docx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-3"
              >
                {uploading ? <Loader2 size={24} className="animate-spin" /> : 'Seleccionar Documento'}
              </button>
            </div>
          ) : (
            <RequirementBoard 
              placeholders={placeholders}
              placeholderValues={placeholderValues}
              activePlaceholder={activePlaceholder} 
              onSelect={setActivePlaceholder} 
            />
          )}
        </main>
      </div>

      {/* Side Chat */}
      {documentLoaded && documentId && (
        <ChatPanel 
          documentId={documentId}
          activePlaceholder={activePlaceholder} 
          placeholderValues={placeholderValues}
          onAccept={(id, content) => {
            setPlaceholderValues(prev => ({ ...prev, [id]: content }));
          }}
        />
      )}
    </div>
  );
}

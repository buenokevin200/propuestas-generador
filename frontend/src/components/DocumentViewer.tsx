import { Placeholder } from '../App';

interface DocumentViewerProps {
  placeholders: Placeholder[];
  activePlaceholder: string | null;
  onSelect: (id: string) => void;
}

export default function DocumentViewer({ placeholders, activePlaceholder, onSelect }: DocumentViewerProps) {
  return (
    <div className="w-full max-w-[850px] bg-white shadow-md border rounded-sm mx-auto my-4 p-16 font-serif text-slate-800 leading-relaxed min-h-[1100px]">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">
          Previsualización del Documento
        </h1>
        
        <div className="mb-6 bg-slate-50 p-4 border rounded-lg text-sm text-slate-500">
          Haz clic en cualquier bloque editable marcado con líneas punteadas para comenzar a llenarlo usando a DeepSeek.
        </div>

        {placeholders.length === 0 ? (
          <p className="text-red-500">No se encontraron marcadores en el archivo. Asegúrate de usar la sintaxis &lt;&lt;nombre_variable&gt;&gt;.</p>
        ) : (
          <div className="space-y-8">
            {placeholders.map((ph, idx) => (
              <div key={ph.id} className="border-l-4 border-indigo-100 pl-4 py-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 block mb-2">
                  Sección {idx + 1}
                </span>
                
                <div 
                  onClick={() => onSelect(ph.id)}
                  className={`placeholder-highlight w-full transition-all min-h-[60px] p-3 block text-base ${
                    activePlaceholder === ph.id ? 'placeholder-active shadow-sm' : ''
                  }`}
                >
                  <span className="text-indigo-600/60 font-mono select-none">
                    {ph.raw}
                  </span>
                  
                  {/* If we had generated context we would display it here, but for now we just show the raw placeholder */}
                </div>
                
                {Object.keys(ph.constraints).length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {Object.entries(ph.constraints).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded uppercase font-bold">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

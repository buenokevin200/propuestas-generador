import { Placeholder, ParagraphChunk } from '../App';

interface DocumentViewerProps {
  placeholders: Placeholder[];
  chunks?: ParagraphChunk[];
  placeholderValues: Record<string, string>;
  activePlaceholder: string | null;
  onSelect: (id: string) => void;
  previewMode: boolean;
}

export default function DocumentViewer({ placeholders, chunks, placeholderValues, activePlaceholder, onSelect, previewMode }: DocumentViewerProps) {
  return (
    <div className="w-full max-w-[850px] bg-white shadow-md border rounded-sm mx-auto my-4 p-16 font-serif text-slate-800 leading-relaxed min-h-[1100px]">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">
          Previsualización del Documento
        </h1>
        
        {!previewMode && (
          <div className="mb-6 bg-slate-50 p-4 border rounded-lg text-sm text-slate-500">
            Haz clic en cualquier bloque editable marcado para comenzar a llenarlo usando a DeepSeek.
          </div>
        )}

        {(!chunks || chunks.length === 0) ? (
          <p className="text-red-500">Aún no se puede previsualizar el documento completo.</p>
        ) : (
          <div className="space-y-4">
            {chunks.map((chunk, pIdx) => (
              <p key={pIdx} className="mb-4">
                {chunk.map((item, idx) => {
                  if (item.type === 'text') return <span key={idx}>{item.text}</span>;
                  
                  const val = placeholderValues[item.id];
                  if (previewMode) {
                     return <span key={idx} className={`px-1 rounded ${val ? 'bg-green-100' : 'bg-yellow-100'}`}>{val || item.raw}</span>;
                  }

                  return (
                    <span 
                      key={idx}
                      onClick={() => onSelect(item.id)}
                      className={`inline-block px-2 py-0.5 mx-1 cursor-pointer transition-colors border-b-2 font-medium ${
                        activePlaceholder === item.id ? 'bg-indigo-100 border-indigo-400 text-indigo-800' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {val ? `(Completado) ${val.substring(0, 30)}...` : item.raw}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

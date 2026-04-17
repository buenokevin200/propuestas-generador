import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Placeholder } from '../App';

interface RequirementBoardProps {
  placeholders: Placeholder[];
  placeholderValues: Record<string, string>;
  activePlaceholder: string | null;
  onSelect: (id: string) => void;
}

export default function RequirementBoard({ placeholders, placeholderValues, activePlaceholder, onSelect }: RequirementBoardProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b pb-6 border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Estructura de la Propuesta</h2>
          <p className="text-slate-500 text-sm mt-1">Completa cada sección interactuando con la IA para generar el contenido final.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <span className="text-indigo-700 font-bold text-sm">{placeholders.length} Secciones detectadas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {placeholders.map((ph) => {
          const isCompleted = !!placeholderValues[ph.id];
          const isActive = activePlaceholder === ph.id;

          return (
            <div 
              key={ph.id}
              onClick={() => onSelect(ph.id)}
              className={`group relative p-6 rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 -translate-y-1' 
                  : isCompleted 
                    ? 'bg-white border-emerald-100 hover:border-emerald-300 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="pr-10">
                  <div className={`mb-3 flex items-center gap-2 ${isActive ? 'text-indigo-100' : 'text-indigo-600'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-current/10 px-2 py-1 rounded">
                      Sección
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {ph.id.replace(/_/g, ' ')}
                  </h3>
                  <p className={`text-xs mt-2 line-clamp-2 ${isActive ? 'text-indigo-100/70' : 'text-slate-400'}`}>
                    {isCompleted ? placeholderValues[ph.id] : ph.raw}
                  </p>
                </div>
                
                <div className={`shrink-0 mt-1 transition-transform ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                  {isCompleted ? (
                    <CheckCircle2 className={isActive ? 'text-white' : 'text-emerald-500'} size={24} />
                  ) : isActive ? (
                    <ChevronRight className="text-white" size={24} />
                  ) : (
                    <Circle className="text-slate-200" size={24} />
                  )}
                </div>
              </div>

              {isActive && (
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FileText size={80} className="text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FileText({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  );
}

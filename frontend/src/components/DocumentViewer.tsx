interface DocumentViewerProps {
  activePlaceholder: string | null;
  onSelect: (id: string) => void;
}

export default function DocumentViewer({ activePlaceholder, onSelect }: DocumentViewerProps) {
  // Mock content to simulate a rendered document
  return (
    <div className="w-full max-w-[850px] bg-white shadow-md border rounded-sm mx-auto my-4 p-16 font-serif text-slate-800 leading-relaxed min-h-[1100px]">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 border-b pb-4">
          Propuesta Comercial
        </h1>

        <div className="mb-8">
          <p className="text-sm tracking-widest uppercase text-slate-500 mb-2">Para:</p>
          <p className="text-lg font-medium">
            <span 
              onClick={() => onSelect('nombre_cliente')}
              className={`placeholder-highlight ${activePlaceholder === 'nombre_cliente' ? 'placeholder-active' : ''}`}
            >
              &lt;&lt;nombre_cliente&gt;&gt;
            </span>
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">1. Introducción</h2>
          <p className="mb-4">
            Agradecemos la oportunidad de presentar esta propuesta. Entendemos que su organización busca mejorar su eficiencia operativa.
          </p>
          <div 
            onClick={() => onSelect('descripcion_problema')}
            className={`placeholder-highlight w-full min-h-[60px] p-2 mt-2 block ${activePlaceholder === 'descripcion_problema' ? 'placeholder-active' : ''}`}
          >
            <span className="text-indigo-600/60 text-sm font-mono">&lt;&lt;descripcion_problema | max:500&gt;&gt;</span>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">2. Nuestra Solución</h2>
          <p className="mb-4">
            Basado en nuestro análisis, proponemos el siguiente enfoque:
          </p>
          <div 
            onClick={() => onSelect('descripcion_solucion')}
            className={`placeholder-highlight w-full min-h-[120px] p-2 mt-2 block ${activePlaceholder === 'descripcion_solucion' ? 'placeholder-active' : ''}`}
          >
            <span className="text-indigo-600/60 text-sm font-mono">&lt;&lt;descripcion_solucion | tone:formal&gt;&gt;</span>
          </div>
        </section>
        
        <section>
           <h2 className="text-2xl font-semibold mb-4 text-slate-800">3. Equipo Asignado</h2>
           <div 
            onClick={() => onSelect('equipo_asignado')}
            className={`placeholder-highlight w-full min-h-[80px] p-2 mt-2 block ${activePlaceholder === 'equipo_asignado' ? 'placeholder-active' : ''}`}
          >
            <span className="text-indigo-600/60 text-sm font-mono">&lt;&lt;equipo_asignado&gt;&gt;</span>
          </div>
        </section>

      </div>
    </div>
  );
}

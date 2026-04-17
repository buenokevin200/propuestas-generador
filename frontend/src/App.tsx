import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import DocumentViewer from './components/DocumentViewer';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);

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
            <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              Preview
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm">
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
                Upload your .docx or .pptx document containing placeholders like &lt;&lt;company_name&gt;&gt;
              </p>
              <button 
                onClick={() => setDocumentLoaded(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Simulate Upload
              </button>
            </div>
          ) : (
            <DocumentViewer 
              activePlaceholder={activePlaceholder} 
              onSelect={setActivePlaceholder} 
            />
          )}
        </main>
      </div>

      {/* Chat / AI Panel */}
      {documentLoaded && (
        <ChatPanel 
          activePlaceholder={activePlaceholder} 
        />
      )}
    </div>
  );
}

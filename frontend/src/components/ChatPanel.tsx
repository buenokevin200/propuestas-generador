import { Sparkles, Send, Bot, User, AlertCircle } from 'lucide-react';
import { useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatPanel({ activePlaceholder }: { activePlaceholder: string | null }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);

  const activeMessages = activePlaceholder ? (messages[activePlaceholder] || []) : [];

  const handleSend = () => {
    if (!input.trim() || !activePlaceholder) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => ({
      ...prev,
      [activePlaceholder]: [...(prev[activePlaceholder] || []), userMsg]
    }));
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `Here is the generated content for <<${activePlaceholder}>> based on your request.` 
      };
      setMessages(prev => ({
        ...prev,
        [activePlaceholder]: [...(prev[activePlaceholder] || []), aiMsg]
      }));
      setLoading(false);
    }, 1500);
  };

  if (!activePlaceholder) {
    return (
      <div className="w-[400px] border-l bg-white flex flex-col items-center justify-center p-8 text-center shrink-0">
        <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 mb-2">AI Assistant</h3>
        <p className="text-sm text-slate-500">
          Select a placeholder in the document to start generating content with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="w-[400px] border-l bg-white flex flex-col shrink-0">
      {/* Panel Header */}
      <div className="h-14 border-b flex items-center px-4 shrink-0 bg-slate-50/50">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Editing Section</span>
          <span className="text-sm font-semibold text-indigo-700 font-mono tracking-tight">
            &lt;&lt;{activePlaceholder}&gt;&gt;
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeMessages.length === 0 ? (
          <div className="text-center p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 mt-4">
            <span className="text-xl mb-2 block">👋</span>
            <p className="text-sm text-indigo-900">
              Describe what you need for this section and I'll write it for you.
            </p>
          </div>
        ) : (
          activeMessages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-sm' 
                  : 'bg-white border text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot size={16} />
            </div>
            <div className="p-4 bg-white border text-slate-700 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s'}} />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s'}} />
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t bg-white shrink-0">
        <div className="relative flex items-end bg-slate-50 border rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="E.g. Write a professional introduction describing our digital marketing services..."
            className="w-full bg-transparent p-3 pr-12 max-h-32 min-h-[44px] text-sm resize-none focus:outline-none"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 justify-center">
          <AlertCircle size={12} className="text-slate-400" />
          <span className="text-xs text-slate-400">AI can make mistakes. Review generated content.</span>
        </div>
      </div>
    </div>
  );
}

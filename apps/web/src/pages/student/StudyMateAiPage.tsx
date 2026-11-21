import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  User,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  subjectContext?: string;
}

export const StudyMateAiPage: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('CS101');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content:
        'Welcome to the StudyMate preview! This chat uses sample explanations—not a live AI model. Choose a subject and explore the interface.',
      timestamp: '10:00 AM',
      subjectContext: 'CS101',
    },
    {
      id: 'msg-2',
      sender: 'user',
      content:
        'Can you explain why the ReLU activation function is preferred over Sigmoid in multi-layer neural networks?',
      timestamp: '10:02 AM',
      subjectContext: 'CS101',
    },
    {
      id: 'msg-3',
      sender: 'assistant',
      content:
        'Great question aligned with **Unit 2: Neural Networks & Activation Functions**!\n\nHere is why **ReLU** ($f(x) = \\max(0, x)$) is favored:\n\n1. **Vanishing Gradient Prevention**: Sigmoid saturates at 0 and 1, where its derivative is near zero ($f\'(x) \\le 0.25$). Backpropagating through many layers causes gradients to shrink to zero. ReLU has a constant derivative of 1 for $x > 0$.\n2. **Computational Speed**: Calculating max(0, x) requires a simple threshold comparison, unlike Sigmoid which requires expensive exponential calculation ($e^{-x}$).\n3. **Sparsity**: Negative inputs yield zero output, activating only a subset of neurons and enabling sparse representations.',
      timestamp: '10:03 AM',
      subjectContext: 'CS101',
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyMessage = async (msg: ChatMessage) => { try { await navigator.clipboard.writeText(msg.content); setCopiedId(msg.id); } catch { setCopiedId(null); } };
  const clearChat = () => { setMessages([]); setInputText(''); };
  const promptSuggestions = [
    'Explain Karnaugh Maps minimization with a 4-variable example',
    'Summarize Cayley-Hamilton theorem and how to find matrix inverse',
    'What are the 5 phases of Design Thinking according to Stanford d.school?',
    'Give me a 5-question quick quiz on A* search heuristics',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectContext: selectedSubject,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Simulate structured educational assistant response (explicitly marked demo)
    setTimeout(() => {
      const assistantReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'assistant',
        content: `**[Demo AI Assistant Response for ${selectedSubject}]**\n\nI have analyzed your query regarding *"${text}"* within the context of your enrolled curriculum.\n\n- **Key Formula / Concept**: Relates to active classroom topics.\n- **Syllabus Reference**: Faculty approved Unit lecture notes.\n- **Recommended Next Step**: Review Practice Problem Sheet #2 or attempt the 10-question MCQ drill.\n\n*(Notice: Live Gemini / Claude LLM inference integration activates in Phase 2)*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subjectContext: selectedSubject,
      };
      setMessages((prev) => [...prev, assistantReply]);
      setIsLoading(false);
    }, 900);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">StudyMate AI Assistant</Badge>
            <span className="text-xs text-slate-500 font-semibold">Topic-Aware Educational Tutor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Contextual Academic AI Chat
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Ask for step-by-step mathematical proofs, circuit explanations, and exam preparation guides.
          </p>
        </div>

        <button type="button" onClick={clearChat} className="text-xs font-semibold text-slate-500 hover:text-brand-blue border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">Clear conversation</button>
        {/* Subject Context Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Subject Context:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-brand-blue dark:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="CS101">CS101 - Foundation in AI</option>
            <option value="EC103">EC103 - Digital Electronics</option>
            <option value="MA101">MA101 - Mathematics</option>
            <option value="DT102">DT102 - Design Thinking</option>
            <option value="HU101">HU101 - Business Communication</option>
          </select>
        </div>
      </div>

      {/* Explicit Phase 1 AI Provider Advisory */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <strong>Phase 1 Full-Stack Notice:</strong> The StudyMate interface demonstrates context-aware prompt templating, conversational state, and UI responsiveness. Live API keys and external AI LLM providers will be connected to the provider-agnostic backend service in Phase 2.
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col h-[650px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-premium">
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" role="log" aria-label="StudyMate conversation" aria-live="polite">
          {messages.length === 0 && <div className="grid place-items-center h-full text-center px-4"><div><Bot className="w-11 h-11 mx-auto text-brand-blue mb-4"/><h2 className="text-lg font-bold text-slate-900 dark:text-white">Start a new study chat</h2><p className="text-xs text-slate-500 mt-2">This is an illustrative AI chat preview. Choose a suggested question below.</p></div></div>}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'bg-gradient-to-tr from-brand-blue to-brand-cyan text-white shadow-glow-blue'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-brand-blue text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 pb-1 text-[10px] opacity-75">
                    <span>{isUser ? 'You' : `StudyMate AI (${msg.subjectContext || selectedSubject})`}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-line mt-1">{msg.content}</div>
                  {!isUser && <button type="button" onClick={() => void copyMessage(msg)} className="mt-3 text-[10px] font-semibold opacity-70 hover:opacity-100 underline underline-offset-2" aria-label="Copy assistant response">{copiedId === msg.id ? 'Copied' : 'Copy response'}</button>}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-cyan text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-bounce [animation-delay:0.4s]" />
                <span>Preparing a sample explanation...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompts Pills */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-bold shrink-0 text-[10px] uppercase">
            Suggested:
          </span>
          {promptSuggestions.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-colors text-xs truncate max-w-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-surfaceDark flex items-center gap-3">
          <input
            type="text"
            placeholder={`Ask StudyMate anything about ${selectedSubject}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <Button
            variant="gradient"
            size="md"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Send className="w-4 h-4 mr-1" />
            <span>Send</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

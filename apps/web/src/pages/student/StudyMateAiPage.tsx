import React, { useState, useEffect, useRef } from 'react';
import { StudyMateService } from '@/services/studyMateService';
import { AcademicService } from '@/services/academicService';
import {
  SubjectSummary,
  SyllabusMode,
  StudyMateConversation,
} from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Bot,
  Send,
  AlertCircle,
  RotateCcw,
  User,
  Copy,
  Check,
  Plus,
  Trash2,
  Compass,
  Layers,
  History,
} from 'lucide-react';

interface DisplayMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  subjectContext?: string;
  mode?: SyllabusMode;
  groundingContext?: { topicTitles: string[]; resourceTitles: string[] };
  isMock?: boolean;
}

const COURSE_SUGGESTIONS: Record<string, string[]> = {
  CS101: [
    'Why does ReLU prevent vanishing gradients compared to Sigmoid?',
    'Explain the A* search heuristic admissibility condition with a diagram example',
    'How does backpropagation compute gradients using the computational chain rule?',
    'Give me a 3-question quick quiz on PEAS agent formulation',
  ],
  EC103: [
    'Explain the JK flip-flop toggle state (J=1, K=1) and race-around condition',
    'How do I minimize a 4-variable truth table using a Karnaugh Map?',
    'What is the difference between synchronous and asynchronous counters?',
    'Draw the excitation table for an SR flip-flop converted to D flip-flop',
  ],
  MA101: [
    'State and explain the Cayley-Hamilton theorem with an example 2x2 matrix',
    'How do I find eigenvalues and eigenvectors of a symmetric matrix?',
    'Explain partial derivatives and directional gradient vector geometry',
    'What are the conditions for a matrix to be diagonalizable?',
  ],
  DT102: [
    'What are the 5 phases of Design Thinking in the Stanford d.school framework?',
    'How do I construct actionable How-Might-We (HMW) statements?',
    'What is the difference between an Empathy Map and a User Journey Map?',
  ],
  HU101: [
    'Explain the BLUF (Bottom Line Up Front) principle in executive technical briefings',
    'How should an engineering team structure project defense Q&A under tough critiques?',
    'What are key strategies for active listening in group discussions?',
  ],
};

export const StudyMateAiPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [mode, setMode] = useState<SyllabusMode>('WITHIN_SYLLABUS');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Conversation Management
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<StudyMateConversation[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content:
        'Hello! I am **StudyMate AI**, your syllabus-grounded academic tutor. I have direct access to your enrolled courses, active classroom topics, and faculty lecture notes. Ask any concept question, request step-by-step mathematical solutions, or test yourself with quick practice drills!',
      timestamp: '',
      subjectContext: '',
      mode: 'WITHIN_SYLLABUS',
    },
  ]);

  // Load subject list and past conversations
  useEffect(() => {
    AcademicService.getSubjects().then((subjs) => {
      setSubjects(subjs);
      if (subjs.length > 0 && !selectedSubject) {
        setSelectedSubject(subjs[0].code);
      }
    }).catch(() => setErrorMessage('Subjects could not be loaded.'));

    if (user?.id) {
      StudyMateService.getConversations(user.id).then(setConversations).catch(() => setErrorMessage('Conversation history could not be loaded.'));
    }
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputText('');

    const userMsgId = `user-${Date.now()}`;
    const userMsg: DisplayMessage = {
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectContext: selectedSubject,
      mode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.content,
        }));

      // Find matching subjectId
      const subjectObj = subjects.find(
        (s) => s.code.toLowerCase() === selectedSubject.toLowerCase() || s.id === selectedSubject
      );
      const effectiveSubjectId = subjectObj ? subjectObj.id : selectedSubject;

      const response = await StudyMateService.askStudyMate({
        prompt: text,
        subjectId: effectiveSubjectId,
        mode,
        conversationId: currentConversationId || undefined,
        conversationHistory: history,
      });

      if (!currentConversationId && response.conversationId) {
        setCurrentConversationId(response.conversationId);
        // Refresh conversation history
        if (user?.id) {
          StudyMateService.getConversations(user.id).then(setConversations).catch(() => setErrorMessage('Conversation history could not be loaded.'));
        }
      }

      const aiMsg: DisplayMessage = {
        id: response.messageId || `ai-${Date.now()}`,
        sender: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subjectContext: selectedSubject,
        mode: response.mode,
        groundingContext: response.groundingContext,
        isMock: response.isMockResponse,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('StudyMate AI request error:', err);
      const message = err.message || 'Unable to connect to AI service. Please check your network or try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: `new-${Date.now()}`,
        sender: 'assistant',
        content: `Started a new study session for **${selectedSubject}** in **${mode === 'WITHIN_SYLLABUS' ? 'Within Syllabus' : 'Explore Beyond'}** mode. What would you like to review?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subjectContext: selectedSubject,
        mode,
      },
    ]);
  };

  const clearChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputText('');
  };

  const handleLoadConversation = async (conv: StudyMateConversation) => {
    setCurrentConversationId(conv.id);
    setSelectedSubject(conv.subjectId);
    setMode(conv.mode);
    setIsLoading(true);
    try {
      const historyMsgs = await StudyMateService.getConversationMessages(conv.id);
      if (historyMsgs.length > 0) {
        setMessages(
          historyMsgs.map((m) => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            subjectContext: m.subjectId,
            mode: m.mode,
            groundingContext: m.groundingContext,
            isMock: m.isMockResponse,
          }))
        );
      }
    } catch (err) {
      setErrorMessage('Conversation messages could not be loaded.');
    } finally {
      setIsLoading(false);
      setShowHistorySidebar(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await StudyMateService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        handleStartNewConversation();
      }
    } catch (err) {
      setErrorMessage('The conversation could not be deleted.');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const currentSuggestions = COURSE_SUGGESTIONS[selectedSubject] || COURSE_SUGGESTIONS['CS101'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">StudyMate AI Assistant</Badge>
            <span className="text-xs text-slate-500 font-semibold">Syllabus-Grounded Educational AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Contextual Academic AI Chat
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Ask for step-by-step mathematical proofs, digital logic timing analysis, and curriculum review.
          </p>
        </div>

        {/* Course & Mode Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={clearChat}
            className="text-xs font-semibold text-slate-500 hover:text-brand-blue border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-colors"
          >
            Clear chat
          </button>

          {/* Subject Context Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                handleStartNewConversation();
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-brand-blue dark:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {subjects.length > 0 ? (
                subjects.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="CS101">CS101 - Foundation in AI</option>
                  <option value="EC103">EC103 - Digital Electronics</option>
                  <option value="MA101">MA101 - Mathematics</option>
                  <option value="DT102">DT102 - Design Thinking</option>
                  <option value="HU101">HU101 - Business Communication</option>
                </>
              )}
            </select>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setMode('WITHIN_SYLLABUS')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === 'WITHIN_SYLLABUS'
                  ? 'bg-white dark:bg-brand-cardDark text-brand-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Within Syllabus
            </button>
            <button
              onClick={() => setMode('EXPLORE_BEYOND')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === 'EXPLORE_BEYOND'
                  ? 'bg-white dark:bg-brand-cardDark text-brand-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Explore Beyond
            </button>
          </div>

          {/* New Chat Button */}
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={handleStartNewConversation}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Chat
          </Button>

          {/* History Toggle */}
          <Button
            size="sm"
            variant={showHistorySidebar ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => setShowHistorySidebar((prev) => !prev)}
          >
            <History className="w-3.5 h-3.5 mr-1" />
            History ({conversations.length})
          </Button>
        </div>
      </div>

      {/* Main Chat Layout: Optional Sidebar + Chat Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Past Conversations Sidebar (collapsible) */}
        {showHistorySidebar && (
          <Card className="p-4 lg:col-span-1 space-y-3 h-[650px] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">Previous Sessions</span>
              <Button size="sm" variant="ghost" className="text-xs p-1" onClick={handleStartNewConversation}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No past chats recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleLoadConversation(c)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between group ${
                      currentConversationId === c.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 border border-brand-blue text-brand-blue'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="font-semibold block truncate">{c.title || 'Untitled Session'}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.subjectId} &bull; {c.mode === 'WITHIN_SYLLABUS' ? 'Syllabus' : 'Explore'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Chat Area */}
        <Card
          className={`flex flex-col h-[650px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-premium ${
            showHistorySidebar ? 'lg:col-span-3' : 'lg:col-span-4'
          }`}
        >
          {/* Active Mode Notice Banner */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-brand-blue" />
              <span>
                Mode: <strong>{mode === 'WITHIN_SYLLABUS' ? 'Within Syllabus Mode' : 'Explore Beyond Syllabus'}</strong>
                {' '}&bull; Grounded in approved {selectedSubject} curriculum
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              AI explanations can contain mistakes. Verify with course slides.
            </span>
          </div>

          {/* Messages Body */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
            role="log"
            aria-label="StudyMate conversation"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="grid place-items-center h-full text-center px-4">
                <div>
                  <Bot className="w-11 h-11 mx-auto text-brand-blue mb-4" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Start a new study chat</h2>
                  <p className="text-xs text-slate-500 mt-2">Choose a suggested question below or ask anything about {selectedSubject}.</p>
                </div>
              </div>
            )}

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
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
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

                    {/* Grounding Context pill */}
                    {msg.groundingContext && msg.groundingContext.topicTitles.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <span className="font-bold flex items-center gap-1 text-brand-blue dark:text-cyan-400">
                          <Layers className="w-3 h-3" />
                          Syllabus References:
                        </span>
                        <div className="truncate">
                          {msg.groundingContext.topicTitles.slice(0, 2).join(' • ')}
                        </div>
                      </div>
                    )}

                    {/* Copy Button */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.content, msg.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-slate-700 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Copy assistant response"
                        title="Copy Response"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
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
                  <span>StudyMate AI is analyzing syllabus grounding and generating response...</span>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleSendMessage()}>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-bold shrink-0 text-[10px] uppercase">
              Suggested:
            </span>
            {currentSuggestions.map((prompt) => (
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
              disabled={isLoading}
              maxLength={1500}
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
    </div>
  );
};

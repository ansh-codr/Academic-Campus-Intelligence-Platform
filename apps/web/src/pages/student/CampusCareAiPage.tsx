import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampusCareService } from '@/services/campusCareService';
import {
  CampusCareConversation,
  RelevantTicketSnippet,
  ComplaintDraftSuggestion,
} from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Send,
  AlertCircle,
  RotateCcw,
  User,
  Copy,
  Check,
  Plus,
  Trash2,
  Clock,
  History,
  FileText,
  Building2,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Tag,
  Wrench,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DisplayMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedAction?: string;
  draftComplaint?: ComplaintDraftSuggestion;
  relevantTickets?: RelevantTicketSnippet[];
  suggestedFaqs?: string[];
  isMock?: boolean;
}

const DEFAULT_CHIPS = [
  'What is the current status of my open maintenance tickets?',
  'The AC in Block B Room 302 is not cooling and making noise',
  'Wi-Fi keeps dropping in the Central Library 2nd floor',
  'Water tap is constantly leaking in Hostel Block 4 washroom',
];

export const CampusCareAiPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Conversation Management
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<CampusCareConversation[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content:
        'Hello! I am **Campus Care AI**, your smart campus support concierge. I can look up the real-time status of your maintenance tickets, draft detailed repair requests for technicians, and route facility issues to the proper campus departments.',
      timestamp: '',
      suggestedFaqs: [
        'How do I report a classroom AC leak?',
        'What is the turnaround time for Wi-Fi repairs?',
        'How can I reopen an unresolved ticket?',
      ],
    },
  ]);

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      CampusCareService.getConversations(user.id).then(setConversations).catch(() => setErrorMessage('Conversation history could not be loaded.'));
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
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-10)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.content,
        }));

      const response = await CampusCareService.askCampusCare({
        prompt: text,
        conversationId: currentConversationId?.trim() ? currentConversationId.trim() : undefined,
        conversationHistory,
      });

      if (response.conversationId && response.conversationId !== currentConversationId) {
        setCurrentConversationId(response.conversationId);
        if (user?.id) {
          CampusCareService.getConversations(user.id).then(setConversations).catch(() => setErrorMessage('Conversation history could not be loaded.'));
        }
      }

      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: response.suggestedAction,
        draftComplaint: response.draftComplaint,
        relevantTickets: response.relevantTickets,
        suggestedFaqs: response.suggestedFaqs,
        isMock: response.isMock,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Campus Care AI Error:', err);
      setErrorMessage(err.message || 'Campus Care AI failed to respond. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conv: CampusCareConversation) => {
    try {
      setIsLoading(true);
      setCurrentConversationId(conv.id);
      const pastMessages = await CampusCareService.getConversationMessages(conv.id);

      if (pastMessages.length > 0) {
        setMessages(
          pastMessages.map((m) => ({
            id: m.id,
            sender: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text,
            timestamp: formatDate(m.timestamp),
            suggestedAction: m.metadata?.suggestedAction,
            draftComplaint: m.metadata?.draftComplaint,
          }))
        );
      }
      setShowHistorySidebar(false);
    } catch (err: any) {
      setErrorMessage('Failed to load past conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewSession = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: 'welcome-msg-new',
        sender: 'assistant',
        content:
          'Starting a fresh session! What campus facilities or support questions can I help you resolve?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setShowHistorySidebar(false);
  };

  const handleDeleteSession = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await CampusCareService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        handleStartNewSession();
      }
    } catch (err: any) {
      alert('Failed to delete conversation.');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleUseDraftInReport = (draft: ComplaintDraftSuggestion) => {
    navigate('/portal/report', {
      state: {
        prefillDraft: {
          title: draft.title,
          description: draft.description,
          category: draft.category,
          building: draft.building || '',
          floor: draft.floor || '',
          room: draft.room || '',
          priority: draft.priority || 'MEDIUM',
          assignedDepartment: draft.suggestedDepartment,
        },
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm" className="gap-1.5 py-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              Campus Care AI
            </Badge>
            <span className="text-xs text-slate-500 font-semibold">Gemini Grounded Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Campus Care Concierge
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time ticket updates, smart complaint formulation, and campus facility assistance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="gap-2 text-xs"
          >
            <History className="w-4 h-4" />
            <span>Chat Sessions ({conversations.length})</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleStartNewSession}
            className="gap-1.5 text-xs bg-brand-blue hover:bg-brand-blueHover text-white"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Past Sessions Sidebar (Toggleable on mobile, column on large screens) */}
        {showHistorySidebar && (
          <Card className="lg:col-span-1 p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Past Conversations</span>
              <button
                onClick={() => setShowHistorySidebar(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white lg:hidden"
              >
                ✕
              </button>
            </div>
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No past conversations yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors flex items-center justify-between group ${
                      currentConversationId === conv.id
                        ? 'bg-brand-blue/10 border border-brand-blue/30 text-brand-blue dark:text-cyan-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-semibold truncate">{conv.title || 'Support Query'}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(conv.updatedAt)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Main Chat Interface */}
        <div className={`space-y-4 ${showHistorySidebar ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Suggested:
            </span>
            {DEFAULT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-colors border border-slate-200/60 dark:border-slate-700/60 text-left"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <Card className="min-h-[520px] max-h-[620px] flex flex-col p-4 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-brand-blue text-white rounded-tr-none shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Drafted Complaint Suggestion CTA */}
                      {msg.draftComplaint && (
                        <div className="mt-4 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-800/60 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5" />
                              Structured Complaint Draft
                            </span>
                            <Badge variant="cyan" size="sm">
                              {msg.draftComplaint.category}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-slate-700 dark:text-slate-200">
                            <p className="font-bold text-xs">{msg.draftComplaint.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {msg.draftComplaint.description}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-slate-400">
                              <span>Department: <strong className="text-slate-300">{msg.draftComplaint.suggestedDepartment}</strong></span>
                              {msg.draftComplaint.building && (
                                <span>Building: <strong className="text-slate-300">{msg.draftComplaint.building}</strong></span>
                              )}
                              {msg.draftComplaint.room && (
                                <span>Room: <strong className="text-slate-300">{msg.draftComplaint.room}</strong></span>
                              )}
                              <span>Priority: <strong className="text-amber-400">{msg.draftComplaint.priority}</strong></span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUseDraftInReport(msg.draftComplaint!)}
                            className="w-full text-xs gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-sm"
                          >
                            <span>Use Draft in Report Issue Form</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* Relevant Ticket Snippet Cards */}
                      {msg.relevantTickets && msg.relevantTickets.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Your Matching Tickets:
                          </p>
                          <div className="space-y-1.5">
                            {msg.relevantTickets.map((t) => (
                              <div
                                key={t.id}
                                className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-brand-blue dark:text-cyan-400">
                                      {t.referenceNumber}
                                    </span>
                                    <Badge
                                      variant={
                                        t.status === 'RESOLVED'
                                          ? 'green'
                                          : t.status === 'IN_PROGRESS'
                                          ? 'amber'
                                          : 'slate'
                                      }
                                      size="sm"
                                    >
                                      {t.status}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold truncate max-w-xs mt-0.5">
                                    {t.title}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate('/portal/tickets')}
                                  className="text-xs text-brand-blue hover:text-brand-blueHover dark:text-cyan-400 h-7 px-2"
                                >
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested FAQs */}
                      {msg.suggestedFaqs && msg.suggestedFaqs.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                          {msg.suggestedFaqs.map((faq, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendMessage(faq)}
                              disabled={isLoading}
                              className="text-[10px] px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-brand-blue dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              💡 {faq}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 ml-2"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 items-center text-xs text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Campus Care AI is reasoning and checking facility records...</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your ticket, report an issue, or ask a facilities question..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                variant="primary"
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-sm text-xs gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

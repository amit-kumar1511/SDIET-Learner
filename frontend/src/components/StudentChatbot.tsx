import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, MessageSquare, X, Send, BookOpen, Download, Eye, FileText, ChevronRight } from 'lucide-react';
import { downloadFile } from '../lib/cloudinary';
import PDFViewerModal from './PDFViewerModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SubjectType {
  _id: string;
  name: string;
  branch: string;
  semester: number;
}

interface NoteType {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  type: 'Notes' | 'PYQ' | 'Assignment' | 'Task';
  subjectId: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  subjectSelection?: boolean; // trigger subject buttons list
  resourceType?: 'Notes' | 'Assignment' | 'PYQ'; // for selection prompt
  optionSubject?: SubjectType; // for subject-only prompt
  resources?: NoteType[]; // matching resources cards
  emptyState?: boolean;
}

const StudentChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string } | null>(null);
  
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Load all subjects and resources for this student on mount/open
  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchResources();
    }
  }, [user]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchResources = async () => {
    try {
      const { data } = await axios.get('/api/notes/student/resources');
      setSubjects(data.subjects || []);
      setNotes(data.notes || []);
      
      // Initialize with welcome message
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: `Hi ${user?.name || 'Student'}! 👋 I am your Academic Resource Assistant. I can help you quickly find Notes, Assignments, or PYQs for your branch (${user?.branch}) and semester (${user?.semester}).\n\nTry typing something like:\n• "DBMS normalization notes"\n• "methematics notes" (fuzzy match)\n• "Chemistry"\n• "give me assignments"`
        }
      ]);
    } catch (error) {
      console.error('Failed to load resources for chatbot', error);
    }
  };

  // Helper: Levenshtein distance
  const getLevenshteinDistance = (a: string, b: string): number => {
    const tmp = [];
    let i, j;
    for (i = 0; i <= a.length; i++) {
      tmp.push([i]);
    }
    for (j = 0; j <= b.length; j++) {
      tmp[0][j] = j;
    }
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1, // deletion
          tmp[i][j - 1] + 1, // insertion
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
        );
      }
    }
    return tmp[a.length][b.length];
  };

  // Helper: Similarity index (0.0 to 1.0)
  const getSimilarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) {
      return 1.0;
    }
    return (longerLength - getLevenshteinDistance(longer, shorter)) / longerLength;
  };

  // Helper: Score subject match against query
  const getSubjectScore = (cleanQ: string, subjectName: string): number => {
    const qLower = cleanQ.toLowerCase().trim();
    const sLower = subjectName.toLowerCase().trim();

    if (!qLower) return 0;

    // Exact or substring match (high score)
    if (sLower.includes(qLower)) {
      return 1.0 + (qLower.length / sLower.length) * 0.5;
    }
    if (qLower.includes(sLower)) {
      return 1.0 + (sLower.length / qLower.length) * 0.5;
    }

    // Abbreviation match
    const words = sLower.split(/\s+/);
    const abbreviation = words.map(w => w[0]).join('');
    if (abbreviation.length >= 2 && qLower.includes(abbreviation)) {
      return 1.2;
    }

    // Word similarity match
    const qWords = qLower.split(/\s+/);
    const sWords = sLower.split(/\s+/);
    let totalScore = 0;
    let matches = 0;

    for (const qw of qWords) {
      if (qw.length < 3) continue;
      let maxWordSim = 0;
      for (const sw of sWords) {
        if (sw.length < 3) continue;
        const sim = getSimilarity(qw, sw);
        if (sim > maxWordSim) {
          maxWordSim = sim;
        }
      }
      if (maxWordSim > 0.75) {
        totalScore += maxWordSim;
        matches++;
      }
    }

    if (matches > 0) {
      return totalScore / qWords.filter(w => w.length >= 3).length;
    }

    return 0;
  };

  // Helper: Score resource title match against query
  const getResourceScore = (cleanQ: string, resourceTitle: string): number => {
    const qLower = cleanQ.toLowerCase().trim();
    const rLower = resourceTitle.toLowerCase().trim();

    if (!qLower) return 0;

    if (rLower.includes(qLower)) {
      return 1.0 + (qLower.length / rLower.length) * 0.5;
    }
    if (qLower.includes(rLower)) {
      return 1.0 + (rLower.length / qLower.length) * 0.5;
    }

    const qWords = qLower.split(/\s+/);
    const rWords = rLower.split(/\s+/);
    let totalScore = 0;
    let matches = 0;

    for (const qw of qWords) {
      if (qw.length < 3) continue;
      let maxWordSim = 0;
      for (const rw of rWords) {
        if (rw.length < 3) continue;
        const sim = getSimilarity(qw, rw);
        if (sim > maxWordSim) {
          maxWordSim = sim;
        }
      }
      if (maxWordSim > 0.75) {
        totalScore += maxWordSim;
        matches++;
      }
    }

    if (matches > 0) {
      return totalScore / qWords.filter(w => w.length >= 3).length;
    }

    return 0;
  };

  // Helper: Detect resource type from query
  const detectType = (query: string): 'Notes' | 'Assignment' | 'PYQ' | null => {
    const q = query.toLowerCase();
    if (q.includes('note')) return 'Notes';
    if (q.includes('assignment') || q.includes('task') || q.includes('hw') || q.includes('homework')) return 'Assignment';
    if (q.includes('pyq') || q.includes('question paper') || q.includes('previous year') || q.includes('paper')) return 'PYQ';
    return null;
  };

  // Helper: Clean resource keywords out of query text
  const cleanQuery = (query: string): string => {
    return query
      .toLowerCase()
      .replace(/\b(notes?|materials?|assignments?|tasks?|hw|homeworks?|pyqs?|question papers?|papers?|previous years?)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper UI extractions
  const getUnitNumber = (res: NoteType): string | null => {
    const titleMatch = res.title.match(/unit\s*(\d+)/i)?.[0];
    const descMatch = res.description?.match(/unit\s*(\d+)/i)?.[0];
    return titleMatch || descMatch || null;
  };

  const getDueDate = (res: NoteType): string | null => {
    const descMatch = res.description?.match(/due\s*date:\s*([^\n]+)/i)?.[1] || res.description?.match(/due\s*:\s*([^\n]+)/i)?.[1];
    return descMatch || null;
  };

  const getPYQYear = (res: NoteType): string | null => {
    const titleMatch = res.title.match(/\b(20\d{2})\b/)?.[0];
    const descMatch = res.description?.match(/\b(20\d{2})\b/)?.[0];
    return titleMatch || descMatch || null;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    // Add user message
    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: query
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputVal('');

    // Process Query
    setTimeout(() => {
      processBotResponse(query);
    }, 450);
  };

  const processBotResponse = (query: string) => {
    const type = detectType(query);
    const cleanQ = cleanQuery(query);

    // Find best matching subject
    let matchedSubject: SubjectType | null = null;
    let highestSubjectScore = 0;
    for (const sub of subjects) {
      const score = getSubjectScore(cleanQ, sub.name);
      if (score > highestSubjectScore && score >= 0.6) {
        highestSubjectScore = score;
        matchedSubject = sub;
      }
    }

    // Find matching notes by title
    const scoredNotes = notes
      .map(n => ({ note: n, score: getResourceScore(cleanQ, n.title) }))
      .filter(item => item.score >= 0.6)
      .sort((a, b) => b.score - a.score);

    // 1. Subject-only Query Handling (No resource type given)
    if (type === null && matchedSubject && cleanQ.length > 0 && highestSubjectScore >= 0.8) {
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: `What do you want for **${matchedSubject.name}**?`,
        optionSubject: matchedSubject
      };
      setMessages(prev => [...prev, botResponse]);
      return;
    }

    // 2. Resource type is specified
    if (type) {
      let results: NoteType[] = [];

      // Add by subject
      if (matchedSubject) {
        results = notes.filter(n => n.subjectId?._id === matchedSubject?._id && n.type === type);
      }

      // Add by resource title matching score
      const titleMatches = scoredNotes
        .filter(item => item.note.type === type)
        .map(item => item.note);

      results = [...results, ...titleMatches].filter((note, index, self) =>
        self.findIndex(n => n._id === note._id) === index
      );

      if (results.length > 0) {
        // Direct results matching exact type
        const botResponse: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Here are the **${type}** matching your query:`,
          resources: results
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        // No exact type found, search related resources of other types
        let related: NoteType[] = [];
        if (matchedSubject) {
          related = notes.filter(n => n.subjectId?._id === matchedSubject?._id);
        } else {
          related = scoredNotes.map(item => item.note);
        }

        if (related.length > 0) {
          const botResponse: Message = {
            id: Date.now().toString(),
            sender: 'bot',
            text: `No exact **${type}** found, but I found some related resources:`,
            resources: related
          };
          setMessages(prev => [...prev, botResponse]);
        } else {
          const botResponse: Message = {
            id: Date.now().toString(),
            sender: 'bot',
            text: `No related resources found for your branch and semester.`,
            emptyState: true
          };
          setMessages(prev => [...prev, botResponse]);
        }
      }
      return;
    }

    // 3. Fallback: Search general query (no type specified, e.g. "normalization")
    let results: NoteType[] = [];
    if (matchedSubject) {
      results = notes.filter(n => n.subjectId?._id === matchedSubject?._id);
    }
    
    const titleMatches = scoredNotes.map(item => item.note);
    results = [...results, ...titleMatches].filter((note, index, self) =>
      self.findIndex(n => n._id === note._id) === index
    );

    if (results.length > 0) {
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: `I found some related resources:`,
        resources: results
      };
      setMessages(prev => [...prev, botResponse]);
    } else {
      // Type is not specified and query matches nothing -> check if cleanQ is empty or a resource command
      if (cleanQ.length === 0) {
        // user just typed "notes" or similar command without subject name -> trigger subject list prompt
        const botResponse: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Which subject resources would you like?`,
          subjectSelection: true,
          resourceType: 'Notes' // default fallback
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        const botResponse: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `No related resources found for your branch and semester.`,
          emptyState: true
        };
        setMessages(prev => [...prev, botResponse]);
      }
    }
  };

  // Clicking an option button (Notes / Assignment / PYQ) for a subject
  const handleSubjectTypeSelection = (subject: SubjectType, type: 'Notes' | 'Assignment' | 'PYQ') => {
    // Add user choice to messages
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: `${subject.name} - ${type}`
    };

    // Filter notes
    const results = notes.filter(n => n.subjectId?._id === subject._id && n.type === type);

    if (results.length > 0) {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `Here are the **${type}** for **${subject.name}**:`,
        resources: results
      };
      setMessages(prev => [...prev, userMsg, botResponse]);
    } else {
      // related resources
      const related = notes.filter(n => n.subjectId?._id === subject._id);
      if (related.length > 0) {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `No exact **${type}** found for **${subject.name}**, but I found some related resources:`,
          resources: related
        };
        setMessages(prev => [...prev, userMsg, botResponse]);
      } else {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `No related resources found for your branch and semester.`,
          emptyState: true
        };
        setMessages(prev => [...prev, userMsg, botResponse]);
      }
    }
  };

  // Clicking a subject list card when prompted
  const handleSubjectClick = (selectedSubject: SubjectType, resourceType: 'Notes' | 'Assignment' | 'PYQ') => {
    handleSubjectTypeSelection(selectedSubject, resourceType);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        title="Resource Assistant Chatbot"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-2.5 -right-2.5 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="fixed bottom-36 sm:bottom-24 right-6 w-[340px] sm:w-[400px] h-[520px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 pb-5 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-white">Resource Assistant</h3>
                <div className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider mt-0.5">
                  {user?.branch} • Semester {user?.semester}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-indigo-100 hover:text-white p-1.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender Name */}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold px-1">
                  {msg.sender === 'user' ? 'You' : 'Assistant'}
                </span>

                {/* Message Bubble */}
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/80 rounded-tl-none shadow-xs'
                }`}>
                  {msg.text}
                </div>

                {/* Subject List Selection */}
                {msg.subjectSelection && msg.resourceType && (
                  <div className="flex flex-col gap-2 w-full max-w-[85%] mt-1.5 pl-1">
                    {subjects.map((sub) => (
                      <button
                        key={sub._id}
                        onClick={() => handleSubjectClick(sub, msg.resourceType!)}
                        className="w-full p-3 bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center justify-between text-left text-xs font-black text-slate-850 dark:text-slate-200 group hover:shadow-xs"
                      >
                        <span className="truncate">{sub.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
                      </button>
                    ))}
                    {subjects.length === 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">No subjects configured for your semester.</p>
                    )}
                  </div>
                )}

                {/* Subject-only Options Selection */}
                {msg.optionSubject && (
                  <div className="flex flex-wrap gap-2 mt-1.5 pl-1 w-full max-w-[85%]">
                    {['Notes', 'Assignment', 'PYQ'].map((t) => (
                      <button
                        key={t}
                        onClick={() => handleSubjectTypeSelection(msg.optionSubject!, t as any)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 rounded-xl text-xs font-black transition-all shadow-xs active:scale-95"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}

                {/* Resource Cards Layout List */}
                {msg.resources && msg.resources.length > 0 && (
                  <div className="grid grid-cols-1 gap-2.5 w-full mt-2 pl-1">
                    {msg.resources.map((res) => {
                      const isNote = res.type === 'Notes';
                      const isAssignment = res.type === 'Assignment';
                      const isPYQ = res.type === 'PYQ';

                      return (
                        <div 
                          key={res._id}
                          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs flex flex-col space-y-3"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">
                                {isNote ? '📚' : isAssignment ? '📝' : '📄'}
                              </span>
                              <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-slate-50 text-xs line-clamp-2">
                                  {res.title}
                                </h4>
                                <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-extrabold block mt-0.5">
                                  {res.subjectId?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Unit / Due Date / Year styled meta boxes */}
                          {isNote && (
                            <div className="flex items-center justify-between text-[11px] text-slate-555 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span>Unit:</span>
                              <span className="text-slate-750 dark:text-slate-350 font-black">{getUnitNumber(res) || 'General Note'}</span>
                            </div>
                          )}
                          
                          {isAssignment && (
                            <div className="flex items-center justify-between text-[11px] text-slate-555 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span>Due Date:</span>
                              <span className="text-slate-750 dark:text-slate-355 font-black">{getDueDate(res) || 'N/A'}</span>
                            </div>
                          )}

                          {isPYQ && (
                            <div className="flex items-center justify-between text-[11px] text-slate-555 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span>Year:</span>
                              <span className="text-slate-750 dark:text-slate-355 font-black">{getPYQYear(res) || new Date(res.createdAt).getFullYear()}</span>
                            </div>
                          )}

                          {res.description && !isNote && !isAssignment && !isPYQ && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {res.description}
                            </p>
                          )}

                          <div className="flex gap-2 border-t border-slate-100 dark:border-slate-750 pt-2.5 shrink-0">
                            <button
                              onClick={() => setViewingPdf({ url: res.fileUrl, title: res.title })}
                              className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-750 dark:text-indigo-300 rounded-xl text-[10px] font-black transition-colors flex items-center justify-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadFile(res.fileUrl, res.title)}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl text-[10px] font-black transition-colors flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-700"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State warning */}
                {msg.emptyState && (
                  <div className="w-full max-w-[85%] mt-1 pl-1 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100/50 dark:border-amber-900/20 p-3 rounded-2xl text-amber-700 dark:text-amber-400 text-xs font-bold leading-normal">
                    No related resources found for your branch and semester.
                  </div>
                )}

              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Form Bar */}
          <form 
            onSubmit={handleSend}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. methematics notes, chemistry, dbms PYQ..."
              className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs font-extrabold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl disabled:opacity-40 transition-colors flex items-center justify-center shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>



        </div>
      )}

      {/* Embedded PDF Viewer Modal */}
      {viewingPdf && (
        <PDFViewerModal
          url={viewingPdf.url}
          title={viewingPdf.title}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </>
  );
};

export default StudentChatbot;

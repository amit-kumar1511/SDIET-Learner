import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Sparkles, BookOpen, ArrowLeft, Send, Volume2, VolumeX, Square, 
  Download, Copy, Plus, Check, 
  FileText, Activity, RotateCcw, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

interface SubjectType {
  _id: string;
  name: string;
  branch: string;
  semester: number;
}

interface MessageType {
  _id?: string;
  sender: 'user' | 'model';
  content: string;
  createdAt?: string;
}

interface AISessionType {
  _id: string;
  topic: string;
  mode: string;
  title: string;
  isActive: boolean;
  subjectId: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const AITeacherPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // Settings / selectors
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [semester, setSemester] = useState<number>(user?.semester || 1);
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'Explain Topic' | 'Quick Summary' | 'Viva Questions' | 'MCQ Generator' | 'Revision Mode'>('Explain Topic');
  
  // Active session state
  const [activeSession, setActiveSession] = useState<AISessionType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  
  // UI states
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Immersive layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Audio / Speech Synthesis state
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Layout references
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchSubjects();
    return () => {
      stopSpeaking();
    };
  }, []);

  // Sync state if window size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false); // Default closed on tablets and mobiles
      } else {
        setIsSidebarOpen(true); // Default open on large displays
      }
    };
    handleResize(); // run once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger scroll to bottom on message length/state updates
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Load session from parameter
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      setActiveSession(null);
      setMessages([]);
      stopSpeaking();
    }
  }, [sessionId]);

  const fetchSubjects = async () => {
    try {
      const { data } = await axios.get('/api/subjects');
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load course subjects.');
    }
  };



  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !topic.trim()) {
      toast.error('Please select a subject and input a study topic.');
      return;
    }

    setIsStarting(true);
    stopSpeaking();

    try {
      const { data } = await axios.post('/api/ai/sessions', {
        subjectId: selectedSubjectId,
        semester,
        topic: topic.trim(),
        mode,
      });

      setTopic(''); // Reset input
      toast.success('AI Teacher Session initialized!');
      navigate(`/ai-teacher/session/${data.session._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize session');
    } finally {
      setIsStarting(false);
    }
  };

  const loadSession = async (targetSessionId: string) => {
    stopSpeaking();
    try {
      const { data } = await axios.get(`/api/ai/sessions/${targetSessionId}`);
      setActiveSession(data.session);
      setMessages(data.messages);
      
      // Auto speak welcome back message if it's the only one
      if (data.messages?.length === 1 && data.messages[0].sender === 'model') {
        speakText(data.messages[0].content);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load this session.');
      navigate('/ai-teacher');
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    try {
      await axios.patch(`/api/ai/sessions/${activeSession._id}/end`);
      setActiveSession(prev => prev ? { ...prev, isActive: false } : null);
      toast.success('Session has ended.');
      stopSpeaking();
    } catch (err) {
      toast.error('Could not terminate session.');
    }
  };

  const clearChat = async () => {
    if (!activeSession) return;
    try {
      const { data } = await axios.delete(`/api/ai/sessions/${activeSession._id}/chat`);
      setMessages([data.welcomeMessage]);
      stopSpeaking();
      toast.success('Chat history cleared!');
    } catch (err) {
      toast.error('Could not clear history.');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeSession) return;

    const userQuery = chatInput.trim();
    setChatInput('');
    setIsSending(true);
    stopSpeaking();

    // Optimistically add user core message
    const tempUserMsg: MessageType = { sender: 'user', content: userQuery, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const { data } = await axios.post('/api/ai/chat', {
        sessionId: activeSession._id,
        prompt: userQuery,
      });

      setMessages(prev => [...prev.filter(m => m._id || m.content !== userQuery), data.userMessage, data.aiMessage]);
      speakText(data.aiMessage.content);
    } catch (err) {
      toast.error('AI response failed. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // --- Speech synthesis engine logic ---
  const speakText = (text: string) => {
    if (isSpeechMuted) return;

    // browser speech support check
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); // kill active streams

    // Sanitize message block for reading (strip markdown tags)
    const voiceText = text
      .replace(/[\*\#\`\_]/g, '') // remove markdown signs
      .replace(/\[.*?\]/g, '') // omit bracket tags
      .replace(/\{.*?\}/g, '') // omit curly brackets
      .substring(0, 400); // safety length boundary for speaking loops

    const utterance = new SpeechSynthesisUtterance(voiceText);
    
    // Choose voice preferably English Female
    const voices = window.speechSynthesis.getVoices();
    const optimalVoice = voices.find(v => v.lang.includes('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('zira'))) || voices[0];
    
    if (optimalVoice) {
      utterance.voice = optimalVoice;
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const triggerMuteToggle = () => {
    if (!isSpeechMuted) {
      stopSpeaking();
    }
    const newMuted = !isSpeechMuted;
    setIsSpeechMuted(newMuted);
    toast.success(newMuted ? 'Voice output muted' : 'Voice output enabled');
  };

  // Copy button helper
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied text!');
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1200);
  };

  // Download Session Transcript as PDF helper
  const downloadSessionPDF = () => {
    if (!activeSession) return;
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('AI Teacher Session Transcript', 20, 20);

      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Subject: ${activeSession.subjectId?.name || 'Academic Course'}`, 20, 28);
      doc.text(`Topic: ${activeSession.topic}`, 20, 34);
      doc.text(`Mode: ${activeSession.mode}`, 20, 40);
      doc.text(`Date: ${new Date(activeSession.createdAt).toLocaleDateString()}`, 20, 46);

      doc.setDrawColor(99, 102, 241);
      doc.line(20, 50, 190, 50);

      let yPos = 60;
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);

      messages.forEach((msg) => {
        const senderLabel = msg.sender === 'user' ? 'Student: ' : 'Dr. Aisha (AI): ';
        doc.setFont('Helvetica', 'bold');
        if (msg.sender === 'model') {
          doc.setTextColor(79, 70, 229);
        } else {
          doc.setTextColor(31, 41, 55);
        }

        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(senderLabel, 20, yPos);
        yPos += 5;

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        
        // Strip markdown before saving to pdf
        const cleanContent = msg.content
          .replace(/[\*\#]/g, '')
          .trim();

        const wrappedLines = doc.splitTextToSize(cleanContent, 160);
        wrappedLines.forEach((line: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 22, yPos);
          yPos += 5;
        });

        yPos += 5; // spacing
      });

      const cleanFileName = `Ai_Tutor_Session_${activeSession.topic.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(cleanFileName);
      toast.success('Transcript PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF download');
    }
  };

  // Basic custom markdown formatter to render lists / math formulas / headings beautifully
  const renderSimpleMarkdown = (text: string) => {
    if (!text) return '';
    
    // Split lines
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Header check
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight mt-3 mb-1">{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} className="text-base font-black text-indigo-700 dark:text-indigo-400 tracking-tight mt-4 mb-2">{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={idx} className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-5 mb-2">{trimmed.replace('#', '').trim()}</h2>;
      }

      // Check lists
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemText = trimmed.replace(/^[\*\-]\s*/, '');
        return (
          <ul key={idx} className="list-disc list-inside ml-4 space-y-1 my-1 text-slate-700 dark:text-slate-300">
            <li>{parseInlineBold(itemText)}</li>
          </ul>
        );
      }

      // Check number lists
      if (/^\d+\.\s*/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s*/, '');
        return (
          <ol key={idx} className="list-decimal list-inside ml-4 space-y-1 my-1 text-slate-700 dark:text-slate-300">
            <li>{parseInlineBold(itemText)}</li>
          </ol>
        );
      }

      // Check raw block code
      if (trimmed.startsWith('```')) {
        return null; // ignore boundary lines
      }

      // General paragraph
      return (
        <p key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed my-2 text-sm">
          {parseInlineBold(trimmed)}
        </p>
      );
    });
  };

  // Helper to convert **text** to <strong> tags in list items / paragraphs
  const parseInlineBold = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-slate-50">{part}</strong>;
      }
      return part;
    });
  };

  // --- RENDERING ROUTE: /ai-teacher/session/:sessionId (Immersive ChatGPT UI) ---
  if (sessionId) {
    return (
      <div className="w-full h-[calc(100vh-10rem)] min-h-[580px] flex rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl relative transitions-all">
        
        {/* Dynamic Sidebar Overlay backdrop on mobile */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30"
          />
        )}

        {/* --- ChatGPT-Style Sidebar --- */}
        <aside 
          className={`shrink-0 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 flex flex-col z-40 transition-all duration-300 absolute lg:static ${
            isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0 overflow-hidden'
          }`}
        >
          {/* Sidebar Header with New Chat Initiator */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">AI Teacher Suite</span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1.5 h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                navigate('/ai-teacher');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>New Study Session</span>
            </button>
          </div>

          {/* Sidebar info placeholder */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center space-y-2 text-slate-400 dark:text-slate-500">
              <Sparkles className="w-6 h-6 mx-auto opacity-30" />
              <p className="text-[10px] font-bold">Start a new session to begin learning.</p>
            </div>
          </div>

          {/* Sidebar Footer Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/85 bg-slate-100/50 dark:bg-slate-900/60 flex flex-col gap-2 shrink-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-2 p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 animate-pulse" />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/ai-teacher')}
              className="w-full flex items-center space-x-2 p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Create Session Page</span>
            </button>
          </div>
        </aside>

        {/* --- Main Chat Workspace Panel (Full Screen) --- */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0 h-full relative">
          
          {/* Header Bar */}
          <header className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              
              {/* Trigger Toggle Sidebar button */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all" 
                title="Toggle Session Info Sidebar"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

              {activeSession ? (
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-[350px]">
                    {activeSession.topic}
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    Mode: <span className="text-violet-600 dark:text-violet-400">{activeSession.mode}</span> • {activeSession.subjectId?.name}
                  </p>
                </div>
              ) : (
                <div className="h-5 w-32 bg-slate-100 dark:bg-slate-900 animate-pulse rounded"></div>
              )}
            </div>

            {/* toolbar action controls */}
            {activeSession && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={triggerMuteToggle}
                  className={`p-2 rounded-xl transition-all border ${
                    isSpeechMuted 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40 text-red-600' 
                      : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  }`}
                  title={isSpeechMuted ? 'Unmute Dr. Aisha Voice Output' : 'Mute Voice Output'}
                >
                  {isSpeechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="flex items-center space-x-1.5 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px]"
                    title="Stop speaking"
                  >
                    <Square className="w-3 h-3 text-red-500 fill-red-500" />
                    <span className="hidden sm:inline">Stop Audio</span>
                  </button>
                )}

                <button
                  onClick={downloadSessionPDF}
                  className="flex items-center space-x-1.5 p-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-[10px] transition-all"
                  title="Download Chat Session as PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">PDF</span>
                </button>

                <button
                  onClick={clearChat}
                  className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950 border border-orange-100 dark:border-orange-900/40"
                  title="Clear Chat History"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {activeSession.isActive && (
                  <button
                    onClick={endSession}
                    className="flex items-center space-x-1 p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black transition-all shadow-sm shrink-0"
                  >
                    <Square className="w-3 h-3" />
                    <span className="hidden sm:inline">End Session</span>
                  </button>
                )}
              </div>
            )}
          </header>

          {/* Central Workspace: Avatar Panel & Message Box */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/20 dark:bg-slate-950/20 overflow-hidden">
            
            {/* Embedded Mini Avatar indicator */}
            <div className="w-full md:w-44 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-900/80 bg-slate-50/40 dark:bg-slate-900/40 p-4 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3">
              <div className="flex items-center md:flex-col md:text-center space-x-3 md:space-x-0 md:space-y-2.5">
                
                {/* Micro-Animated Robot display Visor */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-gradient-to-tr from-slate-950 to-indigo-950 shadow-inner overflow-hidden border border-indigo-500/20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent animate-pulse"></div>
                  
                  {/* Concentric waves */}
                  <svg className="w-full h-full absolute" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={isSpeaking ? "38" : "28"} fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1">
                      {isSpeaking && <animate attributeName="r" values="24;44;24" dur="1.2s" repeatCount="indefinite" />}
                    </circle>
                  </svg>

                  {/* Robot Face Visuals */}
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
                    {/* Vision bar */}
                    <div className="flex items-center space-x-2 bg-violet-900/40 px-2 py-0.5 rounded-full border border-violet-500/30">
                      <div className={`w-1.5 h-1.5 rounded-full bg-violet-400 ${isSpeaking ? 'animate-bounce shadow-[0_0_8px_rgba(167,139,250,1)]' : 'shadow-[0_0_4px_rgba(167,139,250,0.5)]'}`}></div>
                      <div className={`w-1.5 h-1.5 rounded-full bg-violet-400 ${isSpeaking ? 'animate-bounce shadow-[0_0_8px_rgba(167,139,250,1)]' : 'shadow-[0_0_4px_rgba(167,139,250,0.5)]'}`} style={{ animationDelay: '0.15s' }}></div>
                    </div>

                    {/* Speaking oscillator bars */}
                    <div className="flex items-center justify-center space-x-1 h-3.5 mt-0.5">
                      <div className={`w-[3px] bg-violet-400 rounded-full transition-all duration-300 ${isSpeaking ? 'h-3 animate-[pulse_0.4s_infinite_alternate]' : 'h-1'}`}></div>
                      <div className={`w-[3px] bg-indigo-400 rounded-full transition-all duration-300 ${isSpeaking ? 'h-4 animate-[pulse_0.6s_infinite_alternate]' : 'h-1.5'}`} style={{ animationDelay: '0.1s' }}></div>
                      <div className={`w-[3px] bg-pink-400 rounded-full transition-all duration-300 ${isSpeaking ? 'h-[10px] animate-[pulse_0.5s_infinite_alternate]' : 'h-1'}`} style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight block">Dr. Aisha (AI)</h4>
                  <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 mt-0.5 inline-flex rounded-full tracking-wider ${
                    isSpeaking ? 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {isSpeaking ? 'Speaking Voce' : 'Ready'}
                  </span>
                </div>
              </div>

              <div className="hidden md:block text-center text-[9px] text-slate-400 dark:text-slate-500 font-bold border-t border-slate-100 dark:border-slate-900 pt-3 px-1 mt-2">
                <p>Aisha maps search matches from notes.</p>
              </div>
            </div>

            {/* Chat Terminal Area */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-50/20 dark:bg-slate-950/20 relative">
              
              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map((msg, index) => {
                  const isAI = msg.sender === 'model';
                  return (
                    <div 
                      key={index} 
                      className={`flex ${isAI ? 'justify-start' : 'justify-end'} group`}
                    >
                      <div className="flex flex-col space-y-1 max-w-[85%]">
                        
                        {/* Sender Label */}
                        <div className={`flex items-center space-x-1 p-1 text-[9px] text-slate-400 font-bold ${
                          isAI ? 'justify-start' : 'justify-end'
                        }`}>
                          <span>{isAI ? 'Dr. Aisha' : user?.name || 'Student'}</span>
                        </div>

                        {/* Content Card layout */}
                        <div className={`relative px-4 py-3 rounded-2xl md:rounded-3xl ${
                          isAI 
                            ? 'bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs' 
                            : 'bg-indigo-600 text-white rounded-br-sm'
                        }`}>
                          
                          {/* Inner formatting HTML */}
                          <div className="break-words select-text">
                            {isAI ? (
                              <div className="space-y-1">
                                {renderSimpleMarkdown(msg.content)}
                              </div>
                            ) : (
                              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>

                          {/* Utility hover buttons */}
                          {isAI && (
                            <div className="absolute right-2 -bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1.5 z-10">
                              <button
                                onClick={() => copyToClipboard(msg.content, index)}
                                className="p-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-all border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                                title="Copy Text"
                              >
                                {copiedIndex === index ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => speakText(msg.content)}
                                className="p-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                                title="Speak Voice"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Sending loader bubble */}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold ml-2">Dr. Aisha is composing answer...</span>
                      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-3.5 px-4 rounded-2xl flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Bottom sending input panel */}
              <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
                {!activeSession ? (
                  <div className="flex items-center justify-center p-3 text-xs text-slate-400 font-bold max-w-4xl mx-auto animate-pulse">
                    Loading session workspace...
                  </div>
                ) : activeSession.isActive ? (
                  <form onSubmit={sendMessage} className="flex gap-2.5 items-center max-w-4xl mx-auto w-full">
                    <input
                      type="text"
                      placeholder={`Ask Dr. Aisha any queries regarding "${activeSession.topic}"...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isSending}
                      className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-3 flex items-center space-x-3 text-amber-700 dark:text-amber-400 max-w-4xl mx-auto">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">
                      This active tutoring block has ended. To restart or create fresh ones, kindly trigger a new Study Session on the left side archives panel!
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </main>
      </div>
    );
  }

  // --- RENDERING ROUTE: /ai-teacher (Portal Setup & Past logs dashboard) ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-6 p-1 md:p-4 animate-fade-in">
      
      {/* Upper header back link */}
      <div className="flex items-center justify-between pb-1">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <span className="flex items-center space-x-1.5 px-3 py-1 bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-full text-[10px] uppercase font-black tracking-widest animate-pulse">
          <Activity className="w-3 h-3" />
          <span>Core Online</span>
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Setup Panel Controls Column */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md space-y-6">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-4">AI Teacher Studio</h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-1">Syllabus-locked interactive tutor</span>
              </div>
            </div>

            <form onSubmit={startSession} className="space-y-4 pt-2">
              
              {/* Course SubjectSelector */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Course Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {subjects.length > 0 ? (
                    subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} (Sem {sub.semester})
                      </option>
                    ))
                  ) : (
                    <option value="">No Subjects Found</option>
                  )}
                </select>
              </div>

              {/* Course Semester lock */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Course Semester</label>
                {user?.role === 'STUDENT' ? (
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Semester {semester} Locked (Syllabus Auto-Matched)
                  </div>
                ) : (
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Study modes Selector */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tutor Study Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="Explain Topic">🧑‍🏫 Explain Topic</option>
                  <option value="Quick Summary">📝 Quick Summary</option>
                  <option value="Viva Questions">❓ Viva Questions</option>
                  <option value="MCQ Generator">💯 MCQ Generator</option>
                  <option value="Revision Mode">⚡ Revision Mode</option>
                </select>
              </div>

              {/* Topic input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Study Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Memory allocation, Stack vs Heap, CPU scheduling"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-xl p-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl py-4 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isStarting ? 'Setting Up Workspace...' : 'Begin Study Session'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Features Bento Dashboard Column */}
        <div className="flex-1 space-y-6">
          
          {/* Quick-Help Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex space-x-3.5">
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                <BookOpen className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 tracking-tight">Direct Notes Integration</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal mt-1">
                  Dr. Aisha dynamically references and scans your uploaded PDF materials, presentations, notes, and study sheets of the matching course.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex space-x-3.5">
              <div className="w-11 h-11 bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0">
                <Volume2 className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 tracking-tight">Audio Voice Broadcast</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal mt-1">
                  Enables text-to-speech audio feedback. The AI teacher reads explained paragraphs aloud in a realistic teaching rhythm.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex space-x-3.5">
              <div className="w-11 h-11 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 tracking-tight">Targeted Study Modes</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal mt-1">
                  Switch the dialogue flavor on-the-fly. Choose Viva prep questions, quick summary sheets, exam generators, or standard tutoring.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm flex space-x-3.5">
              <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                <Download className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-105 tracking-tight">Structured Document Exports</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal mt-1">
                  Compile your full workspace interactive sessions directly into clean formatted text and standard student report PDFs anytime.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AITeacherPage;

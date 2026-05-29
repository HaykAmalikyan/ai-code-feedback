import { useState, useEffect, useCallback } from 'react';
import { syntaxTree } from '@codemirror/language';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

const LANGUAGES = [
  "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "HTML/CSS", "SQL"
];

const getLanguageExtension = (lang) => {
  switch (lang) {
    case "JavaScript": return javascript();
    case "TypeScript": return javascript({ typescript: true });
    case "Java": return java();
    case "C":
    case "C++":
    case "C#": return cpp();
    case "HTML/CSS": return html();
    case "SQL": return sql();
    case "Python":
    default: return python();
  }
};
import { Send, Loader2, Lightbulb, ChevronDown, ChevronUp, Star, Clock, History } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import RatingModal from './RatingModal';
import { API_BASE_URL } from '../config';

export default function MainScreen({ user, setUser }) {
  const [code, setCode] = useState('# Write or paste your code here...\n\n');
  const [language, setLanguage] = useState("Python");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const [error, setError] = useState(null);
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/history/${user.firstName}/${user.lastName}`);
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleHistoryClick = (item) => {
    setCode(item.submittedCode || "");
    setFeedback({
      feedback: item.aiFeedback,
      tips: item.aiTips,
      score: item.score
    });
    setShowTips(false);
    setError(null);
    setSyntaxErrors([]);
  };

  const onUpdate = useCallback((update) => {
    if (update.docChanged) {
      const errors = [];
      syntaxTree(update.state).iterate({
        enter: (node) => {
          if (node.type.isError) {
            const line = update.state.doc.lineAt(node.from).number;
            errors.push({ line, message: `Syntax error near line ${line}` });
          }
        }
      });
      // Deduplicate by line
      const uniqueErrors = Array.from(new Set(errors.map(e => e.line)))
        .map(line => errors.find(e => e.line === line));
      setSyntaxErrors(uniqueErrors);
    }
  }, []);

  const handleGetFeedback = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    setShowTips(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/feedback`, {
        firstName: user.firstName,
        lastName: user.lastName,
        code: code,
        language: language,
        errors: syntaxErrors.map(e => e.message)
      });
      let data = response.data;
      if (data && data.feedback && typeof data.feedback === 'string' && data.feedback.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(data.feedback);
          if (parsed.feedback) data.feedback = parsed.feedback;
          if (parsed.tips) data.tips = parsed.tips;
          if (parsed.score) data.score = parsed.score;
        } catch (e) {
          console.error("Failed to parse nested JSON in feedback", e);
        }
      }
      setFeedback(data);
      // Refresh history after new submission
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to get feedback. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 lg:p-8 gap-6 relative">
      
      {/* Sidebar: History */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 shadow-lg flex flex-col h-[calc(100vh-8rem)] sticky top-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200">
            <History className="w-5 h-5 text-brand-400" />
            History
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-8">
                No previous submissions yet.
              </div>
            ) : (
              history.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left bg-dark-900 border border-dark-700 hover:border-brand-500/50 p-3 rounded-lg transition-colors group flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
                      Score: {item.score}/10
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 line-clamp-2 font-mono bg-dark-800 p-2 rounded border border-dark-700 group-hover:border-dark-600 transition-colors">
                    {item.submittedCode || "No code"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 w-full max-w-4xl">
        
        {/* Rate the App Button */}
        {!user.hasRated && (
          <div className="flex justify-end">
            <button 
              onClick={() => setShowRatingModal(true)}
              className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <Star className="w-4 h-4 fill-current" />
              Rate the App
            </button>
          </div>
        )}

        {/* Intro */}
        <section className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-xl font-semibold mb-2">How it works</h2>
          <p className="text-gray-400">
            Paste your code below and click <span className="text-white font-medium">Get Feedback</span>. 
            Our AI tutor will explain your mistakes in plain language to help you learn, 
            without giving away the exact answer.
          </p>
        </section>

        {/* Editor Area */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="language-select" className="text-sm font-medium text-gray-300">
              Select your programming language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500 transition-colors w-full sm:w-64"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl overflow-hidden border border-dark-700 shadow-lg">
            <div className="bg-[#1e1e1e] border-b border-dark-700 px-4 py-2 flex items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <span className="ml-4 text-xs font-mono text-gray-500">main.py</span>
            </div>
            <CodeMirror
              value={code}
              height="400px"
              theme={vscodeDark}
              extensions={[getLanguageExtension(language)]}
              onChange={(val) => setCode(val)}
              onUpdate={onUpdate}
              className="text-base"
            />
            {syntaxErrors.length > 0 && (
              <div className="bg-red-500/10 border-t border-dark-700 p-3 space-y-1">
                <div className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Detected Issues
                </div>
                {syntaxErrors.map((err, idx) => (
                  <div key={idx} className="text-red-300 text-sm font-mono">
                    • {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end items-center gap-4">
            {error && <span className="text-red-400 text-sm">{error}</span>}
            <button
              onClick={handleGetFeedback}
              disabled={isLoading || !code.trim()}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-brand-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Code...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Get Feedback
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Area */}
        {feedback && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            
            {/* Main Feedback Box */}
            <div className="bg-dark-800 border border-brand-500/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-brand-400" />
                  Tutor's Feedback
                </h3>
                
                <div className="flex items-center gap-2 bg-dark-900 px-3 py-1.5 rounded-full border border-dark-700">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                  <span className="text-sm font-medium">Code Score: {feedback.score}/10</span>
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{feedback.feedback}</ReactMarkdown>
              </div>
            </div>

            {/* Tips Accordion */}
            {feedback.tips && feedback.tips !== "N/A" && (
              <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setShowTips(!showTips)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-dark-700/50 transition-colors"
                >
                  <span className="font-medium text-gray-300">Optional: Code Quality Tips</span>
                  {showTips ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
                
                {showTips && (
                  <div className="px-6 pb-6 pt-2 border-t border-dark-700/50">
                    <div className="prose prose-invert max-w-none text-sm text-gray-400">
                      <ReactMarkdown>{feedback.tips}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

          </section>
        )}
        
        {/* Pad bottom */}
        <div className="h-12"></div>
      </div>

      {showRatingModal && (
        <RatingModal 
          user={user} 
          setUser={setUser} 
          onClose={() => setShowRatingModal(false)} 
        />
      )}
    </div>
  );
}


import { useState, useRef, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell as RechartsCell
} from 'recharts';
import { 
  Send, 
  Copy, 
  Download, 
  Sparkles, 
  Terminal, 
  Database,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import toast, { Toaster } from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sql?: string;
  columns?: string[];
  rows?: any[];
  chartType?: 'line' | 'bar' | 'table';
}

export default function AskAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Hello! I am your InsightFlow AI analyst. Ask me any question about your active dataset, and I will write the SQL, run it, and visualize the output for you.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Active query results (displayed on the right-hand panel)
  const [activeResult, setActiveResult] = useState<{
    sql: string;
    columns: string[];
    rows: any[];
    chartType: 'line' | 'bar' | 'table';
  } | null>(null);

  const [isSqlCollapsed, setIsSqlCollapsed] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const suggestions = [
    'Show me revenue by month this year',
    'Which product has the highest return rate?',
    'Compare sales between Q1 and Q2',
    'Top 5 customers by lifetime value'
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Append User Message
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = { id: userMsgId, sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/query/nl', {
        question: text,
        dataset_id: 'sales' // using sales context by default
      });

      const { sql, columns, rows, chart_type_suggestion } = response.data;

      // Append AI Response
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Here is the analysis for "${text}". I have successfully generated the PostgreSQL query and parsed the results.`,
        sql,
        columns,
        rows,
        chartType: chart_type_suggestion
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Auto-set the active visualization on the right panel
      setActiveResult({
        sql,
        columns,
        rows,
        chartType: chart_type_suggestion
      });

    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to analyze query.');
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'I ran into an issue attempting to translate or execute your query. Please make sure the structure is safe and try again.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const copySqlToClipboard = () => {
    if (!activeResult?.sql) return;
    navigator.clipboard.writeText(activeResult.sql);
    setIsCopied(true);
    toast.success('SQL query copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Simple SQL highlighting tokenizer
  const highlightSql = (sqlText: string) => {
    if (!sqlText) return '';
    const keywords = /\b(select|from|where|group by|order by|limit|as|and|join|on|sum|avg|count|min|max|desc|asc)\b/gi;
    return sqlText.replace(keywords, (match) => `<span class="text-accent font-semibold">${match}</span>`);
  };

  // Export handlers
  const downloadCsv = () => {
    if (!activeResult || activeResult.rows.length === 0) return;
    
    const headers = activeResult.columns.join(',');
    const rows = activeResult.rows.map((r: any) => 
      activeResult.columns.map(c => JSON.stringify(r[c] ?? '')).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "query_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded successfully.');
  };

  // Recharts custom colors
  const COLORS = ['#7C6FF7', '#A78BFA', '#8B5CF6', '#6D28D9', '#4C1D95'];

  return (
    <div className="h-[calc(100vh-96px)] flex gap-6 text-left selection:bg-accent/30 selection:text-text-primary">
      <Toaster position="top-right" />

      {/* Left Chat Panel (40%) */}
      <Card className="w-[40%] flex flex-col justify-between border-border/80 bg-surface/30 p-4 rounded-xl relative overflow-hidden h-full">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    isUser 
                      ? 'bg-accent text-text-primary shadow-lg shadow-accent/10 rounded-br-none' 
                      : 'bg-surface border border-border text-text-primary rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  
                  {/* Link to show chart if generated */}
                  {msg.sql && (
                    <button 
                      onClick={() => setActiveResult({
                        sql: msg.sql!,
                        columns: msg.columns!,
                        rows: msg.rows!,
                        chartType: msg.chartType!
                      })}
                      className="mt-3.5 flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover font-semibold transition-colors focus:outline-none"
                    >
                      Chart generated <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Controls */}
        <div className="space-y-3.5">
          {/* Suggested Chips (Only on empty state) */}
          {messages.length === 1 && !isTyping && (
            <div className="flex flex-wrap gap-2 text-xs">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="px-3 py-1.5 rounded-full border border-border bg-base hover:bg-surface text-text-muted hover:text-text-primary transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Send Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about your data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-base border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-hint focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
            <Button 
              type="submit" 
              variant="primary" 
              className="px-4.5"
              disabled={isTyping || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>

      {/* Right Result Panel (60%) */}
      <Card className="w-[60%] flex flex-col justify-between border-border/80 bg-surface/20 p-6 rounded-xl h-full overflow-y-auto">
        {activeResult ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Chart Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-sm font-display font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Query Visualization
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Renders dynamically based on column mappings</p>
              </div>

              {/* Export Panel */}
              <div className="flex items-center gap-2">
                <Badge variant="info">{activeResult.rows.length} rows returned</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={downloadCsv}
                  className="border border-border gap-2 text-xs hover:bg-surface/50"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </div>
            </div>

            {/* Dynamic Chart Area */}
            <div className="flex-1 min-h-[220px] max-h-[360px] flex items-center justify-center bg-base/40 border border-border/40 rounded-xl p-4 overflow-hidden relative">
              {activeResult.chartType === 'line' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeResult.rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAskRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                    <XAxis dataKey={activeResult.columns[0]} stroke="#6B6B8A" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B6B8A" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#111118', borderColor: '#1E1E2E', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey={activeResult.columns[1]} stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorAskRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeResult.chartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeResult.rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                    <XAxis dataKey={activeResult.columns[0]} stroke="#6B6B8A" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B6B8A" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#111118', borderColor: '#1E1E2E', borderRadius: '8px' }} />
                    <Bar dataKey={activeResult.columns[1]} radius={[4, 4, 0, 0]}>
                      {activeResult.rows.map((_: any, index: number) => (
                        <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeResult.chartType === 'table' && (
                <div className="w-full h-full overflow-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface/50 sticky top-0">
                        {activeResult.columns.map((c, idx) => (
                          <th key={idx} className="p-3 font-display font-semibold text-text-muted">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                          {activeResult.columns.map((c, cIdx) => (
                            <td key={cIdx} className="p-3 text-text-primary">{row[c]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Generated SQL Drawer (Collapsible) */}
            <div className="border border-border bg-surface/60 rounded-xl overflow-hidden mt-4">
              <button 
                onClick={() => setIsSqlCollapsed(!isSqlCollapsed)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-raised transition-colors text-xs font-display font-semibold text-text-primary"
              >
                <div className="flex items-center gap-2 text-accent">
                  <Terminal className="h-4 w-4" />
                  Generated SQL
                </div>
                {isSqlCollapsed ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronUp className="h-4 w-4 text-text-muted" />}
              </button>

              {!isSqlCollapsed && (
                <div className="p-4 border-t border-border bg-base/50 text-xs font-mono relative group text-left">
                  <button 
                    onClick={copySqlToClipboard}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface hover:bg-raised text-text-muted hover:text-text-primary border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy SQL Query"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <pre className="overflow-x-auto whitespace-pre-wrap pr-10 text-[#ECEFF1] select-all leading-relaxed">
                    <code dangerouslySetInnerHTML={{ __html: highlightSql(activeResult.sql) }} />
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <Database className="h-12 w-12 text-text-hint" />
            <div className="space-y-1">
              <h4 className="text-sm font-display font-semibold text-text-primary">No visual query active</h4>
              <p className="text-xs text-text-muted max-w-xs leading-relaxed">Ask a question inside the chat terminal on the left to trigger SQL compiling and charting.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

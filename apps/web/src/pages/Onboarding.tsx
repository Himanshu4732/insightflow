import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Upload, 
  Link2,
  FileSpreadsheet,
  Layers,
  BarChart3,
  Filter,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import toast, { Toaster } from 'react-hot-toast';

// Stepper items
const steps = [
  { number: 1, label: 'Workspace' },
  { number: 2, label: 'Upload Data' },
  { number: 3, label: 'Template' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  
  // Skip onboarding if already completed
  useEffect(() => {
    if (localStorage.getItem('onboarding_completed') === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Step 1 State: Workspace Setup
  const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('onb_workspace_name') || '');
  const [slug, setSlug] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Auto-generate slug and save name
  useEffect(() => {
    const formattedSlug = workspaceName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(formattedSlug);
    localStorage.setItem('onb_workspace_name', workspaceName);
  }, [workspaceName]);

  // Step 2 State: Data Ingestion
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [fileName, setFileName] = useState(() => localStorage.getItem('onb_filename') || '');
  const [rowCount, setRowCount] = useState(() => Number(localStorage.getItem('onb_rowcount')) || 0);
  const [, setColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('onb_columns');
    return saved ? JSON.parse(saved) : [];
  });
  const [schema, setSchema] = useState<{ name: string; type: string }[]>(() => {
    const saved = localStorage.getItem('onb_schema');
    return saved ? JSON.parse(saved) : [];
  });
  const [datasetId, setDatasetId] = useState(() => localStorage.getItem('onb_dataset_id') || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Step 3 State: Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState(() => localStorage.getItem('onb_template') || '');

  // Dynamic Avatar Color
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-[#7C6FF7]',
      'bg-[#EC4899]',
      'bg-[#10B981]',
      'bg-[#F59E0B]',
      'bg-[#EF4444]',
      'bg-[#3B82F6]'
    ];
    if (!name) return colors[0];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name) return 'IF';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // CSV Drag and Drop Handler / File Parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.csv') && !filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      toast.error('Please upload a valid CSV or Excel spreadsheet.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 10 : 90));
    }, 150);

    try {
      const response = await axios.post('/api/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      clearInterval(interval);
      setUploadProgress(100);

      const { dataset_id, rowCount: parsedRowCount, schema: dataSchema } = response.data;

      setFileName(file.name);
      setRowCount(parsedRowCount);
      const cols = dataSchema.map((c: any) => c.name);
      setColumns(cols);
      setSchema(dataSchema);
      setDatasetId(dataset_id);

      // Save to localStorage
      localStorage.setItem('onb_filename', file.name);
      localStorage.setItem('onb_rowcount', String(parsedRowCount));
      localStorage.setItem('onb_columns', JSON.stringify(cols));
      localStorage.setItem('onb_schema', JSON.stringify(dataSchema));
      localStorage.setItem('onb_dataset_id', dataset_id);

      toast.success('Dataset uploaded and processed successfully!');
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.response?.data?.error || 'Failed to upload dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const simulateGoogleSheets = async () => {
    setIsUploading(true);
    setUploadProgress(15);
    const formData = new FormData();
    
    // Convert simulated sheet text to csv file representation
    const mockCsv = "Date,Revenue,Active Users,Status,Product Name,Sales\n2026-05-01,15200,852,Active,Cloud Core subscription,12\n2026-05-02,18400,654,Active,ML Forecast Add-on,8\n2026-05-03,22100,521,Warning,Enterprise Support Pack,6";
    const blob = new Blob([mockCsv], { type: 'text/csv' });
    const file = new File([blob], 'google_sheets_live.csv');
    formData.append('file', file);

    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 15 : 90));
    }, 100);

    try {
      const response = await axios.post('/api/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      clearInterval(interval);
      setUploadProgress(100);

      const { dataset_id, rowCount: parsedRowCount, schema: dataSchema } = response.data;

      setFileName('google_sheets_live.csv');
      setRowCount(parsedRowCount);
      const cols = dataSchema.map((c: any) => c.name);
      setColumns(cols);
      setSchema(dataSchema);
      setDatasetId(dataset_id);

      // Save to localStorage
      localStorage.setItem('onb_filename', 'google_sheets_live.csv');
      localStorage.setItem('onb_rowcount', String(parsedRowCount));
      localStorage.setItem('onb_columns', JSON.stringify(cols));
      localStorage.setItem('onb_schema', JSON.stringify(dataSchema));
      localStorage.setItem('onb_dataset_id', dataset_id);

      toast.success('Google Sheet connection complete!');
    } catch (err: any) {
      clearInterval(interval);
      toast.error('Failed to parse sheet data.');
    } finally {
      setIsUploading(false);
    }
  };

  // Navigations
  const handleNext = async () => {
    if (currentStep === 1) {
      if (!workspaceName.trim()) {
        toast.error('Please enter a workspace name.');
        return;
      }
      setIsCreatingWorkspace(true);
      try {
        await axios.post('/api/workspace/create', {
          name: workspaceName,
          slug: slug
        });
        setDirection(1);
        setCurrentStep(2);
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Workspace creation failed. The URL slug may already be taken.');
      } finally {
        setIsCreatingWorkspace(false);
      }
    } else if (currentStep === 2) {
      if (!datasetId) {
        toast.error('Please upload a dataset or paste a Sheets link to continue.');
        return;
      }
      setDirection(1);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedTemplate) {
        toast.error('Please pick a dashboard template to launch.');
        return;
      }
      // Save template to localStorage
      localStorage.setItem('onb_template', selectedTemplate);
      localStorage.setItem('onboarding_completed', 'true');
      toast.success('Launching your dashboard!');
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Framer Motion Animation Settings
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-base text-text-primary p-6 flex flex-col justify-between font-sans selection:bg-accent/30 selection:text-text-primary relative overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111118',
          color: '#F1F0FF',
          border: '1px solid #1E1E2E',
        }
      }} />

      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-accent/15 text-accent border border-accent/25">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-display font-semibold text-sm">InsightFlow Workspace Setup</span>
        </div>
        <span className="text-xs text-text-hint">Onboarding Wizard</span>
      </header>

      {/* Stepper Progress bar & Indicators */}
      <div className="relative z-10 max-w-lg mx-auto w-full my-8">
        <div className="relative flex items-center justify-between">
          {/* Stepper line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-raised -translate-y-1/2 z-0" />
          <motion.div 
            className="absolute top-1/2 left-0 h-0.5 bg-accent -translate-y-1/2 z-0"
            initial={{ width: '0%' }}
            animate={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            transition={{ duration: 0.4 }}
          />

          {/* Steps */}
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;

            return (
              <div key={step.number} className="relative z-10 flex flex-col items-center gap-2">
                <div 
                  className={`w-8 h-8 rounded-full border flex items-center justify-center font-display font-semibold text-xs transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-success border-success text-white' 
                      : isActive 
                        ? 'bg-accent border-accent text-text-primary shadow-lg shadow-accent/20 scale-110' 
                        : 'bg-surface border-border text-text-muted'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.number}
                </div>
                <span className={`text-[10px] uppercase font-display font-semibold tracking-wider ${
                  isActive ? 'text-accent' : isCompleted ? 'text-success' : 'text-text-hint'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Content Container */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full flex items-center justify-center py-6 min-h-[460px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl text-center space-y-6"
          >
            {/* STEP 1: Name workspace */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-display font-semibold tracking-tight">Welcome! Let's set up your workspace</h2>
                  <p className="text-sm text-text-muted">Choose a workspace name. You can invite team members inside.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center justify-center bg-surface/30 border border-border/50 rounded-2xl p-8 max-w-md mx-auto backdrop-blur-sm">
                  {/* Dynamic initials avatar */}
                  <div className={`w-16 h-16 rounded-full shrink-0 flex items-center justify-center font-display font-bold text-lg text-text-primary shadow-inner shadow-black/25 ${getAvatarColor(workspaceName)}`}>
                    {getInitials(workspaceName)}
                  </div>
                  
                  <div className="flex-1 w-full text-left space-y-4">
                    <Input
                      label="Workspace Name"
                      placeholder="Acme Analytics"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      disabled={isCreatingWorkspace}
                    />

                    {workspaceName && (
                      <div className="text-xs text-text-hint">
                        Workspace URL Preview: <span className="text-accent font-semibold">insightflow.io/{slug || '...'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Ingest dataset */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-display font-semibold tracking-tight">Upload your first dataset</h2>
                  <p className="text-sm text-text-muted">Drag and drop a CSV file, or input a Google Sheets spreadsheet URL.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-2xl mx-auto">
                  {/* Drag-and-drop / Upload container */}
                  <div className="relative group rounded-xl border-2 border-dashed border-border hover:border-accent/40 bg-surface/20 hover:bg-surface/30 p-8 flex flex-col items-center justify-center gap-3 transition-all duration-300">
                    <input 
                      type="file" 
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    <div className="p-3 rounded-lg bg-raised text-text-muted group-hover:text-accent border border-border group-hover:border-accent/20 transition-colors">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-text-primary">Drop CSV here</div>
                      <div className="text-xs text-text-hint">or click to browse local files</div>
                    </div>
                  </div>

                  {/* Google Sheets loader */}
                  <Card className="bg-surface/30 border-border/50 p-6 flex flex-col justify-between text-left">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-accent font-display font-semibold text-sm">
                        <Link2 className="h-4 w-4" />
                        Google Sheets Link
                      </div>
                      <Input
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                        disabled={isUploading}
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full mt-4 justify-center"
                      onClick={() => {
                        if (!googleSheetsUrl) {
                          toast.error('Please enter a Google Sheets URL.');
                          return;
                        }
                        simulateGoogleSheets();
                      }}
                      disabled={isUploading || !googleSheetsUrl}
                    >
                      Connect Sheet
                    </Button>
                  </Card>
                </div>

                {/* Upload Status / Schema Preview */}
                {isUploading && (
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>Analyzing dataset format...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-raised rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {datasetId && !isUploading && (
                  <Card className="max-w-md mx-auto bg-surface/60 border-accent/20 shadow-lg shadow-accent/5 p-4 rounded-xl text-left flex items-start gap-4">
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mt-1">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div>
                        <div className="text-sm font-semibold font-display truncate text-text-primary">{fileName}</div>
                        <div className="text-xs text-text-muted mt-0.5">{rowCount.toLocaleString()} rows parsed successfully</div>
                      </div>
                      <div className="border-t border-border/50 pt-2.5">
                        <div className="text-[10px] uppercase font-display font-semibold tracking-wider text-text-hint mb-1.5">Parsed Schema Columns</div>
                        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
                          {schema.map((col, idx) => (
                            <Badge 
                              key={idx} 
                              variant={col.type === 'number' ? 'success' : col.type === 'date' ? 'info' : 'neutral'} 
                              className="text-[10px] px-2 py-0.5"
                            >
                              {col.name}: {col.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 3: Template Picker */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-display font-semibold tracking-tight">Pick your dashboard template</h2>
                  <p className="text-sm text-text-muted">Select a template framework below. You can customize widgets later.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-4xl mx-auto">
                  {[
                    {
                      id: 'sales',
                      icon: BarChart3,
                      name: 'Sales Overview',
                      bullets: ['Revenue tracking KPI list', 'Monthly order transaction charts', 'Average ticket value metric']
                    },
                    {
                      id: 'marketing',
                      icon: Filter,
                      name: 'Marketing Funnel',
                      bullets: ['Conversion rate calculations', 'Cost Per Acquisition indexes', 'UTM traffic source charts']
                    },
                    {
                      id: 'finance',
                      icon: DollarSign,
                      name: 'Finance Summary',
                      bullets: ['Predictive time-series graphs', 'Operational cash flow summaries', 'Anomaly alert thresholds']
                    }
                  ].map((temp) => {
                    const isSelected = selectedTemplate === temp.id;
                    return (
                      <Card 
                        key={temp.id}
                        onClick={() => setSelectedTemplate(temp.id)}
                        className={`cursor-pointer hover:scale-[1.02] active:scale-[0.99] border relative transition-all duration-300 p-6 flex flex-col justify-between bg-white/[0.02] text-left h-[260px] ${
                          isSelected 
                            ? 'border-accent shadow-lg shadow-accent/5 ring-1 ring-accent' 
                            : 'border-white/[0.08] hover:border-accent/40'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-text-primary text-[10px] font-bold">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                        <div>
                          <div className={`p-2 w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${
                            isSelected ? 'bg-accent/15 text-accent border border-accent/25' : 'bg-raised text-text-muted border border-border'
                          }`}>
                            <temp.icon className="h-5 w-5" />
                          </div>
                          <h3 className="font-display font-semibold text-text-primary text-base mb-3">{temp.name}</h3>
                          <ul className="space-y-1.5">
                            {temp.bullets.map((bullet, idx) => (
                              <li key={idx} className="text-[11px] text-text-muted flex items-start gap-1.5 leading-tight">
                                <span className="text-accent mt-1 shrink-0">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stepper Buttons Panel */}
            <div className="flex items-center justify-between border-t border-border/40 pt-6 max-w-xl mx-auto w-full">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || isCreatingWorkspace}
                className="gap-2 border border-border hover:bg-surface/50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                isLoading={isCreatingWorkspace}
                className="gap-2 group"
              >
                {currentStep === 3 ? (
                  <>
                    Launch my dashboard <Sparkles className="h-4 w-4 text-amber-300" />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 text-center text-xs text-text-hint border-t border-border/40 pt-4 max-w-4xl mx-auto w-full">
        © {new Date().getFullYear()} InsightFlow Inc. All rights reserved.
      </footer>
    </div>
  );
}

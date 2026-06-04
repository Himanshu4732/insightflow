import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Table, 
  ArrowUpDown, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  UploadCloud, 
  X, 
  HelpCircle, 
  FileSpreadsheet, 
  BarChart3, 
  Plus,
  Trash2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  useDatasets, 
  useDatasetRows, 
  useDatasetStats, 
  useUploadDataset,
  useDeleteDataset
} from '../hooks/useQueries';

interface DatasetItem {
  id: string;
  filename: string;
  row_count: number;
  schema: Array<{ name: string; type: string }>;
  created_at: string;
}

export default function DataExplorer() {
  const { data: datasets = [], isLoading: loadingList } = useDatasets();
  const uploadMutation = useUploadDataset();
  const deleteMutation = useDeleteDataset();
  const statsMutation = useDatasetStats();

  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  
  // Table state
  const [page, setPage] = useState(1);
  const limit = 20;
  const [sortCol, setSortCol] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});

  // UI state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeColumn, setActiveColumn] = useState<{ name: string; type: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Debounce filters to prevent heavy database queries on typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1); // reset to first page on filter change
    }, 400);

    return () => clearTimeout(handler);
  }, [filters]);

  // Select first dataset automatically when list loads
  useEffect(() => {
    if (datasets.length > 0 && !activeDatasetId) {
      setActiveDatasetId(datasets[0].id);
    }
  }, [datasets, activeDatasetId]);

  const activeDataset = datasets.find((d: DatasetItem) => d.id === activeDatasetId);
  const schema = activeDataset?.schema || [];

  // Query rows
  const offset = (page - 1) * limit;
  const { data: rowsData, isLoading: loadingRows } = useDatasetRows(activeDatasetId, {
    limit,
    offset,
    sort: sortCol,
    order: sortOrder,
    filters: debouncedFilters
  });

  // Query ALL values for clicked column to calculate statistics
  // Fetch up to 1000 rows to calculate statistics locally
  const { data: allValuesData } = useDatasetRows(activeDatasetId, {
    limit: 1000,
    offset: 0,
    filters: debouncedFilters
  });

  // Compute column statistics when active column changes
  useEffect(() => {
    if (activeColumn && allValuesData?.rows) {
      if (activeColumn.type === 'number') {
        const numbers = allValuesData.rows
          .map((r: any) => Number(r[activeColumn.name]))
          .filter((v: number) => !isNaN(v));
        statsMutation.mutate(numbers);
      } else {
        statsMutation.reset();
      }
    } else {
      statsMutation.reset();
    }
  }, [activeColumn, allValuesData]);

  // Swap active dataset and reset states
  const handleDatasetSwap = (id: string) => {
    setActiveDatasetId(id);
    setPage(1);
    setSortCol('');
    setSortOrder('asc');
    setFilters({});
    setActiveColumn(null);
  };

  // Upload dataset
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    const uploadToast = toast.loading('Parsing and importing spreadsheet...');
    try {
      const res = await uploadMutation.mutateAsync(formData);
      toast.success('Spreadsheet uploaded and parsed successfully!', { id: uploadToast });
      setIsUploadOpen(false);
      setSelectedFile(null);
      handleDatasetSwap(res.dataset_id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to parse and upload dataset.', { id: uploadToast });
    }
  };

  // Sort toggle
  const toggleSort = (colName: string) => {
    if (sortCol === colName) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Filter change
  const handleFilterChange = (colName: string, val: string) => {
    setFilters(prev => ({
      ...prev,
      [colName]: val
    }));
  };

  // Delete dataset
  const handleDeleteDataset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this dataset?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Dataset deleted successfully');
      if (activeDatasetId === id) {
        setActiveDatasetId(null);
      }
    } catch (err) {
      toast.error('Failed to delete dataset');
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (!rowsData || rowsData.rows.length === 0 || !activeDataset) return;
    const headersStr = schema.map((c: any) => c.name).join(',');
    const rowsStr = rowsData.rows.map((r: any) => schema.map((c: any) => `"${String(r[c.name] || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([headersStr + '\n' + rowsStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDataset.filename.replace(/\.[^/.]+$/, '')}_export.csv`;
    a.click();
    toast.success('CSV exported successfully!');
  };

  const handleMockExport = (format: string) => {
    toast.loading(`Compiling export in ${format} format...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success(`Download started for ${activeDataset?.filename.replace(/\.[^/.]+$/, '')}_export.${format.toLowerCase()}`);
    }, 1500);
  };

  // Total pages calculations
  const totalCount = rowsData?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Render cell helper
  const renderCell = (val: any, type: string) => {
    if (val === undefined || val === null || val === '') {
      return <span className="text-text-hint italic">null</span>;
    }
    
    const strVal = String(val);
    if (type === 'number') {
      const num = Number(val);
      return <span className="font-mono text-success">{isNaN(num) ? strVal : num.toLocaleString()}</span>;
    }
    if (type === 'date') {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return <span className="font-mono text-accent">{d.toLocaleDateString()}</span>;
        }
      } catch (_) {}
    }
    
    return <span className="truncate max-w-[200px]" title={strVal}>{strVal.length > 40 ? `${strVal.substring(0, 40)}...` : strVal}</span>;
  };

  return (
    <div className="space-y-6 pb-12 text-left selection:bg-accent/30 selection:text-text-primary">
      <Toaster position="top-right" />

      {/* Dataset Selector Tabs Row */}
      <Card className="p-3 bg-surface/30 border-border/60 flex flex-wrap items-center justify-between gap-4">
        {loadingList ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-raised rounded animate-pulse" />
            <div className="h-8 w-24 bg-raised rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {datasets.map((dataset: DatasetItem) => {
              const isActive = dataset.id === activeDatasetId;
              return (
                <div
                  key={dataset.id}
                  onClick={() => handleDatasetSwap(dataset.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent/15 border-accent/20 text-accent font-semibold shadow-inner'
                      : 'bg-surface/50 border-border hover:bg-base text-text-muted hover:text-text-primary'
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>{dataset.filename}</span>
                  <Badge variant="neutral" className="text-[9px] px-1 bg-white/5 border-none">
                    {dataset.row_count.toLocaleString()}
                  </Badge>
                  <button 
                    onClick={(e) => handleDeleteDataset(dataset.id, e)}
                    className="p-0.5 hover:text-danger rounded-md hover:bg-danger/10 transition-colors ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            
            {datasets.length === 0 && (
              <span className="text-xs text-text-muted">No datasets uploaded yet. Click upload to begin.</span>
            )}
          </div>
        )}

        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setIsUploadOpen(true)}
          className="gap-1.5 shadow-lg shadow-accent/25 hover:shadow-accent/40"
        >
          <Plus className="h-4 w-4" />
          Import Dataset
        </Button>
      </Card>

      {/* Main split view: Table (70%) + Column Stats (30%) */}
      <div className="grid lg:grid-cols-10 gap-6 items-start">
        {/* Left Side: Table (70%) */}
        <Card className="lg:col-span-7 bg-surface/20 border-border/50 p-4 space-y-4 overflow-hidden">
          {/* Header Row count indicator */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-text-muted">
              {rowsData ? (
                <span>
                  Showing <strong className="text-text-primary">{offset + 1}–{Math.min(totalCount, offset + limit)}</strong> of <strong className="text-text-primary">{totalCount.toLocaleString()}</strong> rows
                </span>
              ) : (
                'Loading rows count...'
              )}
            </div>
            
            {/* Filter clear button */}
            {Object.values(filters).some(f => f) && (
              <button 
                onClick={() => setFilters({})}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-border/30 rounded-xl bg-base/20 max-h-[550px] relative">
            <table className="w-full text-xs text-left border-collapse">
              {/* Table Headers */}
              <thead className="bg-[#111118]/80 backdrop-blur sticky top-0 z-10 border-b border-border/50 text-text-primary font-display font-semibold select-none">
                <tr>
                  <th className="p-3 w-12 text-center text-text-hint">#</th>
                  {schema.map((col: any) => {
                    const isSorted = sortCol === col.name;
                    const isColActive = activeColumn?.name === col.name;
                    return (
                      <th 
                        key={col.name} 
                        className={`p-3 min-w-[150px] border-r border-border/10 cursor-pointer transition-colors ${
                          isColActive ? 'bg-accent/5' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1" onClick={() => toggleSort(col.name)}>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveColumn(col);
                            }}
                            className={`font-semibold hover:text-accent border-b border-dashed border-transparent hover:border-accent ${
                              isColActive ? 'text-accent border-accent' : ''
                            }`}
                            title="Click for stats"
                          >
                            {col.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 text-text-hint">
                            <Badge variant={col.type === 'number' ? 'success' : col.type === 'date' ? 'info' : 'neutral'} className="text-[9px] px-1 py-0 border-none uppercase">
                              {col.type}
                            </Badge>
                            <ArrowUpDown className={`h-3 w-3 ${isSorted ? 'text-accent' : 'text-text-hint opacity-50'}`} />
                          </div>
                        </div>

                        {/* Filter Input row */}
                        <div className="mt-2 relative" onClick={e => e.stopPropagation()}>
                          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-hint opacity-40" />
                          <input
                            type="text"
                            placeholder="Filter column..."
                            value={filters[col.name] || ''}
                            onChange={(e) => handleFilterChange(col.name, e.target.value)}
                            className="w-full bg-[#1A1A24]/60 border border-border/60 rounded pl-7 pr-2 py-1 text-[10px] focus:outline-none focus:border-accent/60 placeholder-text-hint text-text-primary"
                          />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-border/20 font-sans">
                {loadingRows ? (
                  Array.from({ length: 8 }).map((_, rIdx) => (
                    <tr key={rIdx} className="odd:bg-surface/5 even:bg-transparent">
                      <td className="p-3 text-center"><div className="h-3 w-4 bg-raised rounded animate-pulse mx-auto" /></td>
                      {schema.map((_: any, cIdx: number) => (
                        <td key={cIdx} className="p-3"><div className="h-3 w-20 bg-raised rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : rowsData?.rows.length > 0 ? (
                  rowsData.rows.map((row: any, rIdx: number) => (
                    <tr 
                      key={row.id || rIdx} 
                      className="odd:bg-white/[0.01] even:bg-transparent hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-3 text-center text-text-hint font-mono">{offset + rIdx + 1}</td>
                      {schema.map((col: any) => {
                        const isColActive = activeColumn?.name === col.name;
                        return (
                          <td 
                            key={col.name} 
                            className={`p-3 border-r border-border/10 ${
                              col.type === 'number' ? 'text-right' : 'text-left'
                            } ${isColActive ? 'bg-accent/5' : ''}`}
                          >
                            {renderCell(row[col.name], col.type)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={schema.length + 1} className="p-16 text-center text-text-muted space-y-2">
                      <Table className="h-10 w-10 text-text-hint opacity-40 mx-auto animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">No matching records found</p>
                        <p className="text-xs">Adjust your filter inputs above or clear sorting metrics.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-border/20 pt-4 text-xs font-display">
            <span className="text-text-hint">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 px-2.5"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 px-2.5"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Side: Column Stats Panel (30%) */}
        <Card className="lg:col-span-3 bg-surface/30 border-border/60 sticky top-24 p-6 space-y-6">
          <div className="border-b border-border/40 pb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            <div>
              <h3 className="text-sm font-display font-semibold text-text-primary">Column Analytics</h3>
              <p className="text-[10px] text-text-muted">Click any header text to calculate properties</p>
            </div>
          </div>

          {activeColumn ? (
            <div className="space-y-5">
              {/* Target column header details */}
              <div className="flex items-center justify-between bg-base/50 p-2.5 border border-border/40 rounded-lg">
                <span className="font-display font-semibold text-xs text-text-primary truncate max-w-[150px]">{activeColumn.name}</span>
                <Badge variant={activeColumn.type === 'number' ? 'success' : activeColumn.type === 'date' ? 'info' : 'neutral'} className="text-[10px]">
                  {activeColumn.type.toUpperCase()}
                </Badge>
              </div>

              {/* Basic metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-border/20 pb-4">
                <div className="bg-white/[0.01] border border-border/10 p-2.5 rounded-lg text-left">
                  <div className="text-[9px] text-text-hint uppercase font-semibold">Total Sample Rows</div>
                  <div className="text-sm font-bold text-text-primary mt-1">{(allValuesData?.rows?.length || 0).toLocaleString()}</div>
                </div>
                <div className="bg-white/[0.01] border border-border/10 p-2.5 rounded-lg text-left">
                  <div className="text-[9px] text-text-hint uppercase font-semibold">Unique Items</div>
                  <div className="text-sm font-bold text-accent mt-1">
                    {allValuesData?.rows ? (
                      new Set(allValuesData.rows.map((r: any) => r[activeColumn.name]).filter(Boolean)).size.toLocaleString()
                    ) : '0'}
                  </div>
                </div>
              </div>

              {/* Numeric analysis math parameters */}
              {activeColumn.type === 'number' ? (
                statsMutation.isPending ? (
                  <div className="space-y-3 py-6">
                    <div className="h-6 w-full bg-raised rounded animate-pulse" />
                    <div className="h-24 w-full bg-raised rounded animate-pulse" />
                  </div>
                ) : statsMutation.data ? (
                  <div className="space-y-4">
                    <span className="text-text-muted font-medium text-xs block">Descriptive Calculations</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-text-hint">Mean</span>
                        <span className="font-mono font-semibold">{statsMutation.data.mean.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-text-hint">Median</span>
                        <span className="font-mono font-semibold">{statsMutation.data.median.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-text-hint">Std Dev</span>
                        <span className="font-mono font-semibold">{statsMutation.data.std.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-text-hint">Min / Max</span>
                        <span className="font-mono font-semibold">{statsMutation.data.min} / {statsMutation.data.max}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-text-hint">P25 (Q1)</span>
                        <span className="font-mono font-semibold">{statsMutation.data.p25}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-text-hint">P75 (Q3)</span>
                        <span className="font-mono font-semibold">{statsMutation.data.p75}</span>
                      </div>
                    </div>

                    {/* Recharts Mini Histogram representation */}
                    {statsMutation.data.histogram && statsMutation.data.histogram.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/25">
                        <span className="text-text-muted font-medium text-xs block">Frequency Distribution</span>
                        <div className="h-[120px] w-full text-[9px] bg-base/50 p-2 border border-border/40 rounded-lg">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsMutation.data.histogram} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                              <XAxis dataKey="bin" tick={false} stroke="#555" />
                              <YAxis stroke="#555" />
                              <Tooltip 
                                contentStyle={{ background: '#111118', border: '1px solid #222', borderRadius: '4px', fontSize: '9px' }} 
                                labelStyle={{ color: '#aaa', fontWeight: 'bold' }}
                              />
                              <Bar dataKey="count" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-text-hint">Failed to fetch column properties. Click running prediction.</p>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-text-hint border border-dashed border-border/30 rounded-xl">
                  <HelpCircle className="h-8 w-8 text-text-hint opacity-40 mb-2" />
                  <p className="font-semibold text-xs text-text-muted">Descriptive stats unavailable</p>
                  <p className="text-[10px] max-w-[180px] mt-1 leading-normal">Mean, median, and histograms are computed on numerical fields only.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-text-hint border border-dashed border-border/30 rounded-xl">
              <HelpCircle className="h-10 w-10 text-text-hint opacity-30 mb-3 animate-pulse" />
              <p className="font-semibold text-xs">No active column selected</p>
              <p className="text-[10px] max-w-[180px] mt-1 leading-normal">Select a dashed column header in the table to load frequency distributions.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Export Bar */}
      {activeDatasetId && (
        <Card className="p-4 bg-surface/30 border-border/60 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-text-muted">
            Retrieve active filter sheets for custom offline reporting
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleExportCSV}
              className="gap-1.5 text-xs py-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleMockExport('XLSX')}
              className="gap-1.5 text-xs py-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleMockExport('PDF')}
              className="gap-1.5 text-xs py-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        </Card>
      )}

      {/* Dataset Import Modal Overlay */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!uploadMutation.isPending) {
                  setIsUploadOpen(false);
                  setSelectedFile(null);
                }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#12121A] border border-border/80 w-full max-w-md rounded-2xl p-6 relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                  <UploadCloud className="h-4.5 w-4.5 text-accent" />
                  Import Dataset Spreadsheet
                </h3>
                <button 
                  disabled={uploadMutation.isPending}
                  onClick={() => {
                    setIsUploadOpen(false);
                    setSelectedFile(null);
                  }}
                  className="p-1 hover:bg-white/5 rounded-lg text-text-hint hover:text-text-primary transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
                {/* Drag zone container */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 relative transition-all duration-300 ${
                    dragOver 
                      ? 'border-accent bg-accent/5' 
                      : 'border-border/80 bg-base/30 hover:border-accent/40'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    disabled={uploadMutation.isPending}
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="p-3 rounded-lg bg-raised text-text-muted border border-border">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-text-primary">
                      {selectedFile ? selectedFile.name : 'Drag and drop file here'}
                    </p>
                    <p className="text-[10px] text-text-hint">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports CSV, Excel spreadsheets up to 10MB'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={uploadMutation.isPending}
                    onClick={() => {
                      setIsUploadOpen(false);
                      setSelectedFile(null);
                    }}
                    className="text-xs px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!selectedFile || uploadMutation.isPending}
                    isLoading={uploadMutation.isPending}
                    className="text-xs px-4 shadow-lg shadow-accent/25"
                  >
                    Process & Import
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

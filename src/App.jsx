import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileCode, 
  Sparkles, 
  Settings, 
  Key, 
  Award,
  AlertTriangle,
  Play,
  Activity,
  Code,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  X
} from 'lucide-react';

const availableProviders = [
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
  { id: 'openai', name: 'OpenAI (ChatGPT)', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic (Claude)', defaultModel: 'claude-3-5-sonnet-latest' },
  { id: 'groq', name: 'Groq (Llama)', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'together', name: 'Together AI', defaultModel: 'meta-llama/Llama-3-70b-chat-hf' },
  { id: 'mistral', name: 'Mistral AI', defaultModel: 'mistral-small-latest' },
  { id: 'cohere', name: 'Cohere', defaultModel: 'command-r-plus' },
  { id: 'deepseek', name: 'DeepSeek', defaultModel: 'deepseek-chat' },
  { id: 'perplexity', name: 'Perplexity AI', defaultModel: 'sonar-reasoning' },
  { id: 'openrouter', name: 'OpenRouter', defaultModel: 'meta-llama/llama-3-8b-instruct:free' },
  { id: 'huggingface', name: 'Hugging Face', defaultModel: 'meta-llama/Meta-Llama-3-8B-Instruct' },
  { id: 'fireworks', name: 'Fireworks AI', defaultModel: 'accounts/fireworks/models/llama-v3-8b-instruct' },
  { id: 'novita', name: 'Novita AI', defaultModel: 'meta-llama/llama-3-8b-instruct' },
  { id: 'anyscale', name: 'Anyscale', defaultModel: 'meta-llama/Llama-3-70b-chat' },
  { id: 'octoai', name: 'OctoAI', defaultModel: 'meta-llama-3-70b-instruct' },
  { id: 'lepton', name: 'Lepton AI', defaultModel: 'llama3-8b' },
  { id: 'deepinfra', name: 'DeepInfra', defaultModel: 'meta-llama/Meta-Llama-3-70B-Instruct' }
];

function App() {
  // LLM Config
  const [provider, setProvider] = useState(() => localStorage.getItem('codeglow_provider') || 'gemini');
  const [model, setModel] = useState(() => localStorage.getItem('codeglow_model') || 'gemini-2.5-flash');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gitpulse_key') || localStorage.getItem('mockforge_key') || localStorage.getItem('promptcraft_keys') || '');
  
  // Folder Scan State
  const [folderPath, setFolderPath] = useState('/home/kregg/agy/Ai Apps/gitpulse-ai/src');
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  
  // Interactive console states
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileReports, setFileReports] = useState({}); // relativePath -> report
  const [refactorings, setRefactorings] = useState({}); // relativePath -> refactoring
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [editorTab, setEditorTab] = useState('code'); // 'code' | 'refactored' | 'notes'
  const [fileOriginalCode, setFileOriginalCode] = useState('');
  
  // UI helper states
  const [copied, setCopied] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  // Auto-scan on startup
  useEffect(() => {
    handleScan();
  }, []);

  const handleScan = async () => {
    if (!folderPath) return;
    setIsScanning(true);
    try {
      const res = await fetch('http://localhost:3005/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to scan codebase');
      }
      const data = await res.json();
      setScanData(data);
      // Reset file reports on folder scan change
      setFileReports({});
      setRefactorings({});
      setSelectedFile(null);
    } catch (e) {
      alert(e.message || 'Error occurred while scanning local codebase directory.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    setEditorTab('code');
    setFileOriginalCode('// Reading file source code...');
    
    // Fetch file code from local filesystem (we can do a simple run command or we read it inside a helper)
    // To read it, we will query the server's endpoint by setting file content or reading it.
    // Let's implement reading file content by fetching it
    try {
      const res = await fetch('http://localhost:3005/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath, relativePath: file.relativePath, apiKey: 'temp', provider, model })
      });
      // We didn't pass real api key here, this endpoint will error out if key is bad, but wait,
      // let's look at what endpoints are in server.js:
      // server.js reads file content. It only calls LLM if apiKey is passed.
      // So let's write a simple helper endpoint in server.js to just read file content or read it locally.
      // Wait, we can fetch the file code by passing a dummy request or just creating a quick read-file endpoint in server.js!
      // Let's check server.js. In server.js we don't have a direct read endpoint, but we can fetch the code inside a read function,
      // or we can add a quick endpoint `/api/file-content` to server.js.
      // Wait! In server.js we have:
      // `app.post('/api/analyze-file', async (req, res) => { const codeContent = fs.readFileSync(fullPath, 'utf8'); ... })`
      // We can just add a simple endpoint to server.js to read file content!
      // Let's modify server.js to add `/api/file-content`! That's very clean and easy.
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger LLM Audit analysis
  const handleAnalyzeFile = async () => {
    if (!apiKey) {
      setTempKey(apiKey);
      setShowKeysModal(true);
      return;
    }
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch('http://localhost:3005/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          relativePath: selectedFile.relativePath,
          apiKey,
          provider,
          model
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API audit failed');
      }
      const data = await res.json();
      setFileReports(prev => ({
        ...prev,
        [selectedFile.relativePath]: data
      }));
    } catch (e) {
      alert(e.message || 'Error executing AI audit.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger LLM Refactoring suggestor
  const handleRefactorFile = async () => {
    if (!apiKey) {
      setTempKey(apiKey);
      setShowKeysModal(true);
      return;
    }
    if (!selectedFile) return;

    setIsRefactoring(true);
    try {
      const res = await fetch('http://localhost:3005/api/refactor-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          relativePath: selectedFile.relativePath,
          apiKey,
          provider,
          model
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API refactoring failed');
      }
      const data = await res.json();
      setRefactorings(prev => ({
        ...prev,
        [selectedFile.relativePath]: data
      }));
      setEditorTab('refactored');
    } catch (e) {
      alert(e.message || 'Error compiling AI refactoring.');
    } finally {
      setIsRefactoring(false);
    }
  };

  // Helper to load file content from endpoint (which we'll add to server.js)
  useEffect(() => {
    if (selectedFile) {
      fetch(`http://localhost:3005/api/file-content?folderPath=${encodeURIComponent(folderPath)}&relativePath=${encodeURIComponent(selectedFile.relativePath)}`)
        .then(res => res.json())
        .then(data => {
          if (data.content) setFileOriginalCode(data.content);
        })
        .catch(e => {
          setFileOriginalCode('// Failed to read file content.');
        });
    }
  }, [selectedFile]);

  // Save API key
  const saveApiKeys = (key) => {
    setApiKey(key);
    localStorage.setItem('gitpulse_key', key);
    setShowKeysModal(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate Overall Codebase stats
  const calculateStats = () => {
    if (!scanData || scanData.files.length === 0) return { totalFiles: 0, totalLines: 0, totalSize: 0, avgHealth: 'N/A' };
    
    let totalLines = 0;
    let totalSizeKb = 0;
    scanData.files.forEach(f => {
      totalLines += f.lines;
      totalSizeKb += parseFloat(f.size);
    });

    const analyzedFiles = Object.values(fileReports);
    let avgHealth = 'Unanalyzed';
    if (analyzedFiles.length > 0) {
      let sum = 0;
      analyzedFiles.forEach(r => {
        sum += (r.complexityScore + r.securityScore + r.documentationScore) / 3;
      });
      avgHealth = `${Math.round(sum / analyzedFiles.length)}%`;
    }

    return {
      totalFiles: scanData.files.length,
      totalLines,
      totalSize: `${totalSizeKb.toFixed(1)} KB`,
      avgHealth
    };
  };

  const stats = calculateStats();

  return (
    <div className="app-container">
      
      {/* Sidebar Control Panel */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <Sparkles size={18} color="white" />
          </div>
          <span className="brand-name">CodeGlow AI</span>
        </div>

        {/* Directory Input Selector */}
        <div className="form-group">
          <span className="section-title">
            <Folder size={14} color="var(--primary)" /> Target Source Folder
          </span>
          <input 
            type="text" 
            className="input-field"
            value={folderPath}
            onChange={e => setFolderPath(e.target.value)}
            placeholder="Absolute folder path..."
          />
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: '8px' }}
            onClick={handleScan}
            disabled={isScanning || !folderPath}
          >
            <span>{isScanning ? 'Scanning Codebase...' : 'Scan Directory'}</span>
          </button>
        </div>

        {/* Codebase Health Stats */}
        <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '16px' }}>
          <span className="section-title">Codebase Analytics</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Health Score:</span>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{stats.avgHealth}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Audited Files:</span>
              <span>{Object.keys(fileReports).length} / {stats.totalFiles}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Panel */}
      <main className="dashboard-panel">
        
        {/* Header Bar */}
        <header className="header-bar">
          <div className="header-title-section">
            <span className="header-title">{scanData ? scanData.folderName : 'Target Directory Offline'}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
              onClick={() => {
                setTempKey(apiKey);
                setShowKeysModal(true);
              }}
            >
              <Settings size={14} /> Configure LLM
            </button>
            {apiKey ? (
              <div className="settings-indicator indicator-green">
                <span className="indicator-dot"></span>
                <span style={{ textTransform: 'capitalize' }}>{provider} Key Loaded</span>
              </div>
            ) : (
              <div className="settings-indicator indicator-yellow">
                <span className="indicator-dot"></span>
                <span>Configure Keys</span>
              </div>
            )}
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-box">
              <FileCode size={18} color="var(--primary)" />
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Files</span>
              <span className="metric-value">{stats.totalFiles}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box">
              <Code size={18} color="var(--secondary)" />
            </div>
            <div className="metric-details">
              <span className="metric-label">Lines of Code</span>
              <span className="metric-value">{stats.totalLines}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box">
              <Activity size={18} color="var(--grade-b)" />
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Size</span>
              <span className="metric-value">{stats.totalSize}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box">
              <Award size={18} color="var(--grade-a)" />
            </div>
            <div className="metric-details">
              <span className="metric-label">Average Health</span>
              <span className="metric-value">{stats.avgHealth}</span>
            </div>
          </div>
        </section>

        {/* Codebase Heatmap grid */}
        <section className="heatmap-section">
          <span className="section-title" style={{ marginBottom: '18px' }}>Codebase Visual Debt Heatmap</span>
          
          <div className="heatmap-grid">
            {scanData?.files.map((file, idx) => {
              const rep = fileReports[file.relativePath];
              const grade = rep ? rep.debtGrade.toLowerCase() : 'unanalyzed';
              return (
                <div 
                  key={idx} 
                  className={`file-glow-card card-grade-${grade}`}
                  onClick={() => handleFileClick(file)}
                >
                  <span className="file-name-label">{file.name}</span>
                  <span className="file-path-label">{file.relativePath}</span>
                  
                  {rep ? (
                    <span className={`grade-badge grade-badge-${grade}`}>{rep.debtGrade}</span>
                  ) : (
                    <span className="grade-badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>?</span>
                  )}

                  <div className="file-meta-row">
                    <span>{file.lines} lines</span>
                    <span>{file.size}</span>
                  </div>
                </div>
              );
            })}

            {(!scanData || scanData.filesCount === 0) && (
              <div className="empty-state">
                <Folder size={48} />
                <h3>No Directory Connected</h3>
                <p>Enter the path to your source folder and click "Scan Directory" in the sidebar control panel.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Interactive Refactoring Console Overlay */}
      {selectedFile && (
        <div className="console-overlay" onClick={() => setSelectedFile(null)}>
          <div className="console-container" onClick={e => e.stopPropagation()}>
            
            {/* Header bar */}
            <div className="console-header">
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCode size={16} color="var(--primary)" />
                  <span>Refactoring Console: {selectedFile.name}</span>
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selectedFile.relativePath}</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleAnalyzeFile}
                  disabled={isAnalyzing}
                >
                  <Activity size={14} /> 
                  <span>{isAnalyzing ? 'Auditing...' : 'Run AI Audit'}</span>
                </button>

                <button 
                  className="btn btn-primary" 
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleRefactorFile}
                  disabled={isRefactoring}
                >
                  <Sparkles size={14} /> 
                  <span>{isRefactoring ? 'Refactoring...' : 'Suggest AI Refactor'}</span>
                </button>

                <button className="close-btn" style={{ padding: '4px 8px' }} onClick={() => setSelectedFile(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Console body splits */}
            <div className="console-body">
              
              {/* Left stats panel */}
              <div className="console-left-panel">
                <span className="section-title">Audit Report</span>
                
                {isAnalyzing && (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <div className="spinner"></div>
                    <p style={{ fontSize: '12px' }}>Running static analysis...</p>
                  </div>
                )}

                {!isAnalyzing && fileReports[selectedFile.relativePath] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Radial metrics */}
                    <div className="circular-metric-row">
                      <div className="circle-progress-bar">
                        <div className="progress-track" style={{ '--p-color': 'var(--primary)', '--p-pct': fileReports[selectedFile.relativePath].complexityScore }}>
                          <span className="progress-val">{fileReports[selectedFile.relativePath].complexityScore}%</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Code Readability</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Cyclomatic rating</span>
                        </div>
                      </div>

                      <div className="circle-progress-bar">
                        <div className="progress-track" style={{ '--p-color': 'var(--secondary)', '--p-pct': fileReports[selectedFile.relativePath].securityScore }}>
                          <span className="progress-val">{fileReports[selectedFile.relativePath].securityScore}%</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Security Score</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vulnerabilities rating</span>
                        </div>
                      </div>

                      <div className="circle-progress-bar">
                        <div className="progress-track" style={{ '--p-color': 'var(--grade-a)', '--p-pct': fileReports[selectedFile.relativePath].documentationScore }}>
                          <span className="progress-val">{fileReports[selectedFile.relativePath].documentationScore}%</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Comments Coverage</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Docstrings check</span>
                        </div>
                      </div>
                    </div>

                    {/* Overall summary */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <span className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Executive Summary</span>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {fileReports[selectedFile.relativePath].summary}
                      </p>
                    </div>

                    {/* Top Issues list */}
                    {fileReports[selectedFile.relativePath].topIssues?.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <span className="section-title" style={{ color: 'var(--grade-f)', fontSize: '11px' }}>
                          <AlertTriangle size={12} /> Diagnosed Issues
                        </span>
                        <ul style={{ paddingLeft: '14px', fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'square', marginTop: '6px' }}>
                          {fileReports[selectedFile.relativePath].topIssues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <Activity size={32} />
                    <p style={{ fontSize: '12.5px' }}>File has not been audited yet. Click "Run AI Audit" above.</p>
                  </div>
                )}
              </div>

              {/* Right editor panel */}
              <div className="console-editor-panel">
                <div className="editor-tabs">
                  <button 
                    className={`editor-tab-btn ${editorTab === 'code' ? 'active' : ''}`}
                    onClick={() => setEditorTab('code')}
                  >
                    <Code size={14} /> Original Source
                  </button>
                  
                  <button 
                    className={`editor-tab-btn ${editorTab === 'refactored' ? 'active' : ''}`}
                    onClick={() => {
                      if (!refactorings[selectedFile.relativePath]) {
                        handleRefactorFile();
                      } else {
                        setEditorTab('refactored');
                      }
                    }}
                    disabled={isRefactoring}
                  >
                    <Sparkles size={14} /> {isRefactoring ? 'Generating...' : 'AI Refactored Code'}
                  </button>

                  {refactorings[selectedFile.relativePath] && (
                    <button 
                      className={`editor-tab-btn ${editorTab === 'notes' ? 'active' : ''}`}
                      onClick={() => setEditorTab('notes')}
                    >
                      <BookOpen size={14} /> Refactoring Notes
                    </button>
                  )}

                  {editorTab === 'refactored' && refactorings[selectedFile.relativePath] && (
                    <button 
                      className="btn btn-secondary"
                      style={{ width: 'auto', marginLeft: 'auto', marginRight: '16px', padding: '0 12px', fontSize: '11px', height: '32px', alignSelf: 'center' }}
                      onClick={() => copyToClipboard(refactorings[selectedFile.relativePath].refactoredCode)}
                    >
                      {copied ? <Check size={12} color="var(--grade-a)" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  )}
                </div>

                <div className="editor-code-container">
                  {editorTab === 'code' && (
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{fileOriginalCode}</pre>
                  )}

                  {editorTab === 'refactored' && (
                    <div>
                      {isRefactoring ? (
                        <div className="empty-state" style={{ marginTop: '80px' }}>
                          <div className="spinner"></div>
                          <p style={{ fontSize: '13px' }}>Refactoring codebase structures...</p>
                        </div>
                      ) : refactorings[selectedFile.relativePath] ? (
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#818cf8' }}>
                          {refactorings[selectedFile.relativePath].refactoredCode}
                        </pre>
                      ) : (
                        <div className="empty-state">
                          <Sparkles size={32} />
                          <p style={{ fontSize: '13px' }}>Click "Suggest AI Refactor" to view optimized alternative structures.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {editorTab === 'notes' && refactorings[selectedFile.relativePath] && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                        {refactorings[selectedFile.relativePath].explanation}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* LLM Key setup modal */}
      {showKeysModal && (
        <div className="modal-overlay" onClick={() => setShowKeysModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Configure LLM Scanner</h3>
              <button className="close-btn" onClick={() => setShowKeysModal(false)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Provider</label>
                <select 
                  className="select-field"
                  value={provider}
                  onChange={e => {
                    const prov = e.target.value;
                    setProvider(prov);
                    const match = availableProviders.find(p => p.id === prov);
                    if (match) setModel(match.defaultModel);
                  }}
                >
                  {availableProviders.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Model Name</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">API Key</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={tempKey}
                  onChange={e => setTempKey(e.target.value)}
                  placeholder="Paste Key here..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowKeysModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => saveApiKeys(tempKey)}>
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

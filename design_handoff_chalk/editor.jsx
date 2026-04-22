
// editor.jsx v2 — chapter tree, right panel, confetti, drawing mode

// ── CONFETTI ────────────────────────────────────────────────────────────────
function Confetti({ active, onDone }) {
  const [pieces] = React.useState(() =>
    Array.from({ length: 90 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#818cf8','#34d399','#f472b6','#fbbf24','#60a5fa','#fb923c','#a78bfa'][i % 7],
      size: Math.random() * 9 + 5,
      delay: Math.random() * 0.6,
      dur: Math.random() * 1.4 + 1.2,
      rot: Math.random() * 720 - 360,
      shape: i % 3,
    }))
  );
  React.useEffect(() => {
    if (active) { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }
  }, [active]);
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: -16,
          width: p.shape === 2 ? p.size * 2 : p.size,
          height: p.shape === 2 ? p.size * 0.5 : p.size,
          background: p.color,
          borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? 2 : 3,
          animation: `confettiFall ${p.dur}s ${p.delay}s cubic-bezier(.25,.46,.45,.94) forwards`,
          transformOrigin: 'center',
        }} />
      ))}
      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', animation: 'popIn 0.4s ease forwards' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
        <div style={{ background: 'white', borderRadius: 16, padding: '14px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '2px solid #818cf8' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>All tests passed!</div>
          <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 600, marginTop: 4 }}>4/4 · Score: 100% · +200 XP</div>
        </div>
      </div>
    </div>
  );
}

// ── DRAWING CANVAS ───────────────────────────────────────────────────────────
function DrawingBoard({ onClose, fullscreen, setFullscreen }) {
  const canvasRef = React.useRef(null);
  const [drawing, setDrawing] = React.useState(false);
  const [tool, setTool] = React.useState('pen');
  const [color, setColor] = React.useState('#818cf8');
  const [size, setSize] = React.useState(3);
  const lastPos = React.useRef(null);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  };

  const startDraw = (e) => {
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    setDrawing(true);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? size * 4 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#1a1f2e' : color;
    ctx.fill();
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#1a1f2e' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const COLORS = ['#818cf8','#34d399','#f472b6','#fbbf24','#60a5fa','#fb923c','#e2e8f0','#ff4444'];

  const panelW = fullscreen ? '100vw' : 340;
  const panelH = fullscreen ? '100vh' : 480;

  return (
    <div style={{
      position: fullscreen ? 'fixed' : 'absolute',
      inset: fullscreen ? 0 : 'auto',
      right: fullscreen ? 0 : 0,
      bottom: fullscreen ? 0 : 0,
      width: panelW, height: panelH,
      background: '#1a1f2e',
      border: fullscreen ? 'none' : '1px solid #2d3a52',
      borderRadius: fullscreen ? 0 : '12px 0 0 12px',
      display: 'flex', flexDirection: 'column',
      zIndex: 200, boxShadow: fullscreen ? 'none' : '-8px 0 32px rgba(0,0,0,0.4)',
      animation: 'slideInRight 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2d3a52', display: 'flex', alignItems: 'center', gap: 10, background: '#141824', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Draw</span>
        {/* Tool */}
        {[['pen','✏'], ['eraser','◻']].map(([t, ico]) => (
          <button key={t} onClick={() => setTool(t)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: tool === t ? '#2d3a52' : 'transparent', color: tool === t ? 'white' : '#475569', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ico}</button>
        ))}
        <div style={{ width: 1, height: 20, background: '#2d3a52' }} />
        {/* Colors */}
        {COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); setTool('pen'); }} style={{ width: 18, height: 18, borderRadius: '50%', border: color === c ? '2px solid white' : '2px solid transparent', background: c, cursor: 'pointer', flexShrink: 0, transition: 'transform 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'} />
        ))}
        <div style={{ width: 1, height: 20, background: '#2d3a52' }} />
        {/* Size */}
        <input type="range" min="1" max="12" value={size} onChange={e => setSize(+e.target.value)} style={{ width: 60, accentColor: color }} />
        <div style={{ flex: 1 }} />
        <button onClick={clearCanvas} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#2d3a52', color: '#94a3b8', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>Clear</button>
        <button onClick={() => setFullscreen(!fullscreen)} style={{ fontSize: 14, width: 28, height: 28, borderRadius: 7, border: 'none', background: '#2d3a52', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fullscreen ? '⊡' : '⊞'}</button>
        <button onClick={onClose} style={{ fontSize: 16, width: 28, height: 28, borderRadius: 7, border: 'none', background: '#2d3a52', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>
      {/* Shared indicator */}
      <div style={{ padding: '6px 14px', background: '#0d1117', borderBottom: '1px solid #1a2235', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulseDot 2s infinite' }} />
        <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>Session 3 · Apr 21 — shared with class</span>
        <div style={{ marginLeft: 'auto', display: 'flex' }}>
          {MOCK_USERS.slice(0, 3).map((u, i) => (
            <div key={u.id} style={{ width: 18, height: 18, borderRadius: '50%', background: u.color, fontSize: 7, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -4 : 0, border: '2px solid #0d1117' }}>{u.initials[0]}</div>
          ))}
        </div>
      </div>
      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}>
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <canvas
          ref={canvasRef}
          width={fullscreen ? window.innerWidth : 340}
          height={fullscreen ? window.innerHeight - 80 : 480 - 80}
          style={{ display: 'block', width: '100%', height: '100%' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={() => setDrawing(false)}
          onMouseLeave={() => setDrawing(false)}
        />
      </div>
    </div>
  );
}

// ── FILE EXPLORER TREE ───────────────────────────────────────────────────────
const TREE_DATA = {
  chapters: [
    {
      id: 'ch1', name: 'Chapter 1: Fundamentals', open: true,
      sessions: [
        { id: 's1', name: 'Session 1 · Apr 14', open: false, students: ['Alex Kim', 'Jordan Lee', 'Sam Patel'] },
        { id: 's2', name: 'Session 2 · Apr 16', open: false, students: ['Alex Kim', 'Jordan Lee'] },
      ]
    },
    {
      id: 'ch2', name: 'Chapter 2: Functions', open: true,
      sessions: [
        { id: 's3', name: 'Session 3 · Apr 21', open: true, students: ['Alex Kim', 'Jordan Lee', 'Sam Patel', 'Maya Chen', 'Ethan Wu'] },
      ]
    },
    {
      id: 'ch3', name: 'Chapter 3: Data Structures', open: false,
      sessions: []
    },
  ]
};

function FileTree({ activeFile, setActiveFile }) {
  const [tree, setTree] = React.useState(TREE_DATA);
  const toggleChapter = (cid) => setTree(t => ({ ...t, chapters: t.chapters.map(c => c.id === cid ? { ...c, open: !c.open } : c) }));
  const toggleSession = (cid, sid) => setTree(t => ({ ...t, chapters: t.chapters.map(c => c.id !== cid ? c : { ...c, sessions: c.sessions.map(s => s.id === sid ? { ...s, open: !s.open } : s) }) }));

  return (
    <div style={{ width: 220, flexShrink: 0, height: '100%', background: '#0a0f1a', borderRight: '1px solid #1a2235', overflowY: 'auto', fontFamily: 'DM Mono, monospace', fontSize: 11.5 }}>
      <div style={{ padding: '11px 14px 8px', fontSize: 9.5, fontWeight: 700, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Explorer</div>
      {tree.chapters.map(ch => (
        <div key={ch.id}>
          <div onClick={() => toggleChapter(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', cursor: 'pointer', color: '#94a3b8', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#111827'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: 9, color: '#475569', transform: ch.open ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>📚</span>
            <span style={{ flex: 1, color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</span>
          </div>
          {ch.open && ch.sessions.map(sess => (
            <div key={sess.id}>
              <div onClick={() => toggleSession(ch.id, sess.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px 5px 28px', cursor: 'pointer', color: '#64748b', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#111827'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 9, color: '#334155', transform: sess.open ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                <span style={{ fontSize: 11 }}>📁</span>
                <span style={{ fontSize: 10.5, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sess.name}</span>
              </div>
              {sess.open && (
                <div>
                  {/* Worksheet */}
                  <div onClick={() => setActiveFile('worksheet.py')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px 4px 44px', cursor: 'pointer', background: activeFile === 'worksheet.py' ? '#1e2a3a' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => activeFile !== 'worksheet.py' && (e.currentTarget.style.background = '#111827')}
                    onMouseLeave={e => activeFile !== 'worksheet.py' && (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize: 10 }}>📄</span>
                    <span style={{ fontSize: 10.5, color: '#818cf8', fontWeight: 500 }}>worksheet.py</span>
                    <span style={{ marginLeft: 4, fontSize: 9, color: '#334155', background: '#1e2a3a', padding: '1px 5px', borderRadius: 4 }}>shared</span>
                  </div>
                  {/* Student folders */}
                  {sess.students.map(name => {
                    const fname = name.split(' ')[0].toLowerCase() + '.py';
                    return (
                      <div key={name} onClick={() => setActiveFile(fname)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px 4px 44px', cursor: 'pointer', background: activeFile === fname ? '#1e2a3a' : 'transparent', transition: 'background 0.1s' }}
                        onMouseEnter={e => activeFile !== fname && (e.currentTarget.style.background = '#111827')}
                        onMouseLeave={e => activeFile !== fname && (e.currentTarget.style.background = 'transparent')}>
                        <span style={{ fontSize: 10 }}>👤</span>
                        <span style={{ fontSize: 10.5, color: '#64748b' }}>{fname}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── SYNTAX HIGHLIGHT ─────────────────────────────────────────────────────────
const KWS = ['def','if','elif','else','return','while','for','in','True','False','None','and','or','not','import','from','class','pass','break','continue','assert'];
function syntaxHighlight(code) {
  return code.split('\n').map(line =>
    line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/("""[\s\S]*?"""|'[^']*'|"[^"]*")/g, m=>`<span style="color:#fbbf24">${m}</span>`)
      .replace(/#.*/g, m=>`<span style="color:#475569">${m}</span>`)
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#c084fc">$1</span>')
      .replace(new RegExp(`\\b(${KWS.join('|')})\\b`,'g'), '<span style="color:#818cf8;font-style:italic">$1</span>')
      .replace(/\b([a-z_][a-z0-9_]*)\s*(?=\()/gi, (m,n) => KWS.includes(n)?m:`<span style="color:#34d399">${n}</span>(`)
  );
}

const PYTHON_CODE = `def fibonacci(n: int) -> int:
    """
    Return the nth Fibonacci number.
    Base cases: fibonacci(0) = 0, fibonacci(1) = 1
    """
    # TODO: implement this
    pass


# Test your solution below
print(fibonacci(0))   # Expected: 0
print(fibonacci(1))   # Expected: 1
print(fibonacci(10))  # Expected: 55
`;

const OUTPUT_LINES = [
  { t:'info', v:'▶  Running fibonacci.py...' },
  { t:'out',  v:'0' },
  { t:'out',  v:'1' },
  { t:'out',  v:'55' },
  { t:'ok',   v:'✓  3 assertions passed' },
];

// ── MAIN EDITOR ──────────────────────────────────────────────────────────────
function EditorView({ setScreen, role = 'student' }) {
  const [code, setCode] = React.useState(PYTHON_CODE);
  const [output, setOutput] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [confetti, setConfetti] = React.useState(false);
  const [activeFile, setActiveFile] = React.useState('fibonacci.py');
  const [outTab, setOutTab] = React.useState('output');
  const [rightTab, setRightTab] = React.useState(role === 'teacher' ? 'students' : 'submissions');
  const [drawOpen, setDrawOpen] = React.useState(false);
  const [drawFullscreen, setDrawFullscreen] = React.useState(false);
  const [selectedSub, setSelectedSub] = React.useState(null);
  const taRef = React.useRef(null);
  const hlRef = React.useRef(null);
  const lnRef = React.useRef(null);

  const syncScroll = () => {
    if (taRef.current && hlRef.current) { hlRef.current.scrollTop = taRef.current.scrollTop; hlRef.current.scrollLeft = taRef.current.scrollLeft; }
    if (taRef.current && lnRef.current) lnRef.current.scrollTop = taRef.current.scrollTop;
  };

  const lines = code.split('\n');
  const hlLines = syntaxHighlight(code);

  const CURSORS = [
    { user: MOCK_USERS[0], line: 3, ch: 8 },
    { user: MOCK_USERS[2], line: 9, ch: 4 },
  ];

  const handleRun = () => {
    setRunning(true); setOutput([OUTPUT_LINES[0]]); setOutTab('output');
    let i = 1;
    const iv = setInterval(() => {
      if (i < OUTPUT_LINES.length) { setOutput(p => [...p, OUTPUT_LINES[i]]); i++; }
      else { clearInterval(iv); setRunning(false); }
    }, 300);
  };

  const handleSubmit = () => {
    setRunning(true); setOutput([{ t:'info', v:'⬆  Submitting...' }]); setOutTab('output');
    setTimeout(() => {
      setOutput([
        { t:'info', v:'▶  Running test suite...' },
        { t:'ok',   v:'✓  fibonacci(0) == 0' },
        { t:'ok',   v:'✓  fibonacci(1) == 1' },
        { t:'ok',   v:'✓  fibonacci(10) == 55' },
        { t:'ok',   v:'✓  fibonacci(20) == 6765' },
        { t:'ok',   v:'' },
        { t:'ok',   v:'🎉  4/4 tests passed · Score: 100% · +200 XP' },
      ]);
      setRunning(false); setSubmitted(true); setConfetti(true);
    }, 1500);
  };

  const activeUsers = MOCK_USERS.slice(0, 4);
  const outColor = { info:'#818cf8', ok:'#34d399', err:'#f87171', out:'#94a3b8' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117', overflow: 'hidden', position: 'relative' }}>
      {/* Confetti */}
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      {/* Drawing board */}
      {drawOpen && (
        <DrawingBoard
          onClose={() => { setDrawOpen(false); setDrawFullscreen(false); }}
          fullscreen={drawFullscreen}
          setFullscreen={setDrawFullscreen}
        />
      )}

      {/* ── Top bar ── */}
      <div style={{ height: 50, background: '#080d14', borderBottom: '1px solid #1a2235', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => setScreen('classroom')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, padding: '5px 8px', borderRadius: 6, transition: 'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1a2235'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Classroom
        </button>
        <span style={{ color: '#1a2235' }}>›</span>
        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Fibonacci Sequence</span>
        <span style={{ color: '#1a2235' }}>›</span>
        <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{activeFile}</span>
        <div style={{ flex: 1 }} />
        <PresenceBar users={activeUsers} />
        <div style={{ width: 1, height: 22, background: '#1a2235' }} />
        {/* Draw button */}
        <button onClick={() => setDrawOpen(!drawOpen)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', background: drawOpen ? '#818cf820' : 'transparent', border: drawOpen ? '1px solid #818cf840' : '1px solid transparent', borderRadius: 7, color: drawOpen ? '#818cf8' : '#475569', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
          ✏ Draw
        </button>
        <button onClick={handleRun} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', background: '#1a2235', border: '1px solid #2d3a52', borderRadius: 7, color: '#94a3b8', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => !running && (e.currentTarget.style.borderColor = '#818cf8')}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#2d3a52'}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#818cf8"><path d="M5 3l14 9-14 9V3z"/></svg>
          Run
        </button>
        <button onClick={handleSubmit} disabled={running || submitted} style={{ padding: '6px 13px', background: submitted ? '#0d2218' : '#4f46e5', border: 'none', borderRadius: 7, color: submitted ? '#34d399' : 'white', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, cursor: (running || submitted) ? 'not-allowed' : 'pointer', opacity: (running || submitted) ? 0.75 : 1, transition: 'all 0.2s' }}>
          {submitted ? '✓ Submitted' : '⬆ Submit'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* File tree */}
        <FileTree activeFile={activeFile} setActiveFile={setActiveFile} />

        {/* Center: editor + terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#080d14', borderBottom: '1px solid #1a2235', flexShrink: 0 }}>
            {[activeFile, 'worksheet.py'].map(tab => (
              <button key={tab} onClick={() => setActiveFile(tab)} style={{ padding: '9px 18px', border: 'none', cursor: 'pointer', background: activeFile === tab ? '#0d1117' : 'transparent', color: activeFile === tab ? '#e2e8f0' : '#475569', fontFamily: 'DM Mono, monospace', fontSize: 11.5, fontWeight: 500, borderBottom: activeFile === tab ? '2px solid #818cf8' : '2px solid transparent', transition: 'all 0.12s', whiteSpace: 'nowrap', flexShrink: 0 }}>{tab}</button>
            ))}
          </div>

          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* Line numbers */}
            <div ref={lnRef} style={{ padding: '14px 0', minWidth: 46, background: '#080d14', borderRight: '1px solid #111827', overflowY: 'hidden', userSelect: 'none', flexShrink: 0 }}>
              {lines.map((_, i) => (
                <div key={i} style={{ lineHeight: '22px', paddingRight: 10, paddingLeft: 8, fontFamily: 'DM Mono, monospace', fontSize: 11.5, color: CURSORS.some(c => c.line === i + 1) ? '#818cf8' : '#1e2a3a', textAlign: 'right' }}>{i + 1}</div>
              ))}
            </div>
            {/* Highlight + textarea */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div ref={hlRef} style={{ position: 'absolute', inset: 0, padding: '14px 14px 14px 12px', fontFamily: 'DM Mono, monospace', fontSize: 12.5, lineHeight: '22px', color: '#e2e8f0', whiteSpace: 'pre', overflowY: 'hidden', overflowX: 'auto', pointerEvents: 'none', tabSize: 4 }}>
                {hlLines.map((html, i) => {
                  const cur = CURSORS.find(c => c.line === i + 1);
                  return (
                    <div key={i} style={{ position: 'relative', minHeight: 22 }}>
                      <span dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
                      {cur && <>
                        <span style={{ position: 'absolute', top: 2, left: `${cur.ch * 7.8 + 12}px`, width: 2, height: 18, background: cur.user.color, display: 'inline-block', borderRadius: 1, animation: 'blink 1.2s infinite', zIndex: 10 }} />
                        <div style={{ position: 'absolute', top: -17, left: `${cur.ch * 7.8 + 8}px`, background: cur.user.color, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font)', whiteSpace: 'nowrap', zIndex: 20 }}>{cur.user.name.split(' ')[0]}</div>
                      </>}
                    </div>
                  );
                })}
              </div>
              <textarea ref={taRef} value={code} onChange={e => setCode(e.target.value)} onScroll={syncScroll} spellCheck={false} style={{ position: 'absolute', inset: 0, padding: '14px 14px 14px 12px', fontFamily: 'DM Mono, monospace', fontSize: 12.5, lineHeight: '22px', color: 'transparent', caretColor: '#e2e8f0', background: 'transparent', border: 'none', outline: 'none', resize: 'none', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'auto', whiteSpace: 'pre', tabSize: 4, zIndex: 5 }} />
            </div>
          </div>

          {/* Terminal */}
          <div style={{ height: 200, background: '#080d14', borderTop: '1px solid #1a2235', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #111827', flexShrink: 0 }}>
              {['output', 'tests'].map(t => (
                <button key={t} onClick={() => setOutTab(t)} style={{ padding: '7px 16px', border: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: outTab === t ? '#e2e8f0' : '#334155', borderBottom: outTab === t ? '2px solid #818cf8' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.12s' }}>{t}</button>
              ))}
              {running && <span style={{ marginLeft: 8, fontSize: 10.5, color: '#818cf8', fontFamily: 'DM Mono, monospace', animation: 'pulse 1s infinite', letterSpacing: '0.04em' }}>running…</span>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', fontFamily: 'DM Mono, monospace', fontSize: 12, lineHeight: 1.8 }}>
              {output.length === 0 ? <span style={{ color: '#1e2a3a' }}>Press Run to execute</span> : output.map((l, i) => <div key={i} style={{ color: outColor[l.t] || '#94a3b8' }}>{l.v}</div>)}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ width: 270, flexShrink: 0, borderLeft: '1px solid #1a2235', background: '#080d14', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1a2235', flexShrink: 0 }}>
            {(role === 'teacher' ? ['students', 'submissions'] : ['submissions']).map(t => (
              <button key={t} onClick={() => setRightTab(t)} style={{ flex: 1, padding: '9px 0', border: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: rightTab === t ? '#e2e8f0' : '#334155', borderBottom: rightTab === t ? '2px solid #818cf8' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.12s' }}>{t}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Teacher: all students */}
            {rightTab === 'students' && (
              <div>
                <div style={{ padding: '10px 14px', fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Editing this file</div>
                {MOCK_USERS.slice(0, 5).map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid #111827', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#111827'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: u.color, fontSize: 10, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.initials}</div>
                      {u.id <= 3 && <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#34d399', border: '1.5px solid #080d14' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: '#334155' }}>{u.id <= 3 ? `Line ${[8, 3, 11][u.id - 1] || 5}` : 'idle'}</div>
                    </div>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.id <= 3 ? '#34d399' : '#1e2a3a', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}

            {/* Submissions panel */}
            {rightTab === 'submissions' && (
              <div>
                <div style={{ padding: '10px 14px', fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {role === 'teacher' ? 'All submissions' : 'My submissions'}
                </div>
                {(role === 'teacher' ? MOCK_SUBMISSIONS : MOCK_SUBMISSIONS.slice(0, 2)).map(sub => (
                  <div key={sub.id} onClick={() => setSelectedSub(selectedSub?.id === sub.id ? null : sub)} style={{ padding: '10px 14px', borderBottom: '1px solid #111827', cursor: 'pointer', transition: 'background 0.1s', background: selectedSub?.id === sub.id ? '#111827' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#111827'}
                    onMouseLeave={e => selectedSub?.id !== sub.id && (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: sub.user.color, fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sub.user.initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.user.name}</div>
                        <div style={{ fontSize: 10, color: '#334155' }}>{sub.time}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: sub.status === 'success' ? '#0d2218' : sub.status === 'failed' ? '#2d0d0d' : '#1a1400', color: sub.status === 'success' ? '#34d399' : sub.status === 'failed' ? '#f87171' : '#fbbf24' }}>{sub.status}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: sub.score >= 80 ? '#34d399' : sub.score > 0 ? '#fbbf24' : '#f87171' }}>{sub.score}%</span>
                      </div>
                    </div>
                    {selectedSub?.id === sub.id && (
                      <div style={{ marginTop: 10, padding: 10, background: '#0d1117', borderRadius: 8, border: '1px solid #1a2235' }}>
                        <div style={{ fontSize: 10, color: '#334155', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tests</div>
                        {[`fibonacci(0)==0`, `fibonacci(1)==1`, `fibonacci(10)==55`, `fibonacci(20)==6765`].map((t, i) => (
                          <div key={i} style={{ fontSize: 10, color: i < sub.passed ? '#34d399' : '#475569', marginBottom: 3, fontFamily: 'DM Mono, monospace' }}>
                            {i < sub.passed ? '✓' : '✗'} {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ height: 24, background: '#060a10', borderTop: '1px solid #111827', display: 'flex', alignItems: 'center', gap: 20, padding: '0 18px', fontSize: 10.5, color: '#1e2a3a', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
        <span style={{ color: '#334155' }}>Due Apr 25</span>
        <span>·</span>
        <span style={{ color: '#334155' }}>Python 3.12</span>
        <span>·</span>
        <span style={{ color: '#334155' }}>{lines.length} lines</span>
        <span>·</span>
        <span style={{ color: '#818cf8' }}>{activeUsers.length} live</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#334155' }}>Ln {lines.length}, Col 1</span>
      </div>
    </div>
  );
}

Object.assign(window, { EditorView });

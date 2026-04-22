
// landing.jsx — Arc-style animated landing page

function useReveal(threshold = 0.12) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function reveal(visible, delay = 0) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s ${delay}s ease, transform 0.7s ${delay}s ease`,
  };
}

// Animated live IDE mockup for hero
function HeroMockup() {
  const [cursorA, setCursorA] = React.useState({ line: 3, x: 52 });
  const [cursorB, setCursorB] = React.useState({ line: 7, x: 28 });
  const [typedChars, setTypedChars] = React.useState(18);
  const fullLine = '    return fibonacci(n-1) + fibonacci(n-2)';

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursorA(c => ({ line: c.line, x: c.x + (Math.random() - 0.5) * 2 }));
      setCursorB(c => ({ line: c.line + (Math.random() > 0.85 ? 1 : 0), x: c.x + (Math.random() - 0.3) * 3 }));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      setTypedChars(n => n < fullLine.length ? n + 1 : n);
    }, 80);
    return () => clearInterval(t);
  }, []);

  const lines = [
    { n: 1, tokens: [{ c: '#818cf8', v: 'def ' }, { c: '#34d399', v: 'fibonacci' }, { c: '#e2e8f0', v: '(n: ' }, { c: '#fb923c', v: 'int' }, { c: '#e2e8f0', v: ') -> ' }, { c: '#fb923c', v: 'int' }, { c: '#e2e8f0', v: ':' }] },
    { n: 2, tokens: [{ c: '#64748b', v: '    """Return the nth Fibonacci number."""' }] },
    { n: 3, tokens: [{ c: '#818cf8', v: '    if ' }, { c: '#e2e8f0', v: 'n <= ' }, { c: '#c084fc', v: '1' }, { c: '#e2e8f0', v: ':' }] },
    { n: 4, tokens: [{ c: '#818cf8', v: '        return ' }, { c: '#e2e8f0', v: 'n' }] },
    { n: 5, tokens: [{ c: '#e2e8f0', v: fullLine.slice(0, typedChars) }] },
    { n: 6, tokens: [] },
    { n: 7, tokens: [{ c: '#34d399', v: 'print' }, { c: '#e2e8f0', v: '(' }, { c: '#34d399', v: 'fibonacci' }, { c: '#e2e8f0', v: '(' }, { c: '#c084fc', v: '10' }, { c: '#e2e8f0', v: '))' }] },
  ];

  const presence = [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[3]];

  return (
    <div style={{ background: '#0d1117', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace', fontSize: 12.5 }}>
      {/* Window chrome */}
      <div style={{ padding: '12px 16px', background: '#080d14', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '4px 14px', fontSize: 11, color: '#475569', fontFamily: 'var(--font)' }}>
            fibonacci.py — Chalk
          </div>
        </div>
        {/* Live presence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
          <span style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font)', fontWeight: 600 }}>4 live</span>
          <div style={{ display: 'flex' }}>
            {presence.map((u, i) => (
              <div key={u.id} style={{ width: 20, height: 20, borderRadius: '50%', background: u.color, fontSize: 7, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -5 : 0, border: '2px solid #0d1117', zIndex: presence.length - i }}>{u.initials[0]}</div>
            ))}
          </div>
        </div>
      </div>
      {/* Editor */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 32, padding: '14px 0', background: '#080d14', borderRight: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}>
          {lines.map(l => <div key={l.n} style={{ lineHeight: '22px', paddingRight: 8, color: '#1e2a3a', fontSize: 11 }}>{l.n}</div>)}
        </div>
        <div style={{ flex: 1, padding: '14px 16px', position: 'relative' }}>
          {lines.map((line, li) => (
            <div key={li} style={{ lineHeight: '22px', position: 'relative', minHeight: 22 }}>
              {line.tokens.length === 0 ? <span>&nbsp;</span> : line.tokens.map((t, ti) => <span key={ti} style={{ color: t.c }}>{t.v}</span>)}
              {line.n === 3 && (
                <>
                  <span style={{ position: 'absolute', top: 3, left: `${Math.max(20, cursorA.x)}px`, width: 2, height: 17, background: MOCK_USERS[0].color, display: 'inline-block', animation: 'blink 1.2s infinite' }} />
                  <div style={{ position: 'absolute', top: -17, left: `${Math.max(16, cursorA.x - 4)}px`, background: MOCK_USERS[0].color, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>Prof. Chen</div>
                </>
              )}
              {line.n === 5 && typedChars < fullLine.length && (
                <>
                  <span style={{ display: 'inline-block', width: 2, height: 17, background: MOCK_USERS[1].color, verticalAlign: 'middle', animation: 'blink 0.9s infinite' }} />
                  <div style={{ position: 'absolute', top: -17, left: `${typedChars * 7.5}px`, background: MOCK_USERS[1].color, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>Alex</div>
                </>
              )}
              {line.n === 7 && (
                <>
                  <span style={{ position: 'absolute', top: 3, left: `${Math.max(10, Math.min(cursorB.x, 80))}px`, width: 2, height: 17, background: MOCK_USERS[2].color, display: 'inline-block', animation: 'blink 1.4s infinite' }} />
                  <div style={{ position: 'absolute', top: -17, left: `${Math.max(6, Math.min(cursorB.x - 4, 76))}px`, background: MOCK_USERS[2].color, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>Jordan</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Output bar */}
      <div style={{ padding: '10px 16px', background: '#080d14', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#34d399', fontSize: 12 }}>
        <span style={{ color: '#334155' }}>▶ </span>55<span style={{ color: '#334155', marginLeft: 12 }}>// fibonacci(10) ✓</span>
      </div>
    </div>
  );
}

// Step card for "how it works"
function StepCard({ number, title, desc, visible, delay, color }) {
  return (
    <div style={{ ...reveal(visible, delay), padding: '28px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color + '12' }} />
      <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: `1px solid ${color}30` }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: color, fontFamily: 'DM Mono, monospace' }}>{number}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

function Landing({ onLogin, heroVariant = 1 }) {
  const [heroVisible, setHeroVisible] = React.useState(false);
  const [stepsRef, stepsVisible] = useReveal();
  const [collabRef, collabVisible] = useReveal();
  const [rolesRef, rolesVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal(0.3);

  React.useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Gradient orbs */}
        <div style={{ position: 'absolute', top: -200, left: '10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.52 0.26 265 / 0.10) 0%, transparent 65%)', animation: 'orbFloat 8s ease-in-out infinite alternate', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 100, right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.60 0.22 308 / 0.08) 0%, transparent 65%)', animation: 'orbFloat 10s ease-in-out infinite alternate-reverse', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '40%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.72 0.16 162 / 0.06) 0%, transparent 65%)', animation: 'orbFloat 12s ease-in-out infinite alternate', pointerEvents: 'none' }} />

        {/* Nav */}
        <nav style={{ padding: '20px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
          <ChalkLogo size={30} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={() => onLogin('student')}>Student sign-in</Btn>
            <Btn variant="primary" size="sm" onClick={() => onLogin('teacher')}>Start teaching →</Btn>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', maxWidth: 1280, margin: '0 auto', width: '100%', padding: '80px 56px', gap: 80 }}>
          {/* Left */}
          <div style={{ flex: '0 0 520px' }}>
            <div style={{ ...reveal(heroVisible, 0), display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--indigo-10)', color: 'var(--indigo)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 99, marginBottom: 28, border: '1px solid var(--indigo-20)', letterSpacing: '0.02em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', animation: 'pulseDot 2s infinite' }} />
              Real-time collaborative coding classroom
            </div>
            <h1 style={{ ...reveal(heroVisible, 0.1), fontSize: 62, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 24px' }}>
              Where code<br />
              <span style={{ background: 'linear-gradient(125deg, var(--indigo) 0%, oklch(0.60 0.22 308) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>meets classroom.</span>
            </h1>
            <p style={{ ...reveal(heroVisible, 0.2), fontSize: 18, color: 'var(--text-2)', lineHeight: 1.65, margin: '0 0 40px', maxWidth: 460 }}>
              Students and teachers edit the same code file simultaneously. Watch, guide, and grade — in real time, from any browser.
            </p>
            <div style={{ ...reveal(heroVisible, 0.3), display: 'flex', gap: 12, marginBottom: 48 }}>
              <Btn variant="primary" size="lg" onClick={() => onLogin('teacher')} style={{ borderRadius: 12 }}>Create a classroom →</Btn>
              <Btn variant="secondary" size="lg" onClick={() => onLogin('student')} style={{ borderRadius: 12 }}>Join with a code</Btn>
            </div>
            {/* Social proof */}
            <div style={{ ...reveal(heroVisible, 0.4), display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-2)', borderRadius: 14, border: '1px solid var(--border)' }}>
              <AvatarStack users={MOCK_USERS} size={30} max={6} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>500+ students coding right now</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Across 40+ classrooms worldwide</div>
              </div>
              <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--mint)', flexShrink: 0, animation: 'pulseDot 2s infinite' }} />
            </div>
          </div>

          {/* Right — mockup */}
          <div style={{ flex: 1, ...reveal(heroVisible, 0.25) }}>
            <HeroMockup />
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ ...reveal(heroVisible, 0.6), position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scroll to explore</span>
          <div style={{ width: 24, height: 38, border: '1.5px solid var(--border)', borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <div style={{ width: 3, height: 8, background: 'var(--indigo)', borderRadius: 99, animation: 'scrollDot 1.6s ease-in-out infinite' }} />
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <div ref={stepsRef} style={{ padding: '100px 56px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ ...reveal(stepsVisible, 0), fontSize: 12, fontWeight: 700, color: 'var(--indigo)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>How it works</div>
          <h2 style={{ ...reveal(stepsVisible, 0.05), fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 16px' }}>From zero to coding<br />in 60 seconds.</h2>
          <p style={{ ...reveal(stepsVisible, 0.1), fontSize: 17, color: 'var(--text-3)', maxWidth: 480, margin: '0 auto' }}>No installs, no config, no broken environments. Chalk runs in the browser — for everyone.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { n: '01', title: 'Create a classroom', desc: 'Teachers set up a classroom in seconds and share an invite code with students.', color: 'var(--indigo)' },
            { n: '02', title: 'Students join instantly', desc: 'Open a browser, enter the code. No install, no account setup — coding in seconds.', color: 'oklch(0.60 0.22 308)' },
            { n: '03', title: 'Code together live', desc: 'Everyone edits the same file. See each other\'s cursors, selections, and changes in real time.', color: 'var(--mint)' },
            { n: '04', title: 'Submit & get graded', desc: 'Click Submit. Chalk runs the code in a safe sandbox and shows results instantly.', color: 'var(--amber)' },
          ].map((s, i) => <StepCard key={s.n} {...s} number={s.n} visible={stepsVisible} delay={0.1 + i * 0.1} />)}
        </div>
      </div>

      {/* ── LIVE COLLAB SHOWCASE ───────────────────────────────────── */}
      <div ref={collabRef} style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ ...reveal(collabVisible, 0), display: 'inline-block', background: 'var(--mint-10)', color: 'var(--mint)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid oklch(0.85 0.08 162)' }}>Live collaboration</div>
            <h2 style={{ ...reveal(collabVisible, 0.05), fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 20px', lineHeight: 1.1 }}>See every keystroke, in real time.</h2>
            <p style={{ ...reveal(collabVisible, 0.1), fontSize: 16, color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 32px' }}>Chalk uses a CRDT engine (the same technology as Figma) so edits never conflict. Every cursor, selection, and change from every user appears instantly — no refreshing, no locking.</p>
            <div style={{ ...reveal(collabVisible, 0.15), display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '●', color: 'var(--indigo)', label: 'Teacher cursor', desc: 'Professors appear in indigo so students always know where they are' },
                { icon: '●', color: 'oklch(0.62 0.22 28)', label: 'Student cursors', desc: 'Each student gets a unique color — their name floats above the cursor' },
                { icon: '◐', color: 'var(--mint)', label: 'Presence bar', desc: 'See who\'s active, who\'s idle, and who just joined — at a glance' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ color: f.color, fontSize: 10, marginTop: 3, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...reveal(collabVisible, 0.1) }}>
            {/* Presence cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mint)', animation: 'pulseDot 2s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>LIVE IN FIBONACCI.PY</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {MOCK_USERS.slice(0, 4).map(u => (
                      <div key={u.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar user={u} size={38} />
                          <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: u.id <= 3 ? 'var(--mint)' : 'var(--border)', border: '2px solid var(--bg)' }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{u.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Activity this session</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48 }}>
                  {[12, 18, 8, 24, 32, 16, 28, 20, 36, 22, 30, 14].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: 3, background: i > 8 ? 'var(--indigo)' : 'var(--bg-3)', height: `${h * 1.3}px`, transition: 'height 0.3s' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>
                  <span>Session start</span><span>Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOR TEACHERS / STUDENTS ────────────────────────────────── */}
      <div ref={rolesRef} style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 56px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ ...reveal(rolesVisible, 0), fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 12px' }}>Built for both sides of the desk.</h2>
          <p style={{ ...reveal(rolesVisible, 0.05), fontSize: 17, color: 'var(--text-3)' }}>Chalk adapts to whether you're teaching or learning.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { role: 'Teacher', color: 'var(--indigo)', items: ['Create classrooms with invite codes', 'Watch every student\'s code in real time', 'Set assignments with template code + test cases', 'Auto-grade submissions with your test suite', 'Jump into any student editor to leave a cursor'] },
            { role: 'Student', color: 'oklch(0.62 0.22 28)', items: ['Join class instantly — no setup', 'Edit code with your classmates live', 'See the teacher\'s cursor as they guide you', 'Submit with one click — instant test results', 'Track your XP, streak, and achievements'] },
          ].map((r, ri) => (
            <div key={r.role} style={{ ...reveal(rolesVisible, 0.1 + ri * 0.08), background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: r.color + '10' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: r.color + '15', borderRadius: 99, padding: '6px 14px', marginBottom: 24 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>For {r.role}s</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {r.items.map(item => (
                  <li key={item} style={{ display: 'flex', gap: 12, fontSize: 14, color: 'var(--text-2)', alignItems: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill={r.color} style={{ flexShrink: 0, marginTop: 1 }}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 28 }}>
                <Btn variant="primary" size="md" onClick={() => onLogin(r.role.toLowerCase())} style={{ background: r.color, width: '100%', justifyContent: 'center', borderRadius: 12 }}>Get started as {r.role} →</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <div ref={ctaRef} style={{ background: 'linear-gradient(135deg, var(--indigo) 0%, oklch(0.48 0.27 265) 50%, oklch(0.55 0.22 308) 100%)', padding: '100px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ ...reveal(ctaVisible, 0), fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', color: 'white', margin: '0 0 16px', lineHeight: 1.05 }}>Ready to code together?</h2>
          <p style={{ ...reveal(ctaVisible, 0.05), fontSize: 18, color: 'rgba(255,255,255,0.7)', margin: '0 0 40px' }}>Free to start. No credit card. No setup.</p>
          <div style={{ ...reveal(ctaVisible, 0.1), display: 'flex', gap: 14, justifyContent: 'center' }}>
            <button onClick={() => onLogin('teacher')} style={{ padding: '14px 32px', background: 'white', color: 'var(--indigo)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              Create a classroom →
            </button>
            <button onClick={() => onLogin('student')} style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', backdropFilter: 'blur(8px)', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              Join as student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Landing });

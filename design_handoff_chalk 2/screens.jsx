
// screens.jsx — Dashboards, Classroom, Submissions (no Landing)

// ── TEACHER DASHBOARD ──────────────────────────────────────────────────────
function TeacherDashboard({ setScreen }) {
  const stats = [
    { label: 'Classrooms', value: '3', path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'var(--indigo)' },
    { label: 'Total students', value: '57', path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'oklch(0.55 0.22 308)' },
    { label: 'Live right now', value: '11', path: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'var(--mint)', live: true },
    { label: 'Pending reviews', value: '14', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'var(--amber)' },
  ];
  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto', background: 'var(--bg-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Good morning, Prof. Chen</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>Monday, April 21 · 3 active classrooms</p>
        </div>
        <Btn variant="primary" onClick={() => setScreen('classroom')}>+ New classroom</Btn>
      </div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.path} /></svg>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</span>
              {s.live && <Badge type="live">Live</Badge>}
            </div>
          </div>
        ))}
      </div>
      {/* Classrooms */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Your classrooms</h2>
          <button onClick={() => setScreen('classroom')} style={{ fontSize: 13, color: 'var(--indigo)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>View all →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {MOCK_CLASSROOMS.map(cls => (
            <Card key={cls.id} onClick={() => setScreen('classroom')} style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: cls.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, fontFamily: 'DM Mono, monospace' }}>{cls.code.slice(0, 2)}</div>
                {cls.active > 0 && <Badge type="live">{cls.active} live</Badge>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{cls.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', marginBottom: 16 }}>{cls.code}</div>
              <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: `${(cls.active / cls.students) * 100}%`, height: '100%', background: cls.color, borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                <span>{cls.students} students</span>
                <span>{cls.assignments} assignments</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── STUDENT DASHBOARD (Steam-like) ──────────────────────────────────────────
const XP_FRAMES = [
  { id: 'plain',    name: 'Default',    cost: 0,    color: 'var(--border)',  glow: 'none', unlocked: true },
  { id: 'bronze',   name: 'Bronze',     cost: 100,  color: '#cd7f32',        glow: '0 0 12px #cd7f3266' },
  { id: 'silver',   name: 'Silver',     cost: 250,  color: '#c0c0c0',        glow: '0 0 12px #c0c0c066' },
  { id: 'gold',     name: 'Gold',       cost: 500,  color: '#ffd700',        glow: '0 0 16px #ffd70066' },
  { id: 'cosmic',   name: 'Cosmic',     cost: 1000, color: 'oklch(0.60 0.22 308)', glow: '0 0 20px oklch(0.60 0.22 308 / 0.5)' },
];
const XP_BGTYPES = [
  { id: 'default', name: 'Default',    cost: 0,   bg: 'linear-gradient(135deg, oklch(0.52 0.26 265) 0%, oklch(0.48 0.27 265) 100%)', unlocked: true },
  { id: 'cosmic',  name: 'Cosmic',    cost: 200,  bg: 'linear-gradient(135deg, #0d0221 0%, #1a0533 50%, #0d1b2a 100%)' },
  { id: 'matrix',  name: 'Matrix',    cost: 300,  bg: 'linear-gradient(135deg, #001100 0%, #003300 50%, #001a00 100%)' },
  { id: 'sunset',  name: 'Sunset',    cost: 400,  bg: 'linear-gradient(135deg, #ff6b35 0%, #f7c948 50%, #e8506a 100%)' },
  { id: 'ocean',   name: 'Ocean',     cost: 500,  bg: 'linear-gradient(135deg, #0575e6 0%, #021b79 100%)' },
];
const ACHIEVEMENTS = [
  { id: 'first',    icon: '🏆', name: 'First Blood',    desc: 'First successful submission',     unlocked: true,  rarity: 'common' },
  { id: 'streak7',  icon: '🔥', name: 'Week Warrior',   desc: '7-day coding streak',              unlocked: true,  rarity: 'rare' },
  { id: 'perfect10',icon: '💎', name: 'Perfectionist',  desc: '10 perfect score submissions',    unlocked: true,  rarity: 'epic' },
  { id: 'speed',    icon: '⚡', name: 'Speed Coder',    desc: 'Submit in under 5 minutes',       unlocked: true,  rarity: 'rare' },
  { id: '500lines', icon: '📝', name: 'Prolific Writer', desc: '500+ lines of code written',     unlocked: false, rarity: 'rare' },
  { id: 'collab',   icon: '👥', name: 'Team Player',    desc: 'Edit in a session with 5+ peers', unlocked: false, rarity: 'epic' },
  { id: 'legend',   icon: '🌟', name: 'Legendary',      desc: 'Reach Level 20',                  unlocked: false, rarity: 'legendary' },
  { id: 'nocopy',   icon: '🔒', name: 'Original',       desc: '0% plagiarism on all work',       unlocked: true,  rarity: 'common' },
];
const RARITY_COLOR = { common: '#94a3b8', rare: '#818cf8', epic: 'oklch(0.60 0.22 308)', legendary: '#fbbf24' };

function XpBar({ current, max, color = 'var(--indigo)' }) {
  const pct = (current / max) * 100;
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: 99, boxShadow: `0 0 8px ${color}`, transition: 'width 1s ease' }} />
    </div>
  );
}

function ActivityGraph() {
  const weeks = 15;
  const days = weeks * 7;
  const data = Array.from({ length: days }, (_, i) => {
    const r = Math.random();
    return r > 0.55 ? Math.floor(r * 5) : 0;
  });
  const colors = ['transparent', '#1e3a5f', '#1d4ed8', '#3b82f6', '#818cf8'];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Coding activity</div>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Array.from({ length: 7 }, (_, d) => {
              const idx = w * 7 + d;
              const val = data[idx] || 0;
              return <div key={d} style={{ width: 10, height: 10, borderRadius: 2, background: colors[Math.min(val, 4)], transition: 'background 0.2s' }} title={val > 0 ? `${val} submissions` : 'No activity'} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentDashboard({ setScreen }) {
  const [xp] = React.useState(2847);
  const [level] = React.useState(12);
  const [frame, setFrame] = React.useState('gold');
  const [bgType, setBgType] = React.useState('default');
  const [shopTab, setShopTab] = React.useState('frames');
  const [showShop, setShowShop] = React.useState(false);

  const curFrame = XP_FRAMES.find(f => f.id === frame) || XP_FRAMES[0];
  const curBg = XP_BGTYPES.find(b => b.id === bgType) || XP_BGTYPES[0];
  const xpToNext = 3000;
  const me = MOCK_USERS[1];

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-2)' }}>
      {/* ── Profile hero ── */}
      <div style={{ position: 'relative', background: curBg.bg, paddingBottom: 0, minHeight: 220, overflow: 'hidden' }}>
        {/* Animated particles overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%)', pointerEvents: 'none' }} />
        {/* Subtle grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '32px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            {/* Avatar with frame */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: me.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: 'white', boxShadow: curFrame.glow, border: `3px solid ${curFrame.color}`, transition: 'box-shadow 0.4s, border-color 0.4s' }}>
                {me.initials}
              </div>
              <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--indigo)', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, border: '2px solid rgba(0,0,0,0.3)', letterSpacing: '0.02em' }}>LV{level}</div>
            </div>
            {/* Info */}
            <div style={{ paddingBottom: 16, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{me.name}</div>
                {ACHIEVEMENTS.filter(a => a.unlocked).slice(0, 3).map(a => (
                  <span key={a.id} style={{ fontSize: 16 }} title={a.name}>{a.icon}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, fontWeight: 500 }}>Senior Coder · Intro to Python</div>
              {/* XP Bar */}
              <div style={{ maxWidth: 320 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{xp.toLocaleString()} XP</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{xpToNext.toLocaleString()} to Lv{level + 1}</span>
                </div>
                <XpBar current={xp} max={xpToNext} color="rgba(255,255,255,0.9)" />
              </div>
            </div>
            {/* Customize button */}
            <button onClick={() => setShowShop(!showShop)} style={{ marginBottom: 16, padding: '8px 18px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
              ✦ Customize
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '0 32px', position: 'relative', zIndex: 1, marginTop: 8 }}>
          {['Profile', 'Assignments'].map(t => (
            <div key={t} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', borderBottom: '2px solid transparent', cursor: 'default' }}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>
        {/* ── Cosmetics shop (collapsible) ── */}
        {showShop && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginTop: 20, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>✦ Cosmetics Shop</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--indigo-10)', color: 'var(--indigo)', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>⬡ {xp.toLocaleString()} XP</div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {['frames', 'backgrounds'].map(t => (
                <button key={t} onClick={() => setShopTab(t)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, background: shopTab === t ? 'var(--indigo-10)' : 'var(--bg-2)', color: shopTab === t ? 'var(--indigo)' : 'var(--text-3)', textTransform: 'capitalize' }}>{t}</button>
              ))}
            </div>
            {shopTab === 'frames' && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {XP_FRAMES.map(f => {
                  const canBuy = xp >= f.cost;
                  const equipped = frame === f.id;
                  return (
                    <div key={f.id} onClick={() => canBuy && setFrame(f.id)} style={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 8px', borderRadius: 12, border: `2px solid ${equipped ? f.color : 'var(--border)'}`, background: equipped ? 'var(--indigo-10)' : 'var(--bg-2)', cursor: canBuy ? 'pointer' : 'not-allowed', opacity: canBuy ? 1 : 0.5, transition: 'all 0.15s' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: MOCK_USERS[1].color, border: `3px solid ${f.color}`, boxShadow: f.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>AK</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{f.cost === 0 ? 'Free' : `⬡ ${f.cost}`}</div>
                      {equipped && <div style={{ fontSize: 9, color: 'var(--indigo)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Equipped</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {shopTab === 'backgrounds' && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {XP_BGTYPES.map(b => {
                  const canBuy = xp >= b.cost;
                  const equipped = bgType === b.id;
                  return (
                    <div key={b.id} onClick={() => canBuy && setBgType(b.id)} style={{ width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 12, border: `2px solid ${equipped ? 'var(--indigo)' : 'var(--border)'}`, background: 'var(--bg-2)', cursor: canBuy ? 'pointer' : 'not-allowed', opacity: canBuy ? 1 : 0.5, transition: 'all 0.15s' }}>
                      <div style={{ width: '100%', height: 44, borderRadius: 8, background: b.bg }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{b.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{b.cost === 0 ? 'Free' : `⬡ ${b.cost}`}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Stats grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 20 }}>
          {[
            { label: 'Total XP', value: '2,847', suffix: 'XP', color: 'var(--indigo)', icon: '⬡', sub: '+340 this week' },
            { label: 'Lines Written', value: '1,247', suffix: '', color: 'oklch(0.60 0.22 308)', icon: '{ }', sub: 'Across 6 assignments' },
            { label: 'Submissions', value: '34', suffix: '', color: 'var(--mint)', icon: '✓', sub: '28 successful · 82%' },
            { label: 'Streak', value: '7', suffix: 'days', color: 'var(--amber)', icon: '🔥', sub: 'Personal best: 12' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: s.color + '12' }} />
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>{s.suffix}</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, opacity: 0.7 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }}>
          {/* Achievements */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Achievements</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {ACHIEVEMENTS.map(a => (
                <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 12, background: a.unlocked ? 'var(--bg-2)' : 'var(--bg-3)', border: `1px solid ${a.unlocked ? RARITY_COLOR[a.rarity] + '44' : 'var(--border)'}`, opacity: a.unlocked ? 1 : 0.45, transition: 'transform 0.15s', cursor: 'default' }}
                  onMouseEnter={e => a.unlocked && (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                  <span style={{ fontSize: a.unlocked ? 22 : 18, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                  <div style={{ fontSize: 10, fontWeight: 700, color: a.unlocked ? RARITY_COLOR[a.rarity] : 'var(--text-3)', textAlign: 'center', lineHeight: 1.3 }}>{a.name}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Activity */}
          <div style={{ background: '#0d1117', border: '1px solid #1a2235', borderRadius: 'var(--r-lg)', padding: 20 }}>
            <ActivityGraph />
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP Progress</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                <span>Level {level}</span>
                <span>{xp} / {xpToNext} XP</span>
              </div>
              <XpBar current={xp} max={xpToNext} color="#818cf8" />
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Assignments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MOCK_ASSIGNMENTS.map(a => (
              <Card key={a.id} onClick={() => setScreen('editor')} style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Due {a.due}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {a.myStatus === 'submitted' && <span style={{ fontSize: 12, color: 'var(--mint)', fontWeight: 700 }}>+200 XP</span>}
                    <Badge type={a.myStatus}>{a.myStatus.replace('-', ' ')}</Badge>
                  </div>
                </div>
                {a.myStatus === 'in-progress' && (
                  <div style={{ marginTop: 10, height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: '45%', height: '100%', background: 'var(--indigo)', borderRadius: 99 }} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CLASSROOM VIEW ───────────────────────────────────────────────────────────
function ClassroomView({ setScreen, role }) {
  const [tab, setTab] = React.useState('students');
  const cls = MOCK_CLASSROOMS[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 6 }}>Dashboard › Classrooms</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>{cls.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <code style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', background: 'var(--bg-2)', padding: '3px 10px', borderRadius: 6, color: 'var(--text-2)', border: '1px solid var(--border)' }}>Invite: {cls.code}</code>
              {cls.active > 0 && <Badge type="live">{cls.active} live now</Badge>}
            </div>
          </div>
          {role === 'teacher' ? <Btn variant="primary" onClick={() => setScreen('editor')}>+ New assignment</Btn> : <Btn variant="mint" onClick={() => setScreen('editor')}>Join live →</Btn>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['students', 'assignments'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, background: tab === t ? 'var(--indigo-10)' : 'transparent', color: tab === t ? 'var(--indigo)' : 'var(--text-3)', transition: 'all 0.12s', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 28 }}>
        {tab === 'students' && (
          <Card hover={false} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cls.students} enrolled</span>
              <AvatarStack users={MOCK_USERS.slice(1)} size={26} max={5} />
            </div>
            {MOCK_USERS.slice(1).map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < MOCK_USERS.length - 2 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => setScreen('editor')}>
                <Avatar user={u} size={36} pulse={u.id <= 3} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.id <= 3 ? 'Editing fibonacci.py' : 'Last seen 2h ago'}</div>
                </div>
                <Badge type={u.id <= 3 ? 'live' : 'closed'}>{u.id <= 3 ? 'live' : 'offline'}</Badge>
              </div>
            ))}
          </Card>
        )}
        {tab === 'assignments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_ASSIGNMENTS.map(a => (
              <Card key={a.id} onClick={() => setScreen(role === 'teacher' ? 'submissions' : 'editor')} style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Due {a.due}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {role === 'teacher' && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{a.submissions}/{a.total}</span>}
                    <Badge type={role === 'teacher' ? a.status : a.myStatus}>{role === 'teacher' ? a.status : a.myStatus.replace('-', ' ')}</Badge>
                  </div>
                </div>
                {role === 'teacher' && (
                  <div style={{ marginTop: 12, height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${(a.submissions / a.total) * 100}%`, height: '100%', background: 'var(--indigo)', borderRadius: 99 }} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SUBMISSIONS VIEW ─────────────────────────────────────────────────────────
function SubmissionsView({ setScreen }) {
  const [selected, setSelected] = React.useState(MOCK_SUBMISSIONS[0]);
  const tokenize = (code) => code.split('\n').map((line, i) => {
    const kws = ['def', 'if', 'return', 'while', 'for', 'in', 'True', 'False', 'None', 'pass', 'and', 'or', 'not'];
    const html = line.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/#.*/g, m => `<span style="color:#64748b">${m}</span>`)
      .replace(/\b(\d+)\b/g, '<span style="color:#c084fc">$1</span>')
      .replace(new RegExp(`\\b(${kws.join('|')})\\b`, 'g'), '<span style="color:#818cf8">$1</span>');
    return { n: i + 1, html };
  });
  const tests = [
    { name: 'fibonacci(0) == 0', pass: selected.passed >= 1 },
    { name: 'fibonacci(1) == 1', pass: selected.passed >= 2 },
    { name: 'fibonacci(10) == 55', pass: selected.passed >= 3 },
    { name: 'fibonacci(20) == 6765', pass: selected.passed >= 4 },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '18px 28px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>PY101 › <strong>Fibonacci Sequence</strong> › Submissions</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Submissions</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge type="success">{MOCK_SUBMISSIONS.filter(s => s.status === 'success').length} passed</Badge>
            <Badge type="failed">{MOCK_SUBMISSIONS.filter(s => s.status === 'failed').length} failed</Badge>
            <Badge type="timeout">{MOCK_SUBMISSIONS.filter(s => s.status === 'timeout').length} timeout</Badge>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '290px 1fr', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg)' }}>
          {MOCK_SUBMISSIONS.map(sub => (
            <div key={sub.id} onClick={() => setSelected(sub)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selected.id === sub.id ? 'var(--indigo-10)' : 'transparent', borderLeft: `3px solid ${selected.id === sub.id ? 'var(--indigo)' : 'transparent'}`, transition: 'background 0.12s' }}>
              <Avatar user={sub.user} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected.id === sub.id ? 'var(--indigo)' : 'var(--text)', marginBottom: 2 }}>{sub.user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub.time}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <Badge type={sub.status}>{sub.status}</Badge>
                <span style={{ fontSize: 11, fontWeight: 700, color: sub.score >= 80 ? 'var(--mint)' : sub.score > 0 ? 'var(--amber)' : 'var(--rose)' }}>{sub.score}%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ overflowY: 'auto', background: 'var(--bg-2)', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar user={selected.user} size={40} ring />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{selected.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Submitted {selected.time}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: selected.score >= 80 ? 'var(--mint)' : selected.score > 0 ? 'var(--amber)' : 'var(--rose)' }}>{selected.score}%</div>
              <Badge type={selected.status}>{selected.status}</Badge>
            </div>
          </div>
          <div style={{ background: '#0f1117', borderRadius: 12, overflow: 'hidden', marginBottom: 14, fontFamily: 'DM Mono, monospace' }}>
            <div style={{ padding: '9px 16px', borderBottom: '1px solid #1e2433', fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Submitted code</div>
            <div style={{ padding: '14px', fontSize: 12.5, lineHeight: '22px' }}>
              {tokenize(selected.code).map(l => (
                <div key={l.n} style={{ display: 'flex', gap: 14 }}>
                  <span style={{ color: '#1e2a3a', minWidth: 18, textAlign: 'right', userSelect: 'none', fontSize: 11 }}>{l.n}</span>
                  <span style={{ color: '#94a3b8' }} dangerouslySetInnerHTML={{ __html: l.html }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Tests · {selected.passed}/{selected.total}</div>
            {tests.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < tests.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 14 }}>{t.pass ? '✓' : '✗'}</span>
                <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: t.pass ? 'var(--text)' : 'var(--text-3)' }}>{t.name}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TeacherDashboard, StudentDashboard, ClassroomView, SubmissionsView });

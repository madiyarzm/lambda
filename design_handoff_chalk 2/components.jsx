
const { useState, useEffect, useRef } = React;

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id:1, name:'Prof. Chen',  initials:'PC', role:'teacher', color:'var(--indigo)' },
  { id:2, name:'Alex Kim',    initials:'AK', role:'student', color:'oklch(0.62 0.22 28)' },
  { id:3, name:'Jordan Lee',  initials:'JL', role:'student', color:'oklch(0.60 0.20 145)' },
  { id:4, name:'Sam Patel',   initials:'SP', role:'student', color:'oklch(0.60 0.22 308)' },
  { id:5, name:'Maya Chen',   initials:'MC', role:'student', color:'oklch(0.62 0.18 200)' },
  { id:6, name:'Ethan Wu',    initials:'EW', role:'student', color:'oklch(0.65 0.18 55)' },
  { id:7, name:'Priya Shah',  initials:'PS', role:'student', color:'oklch(0.60 0.20 338)' },
];
const MOCK_CLASSROOMS = [
  { id:1, name:'Intro to Python',  code:'PY101', students:24, active:8,  assignments:6,  color:'var(--indigo)' },
  { id:2, name:'Data Structures',  code:'DS201', students:18, active:3,  assignments:9,  color:'oklch(0.55 0.22 308)' },
  { id:3, name:'Algorithms',       code:'AL301', students:15, active:0,  assignments:12, color:'oklch(0.55 0.20 145)' },
];
const MOCK_ASSIGNMENTS = [
  { id:1, title:'Fibonacci Sequence', due:'Apr 25', status:'open',     submissions:12, total:24, myStatus:'in-progress' },
  { id:2, title:'Binary Search',      due:'Apr 30', status:'open',     submissions:5,  total:24, myStatus:'not-started' },
  { id:3, title:'Merge Sort',         due:'Apr 20', status:'closed',   submissions:22, total:24, myStatus:'submitted' },
  { id:4, title:'Linked Lists',       due:'May 5',  status:'upcoming', submissions:0,  total:24, myStatus:'upcoming' },
];
const MOCK_SUBMISSIONS = [
  { id:1, user:MOCK_USERS[1], status:'success', time:'14 min ago', passed:4, total:4, score:100, code:`def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))` },
  { id:2, user:MOCK_USERS[2], status:'failed',  time:'22 min ago', passed:2, total:4, score:50,  code:`def fibonacci(n):\n    # Iterative attempt\n    a, b = 0, 1\n    for i in range(n):\n        a = b  # bug: forgot b = a + b\n    return a` },
  { id:3, user:MOCK_USERS[3], status:'success', time:'1h ago',     passed:4, total:4, score:100, code:`def fibonacci(n):\n    memo = {}\n    def helper(k):\n        if k in memo: return memo[k]\n        if k <= 1: return k\n        memo[k] = helper(k-1) + helper(k-2)\n        return memo[k]\n    return helper(n)` },
  { id:4, user:MOCK_USERS[4], status:'timeout', time:'1.5h ago',   passed:0, total:4, score:0,   code:`def fibonacci(n):\n    # Infinite loop bug\n    while True:\n        pass` },
  { id:5, user:MOCK_USERS[5], status:'success', time:'2h ago',     passed:3, total:4, score:75,  code:`def fibonacci(n):\n    if n == 0: return 0\n    if n == 1: return 1\n    return fibonacci(n-1) + fibonacci(n-2)` },
];
const COLLAB_CURSORS = [
  { user:MOCK_USERS[0], line:3,  col:12, active:true },
  { user:MOCK_USERS[2], line:7,  col:8,  active:true },
  { user:MOCK_USERS[3], line:11, col:4,  active:false },
];

// ── LOGO ───────────────────────────────────────────────────────────────────
function ChalkLogo({ size=28, collapsed=false }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink:0 }}>
        <rect width="32" height="32" rx="9" fill="var(--indigo)"/>
        <path d="M16 7L17.9 14.1L25 16L17.9 17.9L16 25L14.1 17.9L7 16L14.1 14.1Z" fill="white"/>
      </svg>
      {!collapsed && <span style={{ fontWeight:800, fontSize:size*0.78, color:'var(--text)', letterSpacing:'-0.03em' }}>Chalk</span>}
    </div>
  );
}

// ── AVATAR ─────────────────────────────────────────────────────────────────
function Avatar({ user, size=32, ring=false, pulse=false }) {
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background:user.color, color:'white',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:size*0.35, fontWeight:700, flexShrink:0,
        boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 4px ${user.color}33` : 'none',
      }}>{user.initials}</div>
      {pulse && (
        <span style={{
          position:'absolute', bottom:0, right:0,
          width:size*0.28, height:size*0.28, borderRadius:'50%',
          background:'var(--mint)', border:`2px solid var(--bg)`,
          animation:'pulseDot 2s infinite'
        }}/>
      )}
    </div>
  );
}

function AvatarStack({ users, size=28, max=4 }) {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div style={{ display:'flex', alignItems:'center' }}>
      {shown.map((u,i) => (
        <div key={u.id} style={{ marginLeft: i===0?0:-size*0.35, zIndex:shown.length-i }}>
          <Avatar user={u} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft:-size*0.35, width:size, height:size, borderRadius:'50%',
          background:'var(--bg-3)', border:'2px solid var(--bg)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:size*0.3, fontWeight:700, color:'var(--text-3)', zIndex:0
        }}>+{extra}</div>
      )}
    </div>
  );
}

// ── BADGE ──────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  success:    { bg:'var(--mint-10)',  color:'oklch(0.40 0.14 162)', dot:'var(--mint)' },
  failed:     { bg:'var(--rose-10)',  color:'var(--rose)',          dot:'var(--rose)' },
  timeout:    { bg:'var(--amber-10)', color:'oklch(0.52 0.14 75)',  dot:'var(--amber)' },
  open:       { bg:'var(--indigo-10)',color:'var(--indigo)',        dot:'var(--indigo)' },
  closed:     { bg:'var(--bg-3)',     color:'var(--text-3)',        dot:'var(--border-2)' },
  upcoming:   { bg:'var(--amber-10)', color:'oklch(0.52 0.14 75)',  dot:'var(--amber)' },
  live:       { bg:'var(--mint-10)',  color:'oklch(0.40 0.14 162)', dot:'var(--mint)' },
  'in-progress':{ bg:'var(--indigo-10)', color:'var(--indigo)',     dot:'var(--indigo)' },
  submitted:  { bg:'var(--mint-10)',  color:'oklch(0.40 0.14 162)', dot:'var(--mint)' },
  'not-started':{ bg:'var(--bg-3)',   color:'var(--text-3)',        dot:'var(--border-2)' },
};
function Badge({ type='open', children, dot=true }) {
  const s = BADGE_STYLES[type] || BADGE_STYLES.open;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:600,
      background:s.bg, color:s.color, whiteSpace:'nowrap'
    }}>
      {dot && <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>}
      {children}
    </span>
  );
}

// ── BUTTON ─────────────────────────────────────────────────────────────────
function Btn({ onClick, children, variant='primary', size='md', disabled=false, style:xs={} }) {
  const sz = { sm:{padding:'5px 12px',fontSize:12}, md:{padding:'8px 16px',fontSize:13}, lg:{padding:'12px 24px',fontSize:15} }[size];
  const vt = {
    primary:   { background:'var(--indigo)',    color:'white',         border:'none' },
    secondary: { background:'var(--bg-2)',      color:'var(--text)',   border:'1px solid var(--border)' },
    ghost:     { background:'transparent',      color:'var(--text-2)', border:'none' },
    mint:      { background:'var(--mint)',       color:'white',         border:'none' },
    danger:    { background:'var(--rose-10)',    color:'var(--rose)',   border:'1px solid oklch(0.88 0.06 15)' },
  }[variant] || {};
  return (
    <button disabled={disabled} onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      fontFamily:'var(--font)', fontWeight:600, borderRadius:'var(--r)',
      cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1,
      transition:'all 0.14s', ...sz, ...vt, ...xs
    }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.filter='brightness(0.93)')}
    onMouseLeave={e => (e.currentTarget.style.filter='none')}>
      {children}
    </button>
  );
}

// ── CARD ───────────────────────────────────────────────────────────────────
function Card({ children, style:xs={}, onClick, hover=true }) {
  return (
    <div onClick={onClick} style={{
      background:'var(--bg)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', padding:20, transition:'all 0.14s',
      cursor:onClick?'pointer':'default', ...xs,
    }}
    onMouseEnter={e => onClick&&hover && Object.assign(e.currentTarget.style,{borderColor:'var(--indigo)',boxShadow:'var(--shadow)'})}
    onMouseLeave={e => Object.assign(e.currentTarget.style,{borderColor:'var(--border)',boxShadow:'none'})}>
      {children}
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────────────────
function Sidebar({ screen, setScreen, role, setRole }) {
  const tNav = [
    { id:'teacher-dash', label:'Dashboard',    icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id:'classroom',    label:'Classroom',     icon:'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id:'submissions',  label:'Submissions',   icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];
  const sNav = [
    { id:'student-dash', label:'Dashboard',    icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id:'classroom',    label:'Classroom',     icon:'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id:'editor',       label:'Editor',        icon:'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  ];
  const nav = role==='teacher' ? tNav : sNav;
  const me = role==='teacher' ? MOCK_USERS[0] : MOCK_USERS[1];

  return (
    <aside style={{ width:220, flexShrink:0, height:'100vh', position:'sticky', top:0, display:'flex', flexDirection:'column', background:'var(--bg)', borderRight:'1px solid var(--border)', padding:'18px 10px' }}>
      <div style={{ padding:'2px 10px 18px', borderBottom:'1px solid var(--border)', marginBottom:10 }}>
        <ChalkLogo />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2, flex:1 }}>
        {nav.map(item => {
          const active = screen===item.id;
          return (
            <button key={item.id} onClick={()=>setScreen(item.id)} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'9px 12px', borderRadius:'var(--r)', border:'none', cursor:'pointer',
              background: active?'var(--indigo-10)':'transparent',
              color: active?'var(--indigo)':'var(--text-2)',
              fontFamily:'var(--font)', fontSize:13, fontWeight: active?600:500,
              transition:'all 0.12s', textAlign:'left'
            }}
            onMouseEnter={e => !active&&(e.currentTarget.style.background='var(--bg-2)')}
            onMouseLeave={e => !active&&(e.currentTarget.style.background='transparent')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon}/>
              </svg>
              {item.label}
            </button>
          );
        })}
      </div>
      {/* Role toggle */}
      <div style={{ background:'var(--bg-2)', borderRadius:'var(--r)', padding:10, marginBottom:12 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', letterSpacing:'0.08em', marginBottom:8, textTransform:'uppercase' }}>View as</div>
        <div style={{ display:'flex', gap:4, background:'var(--bg-3)', borderRadius:8, padding:3 }}>
          {['teacher','student'].map(r=>(
            <button key={r} onClick={()=>{setRole(r);setScreen(r==='teacher'?'teacher-dash':'student-dash');}} style={{
              flex:1, padding:'5px 0', borderRadius:6, fontSize:11, fontWeight:600,
              border:'none', cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.12s',
              background: role===r?'var(--bg)':'transparent',
              color: role===r?'var(--text)':'var(--text-3)',
              boxShadow: role===r?'0 1px 4px rgba(0,0,0,0.08)':'none',
              textTransform:'capitalize'
            }}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 6px', borderTop:'1px solid var(--border)', paddingTop:14 }}>
        <Avatar user={me} size={32} pulse={true} />
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{me.name}</div>
          <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'capitalize' }}>{me.role}</div>
        </div>
      </div>
    </aside>
  );
}

// ── PRESENCE BAR (for editor) ───────────────────────────────────────────────
function PresenceBar({ users }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:500 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--mint)', display:'inline-block', marginRight:5, animation:'pulseDot 2s infinite' }}/>
        {users.length} live
      </span>
      <AvatarStack users={users} size={26} max={5} />
    </div>
  );
}

Object.assign(window, {
  ChalkLogo, Avatar, AvatarStack, Badge, Btn, Card, Sidebar, PresenceBar,
  MOCK_USERS, MOCK_CLASSROOMS, MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS, COLLAB_CURSORS,
  BADGE_STYLES
});

const DEMO = {
  league: { name: "Cypress Basketball League", season: "2026 Season" },
  teams: [
    {id:"cypress",name:"Cypress",short:"CYP",city:"Cypress",logo:"assets/logo.png"},
    {id:"falcons",name:"Falcons",short:"FAL",city:"Northside",logo:""},
    {id:"warriors",name:"Warriors",short:"WAR",city:"Eastside",logo:""},
    {id:"tigers",name:"Tigers",short:"TIG",city:"Westside",logo:""},
    {id:"lions",name:"Lions",short:"LIO",city:"Southside",logo:""},
    {id:"hawks",name:"Hawks",short:"HAW",city:"Central",logo:""},
    {id:"knights",name:"Knights",short:"KNI",city:"Riverside",logo:""},
    {id:"storm",name:"Storm",short:"STM",city:"Lakeside",logo:""}
  ],
  games: [
    {id:"g1",date:"2026-09-20",time:"18:00",home:"cypress",away:"falcons",homeScore:0,awayScore:0,status:"upcoming",round:"Regular Season"},
    {id:"g2",date:"2026-09-21",time:"19:00",home:"warriors",away:"tigers",homeScore:72,awayScore:68,status:"final",round:"Regular Season"},
    {id:"g3",date:"2026-09-22",time:"18:30",home:"lions",away:"hawks",homeScore:61,awayScore:66,status:"final",round:"Regular Season"},
    {id:"g4",date:"2026-09-23",time:"19:00",home:"knights",away:"storm",homeScore:0,awayScore:0,status:"upcoming",round:"Regular Season"},
    {id:"g5",date:"2026-09-25",time:"18:00",home:"cypress",away:"warriors",homeScore:0,awayScore:0,status:"upcoming",round:"Regular Season"}
  ],
  bracket: [
    {round:"Quarterfinals",games:[
      {home:"cypress",away:"storm",homeScore:"",awayScore:"",winner:""},
      {home:"falcons",away:"knights",homeScore:"",awayScore:"",winner:""},
      {home:"warriors",away:"hawks",homeScore:"",awayScore:"",winner:""},
      {home:"tigers",away:"lions",homeScore:"",awayScore:"",winner:""}
    ]},
    {round:"Semifinals",games:[
      {home:"Winner QF1",away:"Winner QF2",homeScore:"",awayScore:"",winner:""},
      {home:"Winner QF3",away:"Winner QF4",homeScore:"",awayScore:"",winner:""}
    ]},
    {round:"Final",games:[
      {home:"Winner SF1",away:"Winner SF2",homeScore:"",awayScore:"",winner:""}
    ]},
    {round:"Champion",games:[
      {home:"TBD",away:"TBD",homeScore:"",awayScore:"",winner:""}
    ]}
  ],
  updatedAt: new Date().toISOString()
};

let state = null;

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function teamById(id){ return state.teams.find(t=>t.id===id); }
function teamName(id){ return teamById(id)?.name || id || "TBD"; }
function logoFor(team){
  return team?.logo || "assets/logo.png";
}
function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function loadLocal(){
  try { return JSON.parse(localStorage.getItem("cbl_league_data")) || clone(DEMO); }
  catch { return clone(DEMO); }
}
function saveLocal(data){
  localStorage.setItem("cbl_league_data", JSON.stringify(data));
}
async function getData(){
  const cfg = window.CBL_CONFIG || {};
  if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase){
    try{
      const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const {data,error} = await client.from("league_data").select("data").eq("id",1).single();
      if(!error && data?.data) return {data:data.data, client};
    }catch(e){ console.warn("Supabase unavailable, using local/demo data.",e); }
  }
  return {data:loadLocal(), client:null};
}
function calcStandings(){
  const rows = state.teams.map(t=>({team:t, w:0,l:0,pf:0,pa:0}));
  const map = Object.fromEntries(rows.map(r=>[r.team.id,r]));
  state.games.filter(g=>g.status==="final" && Number.isFinite(+g.homeScore) && Number.isFinite(+g.awayScore))
    .forEach(g=>{
      const h=map[g.home], a=map[g.away], hs=+g.homeScore, as=+g.awayScore;
      if(!h||!a)return;
      h.pf+=hs;h.pa+=as;a.pf+=as;a.pa+=hs;
      if(hs>as){h.w++;a.l++;} else if(as>hs){a.w++;h.l++;}
    });
  return rows.sort((a,b)=>{
    const wp=b.w/(b.w+b.l||1)-a.w/(a.w+a.l||1);
    return wp || (b.w-a.w) || ((b.pf-b.pa)-(a.pf-a.pa));
  });
}
function renderStats(){
  document.querySelector("#stat-teams").textContent=state.teams.length;
  document.querySelector("#stat-games").textContent=state.games.length;
  document.querySelector("#stat-played").textContent=state.games.filter(g=>g.status==="final").length;
  document.querySelector("#stat-upcoming").textContent=state.games.filter(g=>g.status==="upcoming").length;
  const live=state.games.find(g=>g.status==="live") || state.games.find(g=>g.status==="upcoming");
  const el=document.querySelector("#hero-feature");
  if(live){
    el.innerHTML=`<div class="mini-label">${esc(live.status==="live"?"Live now":"Next game")} • ${esc(live.date)} ${esc(live.time||"")}</div>
      <div class="feature-team">${esc(teamName(live.home))} <span style="opacity:.5">vs</span> ${esc(teamName(live.away))}</div>
      <div class="feature-score">${live.status==="live"||live.status==="final" ? `${esc(live.homeScore)} — ${esc(live.awayScore)}` : "GAME DAY"}</div>`;
  }
  document.querySelector("#updated-at").textContent = state.updatedAt ? `Updated ${new Date(state.updatedAt).toLocaleString()}` : "";
}
function renderGames(){
  const filter=document.querySelector("#game-filter").value;
  const list=state.games.filter(g=>filter==="all"||g.status===filter).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const box=document.querySelector("#games-list");
  if(!list.length){box.innerHTML='<div class="empty">No games match this filter.</div>';return;}
  box.innerHTML=list.map(g=>{
    const status=g.status||"upcoming";
    const date=new Date(`${g.date}T${g.time||"00:00"}`);
    const dateText=isNaN(date) ? g.date : date.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
    const score = status==="upcoming" ? "—" : `${esc(g.homeScore)} : ${esc(g.awayScore)}`;
    return `<article class="game-card">
      <div class="game-date">${esc(g.round||"Game")}<strong>${esc(dateText)} • ${esc(g.time||"")}</strong></div>
      <div class="matchup"><div class="match-team away">${esc(teamName(g.away))}</div><div class="score">${score}</div><div class="match-team">${esc(teamName(g.home))}</div></div>
      <span class="status ${esc(status)}">${esc(status)}</span>
    </article>`;
  }).join("");
}
function renderStandings(){
  const q=document.querySelector("#team-search").value.toLowerCase();
  const body=document.querySelector("#standings-body");
  const rows=calcStandings().filter(r=>r.team.name.toLowerCase().includes(q));
  body.innerHTML=rows.map((r,i)=>{
    const gp=r.w+r.l, pct=gp?(r.w/gp*100).toFixed(1):"0.0", diff=r.pf-r.pa;
    return `<tr><td>${i+1}</td><td><div class="team-cell"><img class="team-logo" src="${esc(logoFor(r.team))}" alt=""><span>${esc(r.team.name)}</span></div></td>
      <td>${r.w}</td><td>${r.l}</td><td>${r.pf}</td><td>${r.pa}</td><td class="${diff>=0?'diff-positive':'diff-negative'}">${diff>0?'+':''}${diff}</td><td>${pct}%</td></tr>`;
  }).join("") || '<tr><td colspan="8">No team found.</td></tr>';
}
function renderTeams(){
  document.querySelector("#teams-grid").innerHTML=state.teams.map(t=>{
    const r=calcStandings().find(x=>x.team.id===t.id);
    return `<article class="team-card"><div class="team-card-head"><img class="team-logo" src="${esc(logoFor(t))}" alt=""><div><div class="team-name">${esc(t.name)}</div><div class="team-meta">${esc(t.city||"")} • ${esc(t.short||"")}</div></div></div>
      <div class="team-record"><div><strong>${r.w}</strong><small>Wins</small></div><div><strong>${r.l}</strong><small>Losses</small></div><div><strong>${r.pf-r.pa>0?"+":""}${r.pf-r.pa}</strong><small>Diff</small></div></div></article>`;
  }).join("");
}
function renderBracket(){
  document.querySelector("#bracket-board").innerHTML=state.bracket.map(round=>`
    <div class="round"><div class="round-title">${esc(round.round)}</div><div class="bracket-stack">
      ${round.games.map(g=>{
        const hn=teamName(g.home), an=teamName(g.away);
        return `<div class="bracket-game">
          <div class="bracket-team ${g.winner===g.home?'winner':''}"><span>${esc(hn)}</span><span class="bracket-score">${esc(g.homeScore)}</span></div>
          <div class="bracket-team ${g.winner===g.away?'winner':''}"><span>${esc(an)}</span><span class="bracket-score">${esc(g.awayScore)}</span></div>
        </div>`;
      }).join("")}
    </div></div>`).join("");
}
async function init(){
  const result=await getData();
  state=result.data || clone(DEMO);
  if(!state.teams) state=clone(DEMO);
  renderAll();
}
function renderAll(){renderStats();renderGames();renderStandings();renderTeams();renderBracket();}
document.querySelector("#game-filter").addEventListener("change",renderGames);
document.querySelector("#team-search").addEventListener("input",renderStandings);
document.querySelector("#footer-year").textContent=new Date().getFullYear();
init();

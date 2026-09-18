const DEFAULT_BRACKET = [
  {round:"Quarterfinals",games:[
    {home:"cypress",away:"storm",homeScore:"",awayScore:"",winner:""},
    {home:"falcons",away:"knights",homeScore:"",awayScore:"",winner:""},
    {home:"warriors",away:"hawks",homeScore:"",awayScore:"",winner:""},
    {home:"tigers",away:"lions",homeScore:"",awayScore:"",winner:""}]},
  {round:"Semifinals",games:[
    {home:"Winner QF1",away:"Winner QF2",homeScore:"",awayScore:"",winner:""},
    {home:"Winner QF3",away:"Winner QF4",homeScore:"",awayScore:"",winner:""}]},
  {round:"Final",games:[{home:"Winner SF1",away:"Winner SF2",homeScore:"",awayScore:"",winner:""}]},
  {round:"Champion",games:[{home:"TBD",away:"TBD",homeScore:"",awayScore:"",winner:""}]}
];
let state=null, client=null;

function clone(x){return JSON.parse(JSON.stringify(x))}
function uid(prefix){return prefix+"_"+Math.random().toString(36).slice(2,9)}
function localData(){try{return JSON.parse(localStorage.getItem("cbl_league_data"))}catch{return null}}
function saveLocal(){state.updatedAt=new Date().toISOString();localStorage.setItem("cbl_league_data",JSON.stringify(state))}
function teamOptions(selected=""){return `<option value="">Select team</option>`+state.teams.map(t=>`<option value="${t.id}" ${t.id===selected?"selected":""}>${esc(t.name)}</option>`).join("")}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function setup(){
  const cfg=window.CBL_CONFIG||{};
  if(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase) client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  if(client){
    const {data:{session}}=await client.auth.getSession();
    if(session){showDash(session);return}
  }
  const local=localData();
  if(local){state=local}
}
function showDash(session){
  document.querySelector("#login").hidden=true;document.querySelector("#dashboard").hidden=false;
  document.querySelector("#account").textContent=session?.user?.email?`Signed in as ${session.user.email}`:"Local/demo mode";
  if(!state) state=localData()||null;
  if(!state){alert("No league data loaded. Use the website demo first, or import a JSON backup."); state={teams:[],games:[],bracket:clone(DEFAULT_BRACKET),updatedAt:new Date().toISOString()}}
  renderEditors();
}
document.querySelector("#login-btn").onclick=async()=>{
  const msg=document.querySelector("#login-msg"), email=document.querySelector("#email").value.trim(), pass=document.querySelector("#password").value;
  if(!client){msg.textContent="Supabase is not configured. You can still use local mode by opening the public site first and then returning here.";msg.className="msg error";return}
  const {data,error}=await client.auth.signInWithPassword({email,password:pass});
  if(error){msg.textContent=error.message;msg.className="msg error";return}
  showDash(data.session);
};
document.querySelector("#logout").onclick=async()=>{if(client)await client.auth.signOut();location.reload()};

function renderEditors(){
  renderTeamsEditor();renderGamesEditor();renderBracketEditor();
}
function renderTeamsEditor(){
  document.querySelector("#teams-editor").innerHTML=state.teams.map((t,i)=>`
    <div class="editor-row">
      <input data-team="${i}" data-k="name" value="${esc(t.name)}" placeholder="Team name">
      <input data-team="${i}" data-k="short" value="${esc(t.short)}" placeholder="Short code">
      <input data-team="${i}" data-k="city" value="${esc(t.city)}" placeholder="City">
      <button class="delete" onclick="removeTeam(${i})">×</button>
    </div>`).join("")||"<p>No teams yet.</p>";
  document.querySelectorAll("[data-team]").forEach(el=>el.oninput=()=>{state.teams[+el.dataset.team][el.dataset.k]=el.value});
}
function renderGamesEditor(){
  document.querySelector("#games-editor").innerHTML=state.games.map((g,i)=>`
    <div class="game-row">
      <select data-game="${i}" data-k="home">${teamOptions(g.home)}</select>
      <select data-game="${i}" data-k="away">${teamOptions(g.away)}</select>
      <input data-game="${i}" data-k="date" type="date" value="${esc(g.date)}">
      <input data-game="${i}" data-k="time" type="time" value="${esc(g.time||"")}">
      <select data-game="${i}" data-k="status"><option ${g.status==="upcoming"?"selected":""}>upcoming</option><option ${g.status==="live"?"selected":""}>live</option><option ${g.status==="final"?"selected":""}>final</option></select>
      <button class="delete" onclick="removeGame(${i})">×</button>
    </div>
    <div class="game-row" style="margin-top:-10px;border-top:0">
      <input data-game="${i}" data-k="homeScore" type="number" value="${esc(g.homeScore)}" placeholder="Home score">
      <input data-game="${i}" data-k="awayScore" type="number" value="${esc(g.awayScore)}" placeholder="Away score">
      <input data-game="${i}" data-k="round" value="${esc(g.round||"Regular Season")}" placeholder="Round">
      <div></div><div></div><div></div>
    </div>`).join("")||"<p>No games yet.</p>";
  document.querySelectorAll("[data-game]").forEach(el=>el.oninput=()=>{state.games[+el.dataset.game][el.dataset.k]=el.value});
}
function renderBracketEditor(){
  document.querySelector("#bracket-editor").innerHTML=state.bracket.map((r,ri)=>`
    <div class="bracket-round"><h3>${esc(r.round)}</h3>
      ${r.games.map((g,gi)=>`<div class="bracket-game">
        <input data-br="${ri}" data-bg="${gi}" data-k="home" value="${esc(g.home)}" placeholder="Home">
        <input data-br="${ri}" data-bg="${gi}" data-k="away" value="${esc(g.away)}" placeholder="Away">
        <input data-br="${ri}" data-bg="${gi}" data-k="homeScore" value="${esc(g.homeScore)}" placeholder="Score">
        <input data-br="${ri}" data-bg="${gi}" data-k="awayScore" value="${esc(g.awayScore)}" placeholder="Score">
        <select data-br="${ri}" data-bg="${gi}" data-k="winner"><option value="">No winner</option><option value="${esc(g.home)}" ${g.winner===g.home?"selected":""}>Home</option><option value="${esc(g.away)}" ${g.winner===g.away?"selected":""}>Away</option></select>
        <button class="delete" onclick="removeBracketGame(${ri},${gi})">×</button>
      </div>`).join("")}
    </div>`).join("");
  document.querySelectorAll("[data-br]").forEach(el=>el.oninput=()=>{
    const g=state.bracket[+el.dataset.br].games[+el.dataset.bg];g[el.dataset.k]=el.value;
  });
}
window.removeTeam=i=>{if(confirm("Remove this team?")){state.teams.splice(i,1);renderEditors()}}
window.removeGame=i=>{state.games.splice(i,1);renderGamesEditor()}
window.removeBracketGame=(r,g)=>{state.bracket[r].games.splice(g,1);renderBracketEditor()}
document.querySelector("#add-team").onclick=()=>{state.teams.push({id:uid("team"),name:"New Team",short:"NEW",city:"",logo:""});renderTeamsEditor()}
document.querySelector("#add-game").onclick=()=>{state.games.push({id:uid("game"),date:new Date().toISOString().slice(0,10),time:"18:00",home:state.teams[0]?.id||"",away:state.teams[1]?.id||"",homeScore:0,awayScore:0,status:"upcoming",round:"Regular Season"});renderGamesEditor()}
document.querySelector("#reset-bracket").onclick=()=>{if(confirm("Reset the bracket template?")){state.bracket=clone(DEFAULT_BRACKET);renderBracketEditor()}}
document.querySelector("#save-all").onclick=async()=>{
  const msg=document.querySelector("#save-msg");state.updatedAt=new Date().toISOString();
  if(client){
    const {data:{session}}=await client.auth.getSession();
    if(!session){msg.textContent="Session expired. Please log in again.";msg.className="msg error";return}
    const {error}=await client.from("league_data").upsert({id:1,data:state,updated_at:state.updatedAt});
    if(error){msg.textContent=error.message;msg.className="msg error";return}
  }else saveLocal();
  msg.textContent="Saved. The public website will use the new data.";msg.className="msg";
};
document.querySelector("#export-json").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="cbl-league-backup.json";a.click();URL.revokeObjectURL(a.href);
};
document.querySelector("#import-json").onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);renderEditors()}catch{alert("Invalid JSON backup.")}};r.readAsText(f)
};
setup();

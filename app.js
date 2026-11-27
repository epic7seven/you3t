const $ = (s, root=document) => root.querySelector(s);
const state = {
  tab:'feed', category:'all', channels:[], videos:[], categories:['버튜버','게임','음악','애니'], channelCats:{},
  clientId:localStorage.getItem('clientId')||'', apiKey:localStorage.getItem('apiKey')||'',
  token:'', tokenExpires:0, account:null, theme:localStorage.getItem('theme')||'dark',
  lastCheck:localStorage.getItem('lastCheck')||'', seen:new Set(JSON.parse(localStorage.getItem('seen')||'[]'))
};
document.documentElement.dataset.theme=state.theme;
const titles={feed:'알림',channels:'채널',account:'계정',settings:'설정'};
function save(){localStorage.setItem('channels',JSON.stringify(state.channels));localStorage.setItem('videos',JSON.stringify(state.videos));localStorage.setItem('categories',JSON.stringify(state.categories));localStorage.setItem('channelCats',JSON.stringify(state.channelCats));localStorage.setItem('seen',JSON.stringify([...state.seen]));}
function load(){state.channels=JSON.parse(localStorage.getItem('channels')||'[]');state.videos=JSON.parse(localStorage.getItem('videos')||'[]');state.categories=JSON.parse(localStorage.getItem('categories')||'["버튜버","게임","음악","애니"]');state.channelCats=JSON.parse(localStorage.getItem('channelCats')||'{}');}
load();
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){ $('#page-title').textContent=titles[state.tab];$('.nav-btn.active')?.classList.remove('active');$(`[data-tab="${state.tab}"]`).classList.add('active');const v=$('#view');v.innerHTML=({feed:feedView,channels:channelsView,account:accountView,settings:settingsView})[state.tab]();bindView();}
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()});
$('#refresh-btn').onclick=()=>refreshFeed(true);
function feedView(){
 const cats=['전체 알림',...state.categories], current=state.category==='all'?'전체 알림':state.category;
 let videos=state.videos.filter(x=>state.category==='all'||(state.channelCats[x.channelId]||[]).includes(state.category));
 videos.sort((a,b)=>new Date(b.published)-new Date(a.published));
 if(!videos.length)return `<select class="category-select" id="cat-filter">${cats.map(c=>`<option ${c===current?'selected':''}>${esc(c)}</option>`).join('')}</select><div class="empty">${state.channels.length?'해당 카테고리의 영상이 아직 없어.':'계정을 연결하고 채널을 불러와줘.'}</div>`;
 let groups={};videos.forEach(x=>{const d=new Date(x.published);const key=d.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});(groups[key]??=[]).push(x)});
 return `<select class="category-select" id="cat-filter">${cats.map(c=>`<option ${c===current?'selected':''}>${esc(c)}</option>`).join('')}</select>`+
 Object.entries(groups).map(([day,items])=>`<div class="date-label">${day}</div>${items.map(x=>videoItem(x)).join('')}`).join('');
}
function videoItem(x){const d=new Date(x.published);const time=d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});return `<div class="video"><div class="video-meta"><span>${time}</span><span class="menu-wrap"><button class="more" data-more="${esc(x.id)}">⋮</button></span></div><div class="video-title" data-open="${esc(x.url)}">${esc(x.title)}</div><div class="channel">${esc(x.channelName)}</div></div>`}
function channelsView(){
 const sorted=[...state.channels].sort((a,b)=>a.title.localeCompare(b.title,'ko'));
 return `<div class="row"><input id="channel-search" placeholder="채널 검색"><button class="btn small" id="manage-cats">카테고리</button></div><p class="muted small">알림 ON 채널 ${state.channels.filter(c=>c.enabled!==false).length} / ${state.channels.length}</p>
 ${sorted.map(c=>`<div class="channel-row"><div style="min-width:0"><div class="channel-name">${esc(c.title)}</div><div class="muted small">${(state.channelCats[c.id]||[]).map(esc).join(' · ')||'분류 없음'}</div><button class="chip assign" data-id="${esc(c.id)}">분류 지정</button></div><input type="checkbox" class="switch enable" data-id="${esc(c.id)}" ${c.enabled!==false?'checked':''} aria-label="알림 활성"></div>`).join('')||'<div class="empty">구독 채널이 없어. 계정 탭에서 불러와줘.</div>'}`;
}
function accountView(){
 return `<div class="card"><div class="section-title">Google 계정 연결</div>${state.account?`<p>${esc(state.account)}</p><p class="muted small">연결된 계정으로 구독 목록을 가져와.</p><button class="btn" id="sync-subs">구독 목록 동기화</button><button class="btn danger" id="disconnect">연결 해제</button>`:`<p class="muted">Google 로그인 후 YouTube 구독 목록을 불러올 수 있어.</p><button class="btn primary" id="signin">Google 계정 연결</button>`}</div>
 <div class="card"><div class="section-title">API 연결 정보</div><p class="hint">Google Cloud에서 만든 OAuth Client ID와 YouTube Data API 키가 필요해. 설정 탭에서 입력해.</p></div>`;
}
function settingsView(){return `<div class="card form-grid"><div class="section-title">API 설정</div><label class="small muted">Google OAuth Client ID</label><input id="client-id" value="${esc(state.clientId)}" placeholder="...apps.googleusercontent.com"><button class="btn primary" id="save-api">저장</button><p class="hint">Google Cloud에서 OAuth Client ID를 생성하고 승인된 JavaScript 원본에 GitHub Pages 주소를 등록해.</p></div>
 <div class="card"><div class="section-title">새 영상 확인</div><p class="hint">앱을 열고 새로고침할 때 업로드를 확인해. 브라우저가 앱을 종료한 상태에서 자동으로 주기 확인하는 기능은 별도 푸시 서버가 필요해.</p><button class="btn" id="notify-permission">브라우저 알림 허용</button></div>
 <div class="card"><div class="section-title">테마</div><select id="theme"><option value="dark" ${state.theme==='dark'?'selected':''}>다크</option><option value="light" ${state.theme==='light'?'selected':''}>라이트</option></select></div>
 <div class="card"><button class="btn danger" id="clear-data">앱 데이터 초기화</button></div>`}
function bindView(){
 $('#cat-filter')?.addEventListener('change',e=>{state.category=e.target.value==='전체 알림'?'all':e.target.value;render()});
 document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>window.open(el.dataset.open,'_blank','noopener'));
 document.querySelectorAll('[data-more]').forEach(el=>el.onclick=e=>{e.stopPropagation();const id=el.dataset.more;const item=state.videos.find(x=>x.id===id);const menu=document.createElement('div');menu.className='menu';menu.innerHTML='<button>URL 복사</button>';menu.onclick=()=>{navigator.clipboard.writeText(item.url).then(()=>toast('URL 복사 완료'));menu.remove()};el.parentElement.append(menu);setTimeout(()=>document.addEventListener('click',()=>menu.remove(),{once:true}),0)});
 $('#channel-search')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.channel-row').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'flex':'none')});
 document.querySelectorAll('.enable').forEach(el=>el.onchange=()=>{const c=state.channels.find(c=>c.id===el.dataset.id);c.enabled=el.checked;save()});
 document.querySelectorAll('.assign').forEach(el=>el.onclick=()=>categoryDialog(el.dataset.id));
 const manageCats=$('#manage-cats'); if(manageCats) manageCats.onclick=()=>categoryDialog();
 const signin=$('#signin'); if(signin) signin.onclick=signIn;
 const syncSubs=$('#sync-subs'); if(syncSubs) syncSubs.onclick=syncSubscriptions;
 const disconnect=$('#disconnect'); if(disconnect) disconnect.onclick=()=>{state.token='';state.account=null;state.channels=[];state.videos=[];save();render();toast('연결 해제됨')};
 const saveApi=$('#save-api'); if(saveApi) saveApi.onclick=()=>{state.clientId=$('#client-id').value.trim();localStorage.setItem('clientId',state.clientId);toast('설정 저장됨')};
 const theme=$('#theme'); if(theme) theme.onchange=e=>{state.theme=e.target.value;document.documentElement.dataset.theme=state.theme;localStorage.setItem('theme',state.theme)};
 const notify=$('#notify-permission'); if(notify) notify.onclick=async()=>{if(!('Notification'in window))return toast('이 브라우저는 알림을 지원하지 않아');const p=await Notification.requestPermission();toast(p==='granted'?'알림 허용됨':'알림이 허용되지 않았어')};
 const clearData=$('#clear-data'); if(clearData) clearData.onclick=()=>{if(confirm('모든 앱 데이터를 삭제할까?')){localStorage.clear();location.reload()}};
}
function categoryDialog(channelId){
 const dlg=document.createElement('dialog');
 const isManage=!channelId;
 dlg.innerHTML=isManage?`<h3>카테고리 관리</h3><div id="cats">${state.categories.map(c=>`<div class="row between" style="margin:8px 0"><span>${esc(c)}</span><button class="btn small danger" data-del="${esc(c)}">삭제</button></div>`).join('')}</div><div class="row"><input id="new-cat" placeholder="새 카테고리 이름"><button class="btn primary" id="add-cat">추가</button></div><button class="btn" id="close" style="margin-top:12px">닫기</button>`:
 `<h3>카테고리 지정</h3><p class="muted small">${esc(state.channels.find(c=>c.id===channelId)?.title||'')}</p>${state.categories.map(c=>`<label class="row" style="margin:10px 0"><input type="checkbox" class="checkbox cat-check" value="${esc(c)}" ${(state.channelCats[channelId]||[]).includes(c)?'checked':''}>${esc(c)}</label>`).join('')}<button class="btn primary" id="save-cats">저장</button><button class="btn" id="close">취소</button>`;
 document.body.append(dlg);dlg.showModal();
 $('#close',dlg).onclick=()=>dlg.close();
 if(isManage){$('#add-cat',dlg).onclick=()=>{const name=$('#new-cat',dlg).value.trim();if(name&&!state.categories.includes(name)){state.categories.push(name);save();dlg.close();render();categoryDialog()}};
 dlg.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const name=b.dataset.del;state.categories=state.categories.filter(x=>x!==name);Object.keys(state.channelCats).forEach(id=>state.channelCats[id]=(state.channelCats[id]||[]).filter(x=>x!==name));save();dlg.close();render();categoryDialog()})}
 else $('#save-cats',dlg).onclick=()=>{state.channelCats[channelId]=[...dlg.querySelectorAll('.cat-check:checked')].map(x=>x.value);save();dlg.close();render()};
 dlg.addEventListener('close',()=>dlg.remove());
}
function signIn(){
 if(!state.clientId){toast('설정 탭에서 OAuth Client ID를 먼저 입력해줘');state.tab='settings';render();return}
 if(!window.google?.accounts?.oauth2){toast('Google 로그인 모듈 로딩 중. 잠시 후 다시 눌러줘');return}
 const client=google.accounts.oauth2.initTokenClient({client_id:state.clientId,scope:'openid email https://www.googleapis.com/auth/youtube.readonly',callback:async r=>{if(r.error){toast('로그인 실패: '+r.error);return}state.token=r.access_token;state.tokenExpires=Date.now()+r.expires_in*1000;try{const profile=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:`Bearer ${state.token}`}}).then(x=>x.json());state.account=profile.email||'Google 계정 연결됨';await syncSubscriptions();state.tab='channels';render()}catch(e){toast(e.message)}}});
 client.requestAccessToken({prompt:'consent'});
}
async function yt(url){const res=await fetch(url,{headers:{Authorization:`Bearer ${state.token}`}});const data=await res.json();if(!res.ok)throw new Error(data.error?.message||'YouTube API 요청 실패');return data}
async function syncSubscriptions(){
 if(!state.token){toast('먼저 Google 계정을 연결해줘');return}
 try{let page='',all=[];do{const url=new URL('https://www.googleapis.com/youtube/v3/subscriptions');url.search=new URLSearchParams({part:'snippet',mine:'true',maxResults:'50',...(page?{pageToken:page}:{})});const data=await yt(url);all.push(...(data.items||[]));page=data.nextPageToken||''}while(page);
 const prior=new Map(state.channels.map(c=>[c.id,c]));state.channels=all.map(s=>{const ch=s.snippet.resourceId.channelId;return{id:ch,title:s.snippet.title,enabled:prior.get(ch)?.enabled??true}});toast(`${state.channels.length}개 구독 채널 불러옴`);save();render();await refreshFeed(false)
 }catch(e){toast('구독 동기화 실패: '+e.message)}
}
async function refreshFeed(manual){
 if(!state.token){if(manual)toast('계정 연결 후 사용할 수 있어');return}
 const enabled=state.channels.filter(c=>c.enabled!==false);
 if(!enabled.length){if(manual)toast('알림 ON 채널이 없어');return}
 try{
  const fresh=[];
  for(const c of enabled){
   const ch=await yt(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(c.id)}`);
   const uploads=ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;if(!uploads)continue;
   const pl=await yt(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(uploads)}&maxResults=5`);
   for(const p of pl.items||[]){const s=p.snippet;const vid=s.resourceId?.videoId;if(!vid)continue;fresh.push({id:vid,title:s.title,channelId:c.id,channelName:c.title,published:s.publishedAt,url:`https://www.youtube.com/watch?v=${vid}`})}
  }
  const oldIds=new Set(state.videos.map(x=>x.id));const newOnes=fresh.filter(x=>!oldIds.has(x.id));
  state.videos=[...fresh,...state.videos].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).sort((a,b)=>new Date(b.published)-new Date(a.published)).slice(0,500);
  if(newOnes.length&&state.lastCheck&&Notification.permission==='granted'){newOnes.slice(0,3).forEach(x=>new Notification(x.channelName,{body:x.title}))}
  state.lastCheck=new Date().toISOString();localStorage.setItem('lastCheck',state.lastCheck);save();render();if(manual)toast(newOnes.length?`${newOnes.length}개 새 영상 발견`:'최신 상태야');
 }catch(e){if(manual)toast('새 영상 확인 실패: '+e.message)}
}
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();

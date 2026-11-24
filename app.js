(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('messageInput');
  const messages = $('messages');
  const welcome = $('welcome');
  const API_URL = 'https://gameverse-ai-api.franciscomzr22.workers.dev';
  const modeNames = {general:'General',game:'Game Creator',roblox:'Roblox Studio',coding:'Programación',design:'Game Design',study:'Estudio',writing:'Escritura'};
  let currentMode = 'general';
  let history = JSON.parse(localStorage.getItem('gv_history') || '[]');
  let conversation = [];
  let toastTimer;
  function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
  function saveHistory(){localStorage.setItem('gv_history',JSON.stringify(history.slice(0,30)));renderHistory()}
  function renderHistory(){const list=$('historyList');list.innerHTML='';history.slice(0,12).forEach(item=>{const b=document.createElement('button');b.className='history-entry';b.textContent=item.title;b.title=item.title;b.onclick=()=>toast('El historial se conserva en este navegador.');list.appendChild(b)})}
  function addMessage(role,text){const row=document.createElement('div');row.className='message '+role;const avatar=document.createElement('div');avatar.className='message-avatar';avatar.textContent=role==='user'?'F':'✳';const bubble=document.createElement('div');bubble.className='message-bubble';bubble.textContent=text;row.append(avatar,bubble);messages.appendChild(row);$('chatScroll').scrollTop=$('chatScroll').scrollHeight}
  async function send(text){
    const value=(text??input.value).trim();
    if(!value)return;
    welcome.hidden=true;
    addMessage('user',value);
    input.value='';
    input.style.height='auto';
    history.unshift({title:value.slice(0,48),mode:currentMode});
    saveHistory();
    conversation.push({role:'user',content:value});
    $('statusText').textContent='Conectando con la IA…';
    $('statusDot').classList.add('online');
    $('sendBtn').disabled=true;
    try{
      const response=await fetch(API_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          message:'Respondé en español y tené en cuenta que el modo seleccionado es '+modeNames[currentMode]+'.\n\n'+value,
          history:conversation.slice(-10,-1)
        })
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'No se pudo conectar con la IA.');
      const answer=data.reply||'No recibí una respuesta.';
      conversation.push({role:'assistant',content:answer});
      addMessage('assistant',answer);
      $('statusText').textContent='IA conectada · '+modeNames[currentMode];
    }catch(error){
      addMessage('assistant','No pude conectar con la IA: '+error.message+' Revisá que la clave API esté configurada y que la API tenga acceso y saldo.');
      $('statusText').textContent='Error de conexión';
      $('statusDot').classList.remove('online');
    }finally{
      $('sendBtn').disabled=false;
      input.focus();
    }
  }
  $('sendBtn').addEventListener('click',()=>send());
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,150)+'px'});
  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{currentMode=btn.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===btn));$('composerMode').textContent=modeNames[currentMode];$('topMode').textContent=modeNames[currentMode]}));
  document.querySelectorAll('[data-prompt]').forEach(btn=>btn.addEventListener('click',()=>{input.value=btn.dataset.prompt;send()}));
  $('newChatBtn').addEventListener('click',()=>{messages.innerHTML='';welcome.hidden=false;input.value='';conversation=[];$('sidebar').classList.remove('open');input.focus()});
  $('clearHistory').addEventListener('click',()=>{history=[];saveHistory();toast('Historial local borrado')});
  $('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('gv_theme',document.body.classList.contains('light')?'light':'dark')});
  if(localStorage.getItem('gv_theme')==='light')document.body.classList.add('light');
  $('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  $('settingsBtn').addEventListener('click',()=>toast('La conexión con la IA se configura de forma segura en el servidor.'));
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus()}});
  renderHistory();
  $('statusText').textContent='Interfaz lista · enviá un mensaje para probar la IA';
  $('statusDot').classList.remove('online');
})();
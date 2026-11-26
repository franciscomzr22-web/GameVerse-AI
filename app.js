(() => {
  const $ = id => document.getElementById(id);
  const input = $('messageInput');
  const messages = $('messages');
  const welcome = $('welcome');
  const chatScroll = $('chatScroll');
  const composer = document.querySelector('.composer-wrap');
  const API_URL = 'https://gameverse-ai-api.franciscomzr22.workers.dev';
  const modeNames = {general:'General',game:'Game Creator',roblox:'Roblox Studio',coding:'Programación',design:'Game Design',study:'Estudio',writing:'Escritura'};
  const viewNames = {chat:'Chat principal',builder:'Game Builder',code:'Code Studio',debugger:'Debugger',image:'Image Studio',projects:'Mis proyectos',library:'Biblioteca',settings:'Personalización'};
  let currentMode = 'general';
  let currentView = 'chat';
  let chats = JSON.parse(localStorage.getItem('gv_chats') || '[]');
  let activeChatId = localStorage.getItem('gv_active_chat') || '';
  let conversation = JSON.parse(localStorage.getItem('gv_conversation') || '[]');
  let projects = JSON.parse(localStorage.getItem('gv_projects') || '[]');
  if (conversation.length && !chats.length) {
    chats.push({id:'legacy-'+Date.now(),title:'Conversación anterior',mode:'general',messages:conversation.slice(),updatedAt:Date.now()});
    activeChatId = chats[0].id;
  }
  if (activeChatId && chats.length && !chats.some(chat=>chat.id===activeChatId)) activeChatId='';
  let toastTimer;
  function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
  function saveState(){
    const active=chats.find(chat=>chat.id===activeChatId);
    if(active){active.messages=conversation.slice(-40);active.updatedAt=Date.now();active.mode=currentMode}
    localStorage.setItem('gv_conversation',JSON.stringify(conversation.slice(-40)));
    localStorage.setItem('gv_projects',JSON.stringify(projects.slice(0,30)));
    localStorage.setItem('gv_chats',JSON.stringify(chats.slice(0,40)));
    if(activeChatId)localStorage.setItem('gv_active_chat',activeChatId);
    else localStorage.removeItem('gv_active_chat');
    renderHistory();
  }
  function createChat(firstMessage){
    const chat={id:'chat-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),title:firstMessage.slice(0,48),mode:currentMode,messages:[],updatedAt:Date.now()};
    chats.unshift(chat);activeChatId=chat.id;return chat;
  }
  function renderHistory(){
    const list=$('historyList');list.innerHTML='';
    chats.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,15).forEach(chat=>{
      const b=document.createElement('button');b.className='history-entry'+(chat.id===activeChatId?' selected':'');
      b.textContent=chat.title||'Nuevo chat';b.title=chat.title||'Nuevo chat';
      b.onclick=()=>loadChat(chat.id);list.appendChild(b);
    });
  }
  function loadChat(id){
    const chat=chats.find(item=>item.id===id);if(!chat)return;
    activeChatId=id;conversation=chat.messages.slice();currentMode=chat.mode||'general';
    messages.innerHTML='';conversation.forEach(item=>addMessage(item.role,item.content));
    document.querySelectorAll('[data-mode]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.mode===currentMode));
    $('composerMode').textContent=modeNames[currentMode]||'General';
    showView('chat');welcome.hidden=conversation.length>0;messages.hidden=conversation.length===0;
    saveState();
  }
  function saveProject(title,content){projects.unshift({title:String(title).slice(0,80),content:String(content).slice(0,12000),date:new Date().toLocaleDateString('es-AR')});projects=projects.slice(0,30);saveState();toast('Proyecto guardado en Mis proyectos')}
  function addMessage(role,text){
    const row=document.createElement('div');row.className='message '+role;
    const avatar=document.createElement('div');avatar.className='message-avatar';avatar.textContent=role==='user'?'F':'✳';
    const wrap=document.createElement('div');wrap.className='message-content';
    const bubble=document.createElement('div');bubble.className='message-bubble';bubble.textContent=text;wrap.appendChild(bubble);
    if(role==='assistant'){const save=document.createElement('button');save.className='save-answer';save.textContent='＋ Guardar en proyectos';save.addEventListener('click',()=>saveProject(text.split('\n')[0]||'Respuesta de GAMEVERSE',text));wrap.appendChild(save)}
    row.append(avatar,wrap);messages.appendChild(row);chatScroll.scrollTop=chatScroll.scrollHeight;
  }
  function setStatus(text,online=false){$('statusText').textContent=text;$('statusDot').classList.toggle('online',online)}
  async function send(text){
    const value=(text??input.value).trim();if(!value)return;
    showView('chat');
    if(!activeChatId)createChat(value);
    const active=chats.find(chat=>chat.id===activeChatId);
    if(active&&!active.messages.length)active.title=value.slice(0,48);
    welcome.hidden=true;messages.hidden=false;addMessage('user',value);input.value='';input.style.height='auto';
    conversation.push({role:'user',content:value});saveState();
    setStatus('Conectando con la IA…',true);$('sendBtn').disabled=true;
    try{
      const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Respondé en español y tené en cuenta que el modo seleccionado es '+modeNames[currentMode]+'.\\n\\n'+value,history:conversation.slice(-10,-1)})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo conectar con la IA.');
      const answer=data.reply||'No recibí una respuesta.';conversation.push({role:'assistant',content:answer});saveState();addMessage('assistant',answer);setStatus('IA conectada · '+modeNames[currentMode],true);
    }catch(error){addMessage('assistant','No pude conectar con la IA: '+error.message);setStatus('Error de conexión')}
    finally{$('sendBtn').disabled=false;input.focus()}
  }
  function showView(view){
    currentView=view;const panel=$('workspacePanel');panel.innerHTML='';panel.hidden=true;
    const isChat=view==='chat';welcome.hidden=!isChat||messages.children.length>0;messages.hidden=!isChat;composer.hidden=!isChat;
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    $('topMode').textContent=viewNames[view]||'Chat principal';
    $('sidebar').classList.remove('open');
    if(isChat){chatScroll.scrollTop=chatScroll.scrollHeight;return}
    panel.hidden=false;
    if(view==='builder')renderBuilder(panel);
    if(view==='code')renderCodeStudio(panel);
    if(view==='debugger')renderDebugger(panel);
    if(view==='image')renderImageStudio(panel);
    if(view==='projects')renderProjects(panel);
    if(view==='library')renderLibrary(panel);
    if(view==='settings')renderSettings(panel);
  }
  function panelHeader(kicker,title,desc){return '<div class="tool-heading"><span>'+kicker+'</span><h2>'+title+'</h2><p>'+desc+'</p></div>'}
  function renderBuilder(panel){
    panel.innerHTML=panelHeader('GAMEVERSE CREATOR','Game Builder','Diseñá un videojuego desde cero con ayuda de la IA.')+
      '<div class="tool-card"><label>Plantillas rápidas</label><div class="template-row"><button class="template-chip" data-builder-preset="Obby de obstáculos con checkpoints, plataformas móviles y niveles progresivos.">🏃 Obby</button><button class="template-chip" data-builder-preset="Tycoon con generadores, mejoras, dinero y expansión de una base.">🏭 Tycoon</button><button class="template-chip" data-builder-preset="Simulador con tareas, mascotas, mejoras y zonas desbloqueables.">🐾 Simulador</button><button class="template-chip" data-builder-preset="Juego competitivo por rondas con eventos aleatorios y mapas cortos.">⚡ Party</button></div><label>Nombre o idea del juego</label><input id="builderIdea" placeholder="Ej: un obby caótico con plataformas que desaparecen"><div class="tool-grid"><div><label>Tipo de juego</label><select id="builderGenre"><option>Obby</option><option>Tycoon</option><option>Simulador</option><option>Multijugador competitivo</option><option>Aventura</option><option>Terror suave</option><option>Plataformas 2D</option><option>Arcade</option></select></div><div><label>Plataforma</label><select id="builderPlatform"><option>Roblox Studio (Luau)</option><option>Web 2D (HTML, CSS y JavaScript)</option><option>Web 3D (Three.js)</option><option>Concepto multiplataforma</option></select></div></div><label>Estilo y características</label><textarea id="builderExtra" rows="3" placeholder="Ej: rondas rápidas, monedas, tienda, mapas variados..."></textarea><button class="primary-action" id="buildGame">✦ Crear diseño del videojuego</button><p class="tool-note">El Builder genera el diseño y el plan técnico; no publica automáticamente un juego.</p></div>';
    panel.querySelectorAll('[data-builder-preset]').forEach(button=>button.addEventListener('click',()=>{$('builderExtra').value=button.dataset.builderPreset;$('builderGenre').value=button.textContent.includes('Obby')?'Obby':button.textContent.includes('Tycoon')?'Tycoon':button.textContent.includes('Simulador')?'Simulador':'Multijugador competitivo';}));
    $('buildGame').onclick=()=>{const idea=$('builderIdea').value.trim()||'Un videojuego original';const genre=$('builderGenre').value;const platform=$('builderPlatform').value;const extra=$('builderExtra').value;currentMode='game';send('Actuá como un equipo profesional de desarrollo. Diseñá este videojuego: '+idea+'. Género: '+genre+'. Plataforma: '+platform+'. Detalles: '+extra+'. Entregá nombre, concepto, bucle principal, controles, mecánicas, progresión, interfaz, mapa/escenas, estructura de carpetas y scripts, riesgos técnicos y un plan de prototipo por etapas. Incluí código inicial cuando sea apropiado y explicá dónde colocarlo. No afirmes que se creó o publicó un juego ejecutable si solo entregás el diseño.')};
  }
  function renderCodeStudio(panel){
    panel.innerHTML=panelHeader('DEVELOPMENT LAB','Code Studio','Generá scripts, elegí plantillas y recibí instrucciones para instalarlos.')+
      '<div class="tool-card"><label>Plantillas de inicio</label><div class="template-row"><button class="template-chip" data-code-template="Sistema de monedas con guardado seguro, recompensas y actualización de la interfaz.">🪙 Monedas</button><button class="template-chip" data-code-template="Tienda de objetos con catálogo, precios, compra validada en servidor y equipamiento.">🛒 Tienda</button><button class="template-chip" data-code-template="Sistema de checkpoints y respawn para un obby.">🚩 Checkpoints</button><button class="template-chip" data-code-template="Sistema de rondas con lobby, temporizador, selección de mapa y resultados.">⏱️ Rondas</button></div><label>¿Qué querés programar?</label><textarea id="codeTask" rows="4" placeholder="Ej: un sistema de monedas y tienda para Roblox..."></textarea><div class="tool-grid"><div><label>Lenguaje</label><select id="codeLanguage"><option>Luau (Roblox Studio)</option><option>HTML, CSS y JavaScript</option><option>JavaScript</option><option>Python</option><option>C# (Unity)</option><option>GDScript (Godot)</option></select></div><div><label>Nivel de detalle</label><select id="codeLevel"><option>Explicado paso a paso</option><option>Avanzado y optimizado</option><option>Simple para principiantes</option></select></div></div><button class="primary-action" id="generateCode">⌘ Generar código</button><p class="tool-note">La IA te entrega el código y los pasos de instalación. Revisalo y probalo en un proyecto de prueba antes de publicarlo.</p></div>';
    panel.querySelectorAll('[data-code-template]').forEach(button=>button.addEventListener('click',()=>{$('codeTask').value=button.dataset.codeTemplate;}));
    $('generateCode').onclick=()=>{const task=$('codeTask').value.trim();if(!task)return toast('Contame qué querés programar');currentMode='coding';document.querySelectorAll('[data-mode]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.mode==='coding'));$('composerMode').textContent='Programación';send('Creá código en '+$('codeLanguage').value+' para esto: '+task+'. Nivel: '+$('codeLevel').value+'. Entregá código completo, separá scripts si hace falta, indicá el tipo de script y la ubicación exacta, explicá cada parte y cómo probarlo. Incluí validaciones y seguridad del lado del servidor cuando corresponda. No inventes APIs ni afirmes que ejecutaste el código.')};
  }
  function renderDebugger(panel){
    panel.innerHTML=panelHeader('CODE ANALYSIS','Debugger','Pegá un código y describí qué falla para recibir un diagnóstico.')+
      '<div class="tool-card"><label>Tu código</label><textarea id="debugCode" class="code-input" rows="9" placeholder="Pegá aquí tu código..."></textarea><label>¿Qué problema aparece?</label><textarea id="debugProblem" rows="2" placeholder="Ej: aparece un error en la línea 24 o el botón no funciona..."></textarea><div class="tool-grid"><div><label>Lenguaje</label><select id="debugLanguage"><option>Luau (Roblox Studio)</option><option>JavaScript</option><option>HTML/CSS</option><option>Python</option><option>C#</option><option>Otro</option></select></div></div><button class="primary-action" id="analyzeCode">⌕ Analizar y corregir</button></div>';
    $('analyzeCode').onclick=()=>{const code=$('debugCode').value.trim();if(!code)return toast('Pegá el código que querés revisar');currentMode='coding';send('Analizá este código en '+$('debugLanguage').value+'. Problema informado: '+$('debugProblem').value+'. Código:\\n'+code+'\\nBuscá errores, explicá la causa y devolvé una versión corregida completa. No supongas que ejecutaste el código.')};
  }
  function renderImageStudio(panel){
    panel.innerHTML=panelHeader('VISUAL CONCEPT LAB','Image Studio','Creá conceptos visuales y prompts detallados para personajes, mapas, portadas y objetos.')+
      '<div class="tool-card"><label>¿Qué querés diseñar?</label><textarea id="imageIdea" rows="3" placeholder="Ej: portada épica para un juego de carreras futuristas..."></textarea><div class="tool-grid"><div><label>Tipo de recurso</label><select id="imageType"><option>Personaje</option><option>Mapa o escenario</option><option>Portada o thumbnail</option><option>Interfaz de videojuego</option><option>Objeto o accesorio</option><option>Logo</option></select></div><div><label>Estilo visual</label><select id="imageStyle"><option>3D estilizado</option><option>Roblox-like</option><option>Pixel art</option><option>Low poly</option><option>Realista cinematográfico</option><option>Cartoon</option></select></div></div><button class="primary-action" id="createConcept">✧ Crear concepto visual</button><p class="tool-note">Image Studio prepara descripciones y prompts. La generación directa de imágenes no está conectada en esta versión.</p></div>';
    $('createConcept').onclick=()=>{const idea=$('imageIdea').value.trim();if(!idea)return toast('Describí qué querés diseñar');currentMode='design';send('Actuá como director de arte de videojuegos. Creá un concepto visual para: '+idea+'. Tipo: '+$('imageType').value+'. Estilo: '+$('imageStyle').value+'. Entregá descripción visual, paleta de colores, materiales, iluminación, composición, detalles distintivos y un prompt final listo para un generador de imágenes. No digas que generaste una imagen.')};
  }
  function renderProjects(panel){
    panel.innerHTML=panelHeader('YOUR WORKSPACE','Mis proyectos','Guardá ideas propias o respuestas de la IA y retomá tu trabajo.')+
      '<div class="tool-card project-create"><label>Crear una nota o proyecto</label><input id="projectTitle" placeholder="Nombre del proyecto"><textarea id="projectContent" rows="3" placeholder="Idea, objetivos, tareas pendientes o notas..."></textarea><button class="primary-action" id="createProject">＋ Guardar proyecto</button></div>'+
      (projects.length?'<div class="saved-projects">'+projects.map((p,i)=>'<article class="saved-project"><div><small>'+escapeHtml(p.date||'Sin fecha')+'</small><h3>'+escapeHtml(p.title)+'</h3><p>'+escapeHtml(p.content.slice(0,260))+(p.content.length>260?'…':'')+'</p></div><div class="project-actions"><button data-open-project="'+i+'">Retomar con IA</button><button data-copy-project="'+i+'">Copiar</button><button data-delete-project="'+i+'" class="danger-button">Eliminar</button></div></article>').join('')+'</div>':'<div class="empty-state">Todavía no hay proyectos. Creá una nota arriba o guardá una respuesta del chat.</div>');
    $('createProject').onclick=()=>{const title=$('projectTitle').value.trim();const content=$('projectContent').value.trim();if(!title||!content)return toast('Completá el nombre y el contenido');saveProject(title,content);renderProjects(panel)};
    panel.querySelectorAll('[data-open-project]').forEach(b=>b.onclick=()=>{const p=projects[Number(b.dataset.openProject)];currentMode='general';showView('chat');send('Retomemos este proyecto. Ayudame a continuarlo sin perder sus decisiones:\\n'+p.title+'\\n'+p.content)});
    panel.querySelectorAll('[data-copy-project]').forEach(b=>b.onclick=async()=>{const p=projects[Number(b.dataset.copyProject)];try{await navigator.clipboard.writeText(p.title+'\\n\\n'+p.content);toast('Proyecto copiado')}catch(e){toast('No se pudo copiar desde este navegador')}});
    panel.querySelectorAll('[data-delete-project]').forEach(b=>b.onclick=()=>{projects.splice(Number(b.dataset.deleteProject),1);saveState();renderProjects(panel)});
  }
  function renderSettings(panel){
    const theme=localStorage.getItem('gv_theme')||'dark';
    const accent=localStorage.getItem('gv_accent')||'violet';
    const compact=localStorage.getItem('gv_compact')==='true';
    panel.innerHTML=panelHeader('WORKSPACE SETTINGS','Personalización','Ajustá el aspecto de GAMEVERSE AI en este navegador.')+
      '<div class="tool-card"><label for="settingTheme">Apariencia</label><select id="settingTheme"><option value="dark">Oscuro</option><option value="light">Claro</option></select><label for="settingAccent">Color de acento</label><select id="settingAccent"><option value="violet">Violeta</option><option value="blue">Azul</option><option value="green">Verde</option><option value="pink">Rosa</option></select><label class="setting-check"><input id="settingCompact" type="checkbox"> Interfaz compacta</label><button class="primary-action" id="saveSettings">Guardar preferencias</button><p class="tool-note">Las preferencias se guardan en este navegador y no cambian tu cuenta de Google.</p></div>';
    $('settingTheme').value=theme;$('settingAccent').value=accent;$('settingCompact').checked=compact;
    $('saveSettings').onclick=()=>{const nextTheme=$('settingTheme').value;const nextAccent=$('settingAccent').value;const nextCompact=$('settingCompact').checked;document.body.classList.toggle('light',nextTheme==='light');document.body.classList.toggle('compact-ui',nextCompact);document.body.dataset.accent=nextAccent;localStorage.setItem('gv_theme',nextTheme);localStorage.setItem('gv_accent',nextAccent);localStorage.setItem('gv_compact',String(nextCompact));toast('Preferencias guardadas')};
  }
  function renderLibrary(panel){
    panel.innerHTML=panelHeader('KNOWLEDGE BASE','Biblioteca','Tus herramientas y recursos de desarrollo.')+
      '<div class="library-grid"><article><b>🎮 Roblox Studio</b><p>Diseño de experiencias, scripts Luau, interfaces y DataStores.</p><button data-library-prompt="Explicame cómo organizar un proyecto profesional en Roblox Studio, con carpetas, scripts y módulos.">Consultar a la IA</button></article><article><b>🌐 Desarrollo web</b><p>HTML, CSS, JavaScript y prototipos de juegos para navegador.</p><button data-library-prompt="Preparame una estructura inicial para un videojuego web con HTML, CSS y JavaScript separados.">Consultar a la IA</button></article><article><b>🧩 Game design</b><p>Mecánicas, niveles, progresión, balance y experiencia del jugador.</p><button data-library-prompt="Enseñame un método paso a paso para diseñar las mecánicas de un videojuego divertido.">Consultar a la IA</button></article><article><b>🐞 Depuración</b><p>Diagnóstico de errores y buenas prácticas para probar código.</p><button data-library-prompt="Dame una checklist para encontrar errores en un videojuego antes de publicarlo.">Consultar a la IA</button></article></div>';
    panel.querySelectorAll('[data-library-prompt]').forEach(b=>b.onclick=()=>{currentMode='general';send(b.dataset.libraryPrompt)});
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  $('sendBtn').addEventListener('click',()=>send());
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,150)+'px'});
  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{currentMode=btn.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===btn));$('composerMode').textContent=modeNames[currentMode];$('topMode').textContent=modeNames[currentMode]}));
  document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
  document.querySelectorAll('[data-prompt]').forEach(btn=>btn.addEventListener('click',()=>send(btn.dataset.prompt)));
  $('newChatBtn').addEventListener('click',()=>{
    saveState();activeChatId='';conversation=[];messages.innerHTML='';input.value='';
    welcome.hidden=false;messages.hidden=false;saveState();showView('chat');
    $('sidebar').classList.remove('open');input.focus();
  });
  $('clearHistory').addEventListener('click',()=>{
    chats=[];activeChatId='';conversation=[];messages.innerHTML='';welcome.hidden=false;
    localStorage.removeItem('gv_chats');localStorage.removeItem('gv_active_chat');
    saveState();renderHistory();toast('Historial de chats borrado');
  });
  $('themeBtn').addEventListener('click',()=>{const light=document.body.classList.toggle('light');localStorage.setItem('gv_theme',light?'light':'dark')});
  if(localStorage.getItem('gv_theme')==='light')document.body.classList.add('light');
  document.body.dataset.accent=localStorage.getItem('gv_accent')||'violet';
  if(localStorage.getItem('gv_compact')==='true')document.body.classList.add('compact-ui');
  $('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  $('settingsBtn').addEventListener('click',()=>showView('settings'));
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus()}});
  const panel=document.createElement('section');panel.id='workspacePanel';panel.className='workspace-panel';panel.hidden=true;chatScroll.insertBefore(panel,messages);
  const storedActive=chats.find(chat=>chat.id===activeChatId);
  if(storedActive)conversation=storedActive.messages.slice();
  renderHistory();
  messages.hidden=conversation.length===0;
  if(conversation.length){welcome.hidden=true;conversation.forEach(m=>addMessage(m.role,m.content))}
  saveState();
  setStatus('Interfaz lista · IA gratuita disponible');
  showView('chat');
})();
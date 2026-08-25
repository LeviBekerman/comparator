/* אפליקציית הלמידה - בקר ראשי. עובד לגמרי לוקאלית (localStorage), ללא שרת וללא אינטרנט */

/* ---------- עזר ל-DOM ---------- */
function E(tag, attrs, children){
  var node = document.createElement(tag);
  attrs = attrs || {};
  Object.keys(attrs).forEach(function(k){
    var v = attrs[k];
    if(k === 'class') node.className = v;
    else if(k === 'text') node.textContent = v;
    else if(k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if(v !== undefined && v !== null) node.setAttribute(k, v);
  });
  (children||[]).forEach(function(c){
    if(c === null || c === undefined) return;
    if(typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

function starsNode(n){
  var wrap = E('div',{class:'dots-wrap'},[]);
  for(var i=0;i<n;i++) wrap.appendChild(E('span',{class:'dot-star'},['⭐']));
  return wrap;
}
function starsString(n){
  n = n||0;
  var s='';
  for(var i=0;i<3;i++) s += (i<n ? '★' : '☆');
  return s;
}
function heartsString(n){
  var s=''; for(var i=0;i<3;i++) s += (i<n?'❤️':'🤍'); return s;
}

function confettiBurst(){
  var wrap = E('div',{class:'confetti-burst'},[]);
  var emojis = ['🎉','⭐','✨','🎈','🌟','💫'];
  for(var i=0;i<24;i++){
    var piece = E('span',{class:'confetti-piece'},[emojis[rnd(0,emojis.length-1)]]);
    piece.style.left = rnd(0,100)+'vw';
    piece.style.animationDuration = (1.2+Math.random()*1.4)+'s';
    piece.style.animationDelay = (Math.random()*0.4)+'s';
    wrap.appendChild(piece);
  }
  document.body.appendChild(wrap);
  setTimeout(function(){ wrap.remove(); }, 3000);
}

/* ---------- אחסון מצב ---------- */
var STORE_KEY = 'kids-learning-state-v1';
function loadState(){
  try{
    var raw = localStorage.getItem(STORE_KEY);
    if(raw){
      var s = JSON.parse(raw);
      if(!s.voicePrefs) s.voicePrefs = { he:null, en:null };
      return s;
    }
  }catch(e){}
  return { profiles: [], currentId: null, voicePrefs: { he:null, en:null } };
}
function saveState(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(STATE)); }catch(e){} }
var STATE = loadState();
SPEECH.setPreferred('he', STATE.voicePrefs.he);
SPEECH.setPreferred('en', STATE.voicePrefs.en);

function currentProfile(){
  return STATE.profiles.find(function(p){ return p.id === STATE.currentId; }) || null;
}
function progressKey(worldId,moduleId,levelId){ return worldId+'.'+moduleId+'.'+levelId; }
function getProgress(key){
  var p = currentProfile();
  if(!p) return { stars:0, gameDone:false };
  return p.progress[key] || { stars:0, gameDone:false };
}
function setProgress(key, data){
  var p = currentProfile();
  if(!p) return;
  p.progress[key] = Object.assign({}, getProgress(key), data);
  saveState();
}

/* ---------- ניווט ---------- */
var VIEW = { screen:'profiles' };
function nav(view){ VIEW = view; render(); window.scrollTo({top:0,behavior:'smooth'}); }

function findWorld(id){ return CONTENT.worlds.find(function(w){ return w.id===id; }); }
function findModule(world,id){ return world.modules.find(function(m){ return m.id===id; }); }
function findLevel(mod,id){ return mod.levels.find(function(l){ return l.id===id; }); }

/* ---------- שאלות תרגול לפי סוג ---------- */
function pick(arr){ return arr[rnd(0,arr.length-1)]; }

function getPracticeQuestion(level){
  var t = level.type;
  if(t === 'letters'){
    var item = pick(level.items);
    var pool = shuffle(LETTERS.map(function(l){return l.ch;}).filter(function(c){return c!==item.ch;})).slice(0,3);
    var choices = shuffle([item.ch].concat(pool)).map(function(c){ return {label:c, value:c}; });
    return { emoji:item.emoji, qMain:null, qText:'בְּאֵיזוֹ אוֹת מַתְחִילָה הַמִּלָּה "'+item.word+'"?', choices:choices, correct:item.ch, speak:item.word, lang:'he' };
  }
  if(t === 'numbers'){
    var item = pick(level.items);
    var choices = choicesAround(item.n, 1, 20, 4).map(function(v){ return {label:String(v), value:v}; });
    return { emoji:null, qMain:starsNode(item.n), qText:'כַּמָּה כּוֹכָבִים יֵשׁ כָּאן?', choices:choices, correct:item.n, speak:item.word, lang:'he' };
  }
  if(t === 'nikud'){
    var item = pick(level.items);
    var sounds = Object.keys(SOUND_LABEL);
    var pool = shuffle(sounds.filter(function(s){return s!==item.sound;})).slice(0,3);
    var choices = shuffle([item.sound].concat(pool)).map(function(s){ return {label:SOUND_LABEL[s], value:s}; });
    return { emoji:item.emoji, qMain:item.demo, qText:'אֵיזֶה צְלִיל שׁוֹמְעִים?', choices:choices, correct:item.sound, speak:item.demo+' '+item.word, lang:'he' };
  }
  if(t === 'eng'){
    var item = pick(level.items);
    var pool = shuffle(ALPHABET.map(function(a){return a.l;}).filter(function(c){return c!==item.l;})).slice(0,3);
    var choices = shuffle([item.l].concat(pool)).map(function(c){ return {label:c, value:c}; });
    return { emoji:item.e, qMain:null, qText:'Which letter does "'+item.w+'" start with?', choices:choices, correct:item.l, speak:item.w, lang:'en' };
  }
  if(t === 'engword' || t === 'engnum'){
    var item = pick(level.items);
    var poolSrc = level.items.map(function(i){return t==='engnum'?i.w:i.w;}).filter(function(w){return w!==item.w;});
    var pool = shuffle(poolSrc).slice(0,3);
    var choices = shuffle([item.w].concat(pool)).map(function(w){ return {label:w, value:w}; });
    if(t==='engnum'){
      return { emoji:null, qMain:starsNode(item.n), qText:'How many is this?', choices:choices, correct:item.w, speak:item.w, lang:'en' };
    }
    return { emoji:item.e, qMain:null, qText:'What is this?', choices:choices, correct:item.w, speak:item.w, lang:'en' };
  }
  if(t === 'engsent'){
    var item = pick(level.items);
    var pool = shuffle(SENTENCES.map(function(s){return s.s;}).filter(function(s){return s!==item.s;})).slice(0,2);
    var choices = shuffle([item.s].concat(pool)).map(function(s){ return {label:s, value:s}; });
    return { emoji:item.e, qMain:null, qText:'Which sentence matches the picture?', choices:choices, correct:item.s, speak:item.s, lang:'en' };
  }
  if(t === 'math' || t === 'mathword'){
    var q = level.gen();
    var choices = q.choices.map(function(v){ return {label:String(v), value:v}; });
    return { emoji:q.emoji||'🧮', qMain:null, qText:q.text, choices:choices, correct:q.answer, speak:null, lang:'he' };
  }
  return { emoji:'❓', qText:'?', choices:[], correct:null };
}

function getMatchItems(level){
  var t = level.type;
  var pool = shuffle(level.items).slice(0, Math.min(6, level.items.length));
  return pool.map(function(item, idx){
    var a,b;
    if(t==='letters'){ a={main:item.ch}; b={emoji:item.emoji, sub:item.word}; }
    else if(t==='numbers'){ a={main:String(item.n)}; b={emoji:starsNode(item.n)}; }
    else if(t==='nikud'){ a={main:item.demo}; b={main:SOUND_LABEL[item.sound]}; }
    else if(t==='eng'){ a={main:item.l}; b={emoji:item.e, sub:item.w}; }
    else if(t==='engword'){ a={main:item.w}; b={emoji:item.e}; }
    else if(t==='engnum'){ a={main:item.w}; b={emoji:starsNode(item.n)}; }
    else if(t==='engsent'){ a={emoji:item.e}; b={main:item.s, small:true}; }
    else { a={main:'?'}; b={main:'?'}; }
    return { id:'p'+idx, a:a, b:b };
  });
}

/* ---------- רינדור ראשי ---------- */
function render(){
  var app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderTopBar());
  var body = E('div',{},[]);
  app.appendChild(body);

  if(VIEW.screen==='profiles') body.appendChild(screenProfiles());
  else if(VIEW.screen==='setup') body.appendChild(screenSetup());
  else if(VIEW.screen==='worlds') body.appendChild(screenWorlds());
  else if(VIEW.screen==='modules') body.appendChild(screenModules());
  else if(VIEW.screen==='levels') body.appendChild(screenLevels());
  else if(VIEW.screen==='lesson') body.appendChild(screenLesson());
  else if(VIEW.screen==='practice') body.appendChild(screenPractice());
  else if(VIEW.screen==='game') body.appendChild(screenGame());
  else if(VIEW.screen==='result') body.appendChild(screenResult());
  else if(VIEW.screen==='settings') body.appendChild(screenSettings());

  app.appendChild(E('div',{class:'footer-note'},['פועל לגמרי במכשיר שלכם — ללא צורך בחיבור לאינטרנט 💙']));
}

function renderTopBar(){
  var bar = E('div',{class:'top-bar'},[]);
  bar.appendChild(E('div',{class:'brand'},[E('span',{class:'logo'},['🎓']),'עוֹלָם הַלְּמִידָה']));
  var right = E('div',{style:'display:flex;align-items:center;gap:8px;'},[]);
  right.appendChild(E('button',{class:'profile-chip', title:'קול הקראה', onclick:function(){ nav(Object.assign({},VIEW,{screen:'settings', back:VIEW}));  }},['⚙️']));
  var p = currentProfile();
  if(p){
    right.appendChild(E('button',{class:'profile-chip', onclick:function(){ nav({screen:'profiles'}); }},[
      E('span',{class:'av'},[p.avatar]), p.name
    ]));
  }
  bar.appendChild(right);
  return bar;
}

/* ---------- מסך הגדרות קול ---------- */
function screenSettings(){
  var wrap = E('div',{},[]);
  var back = VIEW.back || {screen:'profiles'};
  wrap.appendChild(crumbs([{label:'בַּיִת', onclick:function(){ nav(back); }}, {label:'הַגְדָּרוֹת קוֹל'}]));
  wrap.appendChild(E('h1',{class:'page-title'},['⚙️ הַגְדָּרוֹת קוֹל']));

  if(!SPEECH.isSupported()){
    wrap.appendChild(E('div',{class:'lesson-card'},['הַדְּפַדְפָן הַזֶּה לֹא תּוֹמֵךְ בְּהַקְרָאָה קוֹלִית. הָאַתָּר יַמְשִׁיךְ לַעֲבוֹד מְצֻיָּן גַּם בְּלִי קוֹל.']));
    wrap.appendChild(E('button',{class:'big-btn ghost', onclick:function(){ nav(back); }},['חֲזָרָה']));
    return wrap;
  }

  function voiceRow(langKey, langLabel){
    var section = E('div',{},[E('h2',{class:'section-title'},[langLabel]) ]);
    var list = SPEECH.voicesFor(langKey);
    if(!list.length){
      section.appendChild(E('div',{class:'feedback'},['לֹא נִמְצָא קוֹל מֻתְקָן לְשָׂפָה זוֹ בַּמַּכְשִׁיר. אֶפְשָׁר לְהוֹסִיף קוֹל בְּהַגְדָּרוֹת הַנְּגִישׁוּת שֶׁל הַמַּכְשִׁיר.']));
      return section;
    }
    var grid = E('div',{class:'profiles-grid'},[]);
    list.forEach(function(v){
      var isSel = STATE.voicePrefs[langKey] ? STATE.voicePrefs[langKey]===v.voiceURI : list[0].voiceURI===v.voiceURI;
      var card = E('button',{class:'card', style: isSel?'border:3px solid var(--accent);':'', onclick:function(){
        STATE.voicePrefs[langKey] = v.voiceURI; saveState();
        SPEECH.setPreferred(langKey, v.voiceURI);
        SPEECH.speak(langKey==='he' ? 'שָׁלוֹם, כָּכָה אֲנִי נִשְׁמַעַת' : 'Hello, this is how I sound', langKey);
        nav(Object.assign({},VIEW));
      }},[
        E('div',{class:'icon'},[isSel?'✅':'🔊']),
        E('div',{class:'title', style:'font-size:15px;'},[v.name]),
        E('div',{class:'desc'},[v.lang + (v.localService? ' · מְקוֹמִי':' · דּוֹרֵשׁ אִינְטֶרְנֶט')])
      ]);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }

  wrap.appendChild(E('div',{class:'feedback', style:'text-align:right;font-weight:400;font-size:14px;'},['בּוֹחֲרִים אֶת הַקּוֹל הֲכִי טִבְעִי שֶׁמֻּתְקָן בַּמַּכְשִׁיר שֶׁלָּכֶם. קוֹלוֹת "מְקוֹמִיִּים" עוֹבְדִים גַּם בְּלִי אִינְטֶרְנֶט.']));
  wrap.appendChild(voiceRow('he','🇮🇱 עִבְרִית'));
  wrap.appendChild(voiceRow('en','🇬🇧 English'));
  wrap.appendChild(E('button',{class:'big-btn ghost', onclick:function(){ nav(back); }},['חֲזָרָה']));
  return wrap;
}

function crumbs(items){
  var wrap = E('div',{class:'crumbs'},[]);
  items.forEach(function(it,i){
    if(i>0) wrap.appendChild(E('span',{class:'sep'},['›']));
    if(it.onclick) wrap.appendChild(E('button',{onclick:it.onclick},[it.label]));
    else wrap.appendChild(E('span',{},[it.label]));
  });
  return wrap;
}

/* ---------- מסך פרופילים ---------- */
var AVATARS = ['👧','🧒','👦','🐻','🐰','🦄','🐱','🐶','🦁','🐼'];

function screenProfiles(){
  var wrap = E('div',{},[]);
  wrap.appendChild(E('h1',{class:'page-title'},['מִי לוֹמֵד הַיּוֹם?']));
  var grid = E('div',{class:'profiles-grid'},[]);
  STATE.profiles.forEach(function(p){
    grid.appendChild(E('button',{class:'card', onclick:function(){ STATE.currentId=p.id; saveState(); nav({screen:'worlds'}); }},[
      E('div',{class:'icon'},[p.avatar]),
      E('div',{class:'title'},[p.name])
    ]));
  });
  grid.appendChild(E('button',{class:'card', onclick:function(){ nav({screen:'setup'}); }},[
    E('div',{class:'icon'},['➕']),
    E('div',{class:'title'},['הוֹסֵף לוֹמֵד/ת חָדָשׁ/ה'])
  ]));
  wrap.appendChild(grid);
  return wrap;
}

function screenSetup(){
  var wrap = E('div',{class:'setup-wrap'},[]);
  wrap.appendChild(E('h1',{class:'page-title'},['בּוֹאוּ נַכִּיר!']));
  wrap.appendChild(E('div',{},['מַה הַשֵּׁם שֶׁלְּךָ/שֶׁלָּךְ?']));
  var input = E('input',{class:'name-input', placeholder:'הַשֵּׁם שֶׁלִּי...', maxlength:'20'},[]);
  wrap.appendChild(input);
  wrap.appendChild(E('div',{},['בְּחַר/י דְּמוּת:']));
  var selected = AVATARS[0];
  var avRow = E('div',{class:'avatar-row'},[]);
  AVATARS.forEach(function(av,i){
    var b = E('button',{class:'avatar-opt'+(i===0?' sel':''), onclick:function(){
      Array.prototype.forEach.call(avRow.children, function(c){ c.classList.remove('sel'); });
      b.classList.add('sel'); selected = av;
    }},[av]);
    avRow.appendChild(b);
  });
  wrap.appendChild(avRow);
  wrap.appendChild(E('button',{class:'big-btn', onclick:function(){
    var name = input.value.trim() || 'חָבֵר/ה';
    var id = 'p'+Date.now();
    STATE.profiles.push({ id:id, name:name, avatar:selected, progress:{} });
    STATE.currentId = id; saveState();
    nav({screen:'worlds'});
  }},['בּוֹאוּ נַתְחִיל! 🚀']));
  wrap.appendChild(E('button',{class:'big-btn ghost', onclick:function(){ nav({screen:'profiles'}); }},['חֲזָרָה']));
  return wrap;
}

/* ---------- מסך עולמות ---------- */
function screenWorlds(){
  var wrap = E('div',{},[]);
  wrap.appendChild(crumbs([{label:'בַּיִת', onclick:function(){ nav({screen:'profiles'}); }}]));
  wrap.appendChild(E('h1',{class:'page-title'},['אֵיזֶה עוֹלָם נָבוֹא הַיּוֹם? 🌈']));
  var grid = E('div',{class:'grid'},[]);
  CONTENT.worlds.forEach(function(w){
    var card = E('button',{class:'card world-card', style:'background:'+w.color, onclick:function(){ nav({screen:'modules', worldId:w.id}); }},[
      E('div',{class:'icon'},[w.icon]),
      E('div',{class:'title'},[w.title]),
      E('div',{class:'desc'},[w.modules.length+' נוֹשְׂאִים לְלִמּוּד'])
    ]);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
}

/* ---------- מסך מודולים ---------- */
function screenModules(){
  var world = findWorld(VIEW.worldId);
  var wrap = E('div',{},[]);
  wrap.appendChild(crumbs([
    {label:'בַּיִת', onclick:function(){ nav({screen:'profiles'}); }},
    {label:'עוֹלָמוֹת', onclick:function(){ nav({screen:'worlds'}); }},
    {label:world.title}
  ]));
  wrap.appendChild(E('h1',{class:'page-title'},[world.icon+' '+world.title]));
  var grid = E('div',{class:'grid'},[]);
  world.modules.forEach(function(m){
    var totalStars=0, maxStars=m.levels.length*3;
    m.levels.forEach(function(l){ totalStars += getProgress(progressKey(world.id,m.id,l.id)).stars || 0; });
    var card = E('button',{class:'card', onclick:function(){ nav({screen:'levels', worldId:world.id, moduleId:m.id}); }},[
      E('div',{class:'icon'},[m.icon]),
      E('div',{class:'title'},[m.title]),
      E('div',{class:'desc'},[m.levels.length+' רָמוֹת']),
      E('div',{class:'stars'},[starsString(0)+' '+totalStars+'/'+maxStars+' ⭐'])
    ]);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
}

/* ---------- מסך רמות ---------- */
function screenLevels(){
  var world = findWorld(VIEW.worldId);
  var mod = findModule(world, VIEW.moduleId);
  var wrap = E('div',{},[]);
  wrap.appendChild(crumbs([
    {label:'בַּיִת', onclick:function(){ nav({screen:'profiles'}); }},
    {label:world.title, onclick:function(){ nav({screen:'modules', worldId:world.id}); }},
    {label:mod.title}
  ]));
  wrap.appendChild(E('h1',{class:'page-title'},[mod.icon+' '+mod.title]));
  var grid = E('div',{class:'grid'},[]);
  mod.levels.forEach(function(lv, idx){
    var key = progressKey(world.id, mod.id, lv.id);
    var prog = getProgress(key);
    var prevDone = idx===0 || getProgress(progressKey(world.id,mod.id,mod.levels[idx-1].id)).gameDone;
    var unlocked = !!prevDone;
    var card = E('button',{class:'card'+(unlocked?'':' locked'), disabled: unlocked?null:'disabled', onclick: unlocked ? function(){ nav({screen:'lesson', worldId:world.id, moduleId:mod.id, levelId:lv.id, step:0}); } : null},[
      unlocked ? null : E('div',{class:'lock'},['🔒']),
      E('div',{class:'icon'},[lv.icon]),
      E('div',{class:'title'},[lv.title]),
      E('div',{class:'stars'},[starsString(prog.stars)])
    ]);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
}

/* ---------- מסך שיעור (וידאו קצר מונחה קול, מתקדם אוטומטית) ---------- */
var LESSON_TOKEN = 0;
var LESSON_PLAYING = true;
function screenLesson(){
  var world = findWorld(VIEW.worldId), mod = findModule(world, VIEW.moduleId), lv = findLevel(mod, VIEW.levelId);
  var wrap = E('div',{},[]);
  wrap.appendChild(crumbs([
    {label:'בַּיִת', onclick:function(){ nav({screen:'profiles'}); }},
    {label:mod.title, onclick:function(){ nav({screen:'levels', worldId:world.id, moduleId:mod.id}); }},
    {label:lv.title}
  ]));
  wrap.appendChild(E('h2',{class:'section-title'},['📺 שִׁעוּר קָצָר']));

  var steps = buildLessonSteps(lv);
  var i = VIEW.step || 0;
  var step = steps[i];
  var isLast = i === steps.length-1;

  LESSON_TOKEN++;
  var myToken = LESSON_TOKEN;

  var card = E('div',{class:'lesson-card', dir: step.lang==='en' ? 'ltr' : 'rtl'},[]);
  if(step.emoji) card.appendChild(E('div',{class:'lesson-emoji'},[step.emoji]));
  if(step.main) card.appendChild(E('div',{class:'lesson-main'},[step.main]));
  if(step.sub) card.appendChild(E('div',{class:'lesson-sub', dir: step.subLang==='he' ? 'rtl' : null},[step.sub]));
  if(step.extra) card.appendChild(E('div',{class:'lesson-he', dir:'rtl'},[step.extra]));

  var timebar = E('div',{class:'lesson-timebar'},[E('div',{class:'lesson-timebar-fill'},[])]);
  card.appendChild(timebar);

  var btnRow = E('div',{style:'display:flex;gap:10px;'},[]);
  var playBtn = E('button',{class:'speak-btn', title: LESSON_PLAYING ? 'הַשְׁהֵה' : 'הַמְשֵׁךְ', onclick:function(){
    LESSON_PLAYING = !LESSON_PLAYING;
    SPEECH.stop();
    nav(Object.assign({},VIEW));
  }},[LESSON_PLAYING ? '⏸️' : '▶️']);
  var speakBtn = E('button',{class:'speak-btn', title:'הַשְׁמַע שׁוּב', onclick:function(){ SPEECH.speak(step.speak, step.lang); }},['🔊']);
  btnRow.appendChild(playBtn);
  btnRow.appendChild(speakBtn);
  card.appendChild(btnRow);
  wrap.appendChild(card);

  var dots = E('div',{class:'dots'},[]);
  steps.forEach(function(_,idx){ dots.appendChild(E('span',{class: idx===i?'active':''},[])); });
  wrap.appendChild(dots);

  var navRow = E('div',{class:'nav-row'},[
    E('button',{class:'big-btn ghost', disabled: i===0?'disabled':null, onclick:function(){ LESSON_PLAYING=false; nav(Object.assign({},VIEW,{step:i-1})); }},['⟵ הַקּוֹדֵם']),
    !isLast
      ? E('button',{class:'big-btn', onclick:function(){ nav(Object.assign({},VIEW,{step:i+1})); }},['הַבָּא ⟶'])
      : E('button',{class:'big-btn good', onclick:function(){ nav({screen:'practice', worldId:world.id, moduleId:mod.id, levelId:lv.id}); }},['לְתַרְגּוּל! ✏️'])
  ]);
  wrap.appendChild(navRow);

  var fillEl = timebar.firstChild;
  if(LESSON_PLAYING){
    var dur = SPEECH.estimateDuration(step.speak);
    fillEl.style.transitionDuration = dur+'ms';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(myToken===LESSON_TOKEN) fillEl.style.width='100%'; }); });
    SPEECH.speak(step.speak, step.lang, function(){
      if(myToken !== LESSON_TOKEN || !LESSON_PLAYING) return;
      if(!isLast){ nav(Object.assign({},VIEW,{step:i+1})); }
    });
  } else {
    fillEl.style.width = '0%';
  }

  return wrap;
}

function buildLessonSteps(lv){
  var t = lv.type;
  if(t==='letters'){
    return lv.items.map(function(it){ return { emoji:it.emoji, main:it.ch, sub:it.name, extra:it.word, speak:it.name+'. '+it.word, lang:'he' }; });
  }
  if(t==='numbers'){
    return lv.items.map(function(it){ return { emoji:null, main:String(it.n), sub:starsNode(it.n), extra:it.word, speak:it.word, lang:'he' }; });
  }
  if(t==='nikud'){
    return lv.items.map(function(it){ return { emoji:it.emoji, main:it.demo, sub:it.sym, extra:it.word, speak:it.demo+'. '+it.word, lang:'he' }; });
  }
  if(t==='eng'){
    return lv.items.map(function(it){ return { emoji:it.e, main:it.l, sub:it.w, speak:it.l+'. '+it.w, lang:'en' }; });
  }
  if(t==='engword'){
    return lv.items.map(function(it){ return { emoji:it.e, main:it.w, sub:it.he||'', subLang:'he', speak:it.w, lang:'en' }; });
  }
  if(t==='engnum'){
    return lv.items.map(function(it){ return { emoji:null, main:it.w, sub:starsNode(it.n), speak:it.w, lang:'en' }; });
  }
  if(t==='engsent'){
    return lv.items.map(function(it){ return { emoji:it.e, main:it.s, speak:it.s, lang:'en' }; });
  }
  if(t==='math' || t==='mathword'){
    var out=[];
    for(var i=0;i<4;i++){
      var q = lv.gen();
      out.push({ emoji:q.emoji||'🧮', main:q.text, sub:'= '+q.answer, speak:(q.text.replace('?', ''))+' זֶה '+q.answer, lang:'he' });
    }
    return out;
  }
  return [{ main:'?', speak:'' }];
}

/* ---------- מסך תרגול ---------- */
var PRACTICE_STATE = null;
function screenPractice(){
  var world = findWorld(VIEW.worldId), mod = findModule(world, VIEW.moduleId), lv = findLevel(mod, VIEW.levelId);
  if(!PRACTICE_STATE || PRACTICE_STATE.levelId !== lv.id){
    PRACTICE_STATE = { levelId: lv.id, round:0, total:8, correct:0, answered:false };
  }
  var wrap = E('div',{},[]);
  wrap.appendChild(crumbs([
    {label:'בַּיִת', onclick:function(){ nav({screen:'profiles'}); }},
    {label:mod.title, onclick:function(){ nav({screen:'levels', worldId:world.id, moduleId:mod.id}); }},
    {label:lv.title}
  ]));
  var isDone = PRACTICE_STATE.round >= PRACTICE_STATE.total;
  wrap.appendChild(E('h2',{class:'section-title'}, isDone ? ['✏️ תַּרְגּוּל — סִיּוּם'] : ['✏️ תַּרְגּוּל  ('+(PRACTICE_STATE.round+1)+'/'+PRACTICE_STATE.total+')']));

  if(isDone){
    var score = PRACTICE_STATE.correct / PRACTICE_STATE.total;
    var pass = score >= 0.6;
    var key = progressKey(world.id, mod.id, lv.id);
    var stars = score>=0.9?3:(score>=0.7?2:(score>=0.4?1:0));
    setProgress(key, { stars: Math.max(stars, getProgress(key).stars||0) });
    var res = E('div',{class:'result-card'},[
      E('div',{class:'big-emoji'},[pass?'🎉':'💪']),
      E('div',{class:'score'},[PRACTICE_STATE.correct+' מִתּוֹךְ '+PRACTICE_STATE.total+' נָכוֹן!']),
      E('div',{class:'stars-row'},[starsString(stars)])
    ]);
    if(pass){
      res.appendChild(E('button',{class:'big-btn good', onclick:function(){ PRACTICE_STATE=null; nav({screen:'game', worldId:world.id, moduleId:mod.id, levelId:lv.id}); }},['לַמִּשְׂחָק! 🎮']));
    } else {
      res.appendChild(E('div',{},['בּוֹאוּ נְנַסֶּה שׁוּב, אַתֶּם כִּמְעַט שָׁם!']));
      res.appendChild(E('button',{class:'big-btn warn', onclick:function(){ PRACTICE_STATE=null; nav(Object.assign({},VIEW)); }},['לְנַסּוֹת שׁוּב 🔁']));
    }
    res.appendChild(E('button',{class:'big-btn ghost', onclick:function(){ PRACTICE_STATE=null; nav({screen:'levels', worldId:world.id, moduleId:mod.id}); }},['חֲזָרָה לָרָמוֹת']));
    wrap.appendChild(res);
    return wrap;
  }

  if(!PRACTICE_STATE.current) PRACTICE_STATE.current = getPracticeQuestion(lv);
  var q = PRACTICE_STATE.current;

  wrap.appendChild(E('div',{class:'quiz-progress'},[ E('div',{style:'width:'+(100*PRACTICE_STATE.round/PRACTICE_STATE.total)+'%'},[]) ]));

  var qBox = E('div',{class:'quiz-question', dir: q.lang==='en' ? 'ltr' : 'rtl'},[]);
  if(q.emoji) qBox.appendChild(E('div',{class:'q-emoji'},[q.emoji]));
  if(q.qMain) qBox.appendChild(E('div',{class:'q-main'},[q.qMain]));
  qBox.appendChild(E('div',{class:'q-text'},[q.qText]));
  wrap.appendChild(qBox);

  var feedback = E('div',{class:'feedback'},[]);
  var choicesWrap = E('div',{class:'choices', dir: q.lang==='en' ? 'ltr' : 'rtl'},[]);
  q.choices.forEach(function(ch){
    var btn = E('button',{class:'choice-btn', onclick:function(){
      if(PRACTICE_STATE.answered) return;
      PRACTICE_STATE.answered = true;
      var ok = ch.value === q.correct;
      if(ok){ PRACTICE_STATE.correct++; feedback.textContent='כֹּל הַכָּבוֹד! 🎉'; feedback.className='feedback good'; btn.classList.add('correct'); }
      else{ feedback.textContent='כִּמְעַט! נַסּוּ שׁוּב בַּפַּעַם הַבָּאָה'; feedback.className='feedback bad'; btn.classList.add('wrong'); }
      Array.prototype.forEach.call(choicesWrap.children, function(b){
        b.disabled = true;
        if(!ok && b !== btn && q.choices[Array.prototype.indexOf.call(choicesWrap.children,b)].value === q.correct) b.classList.add('correct');
      });
      setTimeout(function(){
        PRACTICE_STATE.round++;
        PRACTICE_STATE.current = null;
        PRACTICE_STATE.answered = false;
        render();
      }, 1100);
    }},[ch.label]);
    choicesWrap.appendChild(btn);
  });
  wrap.appendChild(choicesWrap);
  wrap.appendChild(feedback);
  if(q.speak){
    var sb = E('button',{class:'speak-btn', onclick:function(){ SPEECH.speak(q.speak, q.lang); }},['🔊']);
    wrap.appendChild(sb);
  }
  return wrap;
}

/* ---------- מסך משחק ---------- */
var GAME_STATE = null;
function screenGame(){
  var world = findWorld(VIEW.worldId), mod = findModule(world, VIEW.moduleId), lv = findLevel(mod, VIEW.levelId);
  var vocabTypes = ['letters','numbers','nikud','eng','engword','engnum','engsent'];
  var gameType = vocabTypes.indexOf(lv.type) !== -1 ? 'match' : 'speedquiz';
  return gameType === 'match' ? gameMatch(world,mod,lv) : gameSpeedquiz(world,mod,lv);
}

function finishGame(world,mod,lv,stars){
  var key = progressKey(world.id, mod.id, lv.id);
  var prevStars = getProgress(key).stars||0;
  setProgress(key, { gameDone:true, stars: Math.max(stars, prevStars) });
  confettiBurst();
  nav({screen:'result', worldId:world.id, moduleId:mod.id, levelId:lv.id, stars: Math.max(stars, prevStars)});
}

function gameMatch(world,mod,lv){
  if(!GAME_STATE || GAME_STATE.kind!=='match' || GAME_STATE.levelId!==lv.id){
    var pairs = getMatchItems(lv);
    var cards = [];
    pairs.forEach(function(p){
      cards.push({pairId:p.id, side:'a', data:p.a});
      cards.push({pairId:p.id, side:'b', data:p.b});
    });
    GAME_STATE = { kind:'match', levelId:lv.id, cards: shuffle(cards), selected:[], matched:[] };
  }
  var wrap = E('div',{},[]);
  wrap.appendChild(crumbs([
    {label:'בַּיִת', onclick:function(){ nav({screen:'profiles'}); }},
    {label:mod.title, onclick:function(){ nav({screen:'levels', worldId:world.id, moduleId:mod.id}); }},
    {label:lv.title}
  ]));
  wrap.appendChild(E('h2',{class:'section-title'},['🎮 מִשְׂחָק הַתְאָמָה — מָצְאוּ אֶת הַזּוּגוֹת!']));

  var isEnglish = ['eng','engword','engnum','engsent'].indexOf(lv.type) !== -1;
  var grid = E('div',{class:'game-grid', dir: isEnglish?'ltr':'rtl'},[]);
  GAME_STATE.cards.forEach(function(card, idx){
    var isMatched = GAME_STATE.matched.indexOf(card.pairId) !== -1;
    var isSelected = GAME_STATE.selected.indexOf(idx) !== -1;
    var content = [];
    if(card.data.emoji) content.push(E('div',{class:'em'},[card.data.emoji]));
    if(card.data.main) content.push(E('div',{style: card.data.small?'font-size:14px':''},[card.data.main]));
    if(card.data.sub) content.push(E('div',{style:'font-size:13px;opacity:.7'},[card.data.sub]));
    var cls = 'match-card'+(isMatched?' matched':'')+(isSelected?' selected':'');
    var btn = E('div',{class:cls, onclick: (isMatched? null : function(){ onMatchCardClick(idx, world,mod,lv); })},content);
    grid.appendChild(btn);
  });
  wrap.appendChild(grid);
  wrap.appendChild(E('div',{class:'feedback'},[GAME_STATE.matched.length+' / '+(GAME_STATE.cards.length/2)+' זוּגוֹת נִמְצְאוּ']));
  return wrap;
}

function onMatchCardClick(idx, world,mod,lv){
  var gs = GAME_STATE;
  if(gs.selected.indexOf(idx)!==-1) return;
  if(gs.selected.length>=2) return;
  gs.selected.push(idx);
  if(gs.selected.length===2){
    var c1 = gs.cards[gs.selected[0]], c2 = gs.cards[gs.selected[1]];
    if(c1.pairId===c2.pairId && c1.side!==c2.side){
      gs.matched.push(c1.pairId);
      gs.selected = [];
      render();
      if(gs.matched.length === gs.cards.length/2){
        var stars = 3;
        setTimeout(function(){ finishGame(world,mod,lv,stars); }, 500);
      }
    } else {
      render();
      setTimeout(function(){ gs.selected=[]; render(); }, 700);
    }
  } else {
    render();
  }
}

function gameSpeedquiz(world,mod,lv){
  if(!GAME_STATE || GAME_STATE.kind!=='speedquiz' || GAME_STATE.levelId!==lv.id){
    GAME_STATE = { kind:'speedquiz', levelId:lv.id, lives:3, correct:0, target:8, current:null, answered:false };
  }
  var gs = GAME_STATE;
  var wrap = E('div',{},[]);
  wrap.appendChild(crumbs([
    {label:'בַּיִת', onclick:function(){ nav({screen:'profiles'}); }},
    {label:mod.title, onclick:function(){ nav({screen:'levels', worldId:world.id, moduleId:mod.id}); }},
    {label:lv.title}
  ]));
  wrap.appendChild(E('h2',{class:'section-title'},['🎮 מִשְׂחָק הַתְּשׁוּבוֹת הַמְּהִירוֹת']));
  wrap.appendChild(E('div',{class:'hearts-row'},[heartsString(gs.lives)]));

  if(gs.lives<=0){
    var stars = gs.correct>=6?3:(gs.correct>=3?2:1);
    var box = E('div',{class:'result-card'},[
      E('div',{class:'big-emoji'},['😅']),
      E('div',{class:'score'},['הִגַּעְתֶּם לְ-'+gs.correct+' נְקֻדּוֹת!']),
      E('button',{class:'big-btn good', onclick:function(){ finishGame(world,mod,lv,stars); }},['לְסִיּוּם 🏁'])
    ]);
    wrap.appendChild(box);
    return wrap;
  }
  if(gs.correct >= gs.target){
    setTimeout(function(){ finishGame(world,mod,lv,3); }, 10);
    return wrap;
  }

  if(!gs.current) gs.current = getPracticeQuestion(lv);
  var q = gs.current;
  wrap.appendChild(E('div',{class:'quiz-progress'},[ E('div',{style:'width:'+(100*gs.correct/gs.target)+'%'},[]) ]));
  var qBox = E('div',{class:'quiz-question', dir: q.lang==='en' ? 'ltr' : 'rtl'},[]);
  if(q.emoji) qBox.appendChild(E('div',{class:'q-emoji'},[q.emoji]));
  if(q.qMain) qBox.appendChild(E('div',{class:'q-main'},[q.qMain]));
  qBox.appendChild(E('div',{class:'q-text'},[q.qText]));
  wrap.appendChild(qBox);

  var feedback = E('div',{class:'feedback'},[]);
  var choicesWrap = E('div',{class:'choices', dir: q.lang==='en' ? 'ltr' : 'rtl'},[]);
  q.choices.forEach(function(ch){
    var btn = E('button',{class:'choice-btn', onclick:function(){
      if(gs.answered) return;
      gs.answered = true;
      var ok = ch.value === q.correct;
      if(ok){ gs.correct++; feedback.textContent='מְעֻלֶּה! ⚡'; feedback.className='feedback good'; btn.classList.add('correct'); }
      else{ gs.lives--; feedback.textContent='אוֹי, פָּחוֹת חַיִּים!'; feedback.className='feedback bad'; btn.classList.add('wrong'); }
      setTimeout(function(){ gs.current=null; gs.answered=false; render(); }, 900);
    }},[ch.label]);
    choicesWrap.appendChild(btn);
  });
  wrap.appendChild(choicesWrap);
  wrap.appendChild(feedback);
  return wrap;
}

/* ---------- מסך תוצאה סופית ---------- */
function screenResult(){
  var world = findWorld(VIEW.worldId), mod = findModule(world, VIEW.moduleId), lv = findLevel(mod, VIEW.levelId);
  var idx = mod.levels.findIndex(function(l){ return l.id===lv.id; });
  var next = mod.levels[idx+1];
  GAME_STATE = null;
  var wrap = E('div',{},[]);
  var box = E('div',{class:'result-card'},[
    E('div',{class:'big-emoji'},['🏆']),
    E('div',{class:'score'},['סִיַּמְתֶּם אֶת "'+lv.title+'"!']),
    E('div',{class:'stars-row'},[starsString(VIEW.stars||3)])
  ]);
  if(next){
    box.appendChild(E('button',{class:'big-btn good', onclick:function(){ nav({screen:'lesson', worldId:world.id, moduleId:mod.id, levelId:next.id, step:0}); }},['לָרָמָה הַבָּאָה ⟶']));
  } else {
    box.appendChild(E('div',{},['סִיַּמְתֶּם אֶת כָּל הָרָמוֹת בְּנוֹשֵׂא זֶה! 🌟']));
  }
  box.appendChild(E('button',{class:'big-btn ghost', onclick:function(){ nav({screen:'levels', worldId:world.id, moduleId:mod.id}); }},['חֲזָרָה לָרָמוֹת']));
  box.appendChild(E('button',{class:'big-btn ghost', onclick:function(){ nav({screen:'worlds'}); }},['חֲזָרָה לְעוֹלָמוֹת']));
  wrap.appendChild(box);
  return wrap;
}

/* ---------- אתחול ---------- */
document.addEventListener('DOMContentLoaded', function(){
  render();
});

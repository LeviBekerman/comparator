/* תוכן הלמידה - כל הנתונים של האותיות, המספרים, הניקוד, החשבון והאנגלית */
/* עובד לגמרי לוקאלית, ללא צורך באינטרנט */

var LETTERS = [
  { ch:'א', name:'אָלֶף',  word:'אַרְיֵה',   emoji:'🦁' },
  { ch:'ב', name:'בֵּית',  word:'בַּיִת',     emoji:'🏠' },
  { ch:'ג', name:'גִּימֶל', word:'גָּמָל',    emoji:'🐫' },
  { ch:'ד', name:'דָּלֶת', word:'דָּג',      emoji:'🐟' },
  { ch:'ה', name:'הֵא',   word:'הַר',       emoji:'⛰️' },
  { ch:'ו', name:'וָו',   word:'וֶרֶד',     emoji:'🌹' },
  { ch:'ז', name:'זַיִן',  word:'זֶבְּרָה',   emoji:'🦓' },
  { ch:'ח', name:'חֵית',  word:'חָתוּל',    emoji:'🐱' },
  { ch:'ט', name:'טֵית',  word:'טַוָּס',    emoji:'🦚' },
  { ch:'י', name:'יוֹד',  word:'יָם',       emoji:'🌊' },
  { ch:'כ', name:'כַּף',   word:'כַּדּוּר',   emoji:'⚽' },
  { ch:'ל', name:'לָמֶד', word:'לֵב',       emoji:'❤️' },
  { ch:'מ', name:'מֵם',   word:'מַיִם',     emoji:'💧' },
  { ch:'נ', name:'נוּן',  word:'נָמֵר',     emoji:'🐯' },
  { ch:'ס', name:'סָמֶך', word:'סוּס',      emoji:'🐴' },
  { ch:'ע', name:'עַיִן',  word:'עֵץ',       emoji:'🌳' },
  { ch:'פ', name:'פֵּא',   word:'פִּיל',     emoji:'🐘' },
  { ch:'צ', name:'צַדִי',  word:'צִפּוֹר',   emoji:'🐦' },
  { ch:'ק', name:'קוֹף',  word:'קוֹף',      emoji:'🐒' },
  { ch:'ר', name:'רֵישׁ',  word:'רַכֶּבֶת',   emoji:'🚂' },
  { ch:'ש', name:'שִׁין',  word:'שֶׁמֶשׁ',    emoji:'☀️' },
  { ch:'ת', name:'תָּיו',  word:'תַּפּוּחַ',   emoji:'🍎' }
];

var NUMBER_WORDS = ['אֶפֶס','אַחַת','שְׁתַּיִם','שָׁלוֹשׁ','אַרְבַּע','חָמֵשׁ','שֵׁשׁ','שֶׁבַע','שְׁמוֹנֶה','תֵּשַׁע','עֶשֶׂר',
  'אַחַת עֶשְׂרֵה','שְׁתֵּים עֶשְׂרֵה','שְׁלוֹשׁ עֶשְׂרֵה','אַרְבַּע עֶשְׂרֵה','חֲמֵשׁ עֶשְׂרֵה','שֵׁשׁ עֶשְׂרֵה',
  'שְׁבַע עֶשְׂרֵה','שְׁמוֹנֶה עֶשְׂרֵה','תְּשַׁע עֶשְׂרֵה','עֶשְׂרִים'];

var NUM_EMOJI = '⭐';
function numbersRange(a,b){
  var out=[];
  for(var i=a;i<=b;i++) out.push({ n:i, word:NUMBER_WORDS[i], dots: NUM_EMOJI.repeat(i) || '·' });
  return out;
}

var NIKUD_ITEMS = [
  { sym:'קָמָץ',  demo:'מָ', word:'מָה',        emoji:'🤔', sound:'a' },
  { sym:'פַּתָח',  demo:'מַ', word:'מַתָּנָה',    emoji:'🎁', sound:'a' },
  { sym:'צֵירֵה', demo:'מֵ', word:'מֵאָה',       emoji:'💯', sound:'e' },
  { sym:'סֶגּוֹל', demo:'מֶ', word:'מֶלֶך',       emoji:'👑', sound:'e' },
  { sym:'חִירִיק', demo:'מִ', word:'מִלָּה',      emoji:'📝', sound:'i' },
  { sym:'חוֹלָם',  demo:'מוֹ', word:'מוֹרֶה',     emoji:'👨‍🏫', sound:'o' },
  { sym:'שׁוּרוּק', demo:'מוּ', word:'מוּסִיקָה', emoji:'🎵', sound:'u' },
  { sym:'שְׁוָא',  demo:'מְ', word:'מְאֹד',      emoji:'❗', sound:"'" }
];
var SOUND_LABEL = { a:'אַ (a)', e:'אֶ (e)', i:'אִ (i)', o:'אוֹ (o)', u:'אוּ (u)', "'":'חֲטוּפָה' };

function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function shuffle(arr){
  var a = arr.slice();
  for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
function choicesAround(correct, min, max, count){
  var set = [correct];
  var guard = 0;
  while(set.length < count && guard < 200){
    guard++;
    var delta = rnd(-6,6) || 1;
    var v = correct + delta;
    if(v < min || v > max) continue;
    if(set.indexOf(v) === -1) set.push(v);
  }
  while(set.length < count) set.push(correct + set.length*3 + 1);
  return shuffle(set);
}

function opAnswer(op,a,b){ return op==='add'?a+b : op==='sub'?a-b : op==='mul'?a*b : Math.round(a/b); }

var WORD_STORIES = [
  { op:'add', emoji:'🍎',
    setup:function(x){ return 'לְדָנָה יֵשׁ '+x+' תַּפּוּחִים'; },
    change:function(y){ return 'וְקִבְּלָה עוֹד '+y+'.'; },
    question:'כַּמָּה תַּפּוּחִים יֵשׁ לָהּ עַכְשָׁיו?',
    range:function(){ var x=rnd(2,10), y=rnd(1,Math.max(1,10-x)); return {x:x,y:y}; },
    demo:{x:2,y:1}
  },
  { op:'sub', emoji:'⭐',
    setup:function(x){ return 'לְיוֹסִי הָיוּ '+x+' מַדְבְּקוֹת'; },
    change:function(y){ return 'הוּא נָתַן '+y+' לַחֲבֵרוֹ.'; },
    question:'כַּמָּה נִשְׁאֲרוּ לוֹ?',
    range:function(){ var x=rnd(5,20), y=rnd(1,x); return {x:x,y:y}; },
    demo:{x:5,y:2}
  },
  { op:'mul', emoji:'✏️',
    setup:function(x){ return 'בַּכִּתָּה יֵשׁ '+x+' שֻׁלְחָנוֹת'; },
    change:function(y){ return 'וְעַל כָּל שֻׁלְחָן '+y+' עִפְּרוֹנוֹת.'; },
    question:'כַּמָּה עִפְּרוֹנוֹת בְּסַךְ הַכֹּל?',
    range:function(){ var x=rnd(2,6), y=rnd(2,5); return {x:x,y:y}; },
    demo:{x:2,y:3}
  }
];

var MATH_DEMO_EXAMPLES = {
  add: [{a:2,b:1},{a:3,b:2},{a:4,b:3}],
  sub: [{a:5,b:2},{a:6,b:3},{a:4,b:1}],
  mul: [{a:2,b:3},{a:3,b:2},{a:4,b:2}],
  div: [{a:6,b:2},{a:8,b:4},{a:9,b:3}]
};

function mathGenerator(kind, max){
  return function(){
    var a,b,answer,text,choices;
    if(kind === 'add'){
      a = rnd(0,max); b = rnd(0, max-a);
      answer = a+b; text = a+' + '+b+' = ?';
      choices = choicesAround(answer, 0, max*2, 4);
    } else if(kind === 'sub'){
      a = rnd(0,max); b = rnd(0,a);
      answer = a-b; text = a+' − '+b+' = ?';
      choices = choicesAround(answer, 0, max, 4);
    } else if(kind === 'mul'){
      a = rnd(2, max); b = rnd(2,10);
      answer = a*b; text = a+' × '+b+' = ?';
      choices = choicesAround(answer, 0, 100, 4);
    } else if(kind === 'div'){
      b = rnd(2,10); answer = rnd(1,10); a = b*answer;
      text = a+' ÷ '+b+' = ?';
      choices = choicesAround(answer, 0, 10, 4);
    } else if(kind === 'word'){
      var story = WORD_STORIES[rnd(0,WORD_STORIES.length-1)];
      var r = story.range();
      answer = opAnswer(story.op, r.x, r.y);
      text = story.setup(r.x)+' '+story.change(r.y)+' '+story.question;
      choices = choicesAround(answer, 0, 100, 4);
      return { text:text, answer:answer, choices:choices, emoji:story.emoji };
    }
    return { text:text, answer:answer, choices:choices };
  };
}

var ALPHABET = [
  {l:'A',w:'Apple',e:'🍎'},{l:'B',w:'Ball',e:'⚽'},{l:'C',w:'Cat',e:'🐱'},{l:'D',w:'Dog',e:'🐶'},
  {l:'E',w:'Elephant',e:'🐘'},{l:'F',w:'Fish',e:'🐟'},{l:'G',w:'Giraffe',e:'🦒'},{l:'H',w:'Hat',e:'🎩'},
  {l:'I',w:'Ice Cream',e:'🍦'},{l:'J',w:'Juice',e:'🧃'},{l:'K',w:'Kite',e:'🪁'},{l:'L',w:'Lion',e:'🦁'},
  {l:'M',w:'Moon',e:'🌙'},{l:'N',w:'Nest',e:'🪺'},{l:'O',w:'Orange',e:'🍊'},{l:'P',w:'Pizza',e:'🍕'},
  {l:'Q',w:'Queen',e:'👑'},{l:'R',w:'Rainbow',e:'🌈'},{l:'S',w:'Sun',e:'☀️'},{l:'T',w:'Tiger',e:'🐯'},
  {l:'U',w:'Umbrella',e:'☂️'},{l:'V',w:'Violin',e:'🎻'},{l:'W',w:'Watermelon',e:'🍉'},{l:'X',w:'Xylophone',e:'🎼'},
  {l:'Y',w:'Yo-yo',e:'🪀'},{l:'Z',w:'Zebra',e:'🦓'}
];

var COLORS = [
  {w:'Red',he:'אָדוֹם',e:'🔴'},{w:'Blue',he:'כָּחוֹל',e:'🔵'},{w:'Green',he:'יָרוֹק',e:'🟢'},
  {w:'Yellow',he:'צָהוֹב',e:'🟡'},{w:'Orange',he:'כָּתוֹם',e:'🟠'},{w:'Purple',he:'סָגוֹל',e:'🟣'},
  {w:'Black',he:'שָׁחוֹר',e:'⚫'},{w:'White',he:'לָבָן',e:'⚪'},{w:'Pink',he:'וָרוֹד',e:'🩷'},{w:'Brown',he:'חוּם',e:'🟤'}
];

var ANIMALS = [
  {w:'Dog',he:'כֶּלֶב',e:'🐶'},{w:'Cat',he:'חָתוּל',e:'🐱'},{w:'Lion',he:'אַרְיֵה',e:'🦁'},
  {w:'Elephant',he:'פִּיל',e:'🐘'},{w:'Monkey',he:'קוֹף',e:'🐒'},{w:'Bird',he:'צִפּוֹר',e:'🐦'},
  {w:'Fish',he:'דָּג',e:'🐟'},{w:'Horse',he:'סוּס',e:'🐴'},{w:'Rabbit',he:'אַרְנָב',e:'🐰'},{w:'Bear',he:'דוֹב',e:'🐻'}
];

var ENG_NUMBERS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty']
  .map(function(w,i){ return {w:w, n:i, e:NUM_EMOJI.repeat(i)||'·'}; });

var FAMILY = [
  {w:'Mother',he:'אִמָּא',e:'👩'},{w:'Father',he:'אַבָּא',e:'👨'},{w:'Sister',he:'אָחוֹת',e:'👧'},
  {w:'Brother',he:'אָח',e:'👦'},{w:'Baby',he:'תִּינוֹק',e:'👶'},{w:'Grandmother',he:'סָבְתָא',e:'👵'},
  {w:'Grandfather',he:'סַבָּא',e:'👴'},{w:'Family',he:'מִשְׁפָּחָה',e:'👪'}
];

var SENTENCES = [
  {s:'This is a cat.', e:'🐱'},{s:'This is a dog.', e:'🐶'},{s:'I like the sun.', e:'☀️'},
  {s:'She has a red ball.', e:'⚽'},{s:'The bird can fly.', e:'🐦'},{s:'We eat an apple.', e:'🍎'},
  {s:'He is my brother.', e:'👦'},{s:'I see a rainbow.', e:'🌈'}
];

/* ==== מבנה העולמות: עולם -> מודול -> רמות ==== */
var CONTENT = {
  worlds: [
    {
      id:'young', title:'אוֹתִיּוֹת וּמִסְפָּרִים', icon:'🔤', color:'#FF8A5B',
      modules: [
        {
          id:'letters', title:'אוֹתִיּוֹת', icon:'🔡', color:'#5B8DEF',
          levels: [
            { id:'l1', title:'אוֹתִיּוֹת א-י', icon:'🔡', items: LETTERS.slice(0,10), type:'letters' },
            { id:'l2', title:'אוֹתִיּוֹת כ-ת', icon:'🔡', items: LETTERS.slice(10), type:'letters' }
          ]
        },
        {
          id:'numbers', title:'מִסְפָּרִים', icon:'🔢', color:'#2FBF71',
          levels: [
            { id:'n1', title:'מִסְפָּרִים 1-10', icon:'🔢', items: numbersRange(1,10), type:'numbers' },
            { id:'n2', title:'מִסְפָּרִים 11-20', icon:'🔢', items: numbersRange(11,20), type:'numbers' }
          ]
        },
        {
          id:'nikud', title:'נִקּוּד (מִתְקַדֵּם)', icon:'✨', color:'#B15BFF', advanced:true,
          levels: [
            { id:'k1', title:'תְּנוּעוֹת הַנִּקּוּד', icon:'✨', items: NIKUD_ITEMS, type:'nikud' }
          ]
        }
      ]
    },
    {
      id:'grade2', title:'כִּתָּה ב׳', icon:'🎒', color:'#2E8B8B',
      modules: [
        {
          id:'math', title:'חֶשְׁבּוֹן', icon:'➕', color:'#E0574A',
          levels: [
            { id:'m1', title:'חִבּוּר עַד 10', icon:'➕', type:'math', kind:'add', gen: mathGenerator('add',10) },
            { id:'m2', title:'חִבּוּר עַד 20', icon:'➕', type:'math', kind:'add', gen: mathGenerator('add',20) },
            { id:'m3', title:'חִבּוּר עַד 100', icon:'➕', type:'math', kind:'add', gen: mathGenerator('add',100) },
            { id:'m4', title:'חִסּוּר עַד 10', icon:'➖', type:'math', kind:'sub', gen: mathGenerator('sub',10) },
            { id:'m5', title:'חִסּוּר עַד 20', icon:'➖', type:'math', kind:'sub', gen: mathGenerator('sub',20) },
            { id:'m6', title:'חִסּוּר עַד 100', icon:'➖', type:'math', kind:'sub', gen: mathGenerator('sub',100) },
            { id:'m7', title:'לוּחַ הַכֶּפֶל 2-5', icon:'✖️', type:'math', kind:'mul', gen: mathGenerator('mul',5) },
            { id:'m8', title:'לוּחַ הַכֶּפֶל 6-10', icon:'✖️', type:'math', kind:'mul', gen: mathGenerator('mul',10) },
            { id:'m9', title:'חִלּוּק פָּשׁוּט', icon:'➗', type:'math', kind:'div', gen: mathGenerator('div',10) },
            { id:'m10', title:'בְּעָיוֹת מִלּוּלִיּוֹת', icon:'📖', type:'mathword', kind:'word', gen: mathGenerator('word',0) }
          ]
        },
        {
          id:'english', title:'אַנְגְּלִית', icon:'🇬🇧', color:'#4A6FE0',
          levels: [
            { id:'e1', title:'Alphabet A-M', icon:'🔤', items: ALPHABET.slice(0,13), type:'eng' },
            { id:'e2', title:'Alphabet N-Z', icon:'🔤', items: ALPHABET.slice(13), type:'eng' },
            { id:'e3', title:'Colors', icon:'🎨', items: COLORS, type:'engword' },
            { id:'e4', title:'Animals', icon:'🐾', items: ANIMALS, type:'engword' },
            { id:'e5', title:'Family', icon:'👪', items: FAMILY, type:'engword' },
            { id:'e6', title:'Numbers 1-20', icon:'🔢', items: ENG_NUMBERS.slice(1), type:'engnum' },
            { id:'e7', title:'Simple Sentences', icon:'📖', items: SENTENCES, type:'engsent' }
          ]
        }
      ]
    }
  ]
};

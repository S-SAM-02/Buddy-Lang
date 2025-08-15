/* Language Buddy JS — Single-Page App with Flashcards, Quiz, and Voice Assistant */
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];

const state = {
  dataset: {},
  lang: 'hindi',
  words: [],         // current language word list
  cardIndex: 0,
  quizSet: [],
  quizIndex: 0,
  score: 0,
  voices: [],
  recog: null,
  listening: false
};

const SUPPORTED_LANGS = [
  { key:'hindi',   name:'Hindi',   locale: 'hi-IN' },
  { key:'kannada', name:'Kannada', locale: 'kn-IN' },
  { key:'telugu',  name:'Telugu',  locale: 'te-IN' },
  { key:'tamil',   name:'Tamil',   locale: 'ta-IN' },
];

// ---------- Utilities ----------
function rnd(n){ return Math.floor(Math.random()*n); }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=rnd(i+1); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
function speak(text, locale='en-IN'){
  if(!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  let voice = state.voices.find(v=>v.lang===locale) || state.voices.find(v=>v.lang.startsWith(locale.split('-')[0]));
  if(voice) u.voice = voice;
  u.lang = voice?.lang || locale;
  u.rate = 0.95; u.pitch = 1.02;
  window.speechSynthesis.cancel(); // interrupt
  window.speechSynthesis.speak(u);
}
function assistantSay(text){
  $('#assistantText').textContent = text;
  $('#assistantBubble').style.display = 'block';
  const locale = SUPPORTED_LANGS.find(l=>l.key===state.lang)?.locale || 'en-IN';
  speak(text, 'en-IN'); // assistant always English
}
function setProgress(el, percent){ el.style.width = `${Math.max(0,Math.min(100,percent))}%`; }
function showView(id){
  $$('.view').forEach(v=>v.classList.remove('active'));
  $(`#view-${id}`).classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}

// ---------- Dataset loading ----------
async function loadData(){
  const res = await fetch('./data/words.json');
  const data = await res.json();
  state.dataset = data;
  // populate selects
  const opts = SUPPORTED_LANGS.map(l=>`<option value="${l.key}">${l.name}</option>`).join('');
  $('#languageSelect').innerHTML = opts;
  $('#quizLanguageSelect').innerHTML = opts;
  setLanguage('hindi');
}

function setLanguage(langKey){
  state.lang = langKey;
  $('#languageSelect').value = langKey;
  $('#quizLanguageSelect').value = langKey;
  $('#learnLanguageName').textContent = SUPPORTED_LANGS.find(l=>l.key===langKey).name;
  $('#quizLanguageName').textContent = SUPPORTED_LANGS.find(l=>l.key===langKey).name;
  state.words = (state.dataset[langKey] || []).slice();
  state.cardIndex = 0;
  renderCard();
  startQuiz(true);
}

// ---------- Flashcards ----------
function renderCard(){
  const total = state.words.length;
  if(total===0) return;
  const i = state.cardIndex % total;
  const w = state.words[i];
  $('#cardScript').textContent = w.script;
  $('#cardPron').textContent = w.pron;
  $('#cardMeaning').textContent = w.meaning;
  $('.flashcard').classList.remove('flipped');
  setProgress($('#learnProgress'), (i/total)*100);
}
function nextCard(){
  state.cardIndex = (state.cardIndex+1) % state.words.length;
  renderCard();
}
function flipCard(){
  $('.flashcard').classList.toggle('flipped');
}
function listenWord(){
  const i = state.cardIndex % state.words.length;
  const w = state.words[i];
  const locale = SUPPORTED_LANGS.find(l=>l.key===state.lang)?.locale || 'en-IN';
  // Try to speak script; fallback to pron if TTS cannot handle script
  const text = w.script + '. ' + (w.pron || '');
  speak(text, locale);
}

// ---------- Quiz ----------
function startQuiz(reset=false){
  const words = state.words.slice();
  if(words.length<4){ assistantSay('Add more words to take a quiz.'); return; }
  const set = shuffle(words).slice(0, Math.min(10, words.length));
  state.quizSet = set;
  state.quizIndex = 0;
  if(reset) state.score = 0;
  $('#score').textContent = state.score;
  $('#qTotal').textContent = set.length;
  $('#qTotal2').textContent = set.length;
  $('#quizResult').classList.add('hidden');
  $('#nextQBtn').disabled = true;
  renderQuestion();
}
function renderQuestion(){
  const q = state.quizSet[state.quizIndex];
  if(!q){ // finished
    const total = state.quizSet.length;
    const msg = `Great job! You scored ${state.score} out of ${total}.`;
    $('#quizResult').textContent = msg;
    $('#quizResult').classList.remove('hidden');
    assistantSay(msg + ' Say "restart" to try again, or "start learning".');
    setProgress($('#quizProgress'), 100);
    return;
  }
  $('#qIndex').textContent = state.quizIndex+1;
  $('#quizWord').textContent = q.script;
  $('#quizPron').textContent = q.pron || '';
  // build answers
  const options = [q.meaning];
  const pool = state.words.filter(w=>w.meaning!==q.meaning);
  shuffle(pool);
  for(let i=0;i<3 && i<pool.length;i++) options.push(pool[i].meaning);
  shuffle(options);
  $$('.answer').forEach((btn,i)=>{
    btn.textContent = options[i] || '';
    btn.classList.remove('correct','wrong');
    btn.disabled = false;
  });
  $('#nextQBtn').disabled = true;
  $('#quizResult').classList.add('hidden');
  setProgress($('#quizProgress'), (state.quizIndex/state.quizSet.length)*100);
  // auto speak
  const locale = SUPPORTED_LANGS.find(l=>l.key===state.lang)?.locale || 'en-IN';
  speak(q.script + '. ' + (q.pron||''), locale);
}
function chooseAnswer(btn){
  const q = state.quizSet[state.quizIndex];
  if(!q) return;
  const chosen = btn.textContent.trim();
  const correct = (chosen === q.meaning);
  btn.classList.add(correct ? 'correct' : 'wrong');
  $$('.answer').forEach(b=>b.disabled=true);
  if(correct){
    state.score++; $('#score').textContent = state.score;
    assistantSay('Nice! That is correct.');
  }else{
    assistantSay(`Oops! The correct answer is ${q.meaning}.`);
    // highlight the correct one
    const c = $$('.answer').find(b=>b.textContent.trim()===q.meaning);
    if(c) c.classList.add('correct');
  }
  $('#nextQBtn').disabled = false;
}
function nextQuestion(){
  if(state.quizIndex < state.quizSet.length-1){
    state.quizIndex++;
    renderQuestion();
  }else{
    state.quizIndex++;
    renderQuestion(); // triggers finished branch
  }
}

// ---------- Voice Assistant ----------
function initVoices(){
  function loadVoices(){
    state.voices = window.speechSynthesis.getVoices();
  }
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function initRecognition(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ assistantSay('Your browser does not support speech recognition. You can still click the mic to hear me speak.'); return; }
  const recog = new SR();
  recog.lang = 'en-IN';
  recog.interimResults = false;
  recog.continuous = false;
  recog.onstart = () => { state.listening = true; $('#micBtn').classList.add('listening'); };
  recog.onend = () => { state.listening = false; $('#micBtn').classList.remove('listening'); };
  recog.onerror = () => { state.listening = false; $('#micBtn').classList.remove('listening'); };
  recog.onresult = (e)=>{
    const text = [...e.results].map(r=>r[0].transcript).join(' ').toLowerCase().trim();
    handleCommand(text);
  };
  state.recog = recog;
}

function toggleListening(){
  if(!state.recog){ assistantSay('Listening is not available in this browser.'); return; }
  if(state.listening){ state.recog.stop(); }
  else { state.recog.start(); assistantSay('Listening… Try “start quiz”, “next”, “flip”, or “select Hindi”.'); }
}

function handleCommand(text){
  console.log('command:', text);
  if(/start (quiz|test)/.test(text)){ showView('quiz'); startQuiz(true); assistantSay('Starting the quiz. Good luck!'); return; }
  if(/start (learn|learning|flash)/.test(text)){ showView('learn'); assistantSay('Starting flashcards.'); return; }
  if(/home/.test(text)){ showView('home'); assistantSay('Back to home.'); return; }
  if(/next/.test(text)){
    if($('#view-learn').classList.contains('active')){ nextCard(); assistantSay('Next card.'); }
    else if($('#view-quiz').classList.contains('active')){ nextQuestion(); }
    return;
  }
  if(/flip/.test(text)){ if($('#view-learn').classList.contains('active')){ flipCard(); assistantSay('Flipped.'); } return; }
  if(/repeat|say again|listen/.test(text)){
    if($('#view-learn').classList.contains('active')) listenWord();
    else if($('#view-quiz').classList.contains('active')){
      const q = state.quizSet[state.quizIndex];
      if(q){ const locale = SUPPORTED_LANGS.find(l=>l.key===state.lang)?.locale || 'en-IN'; speak(q.script + '. ' + (q.pron||''), locale); }
    }
    return;
  }
  for(const l of SUPPORTED_LANGS){
    if(text.includes(l.name.toLowerCase())){ setLanguage(l.key); assistantSay(`Language set to ${l.name}.`); return; }
  }
  if(/restart/.test(text)){ startQuiz(true); assistantSay('Quiz restarted.'); return; }
  assistantSay("I didn't catch that. Try: start quiz, start learning, next, flip, or select Hindi.");
}

// ---------- Hook up UI ----------
document.addEventListener('DOMContentLoaded', async () => {
  $('#year').textContent = new Date().getFullYear();
  $('#homeBtn').onclick = () => showView('home');
  $('#startAdventure').onclick = () => showView('learn');
  $('#toQuiz').onclick = () => { showView('quiz'); startQuiz(true); };
  $('#toLearn').onclick = () => showView('learn');
  $('#flipBtn').onclick = flipCard;
  $('#nextCardBtn').onclick = nextCard;
  $('#listenBtn').onclick = listenWord;
  $('#nextQBtn').onclick = nextQuestion;
  $('#restartQuiz').onclick = ()=> startQuiz(true);
  $$('.answer').forEach(btn => btn.onclick = ()=>chooseAnswer(btn));
  $('#languageSelect').onchange = (e)=> setLanguage(e.target.value);
  $('#quizLanguageSelect').onchange = (e)=> setLanguage(e.target.value);
  $('#micBtn').onclick = toggleListening;
  $('#assistantClose').onclick = ()=> $('#assistantBubble').style.display = 'none';

  initVoices();
  initRecognition();
  await loadData();
});

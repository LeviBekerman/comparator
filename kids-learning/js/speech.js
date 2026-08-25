/* עטיפה להקראה קולית מקומית (Web Speech API) - פועלת ללא אינטרנט כאשר במכשיר מותקן קול מקומי */
var SPEECH = (function(){
  var supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  var voices = [];
  var preferred = { he: null, en: null }; // voiceURI chosen by the user, if any
  var plainMode = false; // when true, strip niqqud before speaking (some voices read plain Hebrew more naturally)

  function loadVoices(){
    if(!supported) return;
    voices = window.speechSynthesis.getVoices() || [];
  }
  if(supported){
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function voicesFor(lang){
    return voices.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(lang) === 0; });
  }

  function pickVoice(lang){
    var list = voicesFor(lang);
    if(preferred[lang]){
      var chosen = list.find(function(v){ return v.voiceURI === preferred[lang]; });
      if(chosen) return chosen;
    }
    return list[0] || null;
  }

  function setPreferred(lang, voiceURI){ preferred[lang] = voiceURI || null; }
  function setPlainMode(v){ plainMode = !!v; }
  function stripNiqqud(text){ return text.replace(/[֑-ׇ]/g, ''); }

  function estimateDuration(text){
    if(!text) return 1200;
    var ms = stripNiqqud(text).length * 130 + 500;
    return Math.max(1400, Math.min(ms, 8000));
  }

  function speak(text, lang, onEnd){
    var langKey = lang === 'en' ? 'en' : 'he';
    if(!supported || !text){
      if(onEnd) setTimeout(onEnd, estimateDuration(text));
      return false;
    }
    try{
      window.speechSynthesis.cancel();
      var spoken = (langKey==='he' && plainMode) ? stripNiqqud(text) : text;
      var utter = new SpeechSynthesisUtterance(spoken);
      utter.lang = langKey === 'en' ? 'en-US' : 'he-IL';
      utter.rate = langKey === 'en' ? 0.88 : 0.8;
      utter.pitch = 1.0;
      var v = pickVoice(langKey);
      if(v) utter.voice = v;
      var done = false;
      var finish = function(){ if(done) return; done = true; if(onEnd) onEnd(); };
      utter.onend = finish;
      utter.onerror = finish;
      window.speechSynthesis.speak(utter);
      if(onEnd) setTimeout(finish, estimateDuration(text) + 3500);
      return true;
    } catch(e){
      if(onEnd) setTimeout(onEnd, estimateDuration(text));
      return false;
    }
  }

  function stop(){ if(supported) window.speechSynthesis.cancel(); }

  return {
    speak: speak, stop: stop,
    isSupported: function(){ return supported; },
    voicesFor: voicesFor,
    setPreferred: setPreferred,
    setPlainMode: setPlainMode,
    estimateDuration: estimateDuration
  };
})();

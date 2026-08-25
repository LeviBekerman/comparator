/* עטיפה להקראה קולית מקומית (Web Speech API) - פועלת ללא אינטרנט כאשר במכשיר מותקן קול מקומי */
var SPEECH = (function(){
  var supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  var voices = [];

  function loadVoices(){
    if(!supported) return;
    voices = window.speechSynthesis.getVoices() || [];
  }
  if(supported){
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickVoice(lang){
    var pref = voices.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(lang) === 0; });
    return pref[0] || null;
  }

  function speak(text, lang){
    if(!supported || !text) return false;
    try{
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === 'en' ? 'en-US' : 'he-IL';
      utter.rate = 0.85;
      utter.pitch = 1.05;
      var v = pickVoice(lang === 'en' ? 'en' : 'he');
      if(v) utter.voice = v;
      window.speechSynthesis.speak(utter);
      return true;
    } catch(e){ return false; }
  }

  function stop(){ if(supported) window.speechSynthesis.cancel(); }

  return { speak: speak, stop: stop, isSupported: function(){ return supported; } };
})();

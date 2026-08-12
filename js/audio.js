/* Matrix Mastery — sound, voice & pacing (window.MMX)
 *
 * Everything is synthesized in the browser so the course stays zero-build,
 * offline-friendly and works from file://:
 *   - Sound effects: Web Audio API oscillators — no audio files to ship.
 *   - Voice: Web Speech API speechSynthesis, picking the best available
 *     English voice, slightly slowed and warmed for narration.
 *   - Pacing: a speed preference (0.75× / 1× / 1.5× / 2×) that scales both
 *     the engine's JS animation delays (MMX.ms) and CSS animation durations
 *     (the --anim-mult custom property). Reduced-motion users get near-instant
 *     motion automatically.
 *
 * Prefs persist under localStorage key "matrixmastery.prefs".
 * The engine calls: MMX.sfx(name), MMX.speak(text), MMX.ms(base),
 * MMX.soundOn()/setSound()/toggleSound(), MMX.voiceOn()/setVoice()/toggleVoice(),
 * MMX.speed()/setSpeed()/cycleSpeed()/speedLabel().
 */
(function () {
  "use strict";

  var LS_KEY = "matrixmastery.prefs";
  var SPEEDS = [0.75, 1, 1.5, 2];

  var prefs = loadPrefs();
  var ctx = null, master = null;
  var voices = [];
  var pending = null;             /* utterance waiting for voices to load */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadPrefs() {
    var p = { sound: true, voice: true, speed: 1, engine: "auto" };
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var j = JSON.parse(raw);
        if (typeof j.sound === "boolean") p.sound = j.sound;
        if (typeof j.voice === "boolean") p.voice = j.voice;
        if (SPEEDS.indexOf(j.speed) !== -1) p.speed = j.speed;
        if (["auto", "neural", "browser"].indexOf(j.engine) !== -1) p.engine = j.engine;
        if (typeof j.voiceName === "string") p.voiceName = j.voiceName;
      }
    } catch (e) { /* private mode / blocked storage — keep defaults */ }
    return p;
  }

  function savePrefs() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  /* ---------- audio context (lazy + gesture-gated) ---------- */

  function ensureCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* Browsers only let audio start after a real user gesture. Create the
     context on the first pointer/key, resume it on later ones. */
  function gesture() { ensureCtx(); }
  document.addEventListener("pointerdown", gesture, { once: true });
  document.addEventListener("keydown", gesture, { once: true });

  /* ---------- tiny synth ---------- */

  function tone(opts) {
    if (!ctx || !master) return;
    var t0 = ctx.currentTime + (opts.delay || 0);
    var dur = opts.dur || 0.1;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = opts.type || "sine";
    o.frequency.setValueAtTime(opts.freq, t0);
    if (opts.end) o.frequency.exponentialRampToValueAtTime(opts.end, t0 + dur);
    var v = opts.vol == null ? 0.12 : opts.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  var SOUNDS = {
    click:   function () { tone({ freq: 340, end: 250, dur: 0.06, type: "triangle", vol: 0.08 }); },
    step:    function () {
      tone({ freq: 523, end: 700, dur: 0.09, type: "sine", vol: 0.1 });
      tone({ freq: 1046, end: 1400, dur: 0.07, type: "sine", vol: 0.04, delay: 0.02 });
    },
    prev:    function () { tone({ freq: 420, end: 320, dur: 0.09, type: "sine", vol: 0.1 }); },
    pointer: function () { tone({ freq: 620, end: 680, dur: 0.035, type: "triangle", vol: 0.045 }); },
    read:    function () { tone({ freq: 760, end: 920, dur: 0.05, type: "triangle", vol: 0.055 }); },
    write:   function () {
      tone({ freq: 392, end: 784, dur: 0.14, type: "sine", vol: 0.13 });
      tone({ freq: 1175, end: 1568, dur: 0.09, type: "sine", vol: 0.04, delay: 0.05 });
    },
    pop:     function () { tone({ freq: 880, end: 1320, dur: 0.07, type: "sine", vol: 0.08 }); },
    tag:     function () { tone({ freq: 587, end: 740, dur: 0.08, type: "triangle", vol: 0.06 }); },
    finish:  function () {
      [523.25, 659.25, 783.99].forEach(function (f, i) {
        tone({ freq: f, dur: 0.16, type: "triangle", vol: 0.11, delay: i * 0.09 });
        tone({ freq: f * 2, dur: 0.1, type: "sine", vol: 0.035, delay: i * 0.09 + 0.01 });
      });
    },
    complete: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone({ freq: f, dur: 0.22, type: "triangle", vol: 0.12, delay: i * 0.11 });
        tone({ freq: f * 1.5, dur: 0.12, type: "sine", vol: 0.03, delay: i * 0.11 });
      });
    }
  };

  function sfx(name) {
    if (!prefs.sound) return;
    ensureCtx();
    if (!ctx || !SOUNDS[name]) return;
    SOUNDS[name]();
  }

  /* ---------- voice ---------- */

  function loadVoices() {
    if (!window.speechSynthesis) return;
    voices = window.speechSynthesis.getVoices();
    /* voices load asynchronously in Chrome — speak the queued step now */
    if (pending && voices.length) {
      var p = pending;
      pending = null;
      finishSpeak(p);
    }
  }

  if (window.speechSynthesis) {
    loadVoices();
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /* Naturalness matters: rank real voices first, then old Windows SAPI ones,
   * and only fall back to the notoriously robotic David/Zira/Mark as a last
   * resort. `prefs.voiceName` (set by a future settings UI) wins outright. */
  var PREFERRED = [
    /* Google — very natural, local on Chrome/Android */
    "google us english", "google uk english female", "google uk english male",
    "google australia english", "google india english", "google uk english",
    /* Microsoft neural — natural, Edge */
    "aria", "jenny", "guy", "ana", "emma", "brian", "natasha", "william",
    "michelle", "sonia", "libby", "ryan", "ava", "christopher",
    /* Apple */
    "samantha", "serena", "karen", "moira", "tessa", "fiona", "alex",
    "daniel", "kate", "oliver", "zoe",
    /* Old Windows SAPI — softer/more human than the ones we avoid */
    "hazel", "susan", "george", "heera", "catherine"
  ];
  var AVOID = ["david", "zira", "mark", "paul", "eddy"];

  function voiceMatches(name, want) {
    return name && name.toLowerCase().indexOf(want) !== -1;
  }

  function pickVoice() {
    if (!voices.length) return null;
    var i, j, v;
    if (prefs.voiceName) {
      for (i = 0; i < voices.length; i++) {
        if (voiceMatches(voices[i].name, String(prefs.voiceName).toLowerCase())) return voices[i];
      }
    }
    for (i = 0; i < PREFERRED.length; i++) {
      for (j = 0; j < voices.length; j++) {
        v = voices[j];
        if (v.lang && v.lang.toLowerCase().indexOf("en") === 0 &&
            voiceMatches(v.name, PREFERRED[i])) {
          return v;
        }
      }
    }
    for (j = 0; j < voices.length; j++) {
      v = voices[j];
      if (v.lang && v.lang.toLowerCase().indexOf("en") === 0 && !AVOID.some(voiceMatches.bind(null, v.name))) {
        return v;
      }
    }
    for (j = 0; j < voices.length; j++) {
      if (voices[j].lang && voices[j].lang.toLowerCase().indexOf("en") === 0) return voices[j];
    }
    return voices[0] || null;
  }

  function stripHtml(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }

  /* Give the speech engine pauses and a falling final intonation instead of
   * a flat robot read: turn dashes into commas, spell out “×”, end on a period. */
  function tidyForSpeech(s) {
    s = s.replace(/—/g, ", ").replace(/\u00b7/g, ", ").replace(/\u2192/g, ", ");
    s = s.replace(/\s?×\s?/g, " times ");
    s = s.replace(/\s+/g, " ").trim();
    if (s && !/[.!?…"]$/.test(s)) s += ".";
    return s;
  }

  function finishSpeak(u) {
    var v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.9;    /* calmer than default; the biggest anti-robot lever */
    u.pitch = 1.05;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  }

  /* ---------- browser voice (speechSynthesis) ---------- */

  function speakBrowser(clean) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(clean);
    if (voices.length) {
      finishSpeak(u);
    } else {
      /* Chrome populates getVoices() asynchronously — wait a moment so we
       * never narrate with the platform's default (usually the most robotic). */
      pending = u;
      setTimeout(function () {
        if (pending) { var p = pending; pending = null; finishSpeak(p); }
      }, 450);
    }
  }

  /* ---------- neural voice (optional local edge-tts proxy) ----------
   * The course stays fully static: if no proxy is running (or it fails),
   * narration falls back to the browser voice. Set window.__NEURAL_URL
   * before audio.js loads to point at a hosted instance. */

  var neuralCtrl = null;
  var neuralAudio = null;
  var neuralUrl = (window.__NEURAL_URL || "http://127.0.0.1:8866") + "/v1/audio/speech";

  /* Curated voice list — edge-tts neural ids (used by tts-server.py).
   * Each entry: { id, name, gender, locale, browser }.
   * browser: best-matching Web Speech voice substring (for fallback). */
  var VOICES = [
    { id: "en-US-AriaNeural",       name: "Aria",       gender: "F", locale: "US", browser: "aria" },
    { id: "en-US-JennyNeural",       name: "Jenny",       gender: "F", locale: "US", browser: "jenny" },
    { id: "en-US-GuyNeural",         name: "Guy",         gender: "M", locale: "US", browser: "guy" },
    { id: "en-US-BrianNeural",       name: "Brian",       gender: "M", locale: "US", browser: "brian" },
    { id: "en-US-EmmaNeural",        name: "Emma",        gender: "F", locale: "US", browser: "emma" },
    { id: "en-US-AndrewNeural",      name: "Andrew",      gender: "M", locale: "US", browser: "andrew" },
    { id: "en-US-MichelleNeural",    name: "Michelle",    gender: "F", locale: "US", browser: "michelle" },
    { id: "en-US-RogerNeural",       name: "Roger",       gender: "M", locale: "US", browser: "roger" },
    { id: "en-US-AvaNeural",         name: "Ava",         gender: "F", locale: "US", browser: "ava" },
    { id: "en-US-ChristopherNeural", name: "Christopher", gender: "M", locale: "US", browser: "christopher" },
    { id: "en-GB-SoniaNeural",       name: "Sonia",       gender: "F", locale: "GB", browser: "sonia" },
    { id: "en-GB-LibbyNeural",       name: "Libby",       gender: "F", locale: "GB", browser: "libby" },
    { id: "en-GB-RyanNeural",        name: "Ryan",        gender: "M", locale: "GB", browser: "ryan" },
    { id: "en-GB-ThomasNeural",      name: "Thomas",      gender: "M", locale: "GB", browser: "thomas" },
    { id: "en-AU-NatashaNeural",     name: "Natasha",     gender: "F", locale: "AU", browser: "natasha" },
    { id: "en-IN-NeerjaNeural",      name: "Neerja",      gender: "F", locale: "IN", browser: "neerja" },
    { id: "en-IN-PrabhatNeural",     name: "Prabhat",     gender: "M", locale: "IN", browser: "prabhat" }
  ];
  var DEFAULT_VOICE_ID = "en-US-AriaNeural";

  function neuralVoiceName() {
    var n = prefs.voiceName ? String(prefs.voiceName) : "";
    /* If it looks like a full edge-tts id (e.g. "en-US-AriaNeural"), use it directly */
    if (n && n.indexOf("-") !== -1 && n.indexOf("Neural") !== -1) return n;
    /* Otherwise search curated list by substring match */
    var low = n.toLowerCase();
    for (var i = 0; i < VOICES.length; i++) {
      if (low && (VOICES[i].id.toLowerCase().indexOf(low) !== -1 ||
                  VOICES[i].name.toLowerCase().indexOf(low) !== -1)) {
        return VOICES[i].id;
      }
    }
    return DEFAULT_VOICE_ID;
  }

  function speakNeural(clean, strict) {
    if (neuralCtrl) neuralCtrl.abort();
    var ctrl = new AbortController();
    neuralCtrl = ctrl;
    var timer = setTimeout(function () { ctrl.abort(); }, 5000);
    fetch(neuralUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice: neuralVoiceName(), input: clean }),
      signal: ctrl.signal
    }).then(function (res) {
      if (!res.ok) throw new Error("neural TTS HTTP " + res.status);
      return res.blob();
    }).then(function (blob) {
      clearTimeout(timer);
      if (neuralCtrl !== ctrl) return;
      neuralCtrl = null;
      playNeural(blob);
    }).catch(function () {
      clearTimeout(timer);
      if (neuralCtrl !== ctrl) return;
      neuralCtrl = null;
      /* strict = "neural" engine: user opted out of browser voices, stay silent */
      if (!strict) speakBrowser(clean);
    });
  }

  function playNeural(blob) {
    if (!neuralAudio) {
      neuralAudio = new Audio();
      neuralAudio.preload = "auto";
      neuralAudio.style.display = "none";
      document.body.appendChild(neuralAudio);
    }
    if (neuralAudio._url) URL.revokeObjectURL(neuralAudio._url);
    var url = URL.createObjectURL(blob);
    neuralAudio._url = url;
    neuralAudio.src = url;
    var p = neuralAudio.play();
    if (p && p.catch) p.catch(function () { /* no gesture yet — next step retries */ });
  }

  function stopSpeech() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (neuralCtrl) { neuralCtrl.abort(); neuralCtrl = null; }
    if (neuralAudio) { neuralAudio.pause(); neuralAudio.src = ""; }
  }

  function speak(text) {
    if (!prefs.voice || !text) return;
    var clean = tidyForSpeech(stripHtml(text));
    if (!clean) return;
    if (prefs.engine !== "browser" && window.fetch) {
      speakNeural(clean, prefs.engine === "neural");
    } else {
      speakBrowser(clean);
    }
  }

  /* ---------- pacing ---------- */

  function timeScale() { return 1 / prefs.speed; }

  function ms(base) { return Math.round(base * timeScale() * (reduceMotion ? 0.4 : 1)); }

  function applyCss() {
    var mult = timeScale() * (reduceMotion ? 0.4 : 1);
    document.documentElement.style.setProperty("--anim-mult", String(mult));
  }

  function setSpeed(s) {
    if (SPEEDS.indexOf(s) === -1) return;
    prefs.speed = s;
    savePrefs();
    applyCss();
  }

  function cycleSpeed(dir) {
    var i = SPEEDS.indexOf(prefs.speed);
    if (i === -1) i = 1;
    i = (i + dir + SPEEDS.length) % SPEEDS.length;
    setSpeed(SPEEDS[i]);
  }

  /* ---------- toggles ---------- */

  function setVoiceName(name) {
    prefs.voiceName = name || null;
    savePrefs();
  }

  function currentVoice() {
    /* If a neural voice is selected, show its curated name */
    if (prefs.voiceName) {
      var n = String(prefs.voiceName);
      for (var i = 0; i < VOICES.length; i++) {
        if (VOICES[i].id === n) return VOICES[i].name + " (" + VOICES[i].locale + ")";
        if (VOICES[i].name.toLowerCase() === n.toLowerCase()) return VOICES[i].name + " (" + VOICES[i].locale + ")";
      }
      /* Raw edge-tts id not in curated list — show as-is */
      if (n.indexOf("-") !== -1) return n;
    }
    var v = pickVoice();
    return v ? v.name : null;
  }

  function setSound(b) { prefs.sound = !!b; savePrefs(); }
  function toggleSound() { setSound(!prefs.sound); }

  function setVoice(b) {
    prefs.voice = !!b;
    savePrefs();
    if (!prefs.voice) stopSpeech();
  }
  function toggleVoice() { setVoice(!prefs.voice); }

  /* Engine: "auto" (neural when the proxy is up, else browser),
   * "neural" (proxy only), "browser" (Web Speech only). */
  function setEngine(e) {
    if (["auto", "neural", "browser"].indexOf(e) === -1) return;
    prefs.engine = e;
    savePrefs();
    stopSpeech();
  }
  function cycleEngine() {
    var order = ["auto", "neural", "browser"];
    var i = order.indexOf(prefs.engine);
    if (i === -1) i = 0;
    setEngine(order[(i + 1) % order.length]);
  }

  /* ---------- public API ---------- */

  window.MMX = {
    sfx: sfx,
    speak: speak,
    stop: stopSpeech,
    stripHtml: stripHtml,
    ms: ms,
    timeScale: timeScale,
    speed: function () { return prefs.speed; },
    setSpeed: setSpeed,
    cycleSpeed: cycleSpeed,
    speedLabel: function () { return String(prefs.speed) + "×"; },
    soundOn: function () { return prefs.sound; },
    setSound: setSound,
    toggleSound: toggleSound,
    voiceOn: function () { return prefs.voice; },
    setVoice: setVoice,
    toggleVoice: toggleVoice,
    currentVoice: currentVoice,
    setVoiceName: setVoiceName,
    listVoices: function () { return VOICES; },
    defaultVoiceId: function () { return DEFAULT_VOICE_ID; },
    engine: function () { return prefs.engine; },
    setEngine: setEngine,
    cycleEngine: cycleEngine,
    neuralUrl: function () { return neuralUrl; },
    reduceMotion: function () { return reduceMotion; }
  };

  applyCss();
})();

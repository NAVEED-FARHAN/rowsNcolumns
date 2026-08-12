/* LessonEngine — renders a lesson definition into #app.
 *
 * Lesson schema (see js/lessons/m0-p1.js for a fully commented example):
 *   id, module, page, title            — metadata
 *   panels: [{ id, label, style, rows, cols, initial }]  — one or more grids (optional)
 *   code: [line, ...]                  — Python program shown alongside the grid (optional)
 *   steps: [{ text, codeLine, panel, pointer, reads, writes, setGrid, tag, html }]
 *   recap: [item, ...]                 — final checklist (optional)
 *   interview: "..."                   — "why this matters" note (optional)
 *
 * Rules the engine enforces (from the module's global page rules):
 *   - one "Next" click reveals exactly one new causal step
 *   - reading a cell highlights it, writing animates the value changing,
 *     a pointer path animates across the grid — no decorative motion
 *   - the currently "executing" code line is highlighted in sync
 *   - Prev/Next nav at the bottom; the last step reveals the interview
 *     note + recap and offers "Mark complete & continue"
 *
 * Every lesson registers itself: window.LESSONS[id] = { ... }
 * The engine is topic-agnostic: if a lesson has no `panels` and no
 * `code`, it renders as a pure step-by-step explainer.
 */
(function () {
  "use strict";

  var delay = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* Pacing: every animation delay is scaled by the user's speed pref
   * (js/audio.js), and sounds/narration are one-liners so the engine stays
   * silent and untouched if audio.js isn't loaded. */
  function T(ms) { return window.MMX ? MMX.ms(ms) : ms; }
  function sfx(n) { if (window.MMX) MMX.sfx(n); }

  var lesson = null, state = null, panels = [], codeLines = [], ui = null, meta = null;

  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function panelDef(i) { return lesson.panels[i]; }

  function getPanel(id) {
    for (var i = 0; i < panels.length; i++) if (panels[i].id === id) return panels[i];
    return panels[0];
  }

  function defaultPanel() { return lesson.panels[0].id; }

  /* ---------- grids ---------- */

  function gridDims(pdef) {
    /* rows/cols may exceed the initial array's extent (partial grids,
       padded tables, or setGrid expansions) — take the max of both. */
    var rows = pdef.rows || 0;
    var cols = pdef.cols || 0;
    if (pdef.initial && pdef.initial.length) {
      rows = Math.max(rows, pdef.initial.length);
      pdef.initial.forEach(function (r) { cols = Math.max(cols, r.length); });
    }
    return { rows: rows, cols: cols };
  }

  function buildGrid(panelWrap, pdef) {
    var dims = gridDims(pdef);
    var grid = h("div", "grid");
    panelWrap.appendChild(grid);
    if (dims.rows === 0) {
      grid.style.gridTemplateColumns = "1fr";
      grid.style.gridTemplateRows = "1fr";
      grid.appendChild(h("div", "grid-empty mono", "empty matrix — no rows"));
      return { grid: grid, cells: [], rows: 0, cols: 0 };
    }
    grid.style.gridTemplateColumns = "40px repeat(" + dims.cols + ", var(--cell))";
    grid.style.gridTemplateRows = "30px repeat(" + dims.rows + ", var(--cell))";
    var cells = [];
    var c;
    for (c = 0; c <= dims.cols; c++) {
      grid.appendChild(h("div", "gheader" + (c === 0 ? " gheader--corner" : ""), c === 0 ? "" : String(c - 1)));
    }
    for (var r = 0; r < dims.rows; r++) {
      grid.appendChild(h("div", "gheader", String(r)));
      var row = [];
      for (c = 0; c < dims.cols; c++) {
        var val = pdef.initial && pdef.initial[r] ? pdef.initial[r][c] : undefined;
        var cell = h("div", "cell" + (val === undefined ? " cell--blank" : ""), val === undefined ? "" : esc(val));
        cell.setAttribute("data-r", r);
        cell.setAttribute("data-c", c);
        cell._val = val;
        if (pdef.valueClasses && val !== undefined && pdef.valueClasses[val]) cell.classList.add(pdef.valueClasses[val]);
        grid.appendChild(cell);
        row.push(cell);
      }
      cells.push(row);
    }
    return { grid: grid, cells: cells, rows: dims.rows, cols: dims.cols, valueClasses: pdef.valueClasses };
  }

  function buildPanel(pdef, strip) {
    var wrap = h("div", "panel" + (pdef.style ? " panel--" + pdef.style : ""));
    if (pdef.label) wrap.appendChild(h("div", "panel-label mono", pdef.label));
    strip.appendChild(wrap);
    var info = buildGrid(wrap, pdef);
    info.id = pdef.id;
    info.wrap = wrap;
    return info;
  }

  function setPanelGrid(panelId, pdef, animate) {
    var p = getPanel(panelId);
    var old = p.grid;
    var info;
    if (animate) {
      old.style.transition = "opacity " + T(150) + "ms";
      old.style.opacity = "0";
      setTimeout(function () { old.remove(); }, T(170));
      info = buildGrid(p.wrap, pdef);
      info.grid.style.opacity = "0";
      var cells = info.grid.querySelectorAll(".cell");
      for (var i = 0; i < cells.length; i++) {
        cells[i].style.animationDelay = (i * T(28)) + "ms";
        cells[i].classList.add("cell--pop");
      }
      setTimeout(function () { info.grid.style.opacity = "1"; }, T(30));
      sfx("pop");
    } else {
      old.remove();
      info = buildGrid(p.wrap, pdef);
    }
    info.id = p.id;
    info.wrap = p.wrap;
    p.pointer = null;
    p.grid = info.grid;
    p.cells = info.cells;
    p.rows = info.rows;
    p.cols = info.cols;
  }

  /* ---------- pointer / reads / writes ---------- */

  function cellRect(panelId, r, c) {
    var p = getPanel(panelId);
    var cell = p.cells[r] && p.cells[r][c];
    if (!cell) return null;
    var g = p.grid.getBoundingClientRect();
    var el = cell.getBoundingClientRect();
    return { left: el.left - g.left, top: el.top - g.top, w: el.width, h: el.height };
  }

  function getPointer(panelId) {
    var p = getPanel(panelId);
    if (!p.pointer) {
      var ptr = h("div", "pointer");
      ptr.appendChild(h("span", "p-badge mono", ""));
      p.grid.appendChild(ptr);
      p.pointer = ptr;
    }
    return p.pointer;
  }

  function placePointer(panelId, r, c) {
    var rect = cellRect(panelId, r, c);
    if (!rect) return;
    var ptr = getPointer(panelId);
    ptr.style.display = "flex";
    ptr.style.left = rect.left + "px";
    ptr.style.top = rect.top + "px";
    ptr.style.width = rect.w + "px";
    ptr.style.height = rect.h + "px";
    ptr.querySelector(".p-badge").textContent = "[" + r + "][" + c + "]";
  }

  async function movePointer(panelId, path) {
    var p = getPanel(panelId);
    for (var i = 0; i < path.length; i++) {
      sfx("pointer");
      placePointer(panelId, path[i][0], path[i][1]);
      await delay(T(175));
      if (i < path.length - 1) {
        var cell = p.cells[path[i][0]] && p.cells[path[i][0]][path[i][1]];
        if (cell && !cell.classList.contains("cell--blank")) cell.classList.add("trail");
      }
    }
  }

  async function playReads(panelId, reads) {
    var p = getPanel(panelId);
    for (var i = 0; i < reads.length; i++) {
      var rc = reads[i];
      var cell = p.cells[rc[0]] && p.cells[rc[0]][rc[1]];
      if (!cell) continue;
      cell.classList.remove("flash");
      void cell.offsetWidth;
      sfx("read");
      cell.classList.add("flash");
      await delay(T(320));
    }
  }

  async function playWrites(panelId, writes) {
    var p = getPanel(panelId);
    for (var i = 0; i < writes.length; i++) {
      var w = writes[i];
      var cell = p.cells[w[0]] && p.cells[w[0]][w[1]];
      if (!cell) continue;
      cell.classList.remove("cell--blank");
      cell.classList.add("cell--writing");
      sfx("write");
      await delay(T(150));
      cell.textContent = esc(w[2]);
      cell._val = w[2];
      if (p.valueClasses) {
        var cls = p.valueClasses;
        Object.keys(cls).forEach(function (k) { cell.classList.remove(cls[k]); });
        if (cls[w[2]]) cell.classList.add(cls[w[2]]);
      }
      cell.classList.remove("cell--writing");
      void cell.offsetWidth;
      cell.classList.add("cell--fresh");
      await delay(T(300));
    }
  }

  function applyTag(panelId, tag) {
    var p = getPanel(panelId);
    tag.cells.forEach(function (rc) {
      var cell = p.cells[rc[0]] && p.cells[rc[0]][rc[1]];
      if (cell) cell.classList.add(tag.cls);
    });
  }

  function applyUntag(panelId, tag) {
    var p = getPanel(panelId);
    tag.cells.forEach(function (rc) {
      var cell = p.cells[rc[0]] && p.cells[rc[0]][rc[1]];
      if (cell) cell.classList.remove(tag.cls);
    });
  }

  function applyTags(panelId, step) {
    /* tags may target a different panel than the pointer/reads/writes do */
    var tagPanelId = step.tagPanel || panelId;
    if (step.tag) applyTag(tagPanelId, step.tag);
    if (step.tags) step.tags.forEach(function (t) { applyTag(tagPanelId, t); });
    if (step.untag) applyUntag(tagPanelId, step.untag);
    if (step.untags) step.untags.forEach(function (t) { applyUntag(tagPanelId, t); });
    if (step.tag || step.tags || step.untag || step.untags) sfx("tag");
  }

  /* ---------- code pane ---------- */

  function renderCode(code) {
    var pre = h("pre", "code mono");
    var c = h("code");
    pre.appendChild(c);
    codeLines = code.map(function (line, i) {
      var ln = h("span", "ln");
      ln.appendChild(h("span", "lnno", String(i + 1)));
      ln.appendChild(document.createTextNode(line === "" ? " " : line));
      c.appendChild(ln);
      return ln;
    });
    return pre;
  }

  function highlightCode(i) {
    codeLines.forEach(function (ln, idx) { ln.classList.toggle("exec", idx === i); });
    if (i >= 0 && codeLines[i]) codeLines[i].scrollIntoView({ block: "nearest" });
  }

  /* ---------- step playback ---------- */

  function renderText(step) {
    return (step.text || "") + (step.html || "");
  }

  async function playStep(i) {
    var s = lesson.steps[i];
    var panelId = s.panel || defaultPanel();
    ui.explain.innerHTML = renderText(s);
    if (s.text && window.MMX) MMX.speak(s.text);
    if (s.codeLine != null && s.codeLine >= 0) highlightCode(s.codeLine);
    else highlightCode(-1);
    if (s.setGrid) setPanelGrid(panelId, s.setGrid, true);
    await delay(T(90));
    applyTags(panelId, s);
    if (s.pointer) await movePointer(panelId, s.pointer);
    if (s.reads) await playReads(panelId, s.reads);
    if (s.writes) await playWrites(panelId, s.writes);
    updateControls();
  }

  /* Jump straight to step i: rebuild every panel from scratch, then
   * re-apply steps 0..i with no animation (used by "Prev step"). */
  function applyCumulative(i) {
    panels.forEach(function (p) {
      var def = panelDef(panels.indexOf(p));
      p.grid.remove();
      var info = buildGrid(p.wrap, def);
      p.pointer = null;
      p.grid = info.grid;
      p.cells = info.cells;
      p.rows = info.rows;
      p.cols = info.cols;
    });
    for (var s = 0; s <= i; s++) {
      var step = lesson.steps[s];
      var panelId = step.panel || defaultPanel();
      var p = getPanel(panelId);
      if (step.setGrid) {
        p.grid.remove();
        var info = buildGrid(p.wrap, step.setGrid);
        p.pointer = null;
        p.grid = info.grid;
        p.cells = info.cells;
        p.rows = info.rows;
        p.cols = info.cols;
      }
      applyTags(panelId, step);
      if (step.writes) step.writes.forEach(function (w) {
        var cell = p.cells[w[0]] && p.cells[w[0]][w[1]];
        if (!cell) return;
        cell.textContent = esc(w[2]);
        cell._val = w[2];
        cell.classList.remove("cell--blank");
        if (p.valueClasses) {
          var cls = p.valueClasses;
          Object.keys(cls).forEach(function (k) { cell.classList.remove(cls[k]); });
          if (cls[w[2]]) cell.classList.add(cls[w[2]]);
        }
      });
      if (step.reads) step.reads.forEach(function (rc) {
        var cell = p.cells[rc[0]] && p.cells[rc[0]][rc[1]];
        if (cell) cell.classList.add("trail");
      });
      if (step.pointer && step.pointer.length) {
        var last = step.pointer[step.pointer.length - 1];
        placePointer(panelId, last[0], last[1]);
      }
      if (step.codeLine != null && step.codeLine >= 0) highlightCode(step.codeLine);
      ui.explain.innerHTML = renderText(step);
    }
  }

  /* ---------- controls & finish ---------- */

  function updateControls() {
    var i = state.step;
    ui.prevBtn.disabled = (i === 0) || state.playing;
    ui.nextBtn.disabled = state.playing;
    ui.stepLabel.textContent = "Step " + (i + 1) + " / " + lesson.steps.length;
    var last = i === lesson.steps.length - 1;
    ui.nextBtn.style.display = last ? "none" : "";
    if (last && !state.playing) {
      ui.finish.hidden = false;
      renderFinish();
    } else {
      ui.finish.hidden = true;
    }
  }

  function renderFinish() {
    ui.finish.innerHTML = "";
    if (lesson.interview) {
      var call = h("div", "callout");
      call.appendChild(h("div", "callout-label display", "Why this matters in interviews"));
      call.appendChild(h("p", null, lesson.interview));
      ui.finish.appendChild(call);
    }
    if (lesson.recap && lesson.recap.length) {
      var box = h("div", "recap card");
      box.appendChild(h("h3", "display", "Module recap"));
      var ul = h("ul", "recap-list");
      lesson.recap.forEach(function (item) {
        ul.appendChild(h("li", null, '<span class="check">✓</span><span>' + item + "</span>"));
      });
      box.appendChild(ul);
      ui.finish.appendChild(box);
    }
    var cont = h("button", "btn primary big", "Mark complete & continue →");
    cont.addEventListener("click", continueNext);
    ui.finish.appendChild(cont);
  }

  function continueNext() {
    if (window.COURSE) COURSE.markComplete(lesson.id);
    var next = COURSE.nextLesson(lesson.module, lesson.page);
    if (next) {
      sfx("finish");
      location.href = "lesson.html?m=" + next.module + "&p=" + next.page;
    } else {
      sfx("complete");
      var b = h("div", "banner display", "🎉 Module " + lesson.module + " complete! You finished “" + COURSE.moduleTitle(lesson.module) + "”.");
      ui.finish.insertBefore(b, ui.finish.firstChild);
      var home = h("a", "btn", "Back to course home");
      home.href = "index.html";
      var btn = ui.finish.querySelector(".btn.primary");
      if (btn) btn.replaceWith(home);
      else ui.finish.appendChild(home);
    }
  }

  /* ---------- shell ---------- */

  function buildHeader() {
    var head = h("header", "topbar");
    var left = h("div", "topbar-left");
    var home = h("a", "brand display", "Matrix Mastery");
    home.href = "index.html";
    left.appendChild(home);
    var prev = COURSE.prevLesson(meta.module, meta.page);
    if (prev) {
      var pLink = h("a", "btn ghost small", "←");
      pLink.href = "lesson.html?m=" + prev.module + "&p=" + prev.page;
      pLink.title = COURSE.lessonTitle("m" + prev.module + "-p" + prev.page);
      pLink.setAttribute("aria-label", "Previous lesson");
      left.appendChild(pLink);
    }
    head.appendChild(left);
    var title = h("div", "topbar-title");
    title.appendChild(h("span", "topbar-module mono",
      COURSE.moduleTitle(meta.module) + " · Page " + meta.page + " of " + COURSE.modulePageCount(meta.module)));
    title.appendChild(h("span", "topbar-lesson display", lesson.title));
    head.appendChild(title);
    var dots = h("nav", "dots");
    COURSE.modules[meta.module].lessons.forEach(function (l, idx) {
      var a = h("a", "dot" + (l.id === lesson.id ? " dot--active" : "") + (COURSE.isComplete(l.id) ? " dot--done" : ""),
        COURSE.isComplete(l.id) ? "✓" : "");
      a.href = "lesson.html?m=" + meta.module + "&p=" + (idx + 1);
      a.title = l.title;
      a.setAttribute("aria-label", l.title);
      dots.appendChild(a);
    });
    head.appendChild(dots);
    return head;
  }

  function nextStep() {
    if (state.playing) return;
    if (state.step < lesson.steps.length - 1) {
      sfx("step");
      state.playing = true;
      updateControls();
      state.step++;
      playStep(state.step).then(function () {
        state.playing = false;
        updateControls();
      });
    }
  }

  function prevStep() {
    if (state.playing || state.step === 0) return;
    state.step--;
    sfx("prev");
    applyCumulative(state.step);
    if (lesson.steps[state.step] && lesson.steps[state.step].text && window.MMX) {
      MMX.speak(lesson.steps[state.step].text);
    }
    updateControls();
  }

  function replayStep() {
    if (state.playing) return;
    state.playing = true;
    updateControls();
    playStep(state.step).then(function () {
      state.playing = false;
      updateControls();
    });
  }

  /* ---------- shortcuts / help / toolbar ---------- */

  var helpEl = null;

  function toggleHelp() {
    if (helpEl) { helpEl.remove(); helpEl = null; return; }
    var ov = h("div", "help-overlay");
    var card = h("div", "help-card card");
    card.appendChild(h("h3", "display", "Keyboard shortcuts"));
    var rows = [
      ["→ / Space / Enter", "next step"],
      ["←", "previous step"],
      ["r", "replay this step"],
      ["m", "toggle sound effects"],
      ["v", "toggle voice narration"],
      ["e", "voice engine: auto / neural / browser"],
      ["- / +", "slower / faster animation"],
      ["?", "toggle this panel"],
      ["Esc", "close"]
    ];
    var list = h("div", "help-keys");
    rows.forEach(function (r) {
      var row = h("div", "help-row");
      row.appendChild(h("kbd", "kbd", r[0]));
      row.appendChild(h("span", null, r[1]));
      list.appendChild(row);
    });
    card.appendChild(list);
    card.appendChild(h("p", "help-note",
      "Sound is synthesized live and narration uses your browser's best voice — no downloads, works offline."));
    ov.appendChild(card);
    ov.addEventListener("click", function (e) { if (e.target === ov) toggleHelp(); });
    document.body.appendChild(ov);
    helpEl = ov;
  }

  function onKey(e) {
    var t = e.target;
    var interactive = t && (t.tagName === "BUTTON" || t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (e.key === "Escape") { if (helpEl) toggleHelp(); return; }
    if (interactive) return;
    switch (e.key) {
      case "ArrowRight":
      case " ":
      case "Enter":
        e.preventDefault();
        nextStep();
        break;
      case "ArrowLeft":
        e.preventDefault();
        prevStep();
        break;
      case "r": case "R":
        replayStep();
        break;
      case "m": case "M":
        if (window.MMX) { MMX.toggleSound(); renderFx(); }
        break;
      case "v": case "V":
        if (window.MMX) { MMX.toggleVoice(); renderFx(); }
        break;
      case "e": case "E":
        if (window.MMX) { MMX.cycleEngine(); renderFx(); }
        break;
      case "-": case "_":
        if (window.MMX) { MMX.cycleSpeed(-1); renderFx(); }
        break;
      case "=": case "+":
        if (window.MMX) { MMX.cycleSpeed(1); renderFx(); }
        break;
      case "?": case "h": case "H":
        toggleHelp();
        break;
    }
  }

  var fxBtns = null;

  function renderFx() {
    if (!fxBtns || !window.MMX) return;
    var s = MMX.soundOn();
    fxBtns.sound.textContent = s ? "🔊 Sound" : "🔇 Sound";
    fxBtns.sound.classList.toggle("is-off", !s);
    fxBtns.sound.setAttribute("aria-pressed", String(s));
    fxBtns.sound.title = (s ? "Mute" : "Unmute") + " sound effects (m)";
    var v = MMX.voiceOn();
    var vName = MMX.currentVoice();
    var vLabel = v ? ("🗣 " + (vName || "Voice")) : "🚫 Voice";
    fxBtns.voice.textContent = vLabel;
    fxBtns.voice.classList.toggle("is-off", !v);
    fxBtns.voice.setAttribute("aria-pressed", String(v));
    fxBtns.voice.title = (v ? "Stop" : "Enable") + " read-aloud narration (v) · engine " + MMX.engine() +
      " — e cycles auto / neural / browser. Click 🎤 to pick a voice.";
    fxBtns.speed.textContent = "⏩ " + MMX.speedLabel();
    fxBtns.speed.title = "Animation speed " + MMX.speedLabel() + " — slower with -, faster with +";
  }

  function fxButton(kind, label) {
    var b = h("button", "fx-btn", label);
    b.type = "button";
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (kind === "sound") MMX.toggleSound();
      else if (kind === "voice") MMX.toggleVoice();
      else if (kind === "speed") MMX.cycleSpeed(1);
      else if (kind === "voicepick") toggleVoicePicker();
      else toggleHelp();
      sfx("click");
      renderFx();
    });
    return b;
  }

  var voicePickerOpen = false;
  function toggleVoicePicker() {
    voicePickerOpen = !voicePickerOpen;
    var dd = document.getElementById("voice-picker-dd");
    if (dd) dd.classList.toggle("open", voicePickerOpen);
  }

  function buildVoicePicker(parent) {
    if (!window.MMX || !MMX.listVoices) return;
    var wrap = h("div", "voice-pick-wrap");
    var btn = h("button", "fx-btn voice-pick-btn", "🎤 Voice");
    btn.type = "button";
    btn.title = "Choose a voice — " + (MMX.currentVoice() || "default");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleVoicePicker();
    });
    var dd = h("div", "voice-picker-dd");
    dd.id = "voice-picker-dd";
    var voices = MMX.listVoices();
    var current = MMX.currentVoice() || "";
    voices.forEach(function (v) {
      var item = h("button", "voice-pick-item");
      item.type = "button";
      var gender = v.gender === "F" ? "♀" : "♂";
      item.textContent = gender + " " + v.name + " (" + v.locale + ")";
      if (current.toLowerCase().indexOf(v.id.toLowerCase()) !== -1 ||
          current.toLowerCase().indexOf(v.name.toLowerCase()) !== -1) {
        item.classList.add("active");
      }
      item.addEventListener("click", function (e) {
        e.stopPropagation();
        MMX.setVoiceName(v.id);
        MMX.setVoice(true);
        if (MMX.engine() === "browser") MMX.setEngine("auto");
        voicePickerOpen = false;
        dd.classList.remove("open");
        renderFx();
        /* speak a sample */
        MMX.speak("Hi, I'm " + v.name + ". Let's learn matrices together.");
        sfx("click");
        /* update active state */
        var items = dd.querySelectorAll(".voice-pick-item");
        items.forEach(function (it) { it.classList.remove("active"); });
        item.classList.add("active");
      });
      dd.appendChild(item);
    });
    wrap.appendChild(btn);
    wrap.appendChild(dd);
    parent.appendChild(wrap);
  }

  function buildToolbar() {
    if (!window.MMX) return;
    var bar = h("div", "fxbar");
    fxBtns = {
      sound: fxButton("sound", "🔊 Sound"),
      voice: fxButton("voice", "🗣 Voice"),
      speed: fxButton("speed", "⏩ 1×")
    };
    bar.appendChild(fxBtns.sound);
    bar.appendChild(fxBtns.voice);
    buildVoicePicker(bar);
    bar.appendChild(fxBtns.speed);
    bar.appendChild(fxButton("help", "⌨ ?"));
    document.body.appendChild(bar);
    renderFx();
    /* close picker on outside click */
    document.addEventListener("click", function () {
      voicePickerOpen = false;
      var dd = document.getElementById("voice-picker-dd");
      if (dd) dd.classList.remove("open");
    });
  }

  function mount(def, m) {
    lesson = def;
    meta = m;
    state = { step: 0, playing: false };
    if (!lesson.panels && (lesson.rows || lesson.cols || lesson.initialGrid)) {
      lesson.panels = [{
        id: "main", rows: lesson.rows, cols: lesson.cols,
        initial: lesson.initialGrid, style: lesson.style
      }];
    }
    var app = document.getElementById("app");
    app.innerHTML = "";
    app.appendChild(buildHeader());
    var main = h("main", "lesson-main");
    app.appendChild(main);
    var stage = h("section", "stage");
    main.appendChild(stage);
    panels = [];
    if (lesson.panels && lesson.panels.length) {
      var strip = h("div", "panel-strip");
      stage.appendChild(strip);
      panels = lesson.panels.map(function (pd) { return buildPanel(pd, strip); });
    }
    if (lesson.code && lesson.code.length) {
      var codeBox = h("aside", "code-pane");
      codeBox.appendChild(h("div", "code-pane-label mono", "Python"));
      codeBox.appendChild(renderCode(lesson.code));
      stage.appendChild(codeBox);
    }
    ui = {};
    var explain = h("section", "explain card");
    main.appendChild(explain);
    ui.explain = explain;
    var controls = h("section", "controls");
    var prevBtn = h("button", "btn", "← Prev step");
    prevBtn.addEventListener("click", prevStep);
    ui.prevBtn = prevBtn;
    var stepLabel = h("span", "step-label mono");
    ui.stepLabel = stepLabel;
    var nextBtn = h("button", "btn primary", "Next step →");
    nextBtn.addEventListener("click", nextStep);
    ui.nextBtn = nextBtn;
    controls.appendChild(prevBtn);
    controls.appendChild(stepLabel);
    controls.appendChild(nextBtn);
    main.appendChild(controls);
    var finish = h("section", "finish");
    finish.hidden = true;
    main.appendChild(finish);
    ui.finish = finish;
    main.appendChild(h("div", "kbd-hint mono",
      "Press ? for shortcuts · r replays the step · - / + tunes pacing"));
    buildToolbar();
    document.addEventListener("keydown", onKey);
    state.playing = true;
    updateControls();
    playStep(0).then(function () {
      state.playing = false;
      updateControls();
    });
  }

  window.LessonEngine = { mount: mount };
})();

/* =========================================================
 * 6학년 · Can you come to the ___? · 듣고 따라 말하기 웹 앱
 * - 음성 출력: Web Speech API (SpeechSynthesis)
 * - 단어 클릭: 단어 발음 + 뜻 풍선(popup)
 * - 대화 만들기: 행사 + 대답(승낙/거절) + 장소/시간 조합 → 검사 + 번역 + 듣기
 * - 따라 말하기 채점: Web Speech API (SpeechRecognition)
 * ========================================================= */

/* ---------- 음성 합성 (TTS) ---------- */
const synth = window.speechSynthesis;
let enVoice = null;
let speakRate = 0.85;

function pickVoice() {
  const voices = synth.getVoices();
  enVoice =
    voices.find(v => /en[-_]US/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
    null;
  const status = document.querySelector(".toolbar #voice-status");
  if (status) {
    status.textContent = enVoice ? `음성: ${enVoice.name}` : "영어 음성을 찾는 중...";
  }
}
pickVoice();
if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;

function speak(text, rate, onStart, onEnd) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate || speakRate;
  u.pitch = 1.05;
  if (enVoice) u.voice = enVoice;
  if (onStart) u.onstart = onStart;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

/* ---------- 단어 뜻 풍선(popup) ---------- */
const popup = document.createElement("div");
popup.className = "word-popup hidden";
popup.innerHTML = `
  <div class="wp-word"></div>
  <div class="wp-meaning"></div>
  <button class="wp-listen">단어 다시 듣기</button>`;
document.body.appendChild(popup);

popup.querySelector(".wp-listen").addEventListener("click", e => {
  e.stopPropagation();
  if (popup.dataset.word) speak(popup.dataset.word, 0.8);
});

function showWordPopup(wordEl, rawWord) {
  const key = wordKey(rawWord);
  const plain = rawWord.replace(/[.,!?]+$/, "");
  const meaning = WORD_MEANINGS[key] || WORD_MEANINGS[plain] || "(뜻 정보 없음)";
  popup.dataset.word = key || rawWord;
  popup.querySelector(".wp-word").textContent = rawWord.replace(/[.,!?]+$/, "");
  popup.querySelector(".wp-meaning").textContent = meaning;

  popup.classList.remove("hidden");
  const r = wordEl.getBoundingClientRect();
  const pw = popup.offsetWidth;
  let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  let top = r.bottom + 8 + window.scrollY;
  popup.style.left = left + "px";
  popup.style.top = top + "px";

  speak(key || rawWord, 0.8);
}

function hidePopup() { popup.classList.add("hidden"); }
document.addEventListener("click", e => {
  if (!popup.contains(e.target) && !e.target.classList.contains("word")) hidePopup();
});

/* ---------- 클릭 가능한 단어로 문장 만들기 ---------- */
function buildWords(sentence) {
  const frag = document.createDocumentFragment();
  sentence.split(/\s+/).forEach((w, i) => {
    if (i > 0) frag.appendChild(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = w;
    span.addEventListener("click", e => {
      e.stopPropagation();
      showWordPopup(span, w);
    });
    frag.appendChild(span);
  });
  return frag;
}

/* ---------- 실사 이미지 ---------- */
let imageMode = true; // true: 실사 사진, false: 이모지
function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}
function imageUrl(prompt) {
  const p = encodeURIComponent("a bright, friendly, realistic photo of " + prompt + ", for kids");
  return `https://image.pollinations.ai/prompt/${p}?width=400&height=260&nologo=true&seed=${hashSeed(prompt)}`;
}

/* ---------- 카드 만들기 ---------- */
function makeCard(item, opts) {
  opts = opts || {};
  const div = document.createElement("div");
  div.className = "card" + (opts.tone != null ? " tone-" + opts.tone : "");

  function speakSentence() {
    speak(item.en, null,
      () => div.classList.add("speaking"),
      () => div.classList.remove("speaking"));
  }

  // 윗줄: 태그 + 듣기
  const top = document.createElement("div");
  top.className = "card-top";
  const tag = document.createElement("span");
  tag.className = "card-tag";
  if (opts.index != null) tag.textContent = "CARD " + opts.index;
  const listenAll = document.createElement("button");
  listenAll.className = "listen-all";
  listenAll.textContent = "듣기 ▶";
  listenAll.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  top.append(tag, listenAll);

  // 이모지 또는 실사 이미지
  let visual;
  if (imageMode && item.imgPrompt) {
    visual = document.createElement("img");
    visual.className = "photo";
    visual.loading = "lazy";
    visual.alt = item.en;
    visual.src = imageUrl(item.imgPrompt);
    visual.addEventListener("error", () => {
      const em = document.createElement("div");
      em.className = "emoji";
      em.textContent = item.emoji;
      visual.replaceWith(em);
    });
  } else {
    visual = document.createElement("div");
    visual.className = "emoji";
    visual.textContent = item.emoji;
  }

  // 안쪽 문장 박스: 문장 + 한글 + 스피커
  const box = document.createElement("div");
  box.className = "sentence-box";
  const txt = document.createElement("div");
  txt.className = "sentence-text";
  const en = document.createElement("div");
  en.className = "en";
  en.appendChild(buildWords(item.en));
  const ko = document.createElement("div");
  ko.className = "ko";
  ko.textContent = item.ko;
  txt.append(en, ko);
  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn";
  speakBtn.setAttribute("aria-label", "문장 듣기");
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  box.append(txt, speakBtn);

  div.append(top, visual, box);

  // ⭐ 연습 목록 담기 버튼
  if (opts.selectable) {
    const sel = document.createElement("button");
    sel.className = "select-btn";
    const on = isSelected(item.en);
    sel.classList.toggle("on", on);
    sel.textContent = on ? "✓ 연습 목록에 있음" : "⭐ 연습 목록에 추가";
    sel.addEventListener("click", e => {
      e.stopPropagation();
      toggleSelect(item, opts.selectType || "suggest");
    });
    div.append(sel);
  }
  return div;
}

function renderGrid(id, list, opts) {
  opts = opts || {};
  const grid = document.getElementById(id);
  grid.innerHTML = "";
  list.forEach((item, i) => {
    const cardOpts = {};
    if (opts.tones) { cardOpts.tone = i % 6; if (!opts.noIndex) cardOpts.index = i + 1; }
    if (opts.selectable) { cardOpts.selectable = true; cardOpts.selectType = opts.selectType; }
    grid.appendChild(makeCard(item, cardOpts));
  });
}

/* ---------- 난이도(초급/중급/고급) + 활동 종류 ---------- */
let currentLevel = "beginner";
let currentCategory = "all";
function currentSuggestions() { return SUGGESTION_LEVELS[currentLevel]; }

function renderSuggestions() {
  const lvl = currentSuggestions();
  const view = [];
  lvl.forEach((item, i) => {
    if (currentCategory === "all" || SUGGESTION_CATEGORIES[i] === currentCategory) {
      view.push(Object.assign({}, item, { imgPrompt: IMAGE_PROMPTS[i] }));
    }
  });
  renderGrid("suggestion-grid", view, { tones: true, selectable: true });
}

document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentLevel = btn.dataset.level;
    synth.cancel();
    hidePopup();
    renderSuggestions();
  });
});

document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.cat;
    synth.cancel();
    hidePopup();
    renderSuggestions();
  });
});

/* ===========================================================
 * 🧩 대화 만들기 (행사 + 대답 + 장소/시간 → 말풍선 빈칸 채우기)
 * =========================================================== */
let buildEvent = null;   // BUILD_EVENTS 항목
let buildAnswer = null;  // { type: "accept"|"refuse", en, ko, emoji, reason? }
let buildPlace = null;   // PLACE_EXPRESSIONS 항목
let buildTime = null;    // TIME_EXPRESSIONS 항목
let lastBuilt = "";      // 마지막으로 들려준 대화 (중복 재생 방지)

function makeChip(text, cls, isOn, onClick) {
  const c = document.createElement("button");
  c.className = "chip " + cls + (isOn ? " on" : "");
  c.textContent = text;
  c.addEventListener("click", onClick);
  return c;
}
function setBlank(id, en) {
  const el = document.getElementById(id);
  el.classList.toggle("filled", !!en);
  if (en) { el.innerHTML = ""; el.appendChild(buildWords(en)); }
  else el.textContent = "________";
}
function refuseAnswer(r) {
  return { type: "refuse", reason: r.en, emoji: r.emoji,
    en: `Sorry, but I can't. I have a ${r.en}.`,
    ko: `미안하지만 못 가. 나 ${r.ko}(이)가 있어.` };
}

function renderBuilder() {
  const evWrap = document.getElementById("build-events");
  const acceptRow = document.getElementById("build-accept");
  const refuseRow = document.getElementById("build-refuse");
  const placeRow = document.getElementById("build-place");
  const timeRow = document.getElementById("build-time");
  evWrap.innerHTML = ""; acceptRow.innerHTML = ""; refuseRow.innerHTML = "";
  placeRow.innerHTML = ""; timeRow.innerHTML = "";

  BUILD_CATS.forEach(cat => {
    const items = BUILD_EVENTS.filter(a => a.cat === cat.key);
    const title = document.createElement("div");
    title.className = "chip-group-title";
    title.textContent = cat.label;
    const row = document.createElement("div");
    row.className = "chip-row wrap";
    items.forEach(a => {
      row.appendChild(makeChip(`${a.emoji} ${a.en}`, "act", buildEvent === a, () => {
        buildEvent = a; renderBuilder(); updateBuildResult();
      }));
    });
    evWrap.append(title, row);
  });
  ACCEPT_EXPRESSIONS.forEach(m => {
    const on = buildAnswer && buildAnswer.type === "accept" && buildAnswer.en === m.en;
    acceptRow.appendChild(makeChip(`${m.emoji} ${m.en}`, "when", on, () => {
      buildAnswer = { type: "accept", en: m.en, ko: m.ko, emoji: m.emoji };
      renderBuilder(); updateBuildResult();
    }));
  });
  REFUSE_REASONS.forEach(r => {
    const on = buildAnswer && buildAnswer.type === "refuse" && buildAnswer.reason === r.en;
    refuseRow.appendChild(makeChip(`${r.emoji} ${r.en}`, "where", on, () => {
      buildAnswer = refuseAnswer(r); renderBuilder(); updateBuildResult();
    }));
  });
  PLACE_EXPRESSIONS.forEach(p => {
    placeRow.appendChild(makeChip(`${p.emoji} ${p.en}`, "place", buildPlace === p, () => {
      buildPlace = p; renderBuilder(); updateBuildResult();
    }));
  });
  TIME_EXPRESSIONS.forEach(t => {
    timeRow.appendChild(makeChip(`${t.emoji} ${t.en}`, "with", buildTime === t, () => {
      buildTime = t; renderBuilder(); updateBuildResult();
    }));
  });

  const refused = !!(buildAnswer && buildAnswer.type === "refuse");
  document.getElementById("build-meet-step").classList.toggle("dimmed", refused);
  document.getElementById("dlg-meet-line").classList.toggle("dimmed", refused);
}

/* 현재 선택으로 대화 줄 만들기 (완성 여부와 함께) */
function currentDialogue() {
  const lines = [];
  lines.push({ who: "A", en: buildEvent ? `Can you come to ${buildEvent.en}?` : null,
               ko: buildEvent ? `${buildEvent.ko}에 올 수 있니?` : null });
  lines.push({ who: "B", en: buildAnswer ? buildAnswer.en : null, ko: buildAnswer ? buildAnswer.ko : null });
  const refused = buildAnswer && buildAnswer.type === "refuse";
  if (!refused) {
    lines.push({ who: "A",
      en: buildPlace && buildTime ? `Please come to ${buildPlace.en} at ${buildTime.en}.` : null,
      ko: buildPlace && buildTime ? `${buildTime.ko}에 ${buildPlace.ko}(으)로 와 줘.` : null });
  }
  return { lines, complete: lines.every(l => l.en) };
}

function updateBuildResult() {
  // 1줄: 행사
  setBlank("dlg-event", buildEvent && buildEvent.en);
  document.getElementById("dlg-event-ko").textContent = `${buildEvent ? buildEvent.ko : "________"}에 올 수 있니?`;
  // 2줄: 대답
  const ans = document.getElementById("dlg-answer");
  ans.innerHTML = "";
  if (!buildAnswer) {
    const b = document.createElement("span"); b.className = "blank"; b.textContent = "________"; ans.appendChild(b);
    document.getElementById("dlg-answer-ko").textContent = "(승낙 또는 거절)";
  } else if (buildAnswer.type === "accept") {
    const b = document.createElement("span"); b.className = "blank filled"; b.appendChild(buildWords(buildAnswer.en)); ans.appendChild(b);
    document.getElementById("dlg-answer-ko").textContent = buildAnswer.ko;
  } else {
    ans.appendChild(buildWords("Sorry, but I can't. I have a"));
    ans.appendChild(document.createTextNode(" "));
    const b = document.createElement("span"); b.className = "blank filled"; b.appendChild(buildWords(buildAnswer.reason)); ans.appendChild(b);
    ans.appendChild(document.createTextNode("."));
    document.getElementById("dlg-answer-ko").textContent = buildAnswer.ko;
  }
  // 3줄: 약속
  setBlank("dlg-place", buildPlace && buildPlace.en);
  setBlank("dlg-time", buildTime && buildTime.en);
  document.getElementById("dlg-meet-ko").textContent =
    `${buildTime ? buildTime.ko : "________"}에 ${buildPlace ? buildPlace.ko : "________"}(으)로 와 줘.`;

  // 상태 + 버튼
  const { lines, complete } = currentDialogue();
  const status = document.getElementById("dlg-status");
  const listenBtn = document.getElementById("build-listen");
  const starBtn = document.getElementById("build-star");
  const refused = buildAnswer && buildAnswer.type === "refuse";
  status.className = "dlg-status";
  if (!buildEvent) status.textContent = "1️⃣ 먼저 행사를 골라보세요! 👇";
  else if (!buildAnswer) status.textContent = "2️⃣ 친구가 뭐라고 대답할까요? 승낙 또는 거절을 골라요 👇";
  else if (!complete) status.textContent = `3️⃣ 친구가 승낙했어요! ${!buildPlace ? "📍 장소" : ""}${!buildPlace && !buildTime ? "와 " : ""}${!buildTime ? "⏰ 시간" : ""}을 골라 약속을 잡아요 👇`;
  else { status.className = "dlg-status ok"; status.textContent = refused ? "✅ 대화 완성! 친구가 못 온대요. 다음에 또 초대해요 😊" : "✅ 대화 완성! 약속까지 잡았어요 🎉"; }

  listenBtn.disabled = !complete;
  starBtn.disabled = !complete;
  const en = complete ? lines.map(l => l.en).join(" ") : "";
  if (complete) {
    const on = isSelected(en);
    starBtn.textContent = on ? "✓ 연습 목록에 있음" : "⭐ 연습 목록에 추가";
    starBtn.classList.toggle("on", on);
    if (en !== lastBuilt) { lastBuilt = en; speak(en); }
  } else {
    starBtn.textContent = "⭐ 연습 목록에 추가";
    starBtn.classList.remove("on");
    lastBuilt = "";
  }
}

document.getElementById("build-listen").addEventListener("click", () => {
  const { lines, complete } = currentDialogue();
  if (complete) speak(lines.map(l => l.en).join(" "));
});
document.getElementById("build-star").addEventListener("click", () => {
  const { lines, complete } = currentDialogue();
  if (!complete) return;
  const item = { en: lines.map(l => l.en).join(" "), ko: lines.map(l => l.ko).join(" "),
    emoji: buildEvent.emoji, lines: lines.map(l => ({ who: l.who, en: l.en, ko: l.ko })) };
  toggleSelect(item, "combo");
  updateBuildResult();
});
document.querySelectorAll("#dialog-preview .speak-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const { lines } = currentDialogue();
    const l = lines[+btn.dataset.line];
    if (l && l.en) speak(l.en);
  });
});

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

document.getElementById("build-random").addEventListener("click", () => {
  buildEvent = pick(BUILD_EVENTS);
  if (Math.random() < 0.6) {
    const m = pick(ACCEPT_EXPRESSIONS);
    buildAnswer = { type: "accept", en: m.en, ko: m.ko, emoji: m.emoji };
    buildPlace = pick(PLACE_EXPRESSIONS);
    buildTime = pick(TIME_EXPRESSIONS);
  } else {
    buildAnswer = refuseAnswer(pick(REFUSE_REASONS));
    buildPlace = null; buildTime = null;
  }
  renderBuilder();
  updateBuildResult();
});

document.getElementById("build-clear").addEventListener("click", () => {
  buildEvent = null; buildAnswer = null; buildPlace = null; buildTime = null;
  synth.cancel();
  renderBuilder();
  updateBuildResult();
});

/* ===========================================================
 * 내 문장 연습 (선택 → 말하기/녹음 → 정확도 → 연습 횟수)
 * =========================================================== */
let selected = new Map();
let stats = {};
try { (JSON.parse(localStorage.getItem("invite_selected") || "[]") || []).forEach(it => selected.set(it.en, it)); } catch (e) {}
try { stats = JSON.parse(localStorage.getItem("invite_stats") || "{}") || {}; } catch (e) {}

function persist() {
  try {
    localStorage.setItem("invite_selected", JSON.stringify([...selected.values()]));
    localStorage.setItem("invite_stats", JSON.stringify(stats));
  } catch (e) {}
}
function isSelected(en) { return selected.has(en); }
function toggleSelect(item, type) {
  if (selected.has(item.en)) selected.delete(item.en);
  else selected.set(item.en, { en: item.en, ko: item.ko, emoji: item.emoji, imgPrompt: item.imgPrompt, lines: item.lines, type: type || "suggest" });
  persist();
  updatePracticeBadge();
  renderSuggestions();
  renderAnswerGrids();
  if (document.getElementById("tab-practice").classList.contains("active")) renderPractice();
}
function updatePracticeBadge() {
  const c = document.getElementById("practice-count");
  if (c) c.textContent = selected.size;
}

/* ---- 음성 인식 (정확도 측정) ---- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const srSupported = !!SR;
let rec = srSupported ? new SR() : null;
if (rec) { rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 5; }
let recBusy = false;

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z\s']/g, "").replace(/\s+/g, " ").trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function wordsClose(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= 1;
}
const STOPWORDS = new Set(["a", "an", "the", "to", "of", "on", "in", "at", "for", "but", "i", "i'm", "i'll"]);
function scoreMatch(target, heard) {
  const t = normalize(target).split(" ").filter(Boolean);
  const h = normalize(heard).split(" ").filter(Boolean);
  let content = t.filter(w => !STOPWORDS.has(w));
  if (!content.length) content = t;
  let hit = 0;
  content.forEach(w => { if (h.some(x => wordsClose(x, w))) hit++; });
  let score = hit / content.length;
  if (score >= 0.5) score = Math.min(1, score + 0.12);
  return score;
}
function practiceAttempt(target, cb) {
  if (!rec || recBusy) { cb.onend && cb.onend(); return; }
  recBusy = true;
  let score = 0, heard = "", errCode = null;
  rec.onresult = e => {
    const alts = e.results[0];
    for (let i = 0; i < alts.length; i++) {
      const s = scoreMatch(target, alts[i].transcript);
      if (s > score) { score = s; heard = alts[i].transcript; }
    }
  };
  rec.onerror = ev => { errCode = ev.error; };
  rec.onend = () => {
    recBusy = false;
    if (errCode && score === 0) cb.onerror && cb.onerror(errCode);
    else cb.onresult && cb.onresult(Math.round(score * 100), heard);
    cb.onend && cb.onend();
  };
  try { rec.start(); } catch (e) { recBusy = false; cb.onend && cb.onend(); }
}

/* ---- 말한 뒤 콜백 (음성이 없어도 넘어가도록 안전장치) ---- */
function speakThen(text, cb) {
  let done = false;
  const finish = () => { if (!done) { done = true; cb(); } };
  const timer = setTimeout(finish, Math.min(9000, 1500 + text.length * 90));
  speak(text, null, null, () => { clearTimeout(timer); finish(); });
}

/* ---- 연습 목록 ---- */
const TAGS = {
  suggest: ["tag-suggest", "🎉 초대"],
  answer:  ["tag-answer",  "💬 대답"],
  meet:    ["tag-meet",    "📍 약속"],
  combo:   ["tag-combo",   "🧩 내 대화"],
};
let practiceFilter = "all";

function statsText(en, last) {
  const s = stats[en] || { attempts: 0, best: 0 };
  return `정확도 <b class="acc">${last != null ? last + "%" : "--"}</b>` +
    ` · 최고 <b class="best">${s.best ? s.best + "%" : "--"}</b>` +
    ` · <b>${s.attempts}</b>회`;
}
function recordScore(en, score) {
  const s = stats[en] || { attempts: 0, best: 0 };
  s.attempts++; s.best = Math.max(s.best, score); stats[en] = s; persist();
}
function feedbackHtml(score, heard) {
  const h = `<span class="heard">내 발음: ${heard || "(못 들었어요)"}</span>`;
  if (score >= 75) return ["good", `⭐ 훌륭해요! ${score}% ${h}`];
  if (score >= 45) return ["good", `👍 좋아요! 한 번 더! ${score}% ${h}`];
  return ["bad", `🔁 다시 또박또박! ${score}% ${h}`];
}

/* 한 문장 연습 줄: [🔊] 문장/뜻 [🎙️ 말하기] 점수 → 피드백 */
function makeSpeakRow(en, ko, who) {
  const row = document.createElement("div");
  row.className = "prow" + (who ? " who-" + who.toLowerCase() : "");

  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn small";
  speakBtn.setAttribute("aria-label", "듣기");
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", () => speak(en));

  const txt = document.createElement("div");
  txt.className = "prow-text";
  if (who) { const w = document.createElement("span"); w.className = "prow-who"; w.textContent = who; txt.appendChild(w); }
  const enEl = document.createElement("div"); enEl.className = "en"; enEl.appendChild(buildWords(en));
  const koEl = document.createElement("div"); koEl.className = "ko"; koEl.textContent = ko;
  txt.append(enEl, koEl);

  const mic = document.createElement("button");
  mic.className = "mic-btn";
  mic.innerHTML = '<span class="mic-ico">🎙️</span><span class="mic-txt">말하기</span>';
  const score = document.createElement("div");
  score.className = "pstats";
  score.innerHTML = statsText(en, null);
  const fb = document.createElement("div");
  fb.className = "mic-feedback";

  if (!srSupported) { mic.disabled = true; mic.title = "이 브라우저는 음성 인식을 지원하지 않아요 (Chrome 권장)"; }

  function attempt(after) {
    if (recBusy || !srSupported) { after && after(); return; }
    mic.classList.add("recording");
    row.classList.add("active");
    fb.className = "mic-feedback"; fb.textContent = "🔴 듣고 있어요... 또박또박 말해보세요!";
    practiceAttempt(en, {
      onresult: (s, heard) => {
        recordScore(en, s);
        score.innerHTML = statsText(en, s);
        const [cls, html] = feedbackHtml(s, heard);
        fb.className = "mic-feedback " + cls; fb.innerHTML = html;
      },
      onerror: err => {
        fb.className = "mic-feedback bad";
        fb.textContent = err === "not-allowed" ? "마이크 권한을 허용해 주세요." : "다시 시도해 주세요.";
      },
      onend: () => { mic.classList.remove("recording"); row.classList.remove("active"); after && after(); }
    });
  }
  mic.addEventListener("click", () => attempt());

  const main = document.createElement("div");
  main.className = "prow-main";
  main.append(speakBtn, txt, mic, score);
  row.append(main, fb);
  row._attempt = attempt;
  row._who = who;
  row._en = en;
  return row;
}

function makePracticeCard(item) {
  const card = document.createElement("div");
  card.className = "pcard" + (item.lines ? " pcard-dialog" : "");

  const top = document.createElement("div");
  top.className = "card-top";
  const tag = document.createElement("span");
  const t = TAGS[item.type] || TAGS.suggest;
  tag.className = "card-tag " + t[0];
  tag.textContent = t[1];
  const em = document.createElement("span"); em.className = "ptag-emoji"; em.textContent = item.emoji || "";
  const remove = document.createElement("button");
  remove.className = "premove";
  remove.setAttribute("aria-label", "목록에서 빼기");
  remove.textContent = "✕";
  remove.addEventListener("click", () => {
    selected.delete(item.en); persist(); updatePracticeBadge();
    renderPractice(); renderSuggestions(); renderAnswerGrids(); updateBuildResult();
  });
  const left = document.createElement("div"); left.className = "ptag-left"; left.append(tag, em);
  top.append(left, remove);
  card.appendChild(top);

  if (!item.lines) {
    card.appendChild(makeSpeakRow(item.en, item.ko));
    return card;
  }

  // 🧩 대화: 줄마다 말하기 + 역할극
  const rows = item.lines.map(l => makeSpeakRow(l.en, l.ko, l.who));
  rows.forEach(r => card.appendChild(r));

  const tools = document.createElement("div");
  tools.className = "ptools";
  const allBtn = document.createElement("button");
  allBtn.className = "btn small"; allBtn.textContent = "🔊 전체 듣기";
  allBtn.addEventListener("click", () => speak(item.en));
  const roleA = document.createElement("button");
  roleA.className = "btn small primary"; roleA.textContent = "🎭 내가 A (초대하기)";
  const roleB = document.createElement("button");
  roleB.className = "btn small primary"; roleB.textContent = "🎭 내가 B (대답하기)";
  const roleNote = document.createElement("div");
  roleNote.className = "role-note";
  tools.append(allBtn, roleA, roleB);
  card.append(tools, roleNote);

  let playing = false;
  function rolePlay(me) {
    if (playing || recBusy) return;
    if (!srSupported) { roleNote.textContent = "이 브라우저는 음성 인식을 지원하지 않아요 (Chrome 권장)"; return; }
    playing = true;
    roleA.disabled = roleB.disabled = true;
    let i = 0;
    const step = () => {
      rows.forEach(r => r.classList.remove("turn"));
      if (i >= rows.length) {
        playing = false; roleA.disabled = roleB.disabled = false;
        roleNote.textContent = "🎉 역할극 끝! 잘했어요. 다시 해 볼까요?";
        return;
      }
      const r = rows[i]; i++;
      r.classList.add("turn");
      if (r._who === me) {
        roleNote.textContent = `🎙️ 내 차례! "${r._en}" 라고 말해보세요.`;
        r._attempt(() => setTimeout(step, 500));
      } else {
        roleNote.textContent = `👂 컴퓨터(${r._who})가 말해요. 잘 들어보세요.`;
        speakThen(r._en, () => setTimeout(step, 400));
      }
    };
    step();
  }
  roleA.addEventListener("click", () => rolePlay("A"));
  roleB.addEventListener("click", () => rolePlay("B"));
  return card;
}

function renderPractice() {
  let items = [...selected.values()];
  const empty = document.getElementById("practice-empty");
  const list = document.getElementById("practice-list");
  updatePracticeBadge();
  document.querySelectorAll("#practice-filter .cat-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === practiceFilter));
  if (practiceFilter !== "all") items = items.filter(it => (it.type || "suggest") === practiceFilter);
  list.innerHTML = "";
  if (!items.length) {
    empty.style.display = "block";
    empty.innerHTML = selected.size
      ? "이 종류로 담은 문장이 없어요. 다른 종류를 눌러 보세요."
      : "아직 담은 문장이 없어요! <b>초대하기</b>·<b>대답하기</b>·<b>약속 잡기</b>·<b>대화 만들기</b> 탭에서 <b>⭐</b>로 연습할 문장을 담아보세요.";
    return;
  }
  empty.style.display = "none";
  const order = { suggest: 0, answer: 1, meet: 2, combo: 3 };
  items.sort((a, b) => (order[a.type] || 0) - (order[b.type] || 0));
  items.forEach(it => list.appendChild(makePracticeCard(it)));
}

document.querySelectorAll("#practice-filter .cat-btn").forEach(btn => {
  btn.addEventListener("click", () => { practiceFilter = btn.dataset.filter; renderPractice(); });
});
document.getElementById("practice-clear").addEventListener("click", () => {
  if (!selected.size) return;
  if (!confirm("연습 목록의 문장을 모두 지울까요?")) return;
  selected.clear(); persist(); updatePracticeBadge();
  renderPractice(); renderSuggestions(); renderAnswerGrids(); updateBuildResult();
});

/* ---------- 대답 · 약속 카드 ---------- */
function renderAnswerGrids() {
  renderGrid("accept-grid", ACCEPT_EXPRESSIONS, { tones: true, noIndex: true, selectable: true, selectType: "answer" });
  renderRefuseFill();
  renderMeetFill();
}

/* ---------- 빈칸 채우기: 거절 (Sorry, but I can't. I have a ___.) ---------- */
let fillReason = null;
let fillPlace = null;
let fillTime = null;
let lastFillSpoken = "";

function fillActions(wrap, en, ko, emoji, type) {
  wrap.innerHTML = "";
  if (!en) return;
  const listenBtn = document.createElement("button");
  listenBtn.className = "btn primary";
  listenBtn.textContent = "🔊 문장 듣기";
  listenBtn.addEventListener("click", () => speak(en));
  const starBtn = document.createElement("button");
  starBtn.className = "btn";
  const on = isSelected(en);
  starBtn.textContent = on ? "✓ 연습 목록에 있음" : "⭐ 연습 목록에 추가";
  starBtn.addEventListener("click", () => toggleSelect({ en, ko, emoji }, type));
  wrap.append(listenBtn, starBtn);
  if (en !== lastFillSpoken) { lastFillSpoken = en; speak(en); }
}

function renderRefuseFill() {
  const row = document.getElementById("refuse-chips");
  row.innerHTML = "";
  REFUSE_REASONS.forEach(r => {
    row.appendChild(makeChip(`${r.emoji} ${r.en}`, "where", fillReason === r, () => {
      fillReason = r; renderRefuseFill();
    }));
  });
  const blank = document.getElementById("refuse-blank");
  const koEl = document.getElementById("refuse-ko");
  blank.classList.toggle("filled", !!fillReason);
  if (fillReason) {
    blank.innerHTML = ""; blank.appendChild(buildWords(fillReason.en));
    koEl.textContent = `미안하지만 못 가. 나 ${fillReason.ko}(이)가 있어.`;
    fillActions(document.getElementById("refuse-actions"),
      `Sorry, but I can't. I have a ${fillReason.en}.`, koEl.textContent, fillReason.emoji, "answer");
  } else {
    blank.textContent = "________";
    koEl.textContent = "미안하지만 못 가. 나 ________(이)가 있어.";
    fillActions(document.getElementById("refuse-actions"), null);
  }
}

/* ---------- 빈칸 채우기: 약속 (Please come to ___ at ___.) ---------- */
function renderMeetFill() {
  const pRow = document.getElementById("meet-place-chips");
  const tRow = document.getElementById("meet-time-chips");
  pRow.innerHTML = ""; tRow.innerHTML = "";
  PLACE_EXPRESSIONS.forEach(p => {
    pRow.appendChild(makeChip(`${p.emoji} ${p.en}`, "place", fillPlace === p, () => {
      fillPlace = p; renderMeetFill();
    }));
  });
  TIME_EXPRESSIONS.forEach(t => {
    tRow.appendChild(makeChip(`${t.emoji} ${t.en}`, "with", fillTime === t, () => {
      fillTime = t; renderMeetFill();
    }));
  });
  const pb = document.getElementById("meet-place-blank");
  const tb = document.getElementById("meet-time-blank");
  pb.classList.toggle("filled", !!fillPlace);
  tb.classList.toggle("filled", !!fillTime);
  if (fillPlace) { pb.innerHTML = ""; pb.appendChild(buildWords(fillPlace.en)); } else pb.textContent = "________";
  if (fillTime) { tb.innerHTML = ""; tb.appendChild(buildWords(fillTime.en)); } else tb.textContent = "________";
  const koEl = document.getElementById("meet-ko");
  koEl.textContent = `${fillTime ? fillTime.ko : "________"}에 ${fillPlace ? fillPlace.ko : "________"}(으)로 와 줘.`;
  if (fillPlace && fillTime) {
    fillActions(document.getElementById("meet-actions"),
      `Please come to ${fillPlace.en} at ${fillTime.en}.`, koEl.textContent, fillPlace.emoji, "meet");
  } else {
    fillActions(document.getElementById("meet-actions"), null);
  }
}

/* ---------- 초기 렌더 ---------- */
renderSuggestions();
renderAnswerGrids();
renderBuilder();
updateBuildResult();
updatePracticeBadge();

/* ---------- 탭 전환 ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    synth.cancel();
    hidePopup();
    if (btn.dataset.tab === "practice") renderPractice();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ---------- 속도 조절 ---------- */
document.getElementById("rate").addEventListener("input", e => {
  speakRate = parseFloat(e.target.value);
});

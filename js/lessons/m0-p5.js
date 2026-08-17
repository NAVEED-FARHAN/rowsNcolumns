window.LESSONS = window.LESSONS || {};

window.LESSONS["m0-p5"] = {
  id: "m0-p5",
  module: 0,
  page: 5,
  title: "The Shared-Row Bug",

  panels: [
    {
      id: "buggy",
      label: "BUGGY — [[0] * 3] * 3",
      rows: 3, cols: 3,
      initial: [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    },
    {
      id: "correct",
      label: "CORRECT — [[0] * 3 for _ in range(3)]",
      rows: 3, cols: 3,
      initial: [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    }
  ],

  code: [
    "# BUGGY — repeats the same row 3 times",
    "grid = [[0] * 3] * 3",
    "",
    "grid[0][0] = 1        # touched ONE cell of ONE row…",
    "",
    "# CORRECT — a fresh row per iteration",
    "grid2 = [[0] * 3 for _ in range(3)]",
    "grid2[0][0] = 1"
  ],

  steps: [
    {
      panel: "buggy",
      codeLine: 1,
      text: `Here's the trap hiding inside a tempting initializer: <code>[[0] * 3] * 3</code>. The inner <code>[0] * 3</code> makes one row of three zeros — fine. But the outer <code>* 3</code> does <strong>not</strong> copy that row three times…`,
      tag: { cls: "shared", cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] }
    },
    {
      panel: "buggy",
      codeLine: 1,
      text: `…it copies the <strong>reference</strong> three times. All three “rows” are the <em>same list object</em> — the linked outline shows the aliasing: one piece of memory, three names for it. <code>grid[0]</code>, <code>grid[1]</code> and <code>grid[2]</code> all point at one row.`,
      pointer: [[0, 0], [1, 0], [2, 0]]
    },
    {
      panel: "buggy",
      codeLine: 3,
      text: `Now the moment of alarm. <code>grid[0][0] = 1</code> touches exactly <strong>one cell of one row</strong> — yet every row's first column flips to 1. Writing through any of the three names writes through the single shared object. If this feels like a bug, good — it is, and it's on every real interview.`,
      writes: [[0, 0, 1], [1, 0, 1], [2, 0, 1]]
    },
    {
      panel: "correct",
      codeLine: 6,
      text: `Now the correct build, side by side: <code>[[0] * 3 for _ in range(3)]</code>. Each comprehension iteration evaluates <code>[0] * 3</code> <em>fresh</em> — a brand-new list every pass. Three separate rows, zero shared memory.`,
    },
    {
      panel: "correct",
      codeLine: 7,
      text: `Same edit on the correct grid: <code>grid2[0][0] = 1</code> — and <strong>only row 0 changes</strong>. The other rows are untouched because they're independent objects. Same operation, different construction, different world.`,
      writes: [[0, 0, 1]]
    },
    {
      text: `Why does this happen? In Python, a variable holds a <strong>reference to an object</strong>, not the object itself. <code>[x] * n</code> repeats that reference <code>n</code> times — it never duplicates the underlying list. Numbers are immutable, so <code>[0] * 3</code> is safe; lists are mutable, so <code>[row] * 3</code> is a landmine.`,
      html: `<div class="diagram" aria-hidden="true">
        <div class="dbox d-outer">grid
          <div class="drow drow--shared">[0, 0, 0] ← same object ×3</div>
        </div>
        <p class="diagram-cap mono">the * operator repeats the reference, not the list</p>
      </div>`
    },
    {
      text: `Rule of thumb: if your DP table's rows seem to <strong>update together</strong>, or a visited grid “magically” fills in, suspect your initialization line first. This exact bug has quietly cost candidates correctness on real interview problems.`,
      codeLine: -1
    }
  ],

  interview: `<code>[[0] * n] * m</code> vs <code>[[0] * n for _ in range(m)]</code> is a top-tier interview gotcha — interviewers seed it into DP and flood-fill problems on purpose. Knowing the <em>why</em> (reference semantics) beats memorizing the fix: the rows update together because they are one row.`
};

window.LESSONS = window.LESSONS || {};

window.LESSONS["m0-p4"] = {
  id: "m0-p4",
  module: 0,
  page: 4,
  title: "Building Matrices",

  panels: [{ id: "main", rows: 1, cols: 4 }],

  code: [
    "rows, cols = 3, 4",
    "",
    "row = [0] * cols                   # one row of 4 zeros",
    "grid = [[0] * cols for _ in range(rows)]"
  ],

  steps: [
    {
      text: `Writing a matrix by hand is fine for 3×3 — but for arbitrary sizes you build it programmatically. Start with the <em>inner piece</em>: <code>[0] * cols</code> repeats the single value <code>0</code> into a row-length list. Four zeros appear. (Safe because <code>0</code> is an immutable value — repetition copies the value, not an object.)`,
      codeLine: 2,
      writes: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]]
    },
    {
      text: `Now the <em>outer piece</em>: <code>[[0] * cols for _ in range(rows)]</code>. The comprehension runs once per item of <code>range(rows)</code> — three iterations — and on <strong>each iteration evaluates <code>[0] * cols</code> fresh</strong>, producing a brand-new row. Iteration 1 → row 0 appears.`,
      codeLine: 3,
      setGrid: { rows: 3, cols: 4, initial: [[0, 0, 0, 0]] }
    },
    {
      text: `Iteration 2 → a second, <em>independent</em> row of zeros. This independence is the whole point of the comprehension — and the exact thing the tempting shortcut on the next page gets wrong.`,
      codeLine: 3,
      writes: [[1, 0, 0], [1, 1, 0], [1, 2, 0], [1, 3, 0]]
    },
    {
      text: `Iteration 3 → the grid is complete: 3 rows × 4 cols, every cell 0, every row its own list object. One expression, three fresh lists.`,
      codeLine: 3,
      writes: [[2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 3, 0]]
    },
    {
      text: `Why <code>range(rows)</code> and not just <code>rows</code>? The comprehension needs an <em>iterable</em> to loop over; <code>range(rows)</code> hands it <code>rows</code> iterations. Memorize this exact line — it's the boilerplate for initializing DP tables and visited grids, and it shows up in almost every grid problem.`,
      codeLine: 3
    }
  ],

  interview: `<code>[[0] * cols for _ in range(rows)]</code> is the single most reused line in grid interview problems — DP tables, visited grids, simulation state. Have it memorized cold, and write it without hesitation.`
};

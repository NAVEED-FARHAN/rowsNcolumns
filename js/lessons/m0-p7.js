window.LESSONS = window.LESSONS || {};

window.LESSONS["m0-p7"] = {
  id: "m0-p7",
  module: 0,
  page: 7,
  title: "Worked Example + Recap",

  panels: [{ id: "main", rows: 3, cols: 4 }],

  code: [
    "rows, cols = 3, 4",
    "grid = [[0] * cols for _ in range(rows)]   # safe build",
    "",
    "for i in range(min(rows, cols)):           # walk the diagonal",
    "    grid[i][i] = 1",
    "",
    "print(grid)"
  ],

  steps: [
    {
      codeLine: 1,
      text: `One continuous worked example — the whole module in action. First, the safe build from page 4: the comprehension runs and iteration 1 spawns row 0.`,
      writes: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]]
    },
    {
      codeLine: 1,
      text: `Iteration 2 → row 1: a fresh, independent list of zeros.`,
      writes: [[1, 0, 0], [1, 1, 0], [1, 2, 0], [1, 3, 0]]
    },
    {
      codeLine: 1,
      text: `Iteration 3 → a clean 3×4 grid of zeros, every row its own object. Exactly the boilerplate from page 4.`,
      writes: [[2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 3, 0]]
    },
    {
      codeLine: 3,
      pointer: [[0, 0]],
      text: `Now fill the diagonal with 1s. <code>range(min(rows, cols))</code> — for a 3×4 grid, <code>min(3, 4) = 3</code>: three diagonal cells exist before we run out of rows. The pointer takes position at <code>[0][0]</code>.`
    },
    {
      codeLine: 4,
      writes: [[0, 0, 1]],
      text: `i = 0 → <code>grid[0][0] = 1</code>: the top-left cell lights up.`
    },
    {
      codeLine: 4,
      pointer: [[1, 1]],
      writes: [[1, 1, 1]],
      text: `i = 1 → <code>grid[1][1] = 1</code>: the pointer steps diagonally down and the center cell changes.`
    },
    {
      codeLine: 4,
      pointer: [[2, 2]],
      writes: [[2, 2, 1]],
      text: `i = 2 → <code>grid[2][2] = 1</code>. The loop ends — there is no row 3 — so the last column stays 0. The diagonal is complete.`
    },
    {
      codeLine: 6,
      text: `Printing shows the raw list-of-lists text — exactly what you'd see in a terminal or LeetCode console:`,
      html: `<pre class="code mono inline-code">[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]]</pre>`
    },
    {
      text: `Zoom out: build a grid with a comprehension, then write to specific cells with a loop. This exact shape — <em>init, then pattern-fill</em> — is the skeleton of DP tables, visited grids, and simulation problems across the rest of the modules. You now know all the pieces it's built from.`
    }
  ],

  interview: `The build-then-fill shape you just ran — comprehension + loop writing to cells — recurs in DP tables, flood fills, and simulations. Internalize the six items in the recap and Module 0 is done; every later module is built on exactly these foundations.`,

  recap: [
    `The list-of-lists representation: outer list = rows, inner lists = cells`,
    `Indexing: <code>grid[row][col]</code> — row first, column second`,
    `Dimensions: <code>len(grid)</code> rows, <code>len(grid[0])</code> columns, guard the empty grid`,
    `Safe build: <code>[[0] * cols for _ in range(rows)]</code>`,
    `The shared-row bug: <code>[[0] * cols] * rows</code> aliases one row`,
    `numpy vs plain lists: know the difference, use plain lists in interviews`
  ]
};

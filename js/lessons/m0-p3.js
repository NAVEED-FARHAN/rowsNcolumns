window.LESSONS = window.LESSONS || {};

window.LESSONS["m0-p3"] = {
  id: "m0-p3",
  module: 0,
  page: 3,
  title: "Dimensions: rows & cols",

  panels: [{
    id: "main",
    rows: 3, cols: 4,
    initial: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]
  }],

  code: [
    "grid = [[1, 2, 3, 4],",
    "        [5, 6, 7, 8],",
    "        [9, 10, 11, 12]]",
    "",
    "rows = len(grid)        # 3",
    "cols = len(grid[0])     # 4",
    "print(rows, cols)",
    "",
    "if not grid or not grid[0]:",
    "    return"
  ],

  steps: [
    {
      text: `<code>len(grid)</code> counts the elements of the <em>outer</em> list — one element per row. Sweeping down the rows: 1, 2, 3 → <strong>3 rows</strong>.`,
      codeLine: 4,
      reads: [[0, 0], [1, 0], [2, 0]]
    },
    {
      text: `<code>len(grid[0])</code> counts the elements of the <em>first inner list</em> — that's the number of columns. Sweeping across the top row: 4 → <strong>4 columns</strong>.`,
      codeLine: 5,
      reads: [[0, 0], [0, 1], [0, 2], [0, 3]]
    },
    {
      text: `Together: <code>rows, cols = 3, 4</code>. This one line — <code>rows, cols = len(grid), len(grid[0])</code> — is the opening move of nearly every matrix solution.`,
      codeLine: 6
    },
    {
      text: `⚠ Real-world data can be <strong>ragged</strong> — rows of different lengths. This grid has a 3-cell row on top and a 4-cell row below. <code>len(grid[0])</code> says 3, <code>len(grid[1])</code> says 4 — so which one is “the number of columns”? There isn't one.`,
      setGrid: { rows: 2, cols: 4, initial: [[1, 2, 3], [4, 5, 6, 7]] }
    },
    {
      text: `That's why interview problems always say “an <em>m × n rectangular grid</em>” — it guarantees every row has the same length, so <code>len(grid[0])</code> is safe to trust. Real-world data doesn't always promise that; check before you rely on it. Back to our clean 3×4 grid.`,
      setGrid: { rows: 3, cols: 4, initial: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] }
    },
    {
      text: `Now the edge case that bites: what if the grid is <code>[]</code> — empty? There is no row 0, so <code>len(grid[0])</code> would crash with an <code>IndexError</code>. The standard guard — often the first line of a matrix solution — checks for both:`,
      setGrid: { rows: 0, cols: 0, initial: [] },
      codeLine: 8
    },
    {
      text: `With an empty grid, <code>not grid</code> is True and we return early instead of crashing. (And <code>not grid[0]</code> catches the rarer but real case of a grid like <code>[[]]</code>.) Size matters — check it before you index it.`,
      codeLine: 9
    },
    {
      text: `Saying <em>“let rows, cols = len(grid), len(grid[0])”</em> out loud at the start of a solution signals you're thinking about edge cases — interviewers hear that as a green flag, and it gives every later loop its bounds.`,
      codeLine: 4
    }
  ],

  interview: `Dimension extraction is the boilerplate preamble of every matrix problem. Handle the empty grid and the ragged case mentally before writing your loop, and state rows/cols explicitly — it structures everything that follows and signals edge-case awareness.`
};

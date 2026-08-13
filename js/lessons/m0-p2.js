window.LESSONS = window.LESSONS || {};

window.LESSONS["m0-p2"] = {
  id: "m0-p2",
  module: 0,
  page: 2,
  title: "Indexing: grid[row][col]",

  panels: [{
    id: "main",
    rows: 3, cols: 3,
    initial: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  }],

  code: [
    "grid = [[1, 2, 3],",
    "        [4, 5, 6],",
    "        [7, 8, 9]]",
    "",
    "value = grid[1][2]",
    "print(value)          # 6"
  ],

  steps: [
    {
      text: `A 3×3 grid, loaded. Reading it uses <code>grid[row][col]</code> — <strong>two indexes, applied in order</strong>. First the row, then the column. Step one: <code>grid[1]</code> selects the <em>whole inner list</em> at index 1 — the entire second row lights up.`,
      codeLine: 4,
      reads: [[1, 0], [1, 1], [1, 2]]
    },
    {
      text: `Step two: <code>[2]</code> reaches <em>inside</em> that row and picks the element at index 2. Together, <code>grid[1][2]</code> lands on the value <strong>6</strong>.`,
      codeLine: 4,
      pointer: [[1, 2]],
      reads: [[1, 2]]
    },
    {
      text: `<code>value = 6</code>, and <code>print(value)</code> confirms it. Two indexes, two hops: row first, column second.`,
      codeLine: 5,
      reads: [[1, 2]]
    },
    {
      text: `Why row first? Because of the <em>nesting</em> — the outer index can only hand you a whole row (an inner list); only then can a second index reach a single number. The structure of the data dictates the order of the indexes. Watch the pointer hop down rows: <code>grid[0]</code>, <code>grid[1]</code>, <code>grid[2]</code>.`,
      pointer: [[0, 0], [1, 0], [2, 0]]
    },
    {
      text: `Classic trap: people read <code>grid[x][y]</code> like math coordinates — x = horizontal, y = vertical. Let's test that model. Math says <code>grid[2][0]</code> should be the <em>bottom-left</em>…`,
      codeLine: -1,
      pointer: [[2, 0]],
      reads: [[2, 0]]
    },
    {
      text: `…and it is — value 7, row 2 column 0. Coincidence. Now <code>grid[0][2]</code>: the math model says bottom-right, but the grid says <strong>top-right</strong> (3). Math x/y is the mirror image of row/col — when in doubt, count from the top, row first.`,
      pointer: [[0, 2]],
      reads: [[0, 2]]
    },
    {
      text: `The single most common matrix bug in interviews is <strong>swapping the indexes</strong> — writing <code>grid[col][row]</code>. When you index, say it aloud: <em>“row 1, column 2.”</em> Five seconds of verbalization prevents a whole class of disasters.`,
      codeLine: -1
    }
  ],

  interview: `Almost every matrix bug in interviews traces back to a swapped row/col. Stating the order out loud (“row 1, column 2”) reads as careful thinking to an interviewer — and it genuinely prevents the most common off-by-one class of errors.`
};

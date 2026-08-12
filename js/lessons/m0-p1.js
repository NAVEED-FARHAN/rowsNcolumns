window.LESSONS = window.LESSONS || {};

/* Lesson schema:
 *   id / module / page / title        — metadata (page = 1-based position in module)
 *   panels: one or more grids. Each: { id, label, style, rows, cols, initial }
 *     - label  : small caption above the grid (optional)
 *     - style  : "numpy" tints the grid to distinguish panels (optional)
 *     - rows/cols OR initial: `initial` is a ragged-safe array of rows;
 *       missing cells render blank and can be filled by step `writes`.
 *   code: the Python program, one string per line (optional)
 *   steps: [{ text, codeLine, panel, pointer, reads, writes, setGrid, tag, html }]
 *     - text     : the one causal idea revealed on this click (inline HTML ok)
 *     - codeLine : 0-based line of `code` highlighted "as it executes" (-1/none = no highlight)
 *     - panel    : which panel to animate (default: first panel)
 *     - pointer  : [[r,c], ...] path the moving pointer sweeps
 *     - reads    : [[r,c], ...] cells highlighted as being read
 *     - writes   : [[r,c,value], ...] cells whose value is animated in
 *     - setGrid  : { rows, cols, initial } rebuilds the panel (e.g. ragged/empty examples)
 *     - tag      : { cls, cells } adds a persistent class (e.g. "shared" = aliased rows)
 *     - html     : extra static HTML (diagrams, tables) rendered under the text
 *   interview  — "why this matters in interviews" note shown at the end
 *   recap      — final checklist (module last page only)
 */
window.LESSONS["m0-p1"] = {
  id: "m0-p1",
  module: 0,
  page: 1,
  title: "A Matrix is a List of Lists",

  panels: [{ id: "main", rows: 3, cols: 3 }],

  code: [
    "grid = [[1, 2, 3],",
    "        [4, 5, 6],",
    "        [7, 8, 9]]",
    "",
    "print(grid[0])      # [1, 2, 3]"
  ],

  steps: [
    {
      text: `A matrix in Python is just a <strong>list of lists</strong>. The outer list holds the rows; each row is its own inner list. Watch as Python evaluates the literal and the first row materializes.`,
      codeLine: 0,
      writes: [[0, 0, 1], [0, 1, 2], [0, 2, 3]]
    },
    {
      text: `Python evaluates the nested literal <em>left to right</em>, one inner list at a time. Each <code>[ … ]</code> is built on its own, then wrapped into the outer list. Here comes the second row.`,
      codeLine: 1,
      writes: [[1, 0, 4], [1, 1, 5], [1, 2, 6]]
    },
    {
      text: `And the third. Now <code>grid</code> holds <strong>three independent list objects</strong> — three rows — packed inside one outer list. This is the whole representation.`,
      codeLine: 2,
      writes: [[2, 0, 7], [2, 1, 8], [2, 2, 9]]
    },
    {
      text: `Read it back: <code>grid[0]</code> — the outer index — hands you the <strong>entire first row</strong>, the inner list <code>[1, 2, 3]</code>. Watch the pointer sweep it: one inner list, three numbers.`,
      codeLine: 4,
      panel: "main",
      pointer: [[0, 0], [0, 1], [0, 2]],
      reads: [[0, 0], [0, 1], [0, 2]]
    },
    {
      text: `Stepping down the outer list: <code>grid[1]</code> is row 1, <code>grid[2]</code> is row 2. The outer index selects a <em>row</em> — never a single number. That asymmetry is the entire mental model.`,
      pointer: [[0, 0], [1, 0], [2, 0]]
    },
    {
      text: `One thing to file away before the next pages: this is <strong>not</strong> a true 2D array like C or Java's <code>int[][]</code>. It's a Python list holding separate list objects — and what that means for memory is exactly what bites people on page 5.`,
      html: `<div class="diagram" aria-hidden="true">
        <div class="dbox d-outer">grid
          <div class="drow">[1, 2, 3]</div>
          <div class="drow">[4, 5, 6]</div>
          <div class="drow">[7, 8, 9]</div>
        </div>
        <p class="diagram-cap mono">three separate list objects inside one outer list</p>
      </div>`
    }
  ],

  interview: `LeetCode hands you virtually every matrix problem as <code>List[List[int]]</code> — this exact shape. Once you see it as “a list whose elements are rows,” indexing, dimensions, and traversal all become one idea instead of three.`
};

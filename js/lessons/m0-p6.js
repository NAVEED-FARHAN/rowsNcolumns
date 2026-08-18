window.LESSONS = window.LESSONS || {};

window.LESSONS["m0-p6"] = {
  id: "m0-p6",
  module: 0,
  page: 6,
  title: "NumPy Aside",

  panels: [
    {
      id: "plain",
      label: "plain list of lists",
      rows: 3, cols: 3,
      initial: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    },
    {
      id: "numpy",
      label: "numpy array",
      style: "numpy",
      rows: 3, cols: 3,
      initial: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    }
  ],

  code: [
    "import numpy as np",
    "",
    "grid  = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]",
    "grid2 = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])"
  ],

  steps: [
    {
      codeLine: 2,
      text: `In data science and ML, the “real” matrix type is <code>numpy.array</code>. Same numbers, same shape — but underneath it's a contiguous block of memory with C-speed math, not a list of Python objects. (The right-hand panel is tinted so you can tell them apart.)`
    },
    {
      codeLine: 3,
      text: `The payoff of numpy is <strong>vectorized arithmetic</strong>: <code>grid2 * 2</code> doubles every element in one fast pass. A plain list-of-lists has no such operator — you'd write nested loops. That's the whole reason numpy exists, and interview problems rarely need it.`
    },
    {
      text: `Practically, both support the same <code>[row][col]</code> indexing and both are mutable. The difference is what they're <em>for</em>:`,
      html: `<table class="compare">
        <tr><th></th><th>list of lists</th><th>numpy array</th></tr>
        <tr><td>indexing</td><td>grid[r][c]</td><td>grid[r][c]</td></tr>
        <tr><td>elementwise math</td><td>manual loops</td><td>grid * 2</td></tr>
        <tr><td>where you'll see it</td><td>algorithm work, interviews</td><td>numeric / ML pipelines</td></tr>
      </table>`
    },
    {
      codeLine: 2,
      panel: "plain",
      pointer: [[1, 2]],
      reads: [[1, 2]],
      text: `But here's the key for interviews: LeetCode tests against <strong>plain <code>List[List[int]]</code></strong> — the input your function receives is a list-of-lists, full stop. The pointer lands on <code>grid[1][2]</code> → 6, exactly as it did before numpy existed. Numpy is not the tool in that room.`
    },
    {
      text: `And one more caution: if an interviewer sees numpy used to <em>sidestep writing the actual loop logic</em> — a one-line vectorized trick that replaces the algorithm you were supposed to write — it can read as avoiding the point. Plain Python is the safe default unless numpy is explicitly allowed.`
    }
  ],

  interview: `Know that numpy exists and what it's for, then leave it at the door: interview problems are about reasoning through an algorithm, and plain lists keep that reasoning visible — which is exactly what you're being evaluated on.`
};

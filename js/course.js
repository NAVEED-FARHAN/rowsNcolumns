/* COURSE — course structure + progress tracking.
 *
 * Extensibility: to add a future topic, append a new module object to
 * `modules` and add lesson files to js/lessons/ (each registers itself in
 * window.LESSONS). Nothing else needs to change — the engine, landing page
 * and progress tracking are all data-driven.
 */
window.COURSE = {
  progressKey: "matrixmastery.v1",

  modules: [
    {
      id: 0,
      title: "Representing Matrices",
      tagline: "What a matrix actually is in Python — and the #1 initialization trap",
      status: "live",
      lessons: [
        { id: "m0-p1", title: "A Matrix is a List of Lists", file: "m0-p1" },
        { id: "m0-p2", title: "Indexing: grid[row][col]", file: "m0-p2" },
        { id: "m0-p3", title: "Dimensions: rows & cols", file: "m0-p3" },
        { id: "m0-p4", title: "Building Matrices", file: "m0-p4" },
        { id: "m0-p5", title: "The Shared-Row Bug", file: "m0-p5" },
        { id: "m0-p6", title: "NumPy Aside", file: "m0-p6" },
        { id: "m0-p7", title: "Worked Example + Recap", file: "m0-p7" }
      ]
    },
    {
      id: 1,
      title: "Traversal Patterns",
      tagline: "row-major, column-major, diagonals, spirals, neighbors, bounds checking",
      status: "live",
      lessons: [
        { id: "m1-p1", title: "Row-Major Traversal", file: "m1-p1" },
        { id: "m1-p2", title: "Column-Major Traversal", file: "m1-p2" },
        { id: "m1-p3", title: "The Main Diagonal", file: "m1-p3" },
        { id: "m1-p4", title: "The Anti-Diagonal", file: "m1-p4" },
        { id: "m1-p5", title: "Spiral: The Boundary Idea", file: "m1-p5" },
        { id: "m1-p6", title: "The 4-Directional Neighbor Pattern", file: "m1-p6" },
        { id: "m1-p7", title: "The Bounds-Checking Idiom", file: "m1-p7" },
        { id: "m1-p8", title: "Spiral Worked Example (1): Outer Layer", file: "m1-p8" },
        { id: "m1-p9", title: "Spiral Worked Example (2): Inward", file: "m1-p9" },
        { id: "m1-p10", title: "Recap + LeetCode Checklist", file: "m1-p10" }
      ]
    },
    {
      id: 2,
      title: "In-Place Transformations",
      tagline: "transpose, row reversal, and the rotate-90° combo",
      status: "live",
      lessons: [
        { id: "m2-p1", title: "Transpose In Place", file: "m2-p1" },
        { id: "m2-p2", title: "Reversing Rows & Columns", file: "m2-p2" },
        { id: "m2-p3", title: "Rotate 90° = Transpose + Reverse", file: "m2-p3" },
        { id: "m2-p4", title: "Why “In Place” Matters", file: "m2-p4" },
        { id: "m2-p5", title: "Worked Example (1): Transpose a 4×4", file: "m2-p5" },
        { id: "m2-p6", title: "Worked Example (2): Reverse Each Row", file: "m2-p6" },
        { id: "m2-p7", title: "Worked Example (3): Full Rotation", file: "m2-p7" },
        { id: "m2-p8", title: "Recap + LeetCode Checklist", file: "m2-p8" }
      ]
    },
    {
      id: 3,
      title: "Search in Matrices",
      tagline: "flattened binary search and the staircase search",
      status: "live",
      lessons: [
        { id: "m3-p1", title: "Sorted Matrix as a Flattened Array", file: "m3-p1" },
        { id: "m3-p2", title: "The Staircase Search", file: "m3-p2" },
        { id: "m3-p3", title: "When Each Technique Applies", file: "m3-p3" },
        { id: "m3-p4", title: "Worked Example (1): Staircase Setup", file: "m3-p4" },
        { id: "m3-p5", title: "Worked Example (2): To Completion", file: "m3-p5" },
        { id: "m3-p6", title: "Recap + LeetCode Checklist", file: "m3-p6" }
      ]
    },
    {
      id: 4,
      title: "Flood Fill: DFS & BFS",
      tagline: "matrix as a graph, visited tracking, recursion depth, multi-source BFS",
      status: "live",
      lessons: [
        { id: "m4-p1", title: "The Matrix as an Implicit Graph", file: "m4-p1" },
        { id: "m4-p2", title: "DFS With Recursion", file: "m4-p2" },
        { id: "m4-p3", title: "The Recursion Depth Caveat", file: "m4-p3" },
        { id: "m4-p4", title: "BFS With a Queue", file: "m4-p4" },
        { id: "m4-p5", title: "Three Ways to Track Visited", file: "m4-p5" },
        { id: "m4-p6", title: "Multi-Source BFS", file: "m4-p6" },
        { id: "m4-p7", title: "Worked Example (1): Flood Fill Setup", file: "m4-p7" },
        { id: "m4-p8", title: "Worked Example (2): Flood Fill via DFS", file: "m4-p8" },
        { id: "m4-p9", title: "Worked Example (3): Flood Fill via BFS", file: "m4-p9" },
        { id: "m4-p10", title: "Worked Example (4): Rotting Oranges Setup", file: "m4-p10" },
        { id: "m4-p11", title: "Worked Example (5): Rotting Oranges to Completion", file: "m4-p11" },
        { id: "m4-p12", title: "Common Pitfalls", file: "m4-p12" },
        { id: "m4-p13", title: "Recap + LeetCode Checklist", file: "m4-p13" }
      ]
    },
    {
      id: 5,
      title: "Dynamic Programming on Grids",
      tagline: "DP tables, base cases, transitions, space optimization",
      status: "live",
      lessons: [
        { id: "m5-p1", title: "The DP Table IS the Matrix", file: "m5-p1" },
        { id: "m5-p2", title: "Base Cases: First Row & Column", file: "m5-p2" },
        { id: "m5-p3", title: "The Transition: Why Order Matters", file: "m5-p3" },
        { id: "m5-p4", title: "Space Optimization: Rolling Array", file: "m5-p4" },
        { id: "m5-p5", title: "Worked Example (1): Setup + Base Cases", file: "m5-p5" },
        { id: "m5-p6", title: "Worked Example (2): Filling the Interior", file: "m5-p6" },
        { id: "m5-p7", title: "Worked Example (3): Rolling Version", file: "m5-p7" },
        { id: "m5-p8", title: "Common Pitfalls", file: "m5-p8" },
        { id: "m5-p9", title: "Recap + LeetCode Checklist", file: "m5-p9" }
      ]
    },
    {
      id: 6,
      title: "Prefix Sums",
      tagline: "the 1D recap and the 2D range-query generalization",
      status: "live",
      lessons: [
        { id: "m6-p1", title: "1D Prefix Sum Recap", file: "m6-p1" },
        { id: "m6-p2", title: "The 2D Formula (Inclusion-Exclusion)", file: "m6-p2" },
        { id: "m6-p3", title: "Building the Table: Padding Trick", file: "m6-p3" },
        { id: "m6-p4", title: "Worked Example (1): Building the Table", file: "m6-p4" },
        { id: "m6-p5", title: "Worked Example (2): Region Queries", file: "m6-p5" },
        { id: "m6-p6", title: "Common Pitfalls", file: "m6-p6" },
        { id: "m6-p7", title: "Recap + Course Complete", file: "m6-p7" }
      ]
    }
  ],

  /* ---------- progress (localStorage) ---------- */

  loadProgress: function () {
    try { return JSON.parse(localStorage.getItem(this.progressKey)) || {}; }
    catch (e) { return {}; }
  },

  saveProgress: function (p) {
    localStorage.setItem(this.progressKey, JSON.stringify(p));
  },

  isComplete: function (id) {
    return !!this.loadProgress()[id];
  },

  markComplete: function (id) {
    var p = this.loadProgress();
    p[id] = { done: true, at: Date.now() };
    this.saveProgress(p);
  },

  moduleProgress: function (m) {
    var p = this.loadProgress();
    var ls = m.lessons || [];
    if (!ls.length) return null;
    var done = ls.filter(function (l) { return p[l.id]; }).length;
    return done / ls.length;
  },

  /* ---------- lookups ---------- */

  moduleTitle: function (id) {
    return (this.modules[id] || {}).title || "Module " + id;
  },

  modulePageCount: function (id) {
    var m = this.modules[id];
    return m && m.lessons ? m.lessons.length : 0;
  },

  lessonTitle: function (id) {
    for (var i = 0; i < this.modules.length; i++) {
      var ls = this.modules[i].lessons || [];
      for (var j = 0; j < ls.length; j++) {
        if (ls[j].id === id) return ls[j].title;
      }
    }
    return id;
  },

  lessonById: function (id) {
    for (var i = 0; i < this.modules.length; i++) {
      var ls = this.modules[i].lessons || [];
      for (var j = 0; j < ls.length; j++) {
        if (ls[j].id === id) return ls[j];
      }
    }
    return null;
  },

  /* ---------- navigation ---------- */

  nextLesson: function (modId, page) {
    var ls = (this.modules[modId] || {}).lessons || [];
    for (var i = 0; i < ls.length; i++) {
      if (ls[i].id === "m" + modId + "-p" + page) {
        if (i + 1 < ls.length) return { module: modId, page: page + 1 };
        for (var j = modId + 1; j < this.modules.length; j++) {
          var nm = this.modules[j];
          if (nm.lessons && nm.lessons.length) return { module: j, page: 1 };
        }
        return null;
      }
    }
    return null;
  },

  prevLesson: function (modId, page) {
    var ls = (this.modules[modId] || {}).lessons || [];
    for (var i = 0; i < ls.length; i++) {
      if (ls[i].id === "m" + modId + "-p" + page) {
        if (i > 0) return { module: modId, page: page - 1 };
        for (var j = modId - 1; j >= 0; j--) {
          var pm = this.modules[j];
          if (pm.lessons && pm.lessons.length) {
            return { module: j, page: pm.lessons.length };
          }
        }
        return null;
      }
    }
    return null;
  }
};

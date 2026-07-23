/**
 * VIDAR Lab — Research Framework Diagram
 * Four-axis radial SVG diagram: Production / Example-aided / Machines / Interpretation
 *
 * Usage:
 *   <div id="research-diagram"></div>
 *   <script src="research-diagram.js"></script>
 *
 * To add future projects, add entries to the PROJECTS array with status: "future"
 * and uncomment the future node rendering block near the bottom of renderDiagram().
 */

(function () {
  // ─── CONFIG ────────────────────────────────────────────────────────────────

  let W, H, CX, CY, RING; // Will be set based on parent container

  // Axis angles (degrees from 12-o'clock, clockwise)
  const AXIS_ANGLE = {
    production: -90,
    example: 0,
    machines: 90,
    interpretation: 180,
  };

  // Color palette
  const COLOR = {
    bg: "#ffffff",
    centerFill: "#eef3fa",
    centerStroke: "#3d6aad",
    axisLine: "#c5d3e8",
    ring: "#73849c",
    ringDash: "#283444",
    labelAxis: "#2a4a80",
    labelSub: "#6a86aa",
    past: "#c8a96e",
    current: "#5ab88a",
    future: "#8b6fc6",
    knowledgeFlow: "#3d6aad",
    tooltipBg: "#ffffff",
    tooltipBorder: "#c5d3e8",
    tooltipText: "#1a2a3a",
    tooltipMeta: "#3d6aad",
    centerText: "#2a4a80",
  };

  // ─── PROJECT DATA ──────────────────────────────────────────────────────────

  let PROJECTS = [];

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (insideQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          insideQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        insideQuotes = true;
        continue;
      }

      if (char === ',') {
        row.push(field.trim());
        field = "";
        continue;
      }

      if (char === '\n') {
        row.push(field.trim());
        if (row.some(value => value.length > 0)) {
          rows.push(row);
        }
        row = [];
        field = "";
        continue;
      }

      if (char === '\r') {
        continue;
      }

      field += char;
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field.trim());
      if (row.some(value => value.length > 0)) {
        rows.push(row);
      }
    }

    if (rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map(values => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || "";
      });
      return record;
    });
  }

  function normalizeProject(row) {
    const offset = Number.parseFloat(row.offset || 0);
    return {
      id: row.id || "",
      axis: row.axis || "production",
      ring: row.ring || "inner",
      offset: Number.isNaN(offset) ? 0 : offset,
      status: row.status || "current",
      label: row.label || "",
      year: row.year || "",
      desc: row.desc || "",
      url: row.url || "#",
    };
  }

  function loadProjects(csvFilePath) {
    return fetch(csvFilePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load project data from ${csvFilePath}`);
        }
        return response.text();
      })
      .then((text) => {
        const rows = parseCSV(text);
        PROJECTS = rows.map(normalizeProject).filter((project) => project.label);
        return PROJECTS;
      })
      .catch((error) => {
        console.error("research-diagram: unable to load project data", error);
        PROJECTS = [];
        return PROJECTS;
      });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  function toRad(deg) { return (deg * Math.PI) / 180; }

  function polarToCart(angleDeg, radius) {
    const r = toRad(angleDeg);
    return { x: CX + radius * Math.cos(r), y: CY + radius * Math.sin(r) };
  }

  function projectXY(p) {
    const angle = AXIS_ANGLE[p.axis] + (p.offset || 0);
    const radius = p.ring === "future" ? RING.outer + 65 : RING[p.ring];
    return polarToCart(angle, radius);
  }

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  function renderDiagram(containerId) {
    const container = document.getElementById(containerId);
    if (!container) { console.error("research-diagram: container not found:", containerId); return; }

    W = container.offsetWidth || 950;
    H = W;
    CX = W / 2;
    CY = H / 2;

    const scale = W / 950;
    RING = { inner: 110 * scale, mid: 195 * scale, outer: 275 * scale };

    // ── Styles ──
    const style = document.createElement("style");
    style.textContent = `
      #rd-wrap { position: relative; display: inline-block; font-family: 'Georgia', serif; width: 100%; }
      #rd-wrap svg { display: block; width: 100%; height: auto; }
      #rd-tooltip {
        position: absolute;
        pointer-events: none;
        background: ${COLOR.tooltipBg};
        border: 1px solid ${COLOR.tooltipBorder};
        border-radius: 8px;
        padding: 10px 14px;
        max-width: 230px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        opacity: 0;
        transition: opacity 0.18s ease;
        z-index: 10;
      }
      #rd-tooltip.visible { opacity: 1; }
      #rd-tooltip .tt-label {
        font-size: 13px;
        font-weight: bold;
        color: ${COLOR.tooltipText};
        margin-bottom: 3px;
        letter-spacing: 0.01em;
      }
      #rd-tooltip .tt-year {
        font-size: 11px;
        color: ${COLOR.tooltipMeta};
        margin-bottom: 6px;
        font-style: italic;
      }
      #rd-tooltip .tt-desc {
        font-size: 11.5px;
        color: #445870;
        line-height: 1.5;
      }
      #rd-tooltip .tt-hint {
        font-size: 10px;
        color: #8a9db8;
        margin-top: 7px;
        border-top: 1px solid #dde6f2;
        padding-top: 5px;
      }
      .rd-node { cursor: pointer; }
      .rd-node:hover circle { filter: brightness(1.25); }
    `;
    document.head.appendChild(style);

    // ── Wrapper & tooltip ──
    const wrap = document.createElement("div");
    wrap.id = "rd-wrap";
    container.appendChild(wrap);

    const tooltip = document.createElement("div");
    tooltip.id = "rd-tooltip";
    tooltip.innerHTML = `<div class="tt-label"></div><div class="tt-year"></div><div class="tt-desc"></div><div class="tt-hint">Click to learn more →</div>`;
    wrap.appendChild(tooltip);

    // ── SVG — padded viewBox so edge labels aren't clipped ──
    const PAD = 80;
    const svg = svgEl("svg", {
      width: W,
      height: H,
      viewBox: `${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`,
      xmlns: "http://www.w3.org/2000/svg",
    });
    wrap.appendChild(svg);

    // ── Background ──
    svgEl("rect", {
      x: -PAD, y: -PAD,
      width: W + PAD * 2, height: H + PAD * 2,
      fill: COLOR.bg,
    }, svg);

    // ── Defs ──
    const defs = svgEl("defs", {}, svg);

    const rg = svgEl("radialGradient", { id: "centerGrad", cx: "50%", cy: "40%", r: "60%" }, defs);
    svgEl("stop", { offset: "0%", "stop-color": "#4a6aaa" }, rg);
    svgEl("stop", { offset: "100%", "stop-color": "#2a3a70" }, rg);

    const filt = svgEl("filter", { id: "glow", x: "-40%", y: "-40%", width: "180%", height: "180%" }, defs);
    svgEl("feGaussianBlur", { stdDeviation: "3", result: "blur" }, filt);
    const feMerge = svgEl("feMerge", {}, filt);
    svgEl("feMergeNode", { in: "blur" }, feMerge);
    svgEl("feMergeNode", { in: "SourceGraphic" }, feMerge);

    // ── Orbit rings ──
    for (const r of [RING.inner, RING.mid, RING.outer]) {
      svgEl("circle", {
        cx: CX, cy: CY, r,
        fill: "none",
        stroke: COLOR.ring,
        "stroke-width": "1",
        "stroke-dasharray": "3 6",
        opacity: "0.5",
      }, svg);
    }

    // ── Knowledge flow ring ──
    svgEl("circle", {
      cx: CX, cy: CY, r: RING.outer + 44,
      fill: "none",
      stroke: COLOR.knowledgeFlow,
      "stroke-width": "1",
      "stroke-dasharray": "5 10",
      opacity: "0.35",
    }, svg);

    // ── Axis lines ──
    const AXIS_META = [
      { key: "production",     label: "Author",          sub: "How designers create artifacts" },
      { key: "example",        label: "Adapt", sub: "How designers use existing artifacts" },
      { key: "machines",       label: "Augment",             sub: "How machines learn from and generate artifacts" },
      { key: "interpretation", label: "Interprete",       sub: "How people read artifacts" },
    ];

    for (const ax of AXIS_META) {
      const angle = AXIS_ANGLE[ax.key];
      const isHorizontal = (angle === 0 || angle === 180);

      // text-anchor based on axis direction
      const anchor = angle === 0 ? "start" : angle === 180 ? "end" : "middle";

      // axis line end point
      const far = polarToCart(angle, RING.outer + 20);
      svgEl("line", {
        x1: CX, y1: CY, x2: far.x, y2: far.y,
        stroke: COLOR.axisLine, "stroke-width": "1.5", opacity: "0.7",
      }, svg);

      // label position
      const labelPt = polarToCart(angle, RING.outer + 75);

      // sub-label position:
      // horizontal axes: same x as label, nudged up 24px
      // vertical axes: further along the axis
      let subX, subY;
      if (isHorizontal) {
        subX = labelPt.x;
        subY = labelPt.y - 50;
      } else {
        const subPt = polarToCart(angle, RING.outer + 105);
        subX = subPt.x;
        subY = subPt.y;
      }

      // sub-label (rendered first so it sits behind the main label)
      const subText = svgEl("text", {
        x: subX, y: subY,
        fill: COLOR.labelSub,
        "font-size": "20",
        "font-family": "Georgia, serif",
        "text-anchor": anchor,
        "dominant-baseline": "middle",
        "font-style": "italic",
      }, svg);

      // Allow splitting the subtext into two lines for long phrases (example axis)
      if (ax.key === "example") {
        svgEl("tspan", { x: subX, dy: "-0.45em" }, subText).textContent = "How existing artifacts";
        svgEl("tspan", { x: subX, dy: "1.05em" }, subText).textContent = "shape designers' work";
      } else if (ax.key === "interpretation") {
        svgEl("tspan", { x: subX, dy: "-0.45em" }, subText).textContent = "How people";
        svgEl("tspan", { x: subX, dy: "1.05em" }, subText).textContent = "read artifacts";
      }else {
        subText.textContent = ax.sub;
      }

      // main axis label
      const labelText = svgEl("text", {
        x: labelPt.x, y: labelPt.y,
        fill: COLOR.labelAxis,
        "font-size": "25",
        "font-family": "Georgia, serif",
        "font-weight": "bold",
        "text-anchor": anchor,
        "dominant-baseline": "middle",
        "letter-spacing": "0.03em",
      }, svg);
        labelText.textContent = ax.label;
    }

    // ── Center circle ──
    svgEl("circle", {
      cx: CX, cy: CY, r: 58 * scale,
      fill: "url(#centerGrad)",
      stroke: COLOR.centerStroke,
      "stroke-width": "1.5",
    }, svg);

    for (const line of [
      { text: "Visualization", dy: -10 * scale },
      { text: "design",        dy:   6 * scale },
      { text: "artifacts",     dy:  22 * scale },
    ]) {
      svgEl("text", {
        x: CX, y: CY + line.dy,
        fill: "#e8f0ff",
        "font-size": 15,
        "font-family": "Georgia, serif",
        "font-weight": "600",
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        "font-style": "italic",
        "letter-spacing": "0.04em",
      }, svg).textContent = line.text;
    }

    // ── Legend ──
    let lx = 24, ly = H - 28;
    for (const li of [{ color: COLOR.past, label: "Past" }, { color: COLOR.current, label: "Current" }]) {
      svgEl("circle", { cx: lx + 6, cy: ly, r: 5, fill: li.color, opacity: "0.85" }, svg);
      svgEl("text", {
        x: lx + 16, y: ly,
        fill: "#4a6080", "font-size": "11",
        "font-family": "Georgia, serif", "dominant-baseline": "middle",
      }, svg).textContent = li.label;
      lx += 70;
    }

    // ── Project nodes ──
    for (const p of PROJECTS) {
      const { x, y } = projectXY(p);
      const fill = p.status === "past" ? COLOR.past : p.status === "current" ? COLOR.current : COLOR.future;
      const r = (p.status === "current" ? 9 : 7) * scale;

      const g = svgEl("g", { class: "rd-node" }, svg);

      if (p.status === "current") {
        svgEl("circle", { cx: x, cy: y, r: r + 5, fill, opacity: "0.18" }, g);
      }

      svgEl("circle", {
        cx: x, cy: y, r, fill,
        opacity: "0.9",
        stroke: p.status === "current" ? "#aabbcc" : "none",
        "stroke-width": "1.5",
        filter: p.status === "current" ? "url(#glow)" : "",
      }, g);

      // larger invisible hit target for easier hovering
      svgEl("circle", { cx: x, cy: y, r: 18, fill: "transparent" }, g);

      g.addEventListener("mouseenter", () => {
        tooltip.querySelector(".tt-label").textContent = p.label;
        tooltip.querySelector(".tt-year").textContent = p.year;
        tooltip.querySelector(".tt-desc").textContent = p.desc;
        tooltip.classList.add("visible");
        positionTooltip(x, y);
      });
      g.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      g.addEventListener("click", () => {
        console.log("Project clicked:", p.label, p.url);
        if (p.url && p.url !== "#") window.open(p.url, "_blank");
      });
    }

    // ── Tooltip positioning ──
    function positionTooltip(nx, ny) {
      // Account for the padded viewBox: shift node coords by PAD before scaling
      const rect = wrap.getBoundingClientRect();
      const totalSVGW = W + PAD * 2;
      const totalSVGH = H + PAD * 2;
      const scaleX = rect.width / totalSVGW;
      const scaleY = rect.height / totalSVGH;
      const px = (nx + PAD) * scaleX;
      const py = (ny + PAD) * scaleY;

      const tw = 240, th = 120;
      let left = px + 14;
      let top  = py - 55;

      if (left + tw > rect.width - 8) left = px - tw - 14;
      if (top < 4) top = 4;
      if (top + th > rect.height) top = rect.height - th - 4;

      tooltip.style.left = left + "px";
      tooltip.style.top  = top  + "px";
    }
  }

  // ─── AUTO-INIT ─────────────────────────────────────────────────────────────

  function init() {
    const target = document.getElementById("research-diagram");
    if (!target) return;
    loadProjects("../data/research-projects.csv").then(() => renderDiagram("research-diagram"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.renderResearchDiagram = renderDiagram;
})();
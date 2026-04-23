/**
 * Lecture PDF Generator — jsPDF + autoTable
 * Produces real text-based PDFs (selectable & copyable text)
 * Exposes: window.LecturePDF.generate(code, options)
 */
(function () {
  "use strict";

  /* ── CDN loader ── */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = () => reject(new Error("فشل تحميل مكتبة: " + url));
      document.head.appendChild(s);
    });
  }

  async function ensureLibs() {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js");
  }

  /* ── Parse user JS code ── */
  function parseSummary(code) {
    code = code.replace(/^```[\s\S]*?\n/, "").replace(/\n```\s*$/, "");
    try {
      const fn = new Function(`
        ${code}
        if (typeof lectureSummary !== 'undefined') return lectureSummary;
        throw new Error('lectureSummary object not found');
      `);
      return fn();
    } catch (e) {
      throw new Error("خطأ في تحليل الملخص: " + e.message);
    }
  }

  /* ── Sanitize text: replace Unicode chars unsupported by Helvetica ── */
  function sanitize(text) {
    if (!text) return "";
    return text
      .replace(/\*\*/g, "")      // remove markdown bold **
      .replace(/\*/g, "")        // remove markdown italic *
      .replace(/`/g, "'")        // backticks to quotes
      .replace(/→/g, "->")
      .replace(/←/g, "<-")
      .replace(/↔/g, "<->")
      .replace(/≥/g, ">=")
      .replace(/≤/g, "<=")
      .replace(/≠/g, "!=")
      .replace(/±/g, "+/-")
      .replace(/×/g, "x")
      .replace(/÷/g, "/")
      .replace(/·/g, ".")
      .replace(/•/g, "-")
      .replace(/—/g, "--")
      .replace(/–/g, "-")
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      .replace(/…/g, "...")
      .replace(/∞/g, "inf")
      .replace(/∑/g, "Sum")
      .replace(/∂/g, "d")
      .replace(/√/g, "sqrt")
      .replace(/π/g, "pi")
      .replace(/α/g, "alpha")
      .replace(/β/g, "beta")
      .replace(/γ/g, "gamma")
      .replace(/δ/g, "delta")
      .replace(/ε/g, "epsilon")
      .replace(/η/g, "eta")
      .replace(/θ/g, "theta")
      .replace(/λ/g, "lambda")
      .replace(/μ/g, "mu")
      .replace(/σ/g, "sigma")
      .replace(/τ/g, "tau")
      .replace(/φ/g, "phi")
      .replace(/ω/g, "omega")
      .replace(/Δ/g, "Delta")
      .replace(/Σ/g, "Sigma")
      .replace(/Ω/g, "Omega")
      .replace(/°/g, " deg")
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/¹/g, "^1")
      .replace(/⁻/g, "^-")
      .replace(/ˣ/g, "^x")
      .replace(/ⁱ/g, "^i")
      .replace(/ⱼ/g, "_j")
      .replace(/₁/g, "_1")
      .replace(/₂/g, "_2")
      .replace(/₃/g, "_3")
      .replace(/✓/g, "[ok]")
      .replace(/✗/g, "[x]")
      .replace(/✦/g, "*")
      .replace(/[^\x00-\x7E]/g, "?");  // any remaining non-ASCII -> ?
  }

  /* ── Colors ── */
  const COLORS = {
    accent:    [192, 57, 43],
    accent2:   [217, 119, 6],
    blue:      [37, 99, 235],
    purple:    [108, 92, 231],
    dark:      [26, 26, 46],
    gray:      [100, 100, 100],
    lightGray: [200, 200, 200],
    white:     [255, 255, 255],
    bgLight:   [248, 248, 248],
    bgCallInfo:    [238, 246, 255],
    bgCallTip:     [238, 251, 243],
    bgCallWarn:    [254, 246, 240],
    bgCallNote:    [245, 245, 245],
    bgCallImp:     [253, 240, 240],
    borderInfo:    [33, 150, 243],
    borderTip:     [39, 174, 96],
    borderWarn:    [230, 126, 34],
    borderNote:    [136, 136, 136],
    borderImp:     [192, 57, 43],
    tableBg:   [44, 62, 80],
  };

  /* ── PDF generation ── */
  async function generate(code, opts = {}) {
    const onStatus = opts.onStatus || (() => {});

    onStatus("parse");
    const summary = parseSummary(code);

    onStatus("render");
    await ensureLibs();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginL = 16;
    const marginR = 16;
    const maxW = pageW - marginL - marginR;
    let y = 20;

    /* ── Helpers ── */
    function checkBreak(need) {
      if (y + need > pageH - 18) {
        doc.addPage();
        y = 20;
      }
    }

    function setColor(rgb) {
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    }

    function drawText(text, x, fontSize, style, color, lineH) {
      doc.setFont("Helvetica", style);
      doc.setFontSize(fontSize);
      setColor(color);
      const clean = sanitize(text);
      const lines = doc.splitTextToSize(clean, maxW - (x - marginL));
      const blockH = lines.length * lineH;
      checkBreak(blockH);
      lines.forEach((line) => {
        checkBreak(lineH);
        doc.text(line, x, y);
        y += lineH;
      });
    }

    function drawRule(color, thickness) {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(thickness);
      doc.line(marginL, y, pageW - marginR, y);
      y += 3;
    }

    /* ── Section renderers ── */

    function renderHeading(text) {
      y += 6;
      checkBreak(14);

      // Accent bar
      doc.setFillColor(...COLORS.accent);
      doc.rect(marginL, y - 5, 3, 8, "F");

      drawText(text, marginL + 7, 16, "bold", COLORS.dark, 7);
      y += 1;
      drawRule(COLORS.lightGray, 0.3);
      y += 2;
    }

    function renderSubheading(text) {
      y += 4;
      checkBreak(10);
      drawText(text, marginL, 13, "bold", COLORS.blue, 6);
      y += 2;
    }

    function renderParagraph(text) {
      checkBreak(8);
      drawText(text, marginL, 10.5, "normal", COLORS.dark, 5);
      y += 3;
    }

    function renderList(items, numbered) {
      checkBreak(6);
      (items || []).forEach((item, i) => {
        const prefix = numbered ? `${i + 1}.  ` : "-  ";
        drawText(prefix + item, marginL + 4, 10.5, "normal", COLORS.dark, 5);
        y += 1;
      });
      y += 2;
    }

    function renderDefinition(term, definition) {
      checkBreak(14);

      // Purple left bar
      doc.setFillColor(...COLORS.purple);
      doc.rect(marginL, y - 4, 2.5, 10, "F");

      // Background
      doc.setFillColor(247, 245, 255);
      doc.rect(marginL + 2.5, y - 4, maxW - 2.5, 10, "F");

      drawText(term + ":  " + sanitize(definition), marginL + 6, 10.5, "italic", COLORS.purple, 5);
      y += 4;
    }

    function renderCallout(title, text, variant) {
      const v = variant || "info";
      let bgColor, borderColor, titleColor;

      switch (v) {
        case "tip":       bgColor = COLORS.bgCallTip;  borderColor = COLORS.borderTip;  titleColor = COLORS.borderTip;  break;
        case "warning":   bgColor = COLORS.bgCallWarn; borderColor = COLORS.borderWarn; titleColor = COLORS.borderWarn; break;
        case "note":      bgColor = COLORS.bgCallNote; borderColor = COLORS.borderNote; titleColor = COLORS.borderNote; break;
        case "important": bgColor = COLORS.bgCallImp;  borderColor = COLORS.borderImp;  titleColor = COLORS.borderImp;  break;
        default:          bgColor = COLORS.bgCallInfo;  borderColor = COLORS.borderInfo;  titleColor = COLORS.borderInfo;
      }

      const cleanTitle = sanitize(title || v.toUpperCase());
      const cleanText = sanitize(text || "");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      const textLines = doc.splitTextToSize(cleanText, maxW - 12);
      const boxH = 8 + textLines.length * 4.5 + 4;

      checkBreak(boxH + 4);

      // Background box
      doc.setFillColor(...bgColor);
      doc.roundedRect(marginL, y - 2, maxW, boxH, 2, 2, "F");

      // Left border bar
      doc.setFillColor(...borderColor);
      doc.rect(marginL, y - 2, 2.5, boxH, "F");

      // Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      setColor(titleColor);
      doc.text(cleanTitle, marginL + 6, y + 4);

      // Body
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      setColor(COLORS.dark);
      let ty = y + 10;
      textLines.forEach((line) => {
        doc.text(line, marginL + 6, ty);
        ty += 4.5;
      });

      y += boxH + 4;
    }

    function renderTable(headers, rows) {
      checkBreak(20);
      doc.autoTable({
        startY: y,
        head: [headers.map(h => sanitize(h))],
        body: (rows || []).map(row => row.map(cell => sanitize(cell))),
        styles: {
          font: "Helvetica",
          fontSize: 9.5,
          cellPadding: 3,
          textColor: COLORS.dark,
        },
        headStyles: {
          fillColor: COLORS.tableBg,
          textColor: COLORS.white,
          fontStyle: "bold",
          fontSize: 9.5,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: marginL, right: marginR },
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    function renderFormula(label, expression) {
      checkBreak(18);

      // Box background
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(marginL, y - 2, maxW, 16, 2, 2, "FD");

      // Label
      if (label) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        setColor(COLORS.gray);
        doc.text(sanitize(label).toUpperCase(), marginL + 4, y + 3);
      }

      // Expression centered
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(13);
      setColor(COLORS.dark);
      const exprClean = sanitize(expression);
      const tw = doc.getTextWidth(exprClean);
      doc.text(exprClean, marginL + (maxW - tw) / 2, y + 11);

      y += 20;
    }

    function renderQuote(text, author) {
      checkBreak(16);

      const cleanText = sanitize(text);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize('"' + cleanText + '"', maxW - 12);
      const boxH = lines.length * 5 + (author ? 10 : 4);

      // Background
      doc.setFillColor(253, 248, 247);
      doc.roundedRect(marginL, y - 2, maxW, boxH, 2, 2, "F");

      // Left bar
      doc.setFillColor(...COLORS.accent);
      doc.rect(marginL, y - 2, 2.5, boxH, "F");

      // Quote text
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10.5);
      setColor([68, 68, 68]);
      let qy = y + 3;
      lines.forEach((line) => {
        doc.text(line, marginL + 6, qy);
        qy += 5;
      });

      // Author
      if (author) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        setColor(COLORS.gray);
        doc.text("-- " + sanitize(author), marginL + 6, qy + 2);
      }

      y += boxH + 4;
    }

    function renderCode(language, code) {
      const cleanCode = sanitize(code || "");
      const codeLines = cleanCode.split("\n");

      doc.setFont("Courier", "normal");
      doc.setFontSize(8.5);

      const lineH = 4;
      const boxH = codeLines.length * lineH + 10 + (language ? 6 : 0);
      checkBreak(boxH);

      // Dark background
      doc.setFillColor(30, 30, 46);
      doc.roundedRect(marginL, y - 2, maxW, boxH, 2, 2, "F");

      let cy = y + 3;

      // Language badge
      if (language) {
        doc.setFont("Courier", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 170);
        doc.text(language.toUpperCase(), marginL + 4, cy);
        cy += 6;
      }

      // Code lines
      doc.setFont("Courier", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(212, 212, 212);
      codeLines.forEach((line) => {
        doc.text(line, marginL + 4, cy);
        cy += lineH;
      });

      y += boxH + 4;
    }

    function renderDivider() {
      y += 4;
      drawRule(COLORS.lightGray, 0.4);
      y += 4;
    }

    function renderTakeaways(items) {
      checkBreak(14);

      const cleanItems = (items || []).map(i => sanitize(i));

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      let totalLines = 0;
      cleanItems.forEach(item => {
        totalLines += doc.splitTextToSize("-  " + item, maxW - 14).length;
      });
      const boxH = 12 + totalLines * 5 + 6;

      checkBreak(boxH);

      // Gradient-ish background
      doc.setFillColor(254, 249, 240);
      doc.setDrawColor(240, 221, 214);
      doc.roundedRect(marginL, y - 2, maxW, boxH, 3, 3, "FD");

      // Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      setColor(COLORS.accent);
      doc.text("Key Takeaways", marginL + 6, y + 7);

      let ty = y + 14;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      setColor(COLORS.dark);

      cleanItems.forEach((item) => {
        const lines = doc.splitTextToSize("-  " + item, maxW - 14);
        lines.forEach((line) => {
          checkBreak(5);
          doc.text(line, marginL + 6, ty);
          ty += 5;
        });
        ty += 1;
      });

      y = ty + 4;
    }

    /* ── Title Page ── */
    checkBreak(30);

    // Title bar accent
    doc.setFillColor(...COLORS.accent);
    doc.rect(marginL, y - 4, maxW, 2, "F");
    y += 4;

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    setColor(COLORS.dark);
    const titleLines = doc.splitTextToSize(sanitize(summary.title || "Lecture Summary"), maxW);
    titleLines.forEach((line) => {
      doc.text(line, marginL, y);
      y += 9;
    });
    y += 1;

    // Subtitle
    if (summary.subtitle) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(14);
      setColor(COLORS.gray);
      doc.text(sanitize(summary.subtitle), marginL, y);
      y += 8;
    }

    // Course & Author
    if (summary.course || summary.author) {
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10);
      setColor(COLORS.gray);
      const meta = [summary.course, summary.author].filter(Boolean).map(sanitize).join("  |  ");
      doc.text(meta, marginL, y);
      y += 6;
    }

    // Separator
    y += 2;
    drawRule(COLORS.lightGray, 0.5);
    y += 4;

    /* ── Render sections ── */
    (summary.sections || []).forEach((sec) => {
      switch (sec.type) {
        case "heading":     renderHeading(sec.text);                          break;
        case "subheading":  renderSubheading(sec.text);                      break;
        case "paragraph":   renderParagraph(sec.text);                       break;
        case "list":        renderList(sec.items, sec.style === "numbered"); break;
        case "definition":  renderDefinition(sec.term, sec.definition);     break;
        case "callout":     renderCallout(sec.title, sec.text, sec.variant);break;
        case "table":       renderTable(sec.headers, sec.rows);             break;
        case "formula":     renderFormula(sec.label, sec.expression);       break;
        case "quote":       renderQuote(sec.text, sec.author);              break;
        case "code":        renderCode(sec.language, sec.code);             break;
        case "divider":     renderDivider();                                break;
        case "takeaways":   renderTakeaways(sec.items);                     break;
      }
    });

    onStatus("export");

    /* ── Save ── */
    const filename =
      (summary.title || "lecture")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim()
        .replace(/\s+/g, "_") + ".pdf";

    doc.save(filename);
    onStatus("done");
  }

  /* ── Expose globally ── */
  window.LecturePDF = { generate };
})();

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── colour palette ──────────────────────────────────────────
const C = {
  headerBg:    [13,  27,  18],   // dark green
  headerText:  [74,  222, 128],  // accent green
  subText:     [160, 180, 160],
  batHead:     [22,  101, 52],   // green-700
  bowlHead:    [30,  58,  138],  // blue-900
  headText:    [255, 255, 255],
  rowAlt:      [245, 250, 246],  // very light green tint
  rowNorm:     [255, 255, 255],
  cellText:    [20,  30,  20],
  dimText:     [100, 120, 100],
  totalBg:     [22,  101, 52],
  totalText:   [255, 255, 255],
  sectionTitle:[22,  101, 52],
  foWText:     [80,  80,  80],
  borderColor: [200, 220, 200],
  amber:       [180, 120, 10],
  resultBg:    [22,  101, 52],
};

const PAGE_W    = 210;  // A4 width mm
const MARGIN    = 14;
const USABLE_W  = PAGE_W - MARGIN * 2;  // 182 mm

// ── helpers ─────────────────────────────────────────────────
const sr  = (r, b) => b > 0 ? ((r / b) * 100).toFixed(1) : '-';
const eco = (r, o, b) => {
  const balls = o * 6 + (b || 0);
  return balls > 0 ? ((r / balls) * 6).toFixed(2) : '-';
};
const overs = (o, b) => b > 0 ? `${o}.${b}` : `${o}`;

// ── draw a horizontal rule ───────────────────────────────────
const rule = (doc, y, color = [200, 220, 200]) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
};

// ── section heading pill ─────────────────────────────────────
const sectionHeading = (doc, text, y) => {
  doc.setFillColor(...C.sectionTitle);
  doc.roundedRect(MARGIN, y - 4.5, USABLE_W, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...C.headText);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(text.toUpperCase(), MARGIN + 3, y);
  return y + 6;
};

// ── batting table ─────────────────────────────────────────────
const battingTable = (doc, batting, startY) => {
  const rows = (batting || [])
    .filter(b => b && (b.balls > 0 || b.out))
    .map(b => [
      b.name,
      b.out ? b.dismissal : 'not out',
      b.runs ?? 0,
      b.balls ?? 0,
      b.fours ?? 0,
      b.sixes ?? 0,
      sr(b.runs, b.balls),
    ]);

  if (rows.length === 0) return startY;

  autoTable(doc, {
    startY,
    head: [['Batter', 'Dismissal', 'R', 'B', '4s', '6s', 'SR']],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: C.cellText,
      lineColor: C.borderColor,
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: C.batHead,
      textColor: C.headText,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    bodyStyles: { fillColor: C.rowNorm },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', textColor: [20, 40, 20] },
      1: { cellWidth: 72, fontSize: 7.5, textColor: C.dimText, fontStyle: 'italic' },
      2: { cellWidth: 14, halign: 'right', fontStyle: 'bold', textColor: [20, 100, 40] },
      3: { cellWidth: 14, halign: 'right' },
      4: { cellWidth: 12, halign: 'right', textColor: [80, 130, 80] },
      5: { cellWidth: 12, halign: 'right', textColor: [80, 130, 80] },
      6: { cellWidth: 20, halign: 'right', textColor: C.dimText },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  return doc.lastAutoTable.finalY;
};

// ── bowling table ─────────────────────────────────────────────
const bowlingTable = (doc, bowling, startY) => {
  const rows = (bowling || [])
    .filter(b => b && (b.overs > 0 || b.balls > 0))
    .map(b => [
      b.name,
      overs(b.overs, b.balls),
      b.maidens ?? 0,
      b.runs ?? 0,
      b.wickets ?? 0,
      eco(b.runs, b.overs, b.balls),
    ]);

  if (rows.length === 0) return startY;

  autoTable(doc, {
    startY,
    head: [['Bowler', 'O', 'M', 'R', 'W', 'Eco']],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: C.cellText,
      lineColor: C.borderColor,
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: C.bowlHead,
      textColor: C.headText,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    bodyStyles: { fillColor: C.rowNorm },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', textColor: [20, 30, 80] },
      1: { cellWidth: 22, halign: 'right' },
      2: { cellWidth: 18, halign: 'right', textColor: C.dimText },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [180, 20, 20] },
      5: { cellWidth: 38, halign: 'right', textColor: C.dimText },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  return doc.lastAutoTable.finalY;
};

// ── extras + total bar ────────────────────────────────────────
const extrasTotal = (doc, ex, score, wickets, ovsStr, y) => {
  ex = ex || {};
  const extTotal = (ex.wide||0) + (ex.noball||0) + (ex.bye||0) + (ex.legbye||0);
  const extStr = `Extras: ${extTotal}  (Wd ${ex.wide||0}  NB ${ex.noball||0}  B ${ex.bye||0}  LB ${ex.legbye||0})`;
  const totalStr = `TOTAL: ${score}/${wickets}  (${ovsStr} Ov)`;

  // extras row
  doc.setFillColor(240, 245, 241);
  doc.setDrawColor(...C.borderColor);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y, USABLE_W, 7, 'FD');
  doc.setTextColor(...C.foWText);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(extStr, MARGIN + 3, y + 4.8);

  // total row
  y += 7;
  doc.setFillColor(...C.totalBg);
  doc.rect(MARGIN, y, USABLE_W, 8, 'F');
  doc.setTextColor(...C.totalText);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(totalStr, MARGIN + 3, y + 5.5);

  return y + 8;
};

// ── fall of wickets ───────────────────────────────────────────
const fowRow = (doc, fow, y) => {
  if (!fow || !fow.length) return y;
  doc.setFillColor(252, 252, 248);
  doc.setDrawColor(...C.borderColor);
  doc.setLineWidth(0.2);
  const fowText = fow.map(f => `${f.wicket}-${f.score} (${f.batsman}, ${f.over}ov)`).join('   ');
  const lines = doc.splitTextToSize(`FOW: ${fowText}`, USABLE_W - 6);
  const h = lines.length * 5 + 4;
  doc.rect(MARGIN, y, USABLE_W, h, 'FD');
  doc.setTextColor(...C.foWText);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(lines, MARGIN + 3, y + 4);
  return y + h;
};

// ── page overflow guard ───────────────────────────────────────
const checkPage = (doc, y, needed = 20) => {
  if (y + needed > 275) { doc.addPage(); return 16; }
  return y;
};

// ════════════════════════════════════════════════════════════════
export const exportScorecardPDF = (matchData) => {
  const {
    teamA, teamB, totalOvers, innings1, innings, score, wickets,
    currentOver, currentBall, striker, nonStriker, bowler,
    battingLineup, bowlingLineup, fallOfWickets, extras, target,
    result, winner, tossWonBy, tossChoice, battingTeam,
  } = matchData;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── HEADER ──────────────────────────────────────────────────
  // dark banner
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, PAGE_W, 36, 'F');

  // cricket ball icon (simple circle)
  doc.setFillColor(200, 40, 40);
  doc.circle(MARGIN + 5, 13, 5, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(MARGIN + 1, 13, MARGIN + 9, 13);
  doc.arc && doc.arc(MARGIN + 5, 13, 5, 0, Math.PI, false);

  // title
  doc.setTextColor(...C.headerText);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CRICKET SCORECARD', PAGE_W / 2, 11, { align: 'center' });

  // match info
  doc.setTextColor(...C.subText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${teamA}  vs  ${teamB}  ·  ${totalOvers} Overs`, PAGE_W / 2, 19, { align: 'center' });

  if (tossWonBy) {
    doc.setFontSize(8.5);
    doc.text(`Toss: ${tossWonBy} won & elected to ${tossChoice || 'bat'}`, PAGE_W / 2, 25.5, { align: 'center' });
  }

  doc.setFontSize(7.5);
  doc.setTextColor(120, 150, 120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_W / 2, 31, { align: 'center' });

  // result banner
  if (result) {
    doc.setFillColor(...C.resultBg);
    doc.roundedRect(MARGIN, 37, USABLE_W, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`🏆  ${winner} ${result}`, PAGE_W / 2, 43, { align: 'center' });
  }

  let y = result ? 51 : 43;

  // ── helper: render one full innings ─────────────────────────
  const renderInnings = (label, batting, bowling, sc, wk, ovsStr, ex, fow, tgt, bowlTeamLabel) => {
    y = checkPage(doc, y, 18);

    // innings banner
    y = sectionHeading(doc, label, y);
    y += 3;

    // sub-label: batting team
    y = checkPage(doc, y, 10);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.batHead);
    doc.text('BATTING', MARGIN, y);
    if (tgt) {
      doc.setTextColor(...C.amber);
      doc.text(`Target: ${tgt}`, PAGE_W - MARGIN, y, { align: 'right' });
    }
    y += 3;

    y = checkPage(doc, y, 30);
    y = battingTable(doc, batting, y);
    y += 1;
    y = extrasTotal(doc, ex, sc, wk, ovsStr, y);
    y += 1;
    y = fowRow(doc, fow, y);
    y += 5;

    // bowling section
    y = checkPage(doc, y, 20);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.bowlHead);
    doc.text(`BOWLING${bowlTeamLabel ? ' — ' + bowlTeamLabel.toUpperCase() : ''}`, MARGIN, y);
    y += 3;

    y = checkPage(doc, y, 20);
    y = bowlingTable(doc, bowling, y);
    y += 8;
  };

  // ── INNINGS 1 ────────────────────────────────────────────────
  if (innings1) {
    const bowlTeam = innings1.battingTeam === teamA ? teamB : teamA;
    renderInnings(
      `1ST INNINGS  —  ${innings1.battingTeam || teamA}`,
      innings1.batting || [],
      innings1.bowling || [],
      innings1.score,
      innings1.wickets,
      innings1.overs,
      innings1.extras,
      innings1.fallOfWickets,
      null,
      bowlTeam
    );
  }

  // ── INNINGS 2 (or current innings if still inn 1) ────────────
  const inn2BatTeam = battingTeam === 'A' ? teamA : teamB;
  const inn2BowlTeam = battingTeam === 'A' ? teamB : teamA;
  const battingAll = [
    striker, nonStriker,
    ...battingLineup.filter(b => b && b.name !== striker?.name && b.name !== nonStriker?.name),
  ].filter(Boolean);
  const bowlingAll = bowlingLineup.map(b =>
    b.name === bowler?.name ? { ...bowler } : b
  );

  renderInnings(
    `${innings === 1 ? '1ST' : '2ND'} INNINGS  —  ${inn2BatTeam}`,
    battingAll,
    bowlingAll,
    score,
    wickets,
    `${currentOver}.${currentBall}`,
    extras,
    fallOfWickets,
    target || null,
    inn2BowlTeam
  );

  // ── FOOTER ───────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 245, 241);
    doc.rect(0, 287, PAGE_W, 10, 'F');
    doc.setTextColor(140, 160, 140);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Cricket Live Score  ·  Official Scorecard', MARGIN, 293);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, 293, { align: 'right' });
  }

  doc.save(`Scorecard_${teamA}_vs_${teamB}_${Date.now()}.pdf`);
};

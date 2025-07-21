figma.showUI(__html__, { width: 320, height: 480 });

figma.ui.onmessage = (msg) => {
  if (msg.type !== 'apply-gradient') return;

  const selection = figma.currentPage.selection;
  if (selection.length !== 1 || selection[0].type !== 'FRAME') {
    figma.notify("Please select a single frame with bar elements.");
    return;
  }

  const container = selection[0];
  const bars = container.children.filter(node =>
    node.type === "RECTANGLE" || node.type === "FRAME"
  );

  if (bars.length === 0) {
    figma.notify("No bars found.");
    return;
  }

  const maxHeight = Math.max(...bars.map(bar => bar.height));
  const stops = msg.stops;

  for (const bar of bars) {
    const ratio = bar.height / maxHeight * 100;

    const fillColor = getColorFromStops(ratio, stops);

    const fill = {
      type: "SOLID",
      color: fillColor
    };

    if (bar.type === "RECTANGLE") {
      bar.fills = [fill];
    } else if (bar.type === "FRAME") {
      try {
        bar.fills = [fill];
      } catch (e) {
        const bg = bar.findOne(n => n.type === "RECTANGLE");
        if (bg) bg.fills = [fill];
      }
    }
  }

  figma.closePlugin("Multi-stop gradient applied!");
};

function getColorFromStops(percent, stops) {
  if (percent <= stops[0].position) return stops[0].color;
  if (percent >= stops[stops.length - 1].position) return stops[stops.length - 1].color;

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (percent >= a.position && percent <= b.position) {
      const t = (percent - a.position) / (b.position - a.position);
      return {
        r: interpolate(a.color.r, b.color.r, t),
        g: interpolate(a.color.g, b.color.g, t),
        b: interpolate(a.color.b, b.color.b, t),
      };
    }
  }
}

function interpolate(start, end, t) {
  return start + (end - start) * t;
}
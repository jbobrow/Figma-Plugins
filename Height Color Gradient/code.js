figma.showUI(__html__, { width: 300, height: 150 });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'apply-gradient') {
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
      figma.notify("No bars (rectangles or frames) found inside the selected frame.");
      return;
    }

    const maxHeight = Math.max(...bars.map(bar => bar.height));

    for (const bar of bars) {
      const ratio = bar.height / maxHeight;
      const r = interpolate(msg.startColor.r, msg.endColor.r, ratio);
      const g = interpolate(msg.startColor.g, msg.endColor.g, ratio);
      const b = interpolate(msg.startColor.b, msg.endColor.b, ratio);

      const fill = {
        type: "SOLID",
        color: { r, g, b }
      };

      if (bar.type === "RECTANGLE") {
        bar.fills = [fill];
      } else if (bar.type === "FRAME") {
        // Try applying to the frame
        try {
          bar.fills = [fill];
        } catch (e) {
          const background = bar.findOne(node => node.type === "RECTANGLE");
          if (background) {
            background.fills = [fill];
          }
        }
      }
    }

    figma.closePlugin("Gradient applied!");
  }
};

function interpolate(start, end, t) {
  return start + (end - start) * t;
}
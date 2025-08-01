figma.showUI(__html__, { width: 320, height: 480 });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'resize-ui' && msg.height) {
    figma.ui.resize(320, msg.height);
    return;
  }

  if (msg.type !== 'apply-gradient') return;

  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Please select at least one frame or component.");
    return;
  }

  const validTypes = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];
  
  let containers = [];

  for (const node of selection) {
    if (["FRAME", "COMPONENT", "INSTANCE"].includes(node.type)) {
      containers.push(node);
    } else if (node.type === "COMPONENT_SET") {
      containers.push(...node.children.filter(c => c.type === "COMPONENT"));
    }
  }

  if (containers.length === 0) {
    figma.notify("No valid frames or components selected.");
    return;
  }

  const stops = msg.stops;
  const useParentHeight = msg.useParentHeight;

  for (const container of containers) {
    const bars = findBarNodes(container);

    if (bars.length === 0) {
      console.log(`No bars found in "${container.name}"`);
      continue;
    }

    const baseHeight = useParentHeight
      ? container.height
      : Math.max(...bars.map(bar => bar.height));

    for (const bar of bars) {
      const ratio = (bar.height / baseHeight) * 100;
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
  }

  figma.notify(`Gradient applied to ${containers.length} container(s).`);
};

function findBarNodes(node) {
  const bars = [];

  if ("children" in node) {
    for (const child of node.children) {
      if (child.type === "RECTANGLE" || child.type === "FRAME") {
        bars.push(child);
      } else if ("children" in child) {
        bars.push(...findBarNodes(child)); // recurse
      }
    }
  }

  return bars;
}

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
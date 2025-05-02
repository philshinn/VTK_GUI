
let draggedType = null;
let connectionSource = null;

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.widget').forEach(widget => {
    widget.addEventListener('dragstart', e => {
      draggedType = e.target.getAttribute('data-type');
    });
  });

  const canvas = document.getElementById('canvas');
  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', onDrop);
});

function onDrop(e) {
  e.preventDefault();
  if (!draggedType) return;

  const canvas = document.getElementById('canvas');
  const node = document.createElement('div');
  node.classList.add('node');
  node.setAttribute('data-type', draggedType);
  node.dataset.id = `node-${Date.now()}-${Math.random()}`;
  node.dataset.props = JSON.stringify({ stateType: `${draggedType}State` });
  node.title = `stateType: ${draggedType}State`;
  node.style.left = `${e.offsetX}px`;
  node.style.top = `${e.offsetY}px`;

  const span = document.createElement('span');
  span.textContent = draggedType.charAt(0).toUpperCase() + draggedType.slice(1);

  if (draggedType === 'start' || draggedType === 'stop') {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "widget-icon");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 100 100");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", "45");
    circle.setAttribute("stroke", "#0d47a1");
    circle.setAttribute("stroke-width", "5");
    circle.setAttribute("fill", "#4caf50");
    svg.appendChild(circle);
    node.appendChild(svg);
  } else if (draggedType === 'decision') {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "widget-icon");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 100 100");
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", "50,0 100,50 50,100 0,50");
    polygon.setAttribute("style", "fill:#2196f3;stroke:#0d47a1;stroke-width:5");
    svg.appendChild(polygon);
    node.appendChild(svg);
  } else if (draggedType === 'input' || draggedType === 'output') {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "widget-icon");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 100 100");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "10");
    rect.setAttribute("y", "30");
    rect.setAttribute("width", "80");
    rect.setAttribute("height", "40");
    rect.setAttribute("rx", "10");
    rect.setAttribute("fill", "#03a9f4");
    rect.setAttribute("stroke", "#01579b");
    rect.setAttribute("stroke-width", "5");
    svg.appendChild(rect);
    node.appendChild(svg);
  }

  node.appendChild(span);
  node.style.position = "absolute";

  makeDraggable(node);
  makeResizable(node);
  makeConnectable(node);
  makePropertyEditable(node);

  canvas.appendChild(node);
  updateConnections();
}

function makeDraggable(el) {
  let offsetX, offsetY;
  el.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    function onMouseMove(e) {
      const canvasRect = document.getElementById('canvas').getBoundingClientRect();
      el.style.left = (e.clientX - canvasRect.left - offsetX) + 'px';
      el.style.top = (e.clientY - canvasRect.top - offsetY) + 'px';
      updateConnections();
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function makeResizable(el) {
  el.style.resize = "both";
  el.style.overflow = "auto";
  el.addEventListener('mouseup', updateConnections);
}

function makeConnectable(el) {
  el.addEventListener('click', e => {
    if (e.shiftKey) {
      if (connectionSource && connectionSource !== el) {
        drawLine(connectionSource, el);
        connectionSource = null;
      }
    } else {
      connectionSource = el;
    }
  });
}

function drawLine(fromEl, toEl) {
  const svg = document.getElementById('connections-layer');

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("stroke", "black");
  line.setAttribute("stroke-width", "2");
  line.setAttribute("marker-end", "url(#arrow)");
  line.setAttribute("data-from", fromEl.dataset.id);
  line.setAttribute("data-to", toEl.dataset.id);

  const label = document.createElement('div');
  label.classList.add('connection-label');
  label.contentEditable = true;
  label.innerText = 'Label';
  label.dataset.from = fromEl.dataset.id;
  label.dataset.to = toEl.dataset.id;

  svg.appendChild(line);
  document.getElementById('canvas').appendChild(label);
  updateConnections();
}

function updateConnections() {
  const svg = document.getElementById('connections-layer');
  const canvasRect = document.getElementById('canvas').getBoundingClientRect();

  Array.from(svg.querySelectorAll('line')).forEach(line => {
    const from = document.querySelector(`[data-id="${line.getAttribute('data-from')}"]`);
    const to = document.querySelector(`[data-id="${line.getAttribute('data-to')}"]`);
    const label = document.querySelector(`.connection-label[data-from="${line.getAttribute('data-from')}"][data-to="${line.getAttribute('data-to')}"]`);

    if (from && to && label) {
      const r1 = from.getBoundingClientRect();
      const r2 = to.getBoundingClientRect();

      const cx1 = r1.left + r1.width / 2;
      const cy1 = r1.top + r1.height / 2;
      const cx2 = r2.left + r2.width / 2;
      const cy2 = r2.top + r2.height / 2;

      const dx = cx2 - cx1;
      const dy = cy2 - cy1;
      const angle = Math.atan2(dy, dx);

      const r1x = r1.width / 2 * Math.cos(angle);
      const r1y = r1.height / 2 * Math.sin(angle);
      const r2x = r2.width / 2 * Math.cos(angle);
      const r2y = r2.height / 2 * Math.sin(angle);

      const x1 = cx1 + r1x - canvasRect.left;
      const y1 = cy1 + r1y - canvasRect.top;
      const x2 = cx2 - r2x - canvasRect.left;
      const y2 = cy2 - r2y - canvasRect.top;

      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);

      label.style.left = `${(x1 + x2) / 2}px`;
      label.style.top = `${(y1 + y2) / 2}px`;
    }
  });
}

function makePropertyEditable(el) {
  el.addEventListener('contextmenu', e => {
    e.preventDefault();
    const props = el.dataset.props ? JSON.parse(el.dataset.props) : {};
    const keys = Object.keys(props);
    const entries = keys.map(k => `${k}:${props[k]}`).join("\n");

    const input = prompt("Enter key:value pairs (one per line):", entries);
    if (input !== null) {
      const lines = input.split("\n");
      const newProps = {};
      for (const line of lines) {
        const [key, val] = line.split(":").map(s => s.trim());
        if (key) newProps[key] = val;
      }
      el.dataset.props = JSON.stringify(newProps);
      if (newProps.stateType) el.title = `stateType: ${newProps.stateType}`;
    }
  });
}

function saveDiagram() {
  const nodes = Array.from(document.querySelectorAll('.node')).map(n => ({
    id: n.dataset.id,
    type: n.dataset.type,
    x: n.style.left,
    y: n.style.top,
    w: n.style.width,
    h: n.style.height,
    html: n.innerHTML
  }));
  const lines = Array.from(document.querySelectorAll('line')).map(l => ({
    from: l.dataset.from,
    to: l.dataset.to,
    label: document.querySelector(`.connection-label[data-from="${l.dataset.from}"][data-to="${l.dataset.to}"]`)?.textContent || ''
  }));
  const blob = new Blob([JSON.stringify({ nodes, lines })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'diagram.json';
  a.click();
}

function loadDiagramFromFile(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const { nodes, lines } = JSON.parse(event.target.result);
    document.querySelectorAll('.node, .connection-label').forEach(el => el.remove());
    document.querySelectorAll('#svg-layer line').forEach(el => el.remove());
    const canvas = document.getElementById('canvas');
    nodes.forEach(n => {
      const node = document.createElement('div');
      node.classList.add('node');
      node.dataset.id = n.id;
      node.dataset.type = n.type;
      node.style.left = n.x;
      node.style.top = n.y;
      node.style.width = n.w;
      node.style.height = n.h;
      node.innerHTML = n.html;
      makeDraggable(node);
      makeResizable(node);
      makeConnectable(node);
      canvas.appendChild(node);
    });
    lines.forEach(l => {
      const from = document.querySelector(`[data-id="\${l.from}"]`);
      const to = document.querySelector(`[data-id="\${l.to}"]`);
      connectNodes(from, to);
      const lbl = document.querySelector(`.connection-label[data-from="\${l.from}"][data-to="\${l.to}"]`);
      if (lbl) lbl.textContent = l.label;
    });
  };
  reader.readAsText(file);
}

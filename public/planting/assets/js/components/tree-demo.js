/**
 * 可复用的种树演示组件
 */
export class TreeDemo {
  constructor(options) {
    this.container = options.container;
    this.parameters = options.parameters || { length: 100, interval: 10, mode: 'both', shape: 'line' };
    this.isReadOnly = options.readOnly !== false;
    this.showSteps = options.showSteps || false;
    this.trees = [];
    this.treeIdCounter = 0;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.init();
  }
  init() {
    this.createDemoArea();
    this.updateDemo();
  }
  createDemoArea() {
    this.container.innerHTML = `
      <div class="tree-demo-wrapper" style="width: 100%;">
        <div id="tree-demo-area" style="position: relative; width: 100%; height: 300px; border: 2px dashed var(--accent); border-radius: 12px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); overflow: hidden;">
          <svg id="demo-ground-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
            <line id="demo-ground-line" x1="50" y1="150" x2="550" y2="150" stroke="#2563eb" stroke-width="6" stroke-dasharray="8,4"/>
            <g id="demo-snap-points"></g>
            <g id="demo-measurements"></g>
          </svg>
          <div style="position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.9); padding: 8px 12px; border-radius: 8px; font-size: 12px; color: var(--muted);">
            <div><strong>长度:</strong> <span id="demo-length">${this.parameters.length}</span>米</div>
            <div><strong>间距:</strong> <span id="demo-interval">${this.parameters.interval}</span>米</div>
            <div><strong>模式:</strong> <span id="demo-mode">${this.getModeText(this.parameters.mode)}</span></div>
            <div><strong>图形:</strong> <span id="demo-shape">${this.getShapeText(this.parameters.shape)}</span></div>
          </div>
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); padding: 8px 12px; border-radius: 8px; font-size: 12px; color: var(--muted);">
            <div style="font-weight: bold; color: var(--accent);">树木数量: <span id="demo-tree-count">0</span></div>
          </div>
        </div>
        ${this.showSteps ? this.createStepsSection() : ''}
      </div>
    `;
    this.demoArea = this.container.querySelector('#tree-demo-area');
    this.groundSvg = this.container.querySelector('#demo-ground-svg');
    this.groundLine = this.container.querySelector('#demo-ground-line');
    this.snapPoints = this.container.querySelector('#demo-snap-points');
    this.measurements = this.container.querySelector('#demo-measurements');
    this.treeCountDisplay = this.container.querySelector('#demo-tree-count');
  }
  createStepsSection() {
    return `
      <div style="margin-top: 16px; padding: 16px; background: #f0f9ff; border-radius: 12px;">
        <h4 style="margin: 0 0 12px 0; color: var(--accent);">🧮 解题步骤</h4>
        <div id="demo-solving-steps"></div>
      </div>
    `;
  }
  updateParameters(newParams) {
    this.parameters = { ...this.parameters, ...newParams };
    this.updateParameterDisplay();
    this.updateDemo();
  }
  updateParameterDisplay() {
    this.container.querySelector('#demo-length').textContent = this.parameters.length;
    this.container.querySelector('#demo-interval').textContent = this.parameters.interval;
    this.container.querySelector('#demo-mode').textContent = this.getModeText(this.parameters.mode);
    this.container.querySelector('#demo-shape').textContent = this.getShapeText(this.parameters.shape);
  }
  updateDemo() {
    this.clearTrees();
    this.updateGroundShape();
    const correctPositions = this.calculateCorrectTreePositions();
    correctPositions.forEach(pos => {
      const tree = { id: `demo-tree-${++this.treeIdCounter}`, x: pos.x - 18, y: pos.y - 36, isPlaced: true };
      this.trees.push(tree);
      this.createTreeElement(tree);
    });
    this.updateTreeDisplay();
    if (this.showSteps) this.updateSolvingSteps();
  }
  calculateCorrectTreePositions() {
    const { mode, shape } = this.parameters;
    if (shape === 'circle') return this.generateCirclePoints(mode);
    return this.generateLinePoints(mode);
  }
  updateGroundShape() {
    const centerX = this.demoArea.clientWidth / 2;
    const centerY = 150;
    const maxPixelLength = this.demoArea.clientWidth - 100;
    const pixelLength = Math.min(maxPixelLength, this.parameters.length * 4);
    const verticalLimit = (this.demoArea.clientHeight - 40) / 2;
    const size = Math.min(pixelLength / 2, verticalLimit) * 0.9;
    const existing = this.groundSvg.querySelectorAll('.ground-shape');
    existing.forEach(s => s.remove());
    this.groundConfig = {
      length: this.parameters.length,
      interval: this.parameters.interval,
      startX: centerX - pixelLength / 2,
      endX: centerX + pixelLength / 2,
      startY: centerY,
      shape: this.parameters.shape,
      shapeSize: size
    };
    if (this.parameters.shape === 'line') {
      this.groundLine.setAttribute('x1', this.groundConfig.startX);
      this.groundLine.setAttribute('x2', this.groundConfig.endX);
      this.groundLine.setAttribute('y1', centerY);
      this.groundLine.setAttribute('y2', centerY);
      this.groundLine.style.display = 'block';
    } else {
      this.groundLine.style.display = 'none';
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX);
      circle.setAttribute('cy', centerY);
      circle.setAttribute('r', size);
      circle.setAttribute('stroke', '#2563eb');
      circle.setAttribute('stroke-width', '6');
      circle.setAttribute('stroke-dasharray', '8,4');
      circle.setAttribute('fill', 'none');
      circle.classList.add('ground-shape');
      this.groundSvg.appendChild(circle);
    }
  }
  generateLinePoints(mode) {
    const pixelInterval = (this.groundConfig.endX - this.groundConfig.startX) * this.parameters.interval / this.parameters.length;
    const numIntervals = Math.floor(this.parameters.length / this.parameters.interval);
    const points = [];
    for (let i = 0; i <= numIntervals; i++) {
      const x = this.groundConfig.startX + i * pixelInterval;
      const yTop = this.groundConfig.startY - Math.min(36, this.demoArea.clientHeight / 6);
      const yBottom = this.groundConfig.startY + Math.min(36, this.demoArea.clientHeight / 6);
      const place = (mode === 'both') || (mode === 'none' && i > 0 && i < numIntervals) || (mode === 'one' && i < numIntervals);
      if (place) { points.push({ x, y: yTop }); points.push({ x, y: yBottom }); }
    }
    return points;
  }
  generateCirclePoints() {
    const centerX = (this.groundConfig.startX + this.groundConfig.endX) / 2;
    const centerY = this.groundConfig.startY;
    const radius = this.groundConfig.shapeSize;
    const num = Math.max(3, Math.floor(this.parameters.length / this.parameters.interval));
    const pts = [];
    for (let i = 0; i < num; i++) {
      const angle = (i / num) * 2 * Math.PI;
      pts.push({ x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) });
    }
    return pts;
  }
  createTreeElement(tree) {
    const el = document.createElement('div');
    el.className = 'demo-tree';
    el.id = tree.id;
    el.innerHTML = '🌳';
    const treeSize = this.isMobile ? '28px' : '32px';
    el.style.cssText = `position:absolute;left:${tree.x}px;top:${tree.y}px;font-size:${treeSize};user-select:none;z-index:10;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));pointer-events:none;animation: treeAppear 0.4s ease-out;`;
    this.demoArea.appendChild(el);
  }
  clearTrees() {
    this.trees = [];
    this.demoArea.querySelectorAll('.demo-tree').forEach(t => t.remove());
  }
  updateTreeDisplay() { this.treeCountDisplay.textContent = this.trees.length; }
  updateSolvingSteps() {
    const el = this.container.querySelector('#demo-solving-steps');
    if (!el) return;
    const { length, interval, mode, shape } = this.parameters;
    const steps = [];
    if (shape === 'line') {
      const intervalCount = Math.floor(length / interval);
      steps.push(`道路长度 ÷ 间距 = 间隔数：${length} ÷ ${interval} = ${intervalCount}个间隔`);
      if (mode === 'both') { const one = intervalCount + 1; steps.push(`两端都种：一边树的棵数 = 间隔数 + 1 = ${intervalCount} + 1 = ${one}棵`); steps.push(`道路两边：总棵数 = ${one} × 2 = ${one * 2}棵`); }
      else if (mode === 'none') { const one = intervalCount - 1; steps.push(`两端都不种：一边树的棵数 = 间隔数 - 1 = ${intervalCount} - 1 = ${one}棵`); steps.push(`道路两边：总棵数 = ${one} × 2 = ${one * 2}棵`); }
      else if (mode === 'one') { steps.push(`一端种一端不种：一边树的棵数 = 间隔数 = ${intervalCount}棵`); steps.push(`道路两边：总棵数 = ${intervalCount} × 2 = ${intervalCount * 2}棵`); }
      else if (mode === 'circle') { steps.push(`环形种植：树的棵数 = 间隔数 = ${intervalCount}棵`); }
    } else if (shape === 'circle') {
      const treeCount = Math.floor(length / interval);
      steps.push(`圆形为闭合图形：树的棵数 = 周长 ÷ 间距 = ${length} ÷ ${interval} = ${treeCount}棵`);
    }
    el.innerHTML = steps.map((s, i) => `<div style="margin-bottom:8px;padding:8px;background:white;border-radius:6px;border-left:3px solid var(--accent);"><strong>步骤 ${i+1}:</strong> ${s}</div>`).join('');
  }
  getModeText(mode) { return ({ both:'两端都种', none:'两端都不种', one:'一端种一端不种', circle:'环形种植' })[mode] || mode; }
  getShapeText(shape) { return ({ line:'直线', circle:'圆形' })[shape] || shape; }
}

const style = document.createElement('style');
style.textContent = `@keyframes treeAppear {0%{transform:scale(0) rotate(180deg);opacity:0;}50%{transform:scale(1.2) rotate(90deg);opacity:0.8;}100%{transform:scale(1) rotate(0deg);opacity:1;}}`;
document.head.appendChild(style);



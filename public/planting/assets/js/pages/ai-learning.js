import { chatWithAI } from '../shared/api.js';

export function AILearning(){
  const el = document.createElement('div');
  el.className = 'container';
  el.innerHTML = `
    <div class="hero">
      <div class="mobile-cta" role="navigation" aria-label="快速入口（移动端）">
        <a class="btn primary" href="#/ai-learning">🤖 AI学习</a>
      </div>
      <h1>🤖 AI智能学习助手</h1>
      <p>设置参数后观看种树演示，与AI助手互动学习植树问题的奥秘。</p>
    </div>
    <div class="card" style="margin-top:20px;">
      <h2>🎛️ 参数设置</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
        <div class="input"><label>地面长度（米）</label><input id="ground-length" type="number" value="100" min="20" max="200" step="10"></div>
        <div class="input"><label>种树间距（米）</label><input id="tree-interval" type="number" value="10" min="5" max="25" step="5"></div>
        <div class="input"><label>种树模式</label><select id="tree-mode"><option value="both">两端都种树</option><option value="none">两端都不种</option><option value="one">一端种，一端不种</option><option value="circle">环形种树</option></select></div>
        <div class="input"><label>图形模式</label><select id="shape-mode"><option value="line">直线</option><option value="circle">圆形</option></select></div>
      </div>
      <div style="text-align: center;"><button class="btn" id="clear-all">🗑️ 清空重置</button><button class="btn primary" id="random-generate" style="margin-left:8px;">🎲 随机生成</button></div>
    </div>
    <div class="card" style="margin-top:20px;">
      <h2>🌳 种树演示区域</h2>
      <div id="drag-area" style="position: relative; width: 100%; height: 300px; border: 2px dashed var(--accent); border-radius: 12px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); overflow: hidden;">
        <svg id="ground-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"><line id="ground-line" x1="50" y1="150" x2="550" y2="150" stroke="#2563eb" stroke-width="6" stroke-dasharray="8,4"/><g id="snap-points"></g><g id="measurements"></g></svg>
        <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 8px; background: rgba(255,255,255,0.9); padding: 8px; border-radius: 8px; flex-wrap: wrap;">
          <span style="font-size: 12px; color: var(--muted); align-self: center;" id="demo-hint">🌳 正确的种树演示</span>
        </div>
        <div id="status-display" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); padding: 8px 12px; border-radius: 8px; font-size: 12px; color: var(--muted);">树木数量: <span id="tree-count">0</span></div>
      </div>
    </div>
    <div class="card" style="margin-top:20px;">
      <h2>💬 AI助手对话</h2>
      <div id="chat-history" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f8fafc;">
        <div style="text-align: center; color: var(--muted); padding: 20px;"><div style="font-size: 32px; margin-bottom: 8px;">🤖</div><p>你好！我是你的植树问题学习助手。<br>设置参数后观看演示，然后向我提问吧！</p></div>
      </div>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;"><input id="chat-input" type="text" value="解读演示" placeholder="请输入你的问题..." style="flex: 1; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 14px;"><button id="send-message" class="btn primary">发送</button></div>
      <div id="chat-controls" style="display: none; justify-content: center; gap: 12px;"><button id="continue-chat" class="btn">继续提问</button><button id="new-question" class="btn primary">新的问题</button></div>
      <div id="loading-indicator" style="display: none; text-align: center; padding: 16px; color: var(--muted);"><div style="display: inline-block; width: 20px; height: 20px; border: 2px solid var(--accent); border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite; margin-right: 8px;"></div>AI正在思考中...</div>
    </div>
  `;

  setTimeout(() => { initDemoInteraction(el); }, 0);
  return el;
}

function initDemoInteraction(container) {
  const dragArea = container.querySelector('#drag-area');
  const groundSvg = container.querySelector('#ground-svg');
  const groundLine = container.querySelector('#ground-line');
  const snapPoints = container.querySelector('#snap-points');
  const measurements = container.querySelector('#measurements');
  const treeCountDisplay = container.querySelector('#tree-count');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  let trees = [];
  let groundConfig = { length: 100, interval: 10, startX: 50, startY: 150, endX: 550, shape: 'line' };
  let treeIdCounter = 0;

  function generateRandomParameters() {
    const lengths = [50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200];
    const intervals = [5,10,15,20,25];
    const modes = ['both','none','one','circle'];
    const shapes = ['line','circle'];
    const randomLength = lengths[Math.floor(Math.random()*lengths.length)];
    const randomInterval = intervals[Math.floor(Math.random()*intervals.length)];
    const randomMode = modes[Math.floor(Math.random()*modes.length)];
    const randomShape = shapes[Math.floor(Math.random()*shapes.length)];
    container.querySelector('#ground-length').value = randomLength;
    container.querySelector('#tree-interval').value = randomInterval;
    container.querySelector('#tree-mode').value = randomMode;
    container.querySelector('#shape-mode').value = randomShape;
    updateGround();
    updateDemo();
  }

  function updateDemo() {
    trees = [];
    clearTreeElements();
    const shapeForCheck = container.querySelector('#shape-mode').value;
    const isClosedShape = (shapeForCheck === 'circle');
    if (isClosedShape) {
      const perim = groundConfig.length;
      const feasible = Number.isFinite(perim) && groundConfig.interval > 0 && Number.isInteger(perim / groundConfig.interval);
      const hintEl = container.querySelector('#demo-hint');
      if (!feasible) { if (hintEl) hintEl.textContent = '⚠️ 当前参数无法等距种植（要求：周长可被间距整除）。请调整长度或间距。'; updateTreeDisplay(); return; }
      else if (hintEl) { hintEl.textContent = '🌳 正确的种树演示'; }
    } else {
      const modeForCheck = container.querySelector('#tree-mode').value;
      if (modeForCheck === 'both') {
        const feasible = groundConfig.interval > 0 && Number.isInteger(groundConfig.length / groundConfig.interval);
        const hintEl = container.querySelector('#demo-hint');
        if (!feasible) { if (hintEl) hintEl.textContent = '⚠️ 直线两端都种时，要求路长能被间距整除。请调整参数。'; updateTreeDisplay(); return; }
        else if (hintEl) { hintEl.textContent = '🌳 正确的种树演示'; }
      }
    }
    const correctPositions = calculateCorrectTreePositions();
    function computeIconSize(positions){
      if (!positions || positions.length < 2) return (isMobile ? 28 : 32);
      let minStep = Infinity;
      for (let i = 0; i < positions.length; i++) {
        const a = positions[i];
        const b = positions[(i + 1) % positions.length];
        const step = Math.hypot(a.x - b.x, a.y - b.y);
        if (step > 0 && step < minStep) minStep = step;
      }
      if (!isFinite(minStep)) return (isMobile ? 28 : 32);
      const target = Math.min(minStep - 4, isMobile ? 28 : 36);
      return Math.round(Math.max(10, target));
    }
    const iconSizePx = computeIconSize(correctPositions);
    correctPositions.forEach(pos => {
      const tree = { id: `demo-tree-${++treeIdCounter}`, x: pos.x, y: pos.y, isPlaced: true, size: iconSizePx };
      trees.push(tree);
      createDemoTreeElement(tree);
    });
    updateTreeDisplay();
  }

  function calculateCorrectTreePositions() {
    const shape = container.querySelector('#shape-mode').value;
    const isClosed = (shape === 'circle');
    const mode = isClosed ? 'both' : container.querySelector('#tree-mode').value;
    return shape === 'circle' ? generateCirclePoints(mode) : generateLinePoints(mode);
  }

  function clearTreeElements() {
    dragArea.querySelectorAll('.demo-tree').forEach(tree => tree.remove());
  }
  function createDemoTreeElement(tree) {
    const treeEl = document.createElement('div');
    treeEl.className = 'demo-tree';
    treeEl.id = tree.id;
    treeEl.innerHTML = '🌳';
    const sizePx = (tree && tree.size ? tree.size : (isMobile ? 32 : 36));
    const treeSize = `${sizePx}px`;
    treeEl.style.cssText = `position:absolute;left:${tree.x - sizePx / 2}px;top:${tree.y - sizePx}px;font-size:${treeSize};user-select:none;z-index:10;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));pointer-events:none;animation: treeAppear 0.3s ease-out;`;
    dragArea.appendChild(treeEl);
  }
  function updateGround() {
    const length = parseFloat(container.querySelector('#ground-length').value);
    const interval = parseFloat(container.querySelector('#tree-interval').value);
    const shape = container.querySelector('#shape-mode').value;
    groundConfig.length = length;
    groundConfig.interval = interval;
    groundConfig.shape = shape;
    const maxPixelLength = dragArea.clientWidth - 100;
    const pixelLength = Math.min(maxPixelLength, length * 4);
    const centerX = dragArea.clientWidth / 2;
    groundConfig.startX = centerX - pixelLength / 2;
    groundConfig.endX = centerX + pixelLength / 2;
    updateGroundShape();
    const treeModeContainer = container.querySelector('#tree-mode')?.closest('.input');
    if (treeModeContainer) treeModeContainer.style.display = (shape === 'circle') ? 'none' : '';
    updateSnapPoints();
    updateMeasurements();
    updateDemo();
  }
  function updateGroundShape() {
    groundSvg.querySelectorAll('.ground-shape').forEach(s => s.remove());
    const centerX = (groundConfig.startX + groundConfig.endX) / 2;
    const centerY = groundConfig.startY;
    const verticalLimit = (dragArea.clientHeight - 40) / 2;
    const size = Math.min((groundConfig.endX - groundConfig.startX) / 2, verticalLimit) * 0.9;
    groundConfig.shapeSize = size;
    if (groundConfig.shape === 'line') {
      groundLine.setAttribute('x1', groundConfig.startX);
      groundLine.setAttribute('x2', groundConfig.endX);
      groundLine.setAttribute('y1', groundConfig.startY);
      groundLine.setAttribute('y2', groundConfig.startY);
      groundLine.style.display = 'block';
    } else {
      groundLine.style.display = 'none';
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX);
      circle.setAttribute('cy', centerY);
      circle.setAttribute('r', size);
      circle.setAttribute('stroke', '#2563eb');
      circle.setAttribute('stroke-width', '6');
      circle.setAttribute('stroke-dasharray', '8,4');
      circle.setAttribute('fill', 'none');
      circle.classList.add('ground-shape');
      groundSvg.appendChild(circle);
    }
  }
  function updateSnapPoints() {
    snapPoints.innerHTML = '';
    const shape = groundConfig.shape;
    if (shape === 'circle') {
      const perim = groundConfig.length;
      const feasible = Number.isFinite(perim) && groundConfig.interval > 0 && Number.isInteger(perim / groundConfig.interval);
      if (!feasible) return [];
    } else {
      const modeForCheck = container.querySelector('#tree-mode').value;
      if (modeForCheck === 'both') {
        const feasible = groundConfig.interval > 0 && Number.isInteger(groundConfig.length / groundConfig.interval);
        if (!feasible) return [];
      }
    }
    const mode = container.querySelector('#tree-mode').value;
    const points = (shape === 'circle') ? generateCirclePoints(mode) : generateLinePoints(mode);
    points.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', '#10b981');
      circle.setAttribute('stroke', '#065f46');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('opacity', '0.8');
      circle.setAttribute('data-snap-index', index);
      snapPoints.appendChild(circle);
    });
    return points;
  }
  function generateLinePoints(mode) {
    const pixelInterval = (groundConfig.endX - groundConfig.startX) * groundConfig.interval / groundConfig.length;
    const numIntervals = Math.floor(groundConfig.length / groundConfig.interval);
    const points = [];
    for (let i = 0; i <= numIntervals; i++) {
      const x = groundConfig.startX + i * pixelInterval;
      const y = groundConfig.startY;
      if (mode === 'both' || (mode === 'none' && i > 0 && i < numIntervals) || (mode === 'one' && i < numIntervals)) {
        points.push({ x, y });
      }
    }
    if (mode === 'both' && points.length > 1) {
      points[0] = { x: groundConfig.startX, y: groundConfig.startY };
      points[points.length - 1] = { x: groundConfig.endX, y: groundConfig.startY };
    }
    return points;
  }
  function generateCirclePoints() {
    const centerX = (groundConfig.startX + groundConfig.endX) / 2;
    const centerY = groundConfig.startY;
    const radius = groundConfig.shapeSize;
    const numPoints = Math.max(3, Math.floor(groundConfig.length / groundConfig.interval));
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y });
    }
    return points;
  }
  function updateMeasurements() {
    measurements.innerHTML = '';
    const lengthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lengthText.setAttribute('x', (groundConfig.startX + groundConfig.endX) / 2);
    lengthText.setAttribute('y', groundConfig.startY + 30);
    lengthText.setAttribute('text-anchor', 'middle');
    lengthText.setAttribute('font-size', '14');
    lengthText.setAttribute('fill', '#374151');
    lengthText.setAttribute('font-weight', 'bold');
    lengthText.textContent = `${groundConfig.length}米`;
    measurements.appendChild(lengthText);
    if (groundConfig.interval > 0) {
      const intervalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      intervalText.setAttribute('x', groundConfig.startX + 25);
      intervalText.setAttribute('y', groundConfig.startY - 15);
      intervalText.setAttribute('font-size', '12');
      intervalText.setAttribute('fill', '#6b7280');
      intervalText.setAttribute('font-weight', 'bold');
      intervalText.textContent = `间距: ${groundConfig.interval}米`;
      measurements.appendChild(intervalText);
    }
  }
  updateGround();
  updateTreeDisplay();
  container.querySelector('#random-generate').addEventListener('click', generateRandomParameters);
  container.querySelector('#clear-all').addEventListener('click', () => {
    trees = [];
    clearTreeElements();
    updateTreeDisplay();
    container.querySelector('#ground-length').value = 100;
    container.querySelector('#tree-interval').value = 10;
    container.querySelector('#shape-mode').value = 'line';
    const treeModeEl = container.querySelector('#tree-mode');
    if (treeModeEl) treeModeEl.value = 'both';
    updateGround();
  });
  ['#ground-length','#tree-interval','#tree-mode','#shape-mode'].forEach(sel => {
    const e = container.querySelector(sel); if (e) { e.addEventListener('change', updateGround); e.addEventListener('input', updateGround); }
  });
  if (isMobile) { const demoHint = container.querySelector('#demo-hint'); if (demoHint) demoHint.textContent = '🌳 正确的种树演示'; }
  function updateTreeDisplay() {
    treeCountDisplay.textContent = trees.length; const placed = trees.filter(t => t.isPlaced).length; if (placed > 0) { treeCountDisplay.textContent += ` (已放置: ${placed})`; }
  }
  initChatFeature(container, () => ({ ground: { length: groundConfig.length, interval: groundConfig.interval }, tree_mode: container.querySelector('#tree-mode').value, shape_mode: container.querySelector('#shape-mode').value }));
}

function initChatFeature(container, getInteractionState) {
  const chatHistory = container.querySelector('#chat-history');
  const chatInput = container.querySelector('#chat-input');
  const sendButton = container.querySelector('#send-message');
  const chatControls = container.querySelector('#chat-controls');
  const continueButton = container.querySelector('#continue-chat');
  const newQuestionButton = container.querySelector('#new-question');
  const loadingIndicator = container.querySelector('#loading-indicator');
  let conversationHistory = [];
  let isLoading = false;
  function updateChatInputState() {
    const hasInput = chatInput && chatInput.value.trim().length > 0;
    if (sendButton) { sendButton.disabled = !hasInput || isLoading; sendButton.title = hasInput ? '' : '请输入问题'; }
  }
  function parseMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/`(.*?)`/g,'<code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-family:monospace;">$1</code>').replace(/\n/g,'<br>').replace(/^(\d+)\.\s+(.+)$/gm,'<div style="margin:4px 0;"><strong>$1.</strong> $2</div>').replace(/^[-*]\s+(.+)$/gm,'<div style="margin:4px 0; padding-left: 16px;">• $1</div>');
  }
  function addMessage(role, content, isError = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    messageEl.style.cssText = `margin-bottom:12px;padding:12px 16px;border-radius:12px;max-width:80%;line-height:1.5;${role==='user'?'background: var(--accent); color: white; margin-left: auto; text-align: right;':`background:${isError?'#fee2e2':'#f1f5f9'}; color:${isError?'#dc2626':'var(--text)'}; margin-right: auto;`}`;
    if (role === 'assistant') { const avatar = document.createElement('div'); avatar.style.cssText = 'display:inline-block;margin-right:8px;font-size:16px;vertical-align:top;'; avatar.textContent = isError ? '⚠️' : '🤖'; messageEl.appendChild(avatar); }
    const textEl = document.createElement('div'); textEl.style.cssText = 'display:inline-block;max-width:calc(100% - 32px);';
    if (role === 'assistant' && !isError) { textEl.innerHTML = parseMarkdown(content); } else { textEl.textContent = content; }
    messageEl.appendChild(textEl);
    if (chatHistory && chatHistory.children.length === 1 && chatHistory.firstChild && chatHistory.firstChild.nodeType === Node.ELEMENT_NODE && chatHistory.firstChild.style && chatHistory.firstChild.style.textAlign === 'center') { chatHistory.innerHTML = ''; }
    if (chatHistory) { chatHistory.appendChild(messageEl); chatHistory.scrollTop = chatHistory.scrollHeight; }
  }
  async function sendMessage(isNewConversation = false) {
    if (!chatInput) return; const message = chatInput.value.trim(); if (!message || isLoading) return; isLoading = true; updateChatInputState(); addMessage('user', message); chatInput.value = '';
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    try {
      const data = await chatWithAI(message, getInteractionState(), conversationHistory, isNewConversation);
      addMessage('assistant', data.response);
      conversationHistory = data.updated_history;
      if (chatControls) chatControls.style.display = 'flex';
    } catch (error) { console.error('AI请求失败:', error); addMessage('assistant', '抱歉，AI服务暂时不可用。请检查网络连接或稍后再试。', true); }
    finally { isLoading = false; if (loadingIndicator) loadingIndicator.style.display = 'none'; updateChatInputState(); }
  }
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (chatInput) { chatInput.addEventListener('input', updateChatInputState); chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }); }
  if (isMobile && chatInput) { chatInput.addEventListener('focus', () => { setTimeout(() => { chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }); if (sendButton) { sendButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (!sendButton.disabled) { sendMessage(); } }); } }
  if (sendButton) { sendButton.addEventListener('click', () => sendMessage()); }
  if (continueButton) { continueButton.addEventListener('click', () => { if (chatControls) chatControls.style.display = 'none'; if (chatInput) chatInput.focus(); }); }
  if (newQuestionButton) { newQuestionButton.addEventListener('click', () => { conversationHistory = []; if (chatControls) chatControls.style.display = 'none'; if (chatHistory) { chatHistory.innerHTML = `<div style="text-align: center; color: var(--muted); padding: 20px;"><div style="font-size: 32px; margin-bottom: 8px;">🤖</div><p>对话已重置，请提出新的问题！</p></div>`; } if (chatInput) chatInput.focus(); }); }
  window.updateChatInputState = updateChatInputState; updateChatInputState();
}



// 星系星空背景 - Three.js
(function() {
  if (typeof THREE === 'undefined') return;

  const container = document.getElementById('page-header');
  if (!container) return;

  const canvas = document.getElementById('three-hero-canvas');
  if (canvas) return;

  const el = document.createElement('canvas');
  el.id = 'three-hero-canvas';
  el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
  container.style.position = container.style.position || 'relative';
  container.insertBefore(el, container.firstChild);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, el.clientWidth / Math.max(el.clientHeight, 1), 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- 生成螺旋星系粒子 ---
  const particleCount = 1000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const armCount = 4;
  const twist = 0.35;

  for (let i = 0; i < particleCount; i++) {
    let x, y, z;
    const type = Math.random();

    if (type < 0.55) {
      // 螺旋臂
      const arm = Math.floor(Math.random() * armCount);
      const r = 4 + Math.random() * 42;
      const baseAngle = arm * (Math.PI * 2) / armCount;
      const theta = r * twist + baseAngle + (Math.random() - 0.5) * 0.7;
      x = Math.cos(theta) * r;
      z = Math.sin(theta) * r;
      y = (Math.random() - 0.5) * 10;
    } else if (type < 0.85) {
      // 中心核球
      const r = Math.pow(Math.random(), 0.6) * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.35;
      x = Math.cos(theta) * Math.cos(phi) * r;
      z = Math.sin(theta) * Math.cos(phi) * r;
      y = Math.sin(phi) * r * 0.5;
    } else {
      // 弥散晕
      const r = 10 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;
      x = Math.cos(theta) * Math.cos(phi) * r;
      z = Math.sin(theta) * Math.cos(phi) * r;
      y = Math.sin(phi) * r * 1.2;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // 主体纯白 + 少量淡紫星点
    const dist = Math.sqrt(x * x + z * z);
    const brightness = dist < 10 ? 0.85 + Math.random() * 0.15 : 0.55 + Math.random() * 0.45;
    var tint = Math.random();
    if (tint < 0.12) {
      colors[i * 3] = brightness * 0.92;
      colors[i * 3 + 1] = brightness * 0.78;
      colors[i * 3 + 2] = brightness;
    } else if (tint < 0.22) {
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.88;
      colors[i * 3 + 2] = brightness * 0.76;
    } else {
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // --- 柔光圆形纹理（模拟球体） ---
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 64;
  texCanvas.height = 64;
  const tctx = texCanvas.getContext('2d');
  const grad = tctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.04, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.15, 'rgba(255,255,255,0.6)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.15)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.02)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, 64, 64);
  const spriteTex = new THREE.CanvasTexture(texCanvas);

  const material = new THREE.PointsMaterial({
    size: 0.7,
    map: spriteTex,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.65
  });

  const galaxy = new THREE.Points(geometry, material);
  scene.add(galaxy);

  // 额外一层远景小星点
  const bgCount = 400;
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(bgCount * 3);
  for (let i = 0; i < bgCount; i++) {
    bgPos[i * 3] = (Math.random() - 0.5) * 120;
    bgPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
    bgPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  const bgMat = new THREE.PointsMaterial({
    size: 0.22,
    map: spriteTex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.5,
    color: 0xffffff
  });
  const bgStars = new THREE.Points(bgGeo, bgMat);
  scene.add(bgStars);

  // --- 鼠标跟踪旋转 ---
  var mouseNormX = 0, mouseNormY = 0;
  var smoothX = 0, smoothY = 0;
  var autoTime = 0;

  document.addEventListener('mousemove', function(e) {
    mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNormY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // 触摸也支持
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
      mouseNormX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouseNormY = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
    }
  }, { passive: true });

  // 动画
  function animate() {
    requestAnimationFrame(animate);

    autoTime += 0.001;

    // 平滑跟随鼠标
    smoothX += (mouseNormX - smoothX) * 0.03;
    smoothY += (mouseNormY - smoothY) * 0.03;

    // 自转 + 鼠标偏移
    galaxy.rotation.y = autoTime * 0.3 + smoothX * 0.5;
    galaxy.rotation.x = autoTime * 0.1 + smoothY * 0.25;
    bgStars.rotation.y = -autoTime * 0.15 + smoothX * 0.3;
    bgStars.rotation.x = -autoTime * 0.05 + smoothY * 0.15;

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', function() {
    camera.aspect = el.clientWidth / Math.max(el.clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(el.clientWidth, el.clientHeight);
  });

  animate();

  // 开关按钮
  const btn = document.createElement('button');
  btn.id = 'three-hero-toggle';
  btn.title = '关闭星空背景';
  btn.innerHTML = '✦';
  btn.style.cssText = 'position:absolute;bottom:12px;right:16px;z-index:10;width:32px;height:32px;border:1px solid rgba(255,255,255,0.25);border-radius:50%;background:rgba(10,10,30,0.5);color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:0.3s;backdrop-filter:blur(4px);outline:none;line-height:1;padding:0;';
  container.appendChild(btn);

  var visible = true;
  btn.addEventListener('click', function() {
    visible = !visible;
    galaxy.visible = visible;
    bgStars.visible = visible;
    btn.style.color = visible ? 'rgba(255,255,255,0.5)' : 'rgba(137,84,214,0.9)';
    btn.style.borderColor = visible ? 'rgba(255,255,255,0.25)' : 'rgba(137,84,214,0.6)';
    btn.title = visible ? '关闭星空背景' : '开启星空背景';
  });
})();

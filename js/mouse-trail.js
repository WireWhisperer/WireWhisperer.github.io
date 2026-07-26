// 萤火流光 - 丝滑鼠标跟随
(function() {
  var canvas = document.createElement('canvas');
  canvas.id = 'mouse-trail-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99999;pointer-events:none;';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var width, height;
  var mouseX = -200, mouseY = -200;
  var lastX = -200, lastY = -200;
  var particles = [];
  var maxParticles = 80;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function createParticle(x, y) {
    var angle = Math.random() * Math.PI * 2;
    var speed = Math.random() * 0.6 + 0.2;
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.25,
      life: 1,
      decay: 0.01 + Math.random() * 0.025,
      size: Math.random() * 2 + 0.8
    };
  }

  // 在两个点之间插值生成粒子，保证丝滑
  function spawnBetween(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    // 每 4px 生成一个粒子
    var steps = Math.max(1, Math.floor(dist / 4));
    for (var i = 0; i < steps; i++) {
      if (particles.length >= maxParticles) break;
      var t = i / steps;
      var px = x1 + dx * t;
      var py = y1 + dy * t;
      particles.push(createParticle(px, py));
    }
  }

  document.addEventListener('mousemove', function(e) {
    var newX = e.clientX;
    var newY = e.clientY;
    spawnBetween(mouseX, mouseY, newX, newY);
    lastX = mouseX;
    lastY = mouseY;
    mouseX = newX;
    mouseY = newY;
  });

  document.addEventListener('mouseleave', function() {
    mouseX = -200;
    mouseY = -200;
    lastX = -200;
    lastY = -200;
  });

  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
      var newX = e.touches[0].clientX;
      var newY = e.touches[0].clientY;
      spawnBetween(mouseX, mouseY, newX, newY);
      lastX = mouseX;
      lastY = mouseY;
      mouseX = newX;
      mouseY = newY;
    }
  }, { passive: true });

  document.addEventListener('touchend', function() {
    mouseX = -200;
    mouseY = -200;
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // 光标微光
    if (mouseX > 0 && mouseY > 0) {
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,130,230,0.5)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(160,120,220,0.1)';
      ctx.fill();
    }

    var alive = [];
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) continue;
      alive.push(p);

      var alpha = p.life * 0.65;
      var r = Math.floor(185 + p.life * 70);
      var g = Math.floor(150 + p.life * 105);
      var b = Math.floor(230 + p.life * 25);

      // 主体
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(2) + ')';
      ctx.fill();

      // 光晕
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(165,125,225,' + (alpha * 0.22).toFixed(3) + ')';
      ctx.fill();
    }
    particles = alive;

    requestAnimationFrame(animate);
  }

  animate();
})();

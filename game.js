/**
 * NEON STRIKER - Core Game Engine
 * Cyberpunk Space Shooter Game with Synthesized Web Audio
 */

// --- Sound Effects System (Web Audio API) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.masterVolume = null;
  }

  init() {
    if (this.ctx) return; // Already initialized
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.2, this.ctx.currentTime); // Safe volume level
      this.masterVolume.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playLaser() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterVolume);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playExplosion(type = 'normal') {
    if (!this.ctx) return;
    this.resume();
    
    const dur = type === 'boss' ? 1.2 : (type === 'player' ? 0.8 : 0.25);
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    if (type === 'boss') {
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + dur);
    } else {
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + dur);
    }
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);
    
    noiseNode.start();
    noiseNode.stop(this.ctx.currentTime + dur);
    
    // If boss, play an extra low frequency rumble
    if (type === 'boss') {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
      subOsc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 1.0);
      subGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);
      subOsc.connect(subGain);
      subGain.connect(this.masterVolume);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 1.0);
    }
  }

  playPlayerHit() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterVolume);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playPowerUp() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const playTone = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterVolume);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    
    playTone(330, now, 0.08); // E4
    playTone(440, now + 0.06, 0.08); // A4
    playTone(554, now + 0.12, 0.08); // C#5
    playTone(659, now + 0.18, 0.2); // E5
  }

  playLevelUp() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const playTone = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterVolume);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, start + duration);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(261.63, now, 0.15); // C4
    playTone(329.63, now + 0.1, 0.15); // E4
    playTone(392.00, now + 0.2, 0.15); // G4
    playTone(523.25, now + 0.3, 0.4); // C5
  }

  playGameOver() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    const playTone = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterVolume);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.linearRampToValueAtTime(freq * 0.5, start + duration);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(220, now, 0.25); // A3
    playTone(207.65, now + 0.2, 0.25); // G#3
    playTone(196, now + 0.4, 0.25); // G3
    playTone(164.81, now + 0.6, 0.6); // E3
  }
}

// Instantiate Sound Manager
const sounds = new SoundEffects();

// --- Configuration & Constants ---
const LOGICAL_WIDTH = 600;
const LOGICAL_HEIGHT = 800;
const SHIELD_MAX = 50;
const PLAYER_SPEED = 7;
const LASER_SPEED = 14;

// Game State Enum
const GameState = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
};

// Weapon Systems Config
// 射出間隔の倍率。0.5 で発射間隔が半分 (= 連射速度 2 倍)
// 各武器の cooldown(ms) にこの値を掛けたものが実際の発射間隔になる
const SHOT_INTERVAL_SCALE = 0.5;

// HYPER PULSE を超えた武器レベル 1 つにつき増える発射弾数。固定上限なし。
const BULLETS_PER_EXTRA_LEVEL = 2;

// --- 発射弾数の自動上限 ---
// 実測フレーム時間を見て「1 体あたりの発射弾数」の上限を上下させる。
// 速いマシンでは際限なく伸び、遅いマシンではフレームが落ちる手前で止まる。
const BULLET_CAP_MIN = 9;          // 下限 (HYPER PULSE の素の弾数)
// 8ms 未満なら上げ、13ms 超なら下げる。あいだは不感帯として何もしない。
// 撃った弾は 40 フレームほど残り続けるため負荷の反映が遅れる。
// 不感帯を広めに取らないと上限が振動する。
const BULLET_CAP_RAISE_CPU_MS = 8;
const BULLET_CAP_DROP_CPU_MS = 13;
// 実フレーム間隔で GPU 律速を検出する。60Hz の vsync は 16.7ms なので、
// 18ms を超えたら上げ止め、19.5ms (約 51fps) を超えたら下げる。
const BULLET_CAP_HOLD_FRAME_MS = 18;
const BULLET_CAP_DROP_FRAME_MS = 19.5;
const BULLET_CAP_RISE = 0.05;      // 1 フレームあたりの上げ幅 (約 3 発/秒)
const BULLET_CAP_FALL = 0.15;      // 1 フレームあたりの下げ幅 (約 9 発/秒)

const WEAPONS = [
  { name: 'SINGLE BEAM', color: '#00f0ff', count: 1, cooldown: 180 },
  { name: 'DUAL BEAMS', color: '#0072ff', count: 2, cooldown: 160 },
  { name: 'TRIPLE BEAMS', color: '#9d00ff', count: 3, cooldown: 140 },
  { name: 'QUAD BEAMS', color: '#ff007f', count: 4, cooldown: 120 },
  { name: 'PENTA BEAMS', color: '#ff007f', count: 5, cooldown: 100 },
  { name: 'HEXA BEAMS', color: '#ff007f', count: 6, cooldown: 90 },
  { name: 'HEPTA BEAMS', color: '#ff007f', count: 7, cooldown: 80 },
  { name: 'OCTA BEAMS', color: '#ff00ff', count: 8, cooldown: 75 },
  { name: 'HYPER PULSE', color: '#ff00ff', count: 9, cooldown: 70 }
];

// --- Starfield Parallax Particles ---
// ============================================================
// WebGL 描画レイヤー
// ------------------------------------------------------------
// Canvas2D は線 1 本あたり数マイクロ秒の固定コストがあり、
// 終盤の数千発を全部描くと 1 フレーム 100ms を超えてしまう。
// 星・パーティクル・自機レーザーはいずれも「テクスチャを貼った四角形」なので、
// まとめて 1 回の drawArrays で描けるよう WebGL に逃がす。
// ============================================================

const GL_VERT_SRC = [
  'attribute vec2 aPos;',
  'attribute vec2 aUV;',
  'attribute vec4 aColor;',
  'uniform vec2 uResolution;',
  'varying vec2 vUV;',
  'varying vec4 vColor;',
  'void main() {',
  '  vec2 clip = (aPos / uResolution) * 2.0 - 1.0;',
  '  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);',
  '  vUV = aUV;',
  '  vColor = aColor;',
  '}',
].join('\n');

const GL_FRAG_SRC = [
  'precision mediump float;',
  'uniform sampler2D uTex;',
  'varying vec2 vUV;',
  'varying vec4 vColor;',
  'void main() {',
  '  gl_FragColor = texture2D(uTex, vUV) * vColor;',
  '}',
].join('\n');

// --- アトラスの寸法 ---
// テクスチャの明暗プロファイルが 2D 版と一致するよう、
// 「描画サイズ(px)」と「テクセル数」の比を固定して作る。
const GL_ATLAS_W = 512;
const GL_ATLAS_H = 256;

// レーザー: 芯 lineWidth 3 + shadowBlur 10 => 中心から左右 11.5px 広がる
const GL_LASER_CORE_W = 3;
const GL_LASER_BLUR = 10;
const GL_LASER_LEN = 14;
const GL_LASER_W_PX = GL_LASER_CORE_W / 2 + GL_LASER_BLUR;   // 11.5 (片側)
const GL_LASER_HALF_W = GL_LASER_W_PX;
const GL_LASER_EXT = GL_LASER_W_PX;                          // 端の張り出し
const GL_LASER_TEX_W = 64;
const GL_LASER_SCALE = GL_LASER_TEX_W / (GL_LASER_W_PX * 2); // texel / px
const GL_LASER_TEX_H = Math.round((GL_LASER_LEN + GL_LASER_W_PX * 2) * GL_LASER_SCALE);
const GL_LASER_X0 = 8, GL_LASER_Y0 = 8;

// パーティクル: 半径 size の円 + shadowBlur size*2 => 中心から 3*size 広がる
const GL_GLOW_TEX = 128;
const GL_GLOW_SCALE = GL_GLOW_TEX / 6;   // 1 size あたりのテクセル数 (2r = 6*size)
const GL_GLOW_X0 = 160, GL_GLOW_Y0 = 8;

const GL_SOLID_X0 = 352, GL_SOLID_Y0 = 8, GL_SOLID_SIZE = 56;

const GL_UV_LASER = {
  u0: GL_LASER_X0 / GL_ATLAS_W, v0: GL_LASER_Y0 / GL_ATLAS_H,
  u1: (GL_LASER_X0 + GL_LASER_TEX_W) / GL_ATLAS_W, v1: (GL_LASER_Y0 + GL_LASER_TEX_H) / GL_ATLAS_H,
};
const GL_UV_GLOW = {
  u0: GL_GLOW_X0 / GL_ATLAS_W, v0: GL_GLOW_Y0 / GL_ATLAS_H,
  u1: (GL_GLOW_X0 + GL_GLOW_TEX) / GL_ATLAS_W, v1: (GL_GLOW_Y0 + GL_GLOW_TEX) / GL_ATLAS_H,
};
const GL_UV_SOLID = {
  u0: (GL_SOLID_X0 + 4) / GL_ATLAS_W, v0: (GL_SOLID_Y0 + 4) / GL_ATLAS_H,
  u1: (GL_SOLID_X0 + GL_SOLID_SIZE - 4) / GL_ATLAS_W, v1: (GL_SOLID_Y0 + GL_SOLID_SIZE - 4) / GL_ATLAS_H,
};

const GL_COLOR_CACHE = new Map();
// '#rrggbb' と 'rgba(r,g,b,a)' の両方を [r,g,b,a] (0..1) に変換して覚えておく
function glParseColor(str) {
  let c = GL_COLOR_CACHE.get(str);
  if (c) return c;
  let r = 255, g = 255, b = 255, a = 1;
  const s = String(str).trim();
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const num = parseInt(h, 16);
    if (!Number.isNaN(num)) {
      r = (num >> 16) & 255; g = (num >> 8) & 255; b = num & 255;
    }
  } else {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(',');
      r = parseFloat(parts[0]); g = parseFloat(parts[1]); b = parseFloat(parts[2]);
      if (parts.length > 3) a = parseFloat(parts[3]);
    }
  }
  c = [r / 255, g / 255, b / 255, a];
  GL_COLOR_CACHE.set(str, c);
  return c;
}

class GLLayer {
  constructor(container, baseCanvas) {
    this.ok = false;

    const canvas = document.createElement('canvas');
    canvas.id = 'gl-canvas';
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.zIndex = '0';

    // 2D キャンバスを前面に固定する
    baseCanvas.style.position = 'absolute';
    baseCanvas.style.left = '0';
    baseCanvas.style.top = '0';
    baseCanvas.style.zIndex = '1';

    container.insertBefore(canvas, baseCanvas);
    this.canvas = canvas;

    const opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false };
    const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) {
      canvas.remove();
      return;
    }
    this.gl = gl;

    const program = this.buildProgram(gl, GL_VERT_SRC, GL_FRAG_SRC);
    if (!program) {
      canvas.remove();
      return;
    }
    this.program = program;
    gl.useProgram(program);

    this.aPos = gl.getAttribLocation(program, 'aPos');
    this.aUV = gl.getAttribLocation(program, 'aUV');
    this.aColor = gl.getAttribLocation(program, 'aColor');
    this.uResolution = gl.getUniformLocation(program, 'uResolution');
    this.uTex = gl.getUniformLocation(program, 'uTex');

    this.buffer = gl.createBuffer();
    this.texture = this.buildAtlas(gl);

    // 頂点バッファ: 1 クアッド = 6 頂点 x 8 float
    this.floatsPerVertex = 8;
    this.floatsPerQuad = this.floatsPerVertex * 6;
    this.capacity = 4096;
    this.verts = new Float32Array(this.capacity * this.floatsPerQuad);
    this.quadCount = 0;

    gl.viewport(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    gl.uniform2f(this.uResolution, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    gl.uniform1i(this.uTex, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.ok = false; // 以降は 2D フォールバックに戻る
    });

    this.ok = true;
  }

  buildProgram(gl, vsSrc, fsSrc) {
    const compile = (type, source) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  }

  // レーザー・グロー・単色をまとめた 1 枚のテクスチャを作る (色は頂点側で乗算する)
  buildAtlas(gl) {
    const c = document.createElement('canvas');
    c.width = GL_ATLAS_W;
    c.height = GL_ATLAS_H;
    const x = c.getContext('2d');

    // 1. レーザー: 2D 版の stroke をそのまま拡大して焼き込む
    //    (lineWidth 3 + shadowBlur 10 + round cap を GL_LASER_SCALE 倍で描く)
    x.save();
    const lineLen = GL_LASER_LEN * GL_LASER_SCALE;
    const lx = GL_LASER_X0 + GL_LASER_TEX_W / 2;
    const ly0 = GL_LASER_Y0 + (GL_LASER_TEX_H - lineLen) / 2;
    x.strokeStyle = '#ffffff';
    x.lineCap = 'round';
    x.shadowColor = '#ffffff';
    x.shadowBlur = GL_LASER_BLUR * GL_LASER_SCALE;
    x.lineWidth = GL_LASER_CORE_W * GL_LASER_SCALE;
    x.beginPath();
    x.moveTo(lx, ly0);
    x.lineTo(lx, ly0 + lineLen);
    x.stroke();
    x.restore();

    // 2. パーティクル: 2D 版の arc(size) + shadowBlur(size*2) を拡大して焼き込む
    x.save();
    const gcx = GL_GLOW_X0 + GL_GLOW_TEX / 2;
    const gcy = GL_GLOW_Y0 + GL_GLOW_TEX / 2;
    x.shadowColor = '#ffffff';
    x.shadowBlur = 2 * GL_GLOW_SCALE;
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.arc(gcx, gcy, 1 * GL_GLOW_SCALE, 0, Math.PI * 2);
    x.fill();
    x.restore();

    // 3. 星などに使う単色部分
    x.fillStyle = '#ffffff';
    x.fillRect(GL_SOLID_X0, GL_SOLID_Y0, GL_SOLID_SIZE, GL_SOLID_SIZE);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  ensure(extraQuads) {
    if (this.quadCount + extraQuads <= this.capacity) return;
    let cap = this.capacity;
    while (cap < this.quadCount + extraQuads) cap *= 2;
    const next = new Float32Array(cap * this.floatsPerQuad);
    next.set(this.verts.subarray(0, this.quadCount * this.floatsPerQuad));
    this.verts = next;
    this.capacity = cap;
  }

  // 任意の 4 点からなるクアッドを 2 三角形として積む
  pushQuad(x0, y0, x1, y1, x2, y2, x3, y3, uv, r, g, b, a) {
    const v = this.verts;
    let o = this.quadCount * this.floatsPerQuad;
    const u0 = uv.u0, v0 = uv.v0, u1 = uv.u1, v1 = uv.v1;
    // (x0,y0)=左上 (x1,y1)=右上 (x2,y2)=右下 (x3,y3)=左下
    v[o++] = x0; v[o++] = y0; v[o++] = u0; v[o++] = v0; v[o++] = r; v[o++] = g; v[o++] = b; v[o++] = a;
    v[o++] = x1; v[o++] = y1; v[o++] = u1; v[o++] = v0; v[o++] = r; v[o++] = g; v[o++] = b; v[o++] = a;
    v[o++] = x2; v[o++] = y2; v[o++] = u1; v[o++] = v1; v[o++] = r; v[o++] = g; v[o++] = b; v[o++] = a;
    v[o++] = x0; v[o++] = y0; v[o++] = u0; v[o++] = v0; v[o++] = r; v[o++] = g; v[o++] = b; v[o++] = a;
    v[o++] = x2; v[o++] = y2; v[o++] = u1; v[o++] = v1; v[o++] = r; v[o++] = g; v[o++] = b; v[o++] = a;
    v[o++] = x3; v[o++] = y3; v[o++] = u0; v[o++] = v1; v[o++] = r; v[o++] = g; v[o++] = b; v[o++] = a;
    this.quadCount++;
  }

  beginFrame() {
    this.quadCount = 0;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  pushStars(stars) {
    this.ensure(stars.length);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const col = glParseColor(s.color);
      const w = s.size;
      this.pushQuad(s.x, s.y, s.x + w, s.y, s.x + w, s.y + w, s.x, s.y + w,
        GL_UV_SOLID, col[0], col[1], col[2], col[3]);
    }
  }

  pushParticles(particles) {
    this.ensure(particles.length);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0) continue;
      const col = glParseColor(p.color);
      const r = p.size * 3; // もとの円 + その 2 倍のにじみ
      const x0 = p.x - r, y0 = p.y - r, x1 = p.x + r, y1 = p.y + r;
      this.pushQuad(x0, y0, x1, y0, x1, y1, x0, y1,
        GL_UV_GLOW, col[0], col[1], col[2], p.alpha);
    }
  }

  // wantPlayer と一致するレーザーをすべて積む (間引きなし)
  pushLasers(lasers, wantPlayer) {
    this.ensure(lasers.length);
    const hw = GL_LASER_HALF_W;
    for (let i = 0; i < lasers.length; i++) {
      const l = lasers[i];
      if (l.isPlayer !== wantPlayer) continue;
      const col = glParseColor(l.color);
      const len = l.length || 14;
      const dx = l.tdx / len, dy = l.tdy / len;   // 頭から尾への単位ベクトル
      const px = -dy * hw, py = dx * hw;          // 垂直方向
      const ex = dx * hw, ey = dy * hw;           // 端の丸み分の張り出し
      const hx = l.x - ex, hy = l.y - ey;         // 頭
      const tx = l.x + l.tdx + ex, ty = l.y + l.tdy + ey; // 尾
      this.pushQuad(
        hx + px, hy + py,
        hx - px, hy - py,
        tx - px, ty - py,
        tx + px, ty + py,
        GL_UV_LASER, col[0], col[1], col[2], col[3]
      );
    }
  }

  endFrame() {
    const gl = this.gl;
    if (this.quadCount === 0) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.verts.subarray(0, this.quadCount * this.floatsPerQuad), gl.DYNAMIC_DRAW);

    const stride = this.floatsPerVertex * 4;
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.aUV);
    gl.vertexAttribPointer(this.aUV, 2, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(this.aColor);
    gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, stride, 16);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.TRIANGLES, 0, this.quadCount * 6);
  }
}

class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.stars = [];
    this.layers = [
      { speed: 0.5, size: 0.8, count: 50, color: 'rgba(255, 255, 255, 0.3)' },
      { speed: 1.2, size: 1.5, count: 30, color: 'rgba(0, 240, 255, 0.5)' },
      { speed: 2.5, size: 2.2, count: 15, color: 'rgba(255, 0, 127, 0.6)' }
    ];
    this.init();
  }

  init() {
    this.stars = [];
    this.layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x: Math.random() * LOGICAL_WIDTH,
          y: Math.random() * LOGICAL_HEIGHT,
          speed: layer.speed,
          size: layer.size,
          color: layer.color
        });
      }
    });
  }

  update() {
    this.stars.forEach((star) => {
      star.y += star.speed;
      if (star.y > LOGICAL_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * LOGICAL_WIDTH;
      }
    });
  }

  draw(ctx) {
    this.stars.forEach((star) => {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }
}

// --- Dynamic Particle Burst System ---
class GameParticle {
  constructor(x, y, color, speedScale = 1) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.5 + Math.random() * 4.5) * speedScale;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.alpha = 1;
    this.decay = 0.015 + Math.random() * 0.025;
    this.size = 1.5 + Math.random() * 3.5;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowBlur = this.size * 2;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// dead フラグが立った要素を順序を保ったまま 1 パスで取り除く。
// splice を繰り返すと 1 回ごとに後続要素を全部ずらすため、
// 要素数が数千に達する終盤で O(n^2) になっていた。
function compactArray(arr) {
  let w = 0;
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!item.dead) {
      if (w !== i) arr[w] = item;
      w++;
    }
  }
  arr.length = w;
}

// --- Player Spaceship Class ---
class PlayerShip {
  constructor() {
    this.width = 46;
    this.height = 42;
    this.x = LOGICAL_WIDTH / 2 - this.width / 2;
    this.y = LOGICAL_HEIGHT * 0.8;
    this.shield = SHIELD_MAX;
    this.weaponTier = 0;
    this.lives = 3;
    this.clones = 0;
    this.clonePositions = [];
    this.weaponExp = 0;
    this.invulnerable = 0; // Frames of invulnerability
    this.thrusterAnim = 0;
    this.hitCountForHoming = 0;
  }

  resetPosition() {
    this.x = LOGICAL_WIDTH / 2 - this.width / 2;
    this.y = LOGICAL_HEIGHT * 0.8;
  }

  hit(damage = 25) {
    if (this.invulnerable > 0) return false;
    this.shield -= damage;
    if (this.homing > 0) {
      this.hitCountForHoming++;
      if (this.hitCountForHoming >= 3) {
        this.homing--;
        this.hitCountForHoming = 0;
      }
    } else {
      this.homing = 0; // Lose homing ability on hit
      this.hitCountForHoming = 0;
    }
    sounds.playPlayerHit();
    
    if (this.shield <= 0) {
      this.lives--;
      this.shield = this.lives > 0 ? SHIELD_MAX : 0;
      this.invulnerable = 90; // 1.5 seconds of invincibility at 60 FPS
      
      // Demote weapon tier slightly as penalty
      if (this.weaponTier > 0) this.weaponTier--;
      return true; // Death triggered
    }
    
    this.invulnerable = 45; // 0.75 seconds of flash
    return false;
  }

  update() {
    if (this.invulnerable > 0) {
      this.invulnerable--;
    }
    this.thrusterAnim = (this.thrusterAnim + 1) % 10;

    // Sync clone array size
    while (this.clonePositions.length < this.clones) {
      this.clonePositions.push({ x: this.x, y: this.y });
    }
    if (this.clonePositions.length > this.clones) {
      this.clonePositions.length = this.clones;
    }
    
    // Smooth trailing follow (Snake formation)
    let leaderX = this.x;
    let leaderY = this.y;
    // Spacing gets tighter as more clones are added (max 22, min 8)
    const spacing = Math.max(8, 22 - (this.clonePositions.length * 1));
    
    for (let i = 0; i < this.clonePositions.length; i++) {
      const targetX = leaderX;
      const targetY = leaderY + spacing;
      this.clonePositions[i].x += (targetX - this.clonePositions[i].x) * 0.25;
      this.clonePositions[i].y += (targetY - this.clonePositions[i].y) * 0.25;
      leaderX = this.clonePositions[i].x;
      leaderY = this.clonePositions[i].y;
    }
  }

  draw(ctx) {
    // Flash if invulnerable
    if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
      return;
    }

    // Draw Clones
    for (let i = 0; i < this.clonePositions.length; i++) {
      const pos = this.clonePositions[i];
      this.drawShip(ctx, pos.x, pos.y, true);
    }

    // Draw main ship
    this.drawShip(ctx, this.x, this.y, false);
  }

  drawShip(ctx, x, y, isClone) {
    ctx.save();
    if (isClone) {
      ctx.globalAlpha = 0.5;
    }
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;

    // Draw Sleek Cyberpunk Spaceship Delta Wings
    ctx.beginPath();
    // Nose
    ctx.moveTo(x + this.width / 2, y);
    // Right wing tip
    ctx.lineTo(x + this.width, y + this.height);
    // Right exhaust inner corner
    ctx.lineTo(x + this.width * 0.7, y + this.height * 0.8);
    // Exhaust center
    ctx.lineTo(x + this.width * 0.5, y + this.height * 0.95);
    // Left exhaust inner corner
    ctx.lineTo(x + this.width * 0.3, y + this.height * 0.8);
    // Left wing tip
    ctx.lineTo(x, y + this.height);
    ctx.closePath();
    ctx.stroke();

    // Internal cockpit details
    ctx.strokeStyle = '#0072ff';
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y + 10);
    ctx.lineTo(x + this.width * 0.6, y + this.height * 0.6);
    ctx.lineTo(x + this.width * 0.4, y + this.height * 0.6);
    ctx.closePath();
    ctx.stroke();

    // Jet Engine Flame
    const flameHeight = 10 + (this.thrusterAnim > 5 ? 10 : 4);
    ctx.shadowColor = '#ff007f';
    ctx.strokeStyle = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(x + this.width * 0.45, y + this.height * 0.95);
    ctx.lineTo(x + this.width * 0.5, y + this.height * 0.95 + flameHeight);
    ctx.lineTo(x + this.width * 0.55, y + this.height * 0.95);
    ctx.stroke();

    ctx.restore();
  }
}

// --- Laser Projectiles ---
class Laser {
  constructor(x, y, angle = 0, isPlayer = true, speed = LASER_SPEED, color = '#00f0ff') {
    this.x = x;
    this.y = y;
    this.vx = Math.sin(angle) * speed;
    this.vy = -Math.cos(angle) * speed; // negative because up is negative
    this.isPlayer = isPlayer;
    this.color = color;
    this.radius = 3;
    this.length = 14;
    this.angle = angle;
    this.skipDraw = false;
    this.dead = false;
    // 尾側の相対座標。角度はホーミング時以外変わらないので毎フレーム計算しない
    this.tdx = -Math.sin(angle) * this.length;
    this.tdy = Math.cos(angle) * this.length;
  }

  update(enemies = []) {
    // Only update homing every few frames based on an internal counter or random to save CPU
    if (this.isHoming && this.isPlayer && enemies.length > 0 && Math.random() < 0.3) {
      let nearestEnemy = null;
      let minTargetDist = Infinity;
      for (const enemy of enemies) {
        if (enemy.y < this.y + 50) { // Target enemies roughly ahead
          const ddx = enemy.x - this.x;
          const ddy = enemy.y - this.y;
          const distSq = ddx * ddx + ddy * ddy;
          if (distSq < minTargetDist) {
            minTargetDist = distSq;
            nearestEnemy = enemy;
          }
        }
      }
      if (nearestEnemy) {
        const targetAngle = Math.atan2(nearestEnemy.x - this.x, -(nearestEnemy.y - this.y));
        const diff = targetAngle - this.angle;
        const normDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.angle += Math.sign(normDiff) * Math.min(Math.abs(normDiff), 0.15);
        
        const speed = Math.hypot(this.vx, this.vy);
        this.vx = Math.sin(this.angle) * speed;
        this.vy = -Math.cos(this.angle) * speed;
        this.tdx = -Math.sin(this.angle) * this.length;
        this.tdy = Math.cos(this.angle) * this.length;
      }
    }
    
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    if (this.skipDraw) return;
    
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.tdx, this.y + this.tdy);
    ctx.stroke();
    ctx.restore();
  }

  isOutOfBounds() {
    return this.y < -20 || this.y > LOGICAL_HEIGHT + 20 || this.x < -20 || this.x > LOGICAL_WIDTH + 20;
  }
}

// --- Enemy Spaceships ---
class Enemy {
  constructor(type, level, player = null) {
    this.dead = false;
    this.type = type; // 'drone', 'speeder', 'tank', 'boss'
    this.x = 0;
    this.y = -50;
    this.vx = 0;
    this.vy = 0;
    this.level = level;
    this.phase = Math.random() * Math.PI * 2;
    this.shootTimer = Math.random() * 120 + 30;
    this.lastVisualHit = 0;
    this.initType(type, level, player);
  }

  initType(type, level, player) {
    switch (type) {
      case 'drone':
        this.size = 22;
        this.health = 2 + Math.floor(level * 2.0 + level * level * 0.5);
        this.vy = 1.5 + Math.random() * 1.5 + (level * 0.15);
        this.color = '#00ff66'; // Green neon
        this.scoreValue = 100 + level * 10;
        this.x = Math.random() * (LOGICAL_WIDTH - this.size * 2) + this.size;
        break;
      case 'speeder':
        this.size = 18;
        this.health = 1 + Math.floor(level * 1.0 + level * level * 0.2);
        this.vy = 3 + Math.random() * 1.5 + (level * 0.3);
        this.color = '#ffde00'; // Yellow neon
        this.scoreValue = 180 + level * 20;
        this.x = Math.random() * (LOGICAL_WIDTH - this.size * 2) + this.size;
        break;
      case 'tank':
        this.size = 32;
        this.health = 5 + Math.floor(level * 4.0 + level * level * 1.0);
        this.vy = 1.0 + (level * 0.08);
        this.color = '#ff0055'; // Pink/Red neon
        this.scoreValue = 350 + level * 30;
        this.x = Math.random() * (LOGICAL_WIDTH - this.size * 2) + this.size;
        break;
      case 'blocker':
        this.size = 35;
        let playerPower = 1;
        if (player) {
          // Multiply health based on the number of lasers the player can fire (clones + weapon upgrades)
          playerPower = (1 + player.clones) * (1 + player.weaponTier * 0.3);
          if (player.homing) playerPower *= 5.0; // Slightly reduced from 6.0
        }
        const baseBlockerHealth = 12 + Math.pow(level, 1.8) * 5;
        this.health = 12 + Math.floor(baseBlockerHealth * playerPower);
        this.vy = 0.5 + Math.random() * 0.5 + (level * 0.05);
        this.color = '#ff9900'; // Orange neon
        this.scoreValue = 500 + level * 50;
        this.x = Math.random() * (LOGICAL_WIDTH - this.size * 2) + this.size;
        break;
      case 'boss':
        this.size = 90;
        this.x = LOGICAL_WIDTH / 2;
        this.y = -100; // Slowly descends
        let bossPlayerPower = 1;
        if (player) {
          bossPlayerPower = (1 + player.clones) * (1 + player.weaponTier * 0.3);
          if (player.homing) bossPlayerPower *= 3.5; // Slightly reduced from 4.0
        }
        const baseBossHealth = 35 + Math.floor(level * 35 + level * level * 8);
        this.health = 70 + Math.floor(baseBossHealth * bossPlayerPower);
        this.maxHealth = this.health;
        this.vy = 1.0; // Intial descent speed
        this.color = '#b800ff'; // Purple/Magenta neon
        this.scoreValue = 2500 + level * 500;
        break;
    }
    this.maxHealth = this.health;
  }

  update(playerX, playerY, lasers, activeLasers) {
    this.phase += 0.05;
    
    if (this.type === 'boss') {
      // Boss movements
      if (this.y < 120) {
        this.y += this.vy; // Descend
      } else {
        // Hover and sway side to side
        this.x = LOGICAL_WIDTH / 2 + Math.sin(this.phase * 0.3) * (LOGICAL_WIDTH / 2 - 120);
        this.y = 120 + Math.cos(this.phase * 0.5) * 20;
      }
      
      // Boss Shooting
      this.shootTimer--;
      if (this.shootTimer <= 0 && this.y >= 100) {
        sounds.playLaser();
        // Spray patterns based on level
        const count = 5 + this.level * 2;
        const baseAngle = Math.PI; // straight down
        for (let i = 0; i < count; i++) {
          const spread = 0.8 + Math.min(1.0, this.level * 0.1);
          const angle = baseAngle - (spread / 2) + (spread / (count - 1)) * i;
          activeLasers.push(new Laser(this.x, this.y + 40, angle, false, 6 + this.level * 0.5, '#00bbff'));
        }
        this.shootTimer = Math.max(80 - (this.level * 10), 10); // faster shooting with level
      }
    } else {
      // Normal enemies
      this.y += this.vy;
      
      if (this.type === 'speeder') {
        // Zigzag side-to-side
        this.x += Math.sin(this.phase * 0.8) * 4.5;
        // Clamp to stay on screen
        if (this.x < this.size) this.x = this.size;
        if (this.x > LOGICAL_WIDTH - this.size) this.x = LOGICAL_WIDTH - this.size;
      }
      
      if (this.type === 'tank' || this.type === 'blocker') {
        this.shootTimer--;
        if (this.shootTimer <= 0) {
          sounds.playLaser();
          // Aim slightly towards the player
          const dx = playerX - this.x;
          const dy = playerY - this.y;
          const angle = Math.atan2(dx, dy); // angle relative to vertical-down
          
          if (this.type === 'blocker') {
            const numLasers = 6 + Math.floor(this.level);
            const baseAngle = this.phase * 5; // Spinning pattern
            for (let i = 0; i < numLasers; i++) {
              const a = baseAngle + (Math.PI * 2 / numLasers) * i;
              activeLasers.push(new Laser(this.x, this.y + 20, a, false, 5 + this.level * 0.2, '#ff9900'));
            }
            this.shootTimer = Math.max(30, Math.random() * 60 + 40 - this.level * 2);
          } else {
            activeLasers.push(new Laser(this.x, this.y + 15, angle, false, 7 + this.level * 0.2, '#ff0055'));
            this.shootTimer = Math.random() * 100 + 60; // reload
          }
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = this.type === 'boss' ? 25 : 12;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    
    if (this.type === 'drone') {
      // Hexagon shape
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI/6;
        const px = this.x + Math.cos(angle) * this.size;
        const py = this.y + Math.sin(angle) * this.size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } 
    else if (this.type === 'speeder') {
      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x + this.size * 0.8, this.y);
      ctx.lineTo(this.x, this.y + this.size);
      ctx.lineTo(this.x - this.size * 0.8, this.y);
      ctx.closePath();
      ctx.stroke();
      
      // Core glowing dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } 
    else if (this.type === 'tank') {
      // Heavy fighter shape with two guns
      ctx.beginPath();
      ctx.moveTo(this.x - this.size * 0.5, this.y - this.size * 0.5);
      ctx.lineTo(this.x + this.size * 0.5, this.y - this.size * 0.5);
      ctx.lineTo(this.x + this.size * 0.7, this.y + this.size * 0.2);
      ctx.lineTo(this.x + this.size * 0.3, this.y + this.size * 0.5);
      ctx.lineTo(this.x - this.size * 0.3, this.y + this.size * 0.5);
      ctx.lineTo(this.x - this.size * 0.7, this.y + this.size * 0.2);
      ctx.closePath();
      ctx.stroke();
      
      // Dual guns visual
      ctx.strokeRect(this.x - this.size * 0.4, this.y + this.size * 0.5, 4, 6);
      ctx.strokeRect(this.x + this.size * 0.4 - 4, this.y + this.size * 0.5, 4, 6);
    } 
    else if (this.type === 'blocker') {
      // Solid reinforced square
      ctx.beginPath();
      ctx.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
      ctx.stroke();
      
      // Draw internal lines for strength feel
      ctx.strokeRect(this.x - this.size * 0.8, this.y - this.size * 0.8, this.size * 1.6, this.size * 1.6);
      
      // Draw Health Number in center
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.floor(this.size * 0.9) + 'px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(this.health), this.x, this.y);
    }
    else if (this.type === 'boss') {
      // Huge boss battlecruiser
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      // Nose
      ctx.moveTo(this.x, this.y + this.size * 0.4);
      // Front wing detail
      ctx.lineTo(this.x + this.size * 0.35, this.y + this.size * 0.1);
      // Wing tip right
      ctx.lineTo(this.x + this.size * 0.75, this.y - this.size * 0.2);
      // Side indent
      ctx.lineTo(this.x + this.size * 0.45, this.y - this.size * 0.15);
      // Back right corner
      ctx.lineTo(this.x + this.size * 0.25, this.y - this.size * 0.4);
      // Back exhaust
      ctx.lineTo(this.x - this.size * 0.25, this.y - this.size * 0.4);
      // Back left corner
      ctx.lineTo(this.x - this.size * 0.25, this.y - this.size * 0.4);
      ctx.lineTo(this.x - this.size * 0.45, this.y - this.size * 0.15);
      // Wing tip left
      ctx.lineTo(this.x - this.size * 0.75, this.y - this.size * 0.2);
      // Front wing detail left
      ctx.lineTo(this.x - this.size * 0.35, this.y + this.size * 0.1);
      ctx.closePath();
      ctx.stroke();

      // Glowing boss engine/core
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(this.x - this.size * 0.15, this.y - this.size * 0.4, this.size * 0.3, 8);
      
      // Boss Health Bar overlay directly in canvas
      const barW = this.size * 1.5;
      const barH = 5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(this.x - barW / 2, this.y - this.size * 0.55, barW, barH);
      
      ctx.fillStyle = '#ff0055';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff0055';
      ctx.fillRect(this.x - barW / 2, this.y - this.size * 0.55, barW * (this.health / this.maxHealth), barH);
    }
    
    ctx.restore();
  }

  isOutOfBounds() {
    return this.y > LOGICAL_HEIGHT + 100;
  }
}

// --- Power-up Drops ---
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'weapon', 'shield', 'life'
    this.size = 18;
    this.vy = 2.0;
    this.phase = Math.random() * 100;
    
    // Choose color
    if (type === 'weapon') this.color = '#ff007f'; // Pink
    else if (type === 'shield') this.color = '#00f0ff'; // Cyan
    else if (type === 'life') this.color = '#00ff66'; // Green
    else if (type === 'clone') this.color = '#b800ff'; // Purple
    else if (type === 'homing') this.color = '#ffff00'; // Yellow
  }

  update() {
    this.y += this.vy;
    this.phase += 0.06;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    
    // Animated glowing diamond
    ctx.beginPath();
    const pulseSize = this.size + Math.sin(this.phase) * 2;
    ctx.moveTo(this.x, this.y - pulseSize);
    ctx.lineTo(this.x + pulseSize, this.y);
    ctx.lineTo(this.x, this.y + pulseSize);
    ctx.lineTo(this.x - pulseSize, this.y);
    ctx.closePath();
    ctx.stroke();

    // Symbol inside
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let symbol = 'W';
    if (this.type === 'shield') symbol = 'S';
    if (this.type === 'life') symbol = 'L';
    if (this.type === 'clone') symbol = 'C';
    if (this.type === 'homing') symbol = 'H';
    
    ctx.fillText(symbol, this.x, this.y);
    ctx.restore();
  }

  isOutOfBounds() {
    return this.y > LOGICAL_HEIGHT + 20;
  }
}

// --- Main Game Engine ---
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution
    this.canvas.width = LOGICAL_WIDTH;
    this.canvas.height = LOGICAL_HEIGHT;

    // 背面の WebGL レイヤー。使えない環境では null のまま 2D 描画に戻る
    this.glLayer = null;
    try {
      const container = this.canvas.parentNode;
      if (container) {
        const layer = new GLLayer(container, this.canvas);
        if (layer.ok) this.glLayer = layer;
      }
    } catch (err) {
      this.glLayer = null;
    }
    
    this.starfield = new Starfield(this.canvas);
    this.player = null;
    
    // Game entities arrays
    this.lasers = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.hudDirty = false;
    // 発射弾数の自動上限とフレーム時間の指数移動平均
    this.bulletCap = BULLET_CAP_MIN;
    this.frameCpuAvg = 0;
    this.frameDeltaAvg = 1000 / 60;
    this.lastFrameStart = 0;
    // クローン中心座標のキャッシュ (毎フレーム確保しないよう使い回す)
    this._cloneCx = new Float64Array(64);
    this._cloneCy = new Float64Array(64);
    
    // Score & Progress
    this.score = 0;
    this.level = 1;
    this.bossDefeatedCount = 0;
    this.enemiesKilled = 0;
    this.enemiesNeededForLevel = 15;
    this.bossSpawned = false;
    
    // Control variables
    this.keys = {};
    this.mouse = { x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT * 0.8, down: false };
    this.isMouseActive = false;
    this.lastShotTime = 0;
    
    // Settings & State
    this.state = GameState.START;
    
    // DOM Elements Cache
    this.hudElement = document.getElementById('hud');
    this.scoreValElement = document.getElementById('hud-score');
    this.levelValElement = document.getElementById('hud-level');
    this.homingValElement = document.getElementById('hud-homing');
    this.livesValElement = document.getElementById('hud-lives');
    this.weaponBarElement = document.getElementById('hud-weapon-bar');
    this.weaponNameElement = document.getElementById('hud-weapon-name');
    this.shieldBarElement = document.getElementById('hud-shield-bar');
    
    this.startMenu = document.getElementById('start-menu');
    this.pauseMenu = document.getElementById('pause-menu');
    this.gameOverMenu = document.getElementById('game-over-menu');
    this.goScore = document.getElementById('go-score');
    this.goLevel = document.getElementById('go-level');
    this.playerNameInput = document.getElementById('player-name-input');
    this.highScoreForm = document.getElementById('high-score-form');
    
    // Bind Event Listeners
    this.setupEvents();
    
    // Render first background frame & load high scores
    this.loadHighScores();
    this.gameLoop();
  }

  setupEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.isMouseActive = false; // Disable mouse follow on keyboard input
      
      // Escape for Pause toggle
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.state === GameState.PLAYING) {
          this.pauseGame();
        } else if (this.state === GameState.PAUSED) {
          this.resumeGame();
        }
      }
      
      // Prevent browser default scrolling with arrows and space
      if (['Spacebar', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) > -1) {
        e.preventDefault();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // Handle relative cursor coords with bounding client rect
    const getMouseCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      // Scale coordinates from actual display dimensions back to logical virtual size
      const scaleX = LOGICAL_WIDTH / rect.width;
      const scaleY = LOGICAL_HEIGHT / rect.height;
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const handlePointerDown = (e) => {
      if (this.state === GameState.PLAYING) {
        sounds.init();
        this.mouse.down = true;
        this.isMouseActive = true; // Set mouse active on click
        const coords = getMouseCoords(e);
        this.mouse.x = coords.x;
        this.mouse.y = coords.y;
      }
    };

    const handlePointerMove = (e) => {
      if (this.state === GameState.PLAYING) {
        this.isMouseActive = true; // Set mouse active on movement
        const coords = getMouseCoords(e);
        this.mouse.x = coords.x;
        this.mouse.y = coords.y;
      }
    };

    const handlePointerUp = () => {
      this.mouse.down = false;
    };

    // Mouse and Touch Listeners on container
    const container = document.getElementById('game-container');
    container.addEventListener('mousedown', handlePointerDown);
    container.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    
    container.addEventListener('touchstart', (e) => {
      handlePointerDown(e);
    }, { passive: true });
    container.addEventListener('touchmove', (e) => {
      handlePointerMove(e);
    }, { passive: true });
    container.addEventListener('touchend', handlePointerUp);

    // Button Events
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-restart-paused').addEventListener('click', () => this.startGame());
    document.getElementById('btn-return-title-paused').addEventListener('click', () => this.returnToTitle());
    document.getElementById('btn-restart').addEventListener('click', () => this.startGame());
    document.getElementById('btn-return-title').addEventListener('click', () => this.returnToTitle());
    document.getElementById('btn-submit-score').addEventListener('click', () => this.submitHighScore());
  }

  // --- High Score Functions ---
  async loadHighScores() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '<li>Loading...</li>';
    try {
      const res = await fetch('api.php');
      const data = await res.json();
      const scores = data.scores || [];
      
      list.innerHTML = '';
      scores.forEach((entry, idx) => {
        const li = document.createElement('li');
        if (idx === 0) {
          li.innerHTML = `<span class="rank-name neon-text-pink">${entry.name}</span> <span class="rank-score">${entry.score.toLocaleString()}</span>`;
        } else {
          li.innerHTML = `<span class="rank-name">${entry.name}</span> <span class="rank-score">${entry.score.toLocaleString()}</span>`;
        }
        list.appendChild(li);
      });
      this.currentScores = scores;
    } catch(e) {
      list.innerHTML = '<li>Error loading</li>';
      this.currentScores = [];
    }
  }

  checkIfHighScore() {
    // 常に名前入力フォームを表示してスコア送信できるようにする
    this.highScoreForm.classList.remove('hidden');
    
    const savedName = localStorage.getItem('neon_striker_last_name');
    if (savedName) {
      this.playerNameInput.value = savedName;
    } else {
      this.playerNameInput.value = '';
    }
    
    this.playerNameInput.focus();
  }

  async submitHighScore() {
    const name = this.playerNameInput.value.trim().toUpperCase() || 'AAA';
    this.highScoreForm.classList.add('hidden');
    
    localStorage.setItem('neon_striker_last_name', name);
    
    try {
      await fetch('api.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, score: this.score })
      });
      this.loadHighScores();
    } catch(e) {
      console.error(e);
    }
  }

  // --- Game State Flow Control ---
  startGame() {
    sounds.init();
    sounds.resume();
    sounds.playLevelUp();
    this.loadHighScores();

    this.player = new PlayerShip();
    this.lasers = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    
    this.score = 0;
    this.level = 1;
    this.enemiesKilled = 0;
    this.enemiesNeededForLevel = 30;
    this.bossSpawned = false;
    
    this.state = GameState.PLAYING;
    
    // Update Menu Displays
    this.startMenu.classList.add('hidden');
    this.pauseMenu.classList.add('hidden');
    this.gameOverMenu.classList.add('hidden');
    this.hudElement.classList.remove('hidden');
    
    this.updateHUD();
  }

  pauseGame() {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.PAUSED;
    this.pauseMenu.classList.remove('hidden');
  }

  returnToTitle() {
    this.state = GameState.MENU;
    this.player = null;
    this.lasers = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.startMenu.classList.remove('hidden');
    this.pauseMenu.classList.add('hidden');
    this.gameOverMenu.classList.add('hidden');
    this.hudElement.classList.add('hidden');
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resumeGame() {
    if (this.state !== GameState.PAUSED) return;
    sounds.resume();
    this.state = GameState.PLAYING;
    this.pauseMenu.classList.add('hidden');
  }

  gameOver() {
    this.state = GameState.GAMEOVER;
    sounds.playGameOver();
    
    this.hudElement.classList.add('hidden');
    this.gameOverMenu.classList.remove('hidden');
    
    this.goScore.textContent = this.score.toLocaleString();
    this.goLevel.textContent = this.level;
    
    this.checkIfHighScore();
  }

  // --- Spawning Logic ---
  spawnEnemies() {
    if (this.bossSpawned) return; // Wait until boss is destroyed
    
    const activeNormalEnemies = this.enemies.filter(e => e.type !== 'boss').length;
    
    // Trigger Boss Fight!
    if (!this.bossSpawned && this.enemiesKilled >= this.enemiesNeededForLevel) {
      if (activeNormalEnemies === 0) {
        this.bossSpawned = true;
        this.enemies.push(new Enemy('boss', this.level, this.player));
        sounds.playExplosion('boss'); // Sound cues boss spawn
      }
      return;
    }
    
    // Control enemy counts based on levels (starts low, scales reasonably)
    const maxOnScreen = Math.min(40, 3 + Math.floor(Math.pow(this.level, 1.5) * 2));
    
    // Spawn chance accelerates exponentially
    if (!this.bossSpawned && this.enemiesKilled < this.enemiesNeededForLevel && activeNormalEnemies < maxOnScreen && Math.random() < 0.01 + Math.pow(this.level, 1.5) * 0.005) {
      // Pick random enemy type
      const roll = Math.random();
      let type = 'drone';
      
      if (roll > 0.95 && this.level >= 2) {
        type = 'blocker';
      } else if (roll > 0.80 && this.level >= 3) {
        type = 'tank';
      } else if (roll > 0.50 && this.level >= 2) {
        type = 'speeder';
      }
      
      this.enemies.push(new Enemy(type, this.level, this.player));
    }
  }

  // --- Weapon Shooting System ---
  fireLaser() {
    const now = Date.now();
    
    let config;
    let damageMult = 1;
    
    if (this.player.weaponTier < WEAPONS.length) {
      config = WEAPONS[this.player.weaponTier];
    } else {
      const base = WEAPONS[WEAPONS.length - 1];
      const extraPower = this.player.weaponTier - (WEAPONS.length - 1);
      const weaponLevel = this.player.weaponTier + 1; // 1-indexed weapon level
      
      if (weaponLevel >= 20) {
        // Level 20 (HYPER PULSE +11) onwards: Ultimate power jump (+100x per level)
        damageMult = 250.0 + (extraPower - 11) * 100.0;
      } else if (weaponLevel >= 15) {
        // Level 15 to 19 (HYPER PULSE +6 ~ +10): Huge power jump and steeper scaling (+30x per level)
        damageMult = 30.0 + (extraPower - 6) * 30.0;
      } else if (weaponLevel >= 11) {
        // From Level 11 to 14 (HYPER PULSE +2 ~ +5) (+2.0x per level)
        damageMult = 5.0 + (extraPower - 2) * 2.0; 
      } else {
        // Level 10 (HYPER PULSE +1)
        damageMult = 3.0; 
      }
      
      config = {
        name: `HYPER PULSE +${extraPower}`,
        color: base.color,
        // 武器レベルが上がるほど 1 体あたりの発射弾数が増え続ける。
        // 実際の値はフレーム時間から決まる自動上限 (bulletCap) で頭打ちになる。
        count: Math.max(
          base.count,
          Math.min(
            base.count + Math.floor(extraPower * BULLETS_PER_EXTRA_LEVEL),
            Math.floor(this.bulletCap)
          )
        ),
        cooldown: Math.max(15, base.cooldown - extraPower * 5)
      };
    }
    
    if (now - this.lastShotTime >= config.cooldown * SHOT_INTERVAL_SCALE) {
      sounds.playLaser();
      this.lastShotTime = now;
      
      const px = this.player.x + this.player.width / 2;
      const py = this.player.y;
      
      const spreadAngle = 0.15 + Math.min(0.8, config.count * 0.04);
      const spreadWidth = Math.min(250, 48 + config.count * 4);
      for (let i = 0; i < config.count; i++) {
        const angleOffset = (config.count === 1) ? 0 : -spreadAngle + (spreadAngle * 2 / (config.count - 1)) * i;
        const xOffset = (config.count === 1) ? 0 : -(spreadWidth / 2) + (spreadWidth / (config.count - 1)) * i;
        const yOffset = (i % 2 === 0) ? 4 : 12;
        const speed = config.count >= 5 ? 20 : LASER_SPEED;
        
        const laser = new Laser(px + xOffset, py + yOffset, angleOffset, true, speed, config.color);
        laser.damage = damageMult;
        laser.isHoming = this.player.homing;
        this.lasers.push(laser);
      }
      
      // Inject propulsion thruster particles on shoot for weight sensation
      const particleCount = Math.min(10, 4 + Math.floor(config.count / 3));
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(new GameParticle(px, this.player.y + this.player.height, '#ff007f', 0.5));
      }

      // Clone shooting
      const totalClones = this.player.clonePositions.length;
      // WebGL レイヤーなら全弾そのまま描けるので描画スキップは設定しない。
      // 2D フォールバック時のみ、従来どおりの間引き率を使う。
      const skipProb = (this.glLayer && this.glLayer.ok) || totalClones === 0
        ? 0
        : (1.0 - (1.0 / Math.pow(totalClones, 0.8)));
      
      for (let c = 0; c < totalClones; c++) {
        const pos = this.player.clonePositions[c];
        const cPx = pos.x + this.player.width / 2;
        const cPy = pos.y;
        
        for (let i = 0; i < config.count; i++) {
          const angleOffset = (config.count === 1) ? 0 : -spreadAngle + (spreadAngle * 2 / (config.count - 1)) * i;
          const xOffset = (config.count === 1) ? 0 : -(spreadWidth / 2) + (spreadWidth / (config.count - 1)) * i;
          const yOffset = (i % 2 === 0) ? 4 : 12;
          const speed = config.count >= 5 ? 20 : LASER_SPEED;
          
          const laser = new Laser(cPx + xOffset, cPy + yOffset, angleOffset, true, speed, config.color);
          laser.damage = damageMult;
          laser.isHoming = this.player.homing;
          // Skip rendering for performance, but keep physics/damage
          laser.skipDraw = Math.random() < skipProb;
          this.lasers.push(laser);
        }
      }
    }
  }

  // --- Collision Detector (Bounding Box & Circle Hybrid) ---
  checkCollisions() {
    // 1. Player Lasers collides with Enemies
    for (let lIdx = this.lasers.length - 1; lIdx >= 0; lIdx--) {
      const laser = this.lasers[lIdx];
      if (!laser.isPlayer || laser.dead) continue;

      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = this.enemies[eIdx];
        if (enemy.dead) continue;

        // Simple radial collision
        const dx = laser.x - enemy.x;
        const dy = laser.y - enemy.y;
        const collisionThreshold = enemy.size + laser.radius;

        if (dx * dx + dy * dy < collisionThreshold * collisionThreshold) {
          // Remove laser
          laser.dead = true;
          
          const now = Date.now();
          // Throttle visual effects if hits are too frequent (less than 50ms apart per enemy)
          if (now - enemy.lastVisualHit > 50) {
            enemy.lastVisualHit = now;
            // Flash impact sparks
            for (let i = 0; i < 6; i++) {
              this.particles.push(new GameParticle(laser.x, laser.y, enemy.color, 0.8));
            }
          }
          
          // Apply damage (always apply damage)
          enemy.health -= (laser.damage || 1);
          if (enemy.health <= 0) {
            // Blow up enemy!
            sounds.playExplosion(enemy.type === 'boss' ? 'boss' : 'normal');
            
            // Major explosion burst
            const pCount = enemy.type === 'boss' ? 50 : 10;
            const pSpeed = enemy.type === 'boss' ? 2.0 : 1.2;
            for (let i = 0; i < pCount; i++) {
              this.particles.push(new GameParticle(enemy.x, enemy.y, enemy.color, pSpeed));
            }
            
            // Register score
            this.score += enemy.scoreValue;
            this.hudDirty = true;
            
            if (enemy.type === 'boss') {
              this.bossDefeatedCount++;
              
              // Guarantee Weapon Drop on boss kill
              this.powerups.push(new PowerUp(enemy.x, enemy.y, 'weapon'));
              
              // Only advance level if all bosses are dead
              const remainingBosses = this.enemies.filter(e => e.type === 'boss' && e !== enemy).length;
              if (remainingBosses === 0) {
                this.level++;
                this.bossSpawned = false;
                this.enemiesKilled = 0;
                this.enemiesNeededForLevel = 15 + this.level * 5; // Faster boss spawns
                sounds.playLevelUp();
              }
            } else {
              this.enemiesKilled++;
              
              if (enemy.type === 'blocker') {
                const bRoll = Math.random();
                let bType = 'weapon';
                if (bRoll > 0.80) bType = 'homing'; // 20% homing
                else if (bRoll > 0.75) bType = 'life'; // 5% life
                else if (bRoll > 0.70) bType = 'shield'; // 5% shield
                else if (bRoll > 0.30) bType = 'clone'; // 40% clone
                this.powerups.push(new PowerUp(enemy.x, enemy.y, bType));
              } else {
                // Random PowerUp Spawning roll
                const dropChance = 0.30; // Increased by another 5% (from 0.25)
                if (Math.random() < dropChance) {
                  const roll = Math.random();
                  let pType = 'weapon';
                  if (roll > 0.80) pType = 'homing'; // 20% homing
                  else if (roll > 0.75) pType = 'life'; // 5% life
                  else if (roll > 0.70) pType = 'shield'; // 5% shield
                  else if (roll > 0.30) pType = 'clone'; // 40% clone
                  
                  this.powerups.push(new PowerUp(enemy.x, enemy.y, pType));
                }
              }
            }
            
            enemy.dead = true;
          }
          break; // break enemy loop, check next laser
        }
      }
    }

    // 2. Enemy Lasers / Enemies collides with Player Ship
    const pxCenter = this.player.x + this.player.width / 2;
    const pyCenter = this.player.y + this.player.height / 2;
    const playerRadius = this.player.width * 0.4;

    // クローンの中心座標はフレーム内で不変なので先に1回だけ求めておく
    const clonePositions = this.player.clonePositions;
    const cloneCount = clonePositions.length;
    if (this._cloneCx.length < cloneCount) {
      this._cloneCx = new Float64Array(cloneCount * 2);
      this._cloneCy = new Float64Array(cloneCount * 2);
    }
    const cloneCx = this._cloneCx;
    const cloneCy = this._cloneCy;
    const halfW = this.player.width / 2;
    const halfH = this.player.height / 2;
    for (let c = 0; c < cloneCount; c++) {
      cloneCx[c] = clonePositions[c].x + halfW;
      cloneCy[c] = clonePositions[c].y + halfH;
    }
    
    // Check enemy lasers hit player or clones
    for (let lIdx = this.lasers.length - 1; lIdx >= 0; lIdx--) {
      const laser = this.lasers[lIdx];
      if (laser.isPlayer || laser.dead) continue;
      
      let hitCloneIdx = -1;
      const laserCloneR = playerRadius + laser.radius;
      const laserCloneRSq = laserCloneR * laserCloneR;
      for (let c = 0; c < cloneCount; c++) {
        const dx = laser.x - cloneCx[c];
        const dy = laser.y - cloneCy[c];
        if (dx * dx + dy * dy < laserCloneRSq) {
          hitCloneIdx = c;
          break;
        }
      }

      if (hitCloneIdx !== -1) {
        laser.dead = true;
        for (let i = 0; i < 15; i++) {
          this.particles.push(new GameParticle(laser.x, laser.y, '#b800ff', 1.5));
        }
        this.player.cloneHP = (this.player.cloneHP || (this.player.clones * 3)) - 1;
        this.player.clones = Math.ceil(this.player.cloneHP / 3);
        sounds.playExplosion('normal');
        continue;
      }
      
      const lpdx = laser.x - pxCenter;
      const lpdy = laser.y - pyCenter;
      if (lpdx * lpdx + lpdy * lpdy < laserCloneRSq) {
        // Remove laser
        laser.dead = true;
        
        // Spawn sparks
        for (let i = 0; i < 6; i++) {
          this.particles.push(new GameParticle(laser.x, laser.y, '#00f0ff', 0.8));
        }

        // Damage Player
        const died = this.player.hit(20);
        this.hudDirty = true;
        
        if (died) {
          this.explodePlayer();
          if (this.player.lives <= 0) {
            this.gameOver();
          } else {
            this.player.resetPosition();
          }
        }
      }
    }

    // Check enemies direct crashes into player or clones
    for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
      const enemy = this.enemies[eIdx];
      if (enemy.dead) continue;

      let hitCloneIdx = -1;
      const enemyCloneR = playerRadius + enemy.size * 0.8;
      const enemyCloneRSq = enemyCloneR * enemyCloneR;
      for (let c = 0; c < cloneCount; c++) {
        const dx = enemy.x - cloneCx[c];
        const dy = enemy.y - cloneCy[c];
        if (dx * dx + dy * dy < enemyCloneRSq) {
          hitCloneIdx = c;
          break;
        }
      }

      if (hitCloneIdx !== -1) {
        for (let i = 0; i < 20; i++) {
          this.particles.push(new GameParticle(enemy.x, enemy.y, '#b800ff', 2.0));
        }
        this.player.cloneHP = (this.player.cloneHP || (this.player.clones * 3)) - 1;
        this.player.clones = Math.ceil(this.player.cloneHP / 3);
        sounds.playExplosion('normal');
        if (enemy.type !== 'boss') {
          enemy.dead = true;
        }
        continue;
      }

      const epdx = enemy.x - pxCenter;
      const epdy = enemy.y - pyCenter;

      if (epdx * epdx + epdy * epdy < enemyCloneRSq) {
        // Destroy non-boss enemies instantly on crash
        if (enemy.type !== 'boss') {
          sounds.playExplosion('normal');
          for (let i = 0; i < 15; i++) {
            this.particles.push(new GameParticle(enemy.x, enemy.y, enemy.color, 1.2));
          }
          enemy.dead = true;
        }
        
        // Damage player severely
        const damage = enemy.type === 'boss' ? 50 : 35;
        const died = this.player.hit(damage);
        this.hudDirty = true;
        
        if (died) {
          this.explodePlayer();
          if (this.player.lives <= 0) {
            this.gameOver();
            return;
          } else {
            this.player.resetPosition();
          }
        }
      }
    }

    // 3. Player picks up Power-ups
    for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
      const item = this.powerups[pIdx];
      const ipdx = item.x - pxCenter;
      const ipdy = item.y - pyCenter;
      const itemR = playerRadius + item.size;

      if (ipdx * ipdx + ipdy * ipdy < itemR * itemR) {
        sounds.playPowerUp();
        
        // Apply powerup reward
        if (item.type === 'weapon') {
          this.player.weaponTier++;
          sounds.playLevelUp(); // Notify tier up
          this.score += 200;
        } 
        else if (item.type === 'shield') {
          this.player.shield = Math.min(this.player.shield + 40, SHIELD_MAX);
          this.score += 100;
        } 
        else if (item.type === 'life') {
          this.player.lives++; // No max lives limit
          this.score += 500;
        }
        else if (item.type === 'clone') {
          this.player.clones = (this.player.clones || 0) + 1;
          this.player.cloneHP = (this.player.cloneHP || 0) + 3;
          this.score += 300;
        }
        else if (item.type === 'homing') {
          this.player.homing = (this.player.homing > 0 ? this.player.homing : 0) + 1;
          this.score += 500;
        }
        
        // Visual collection particles
        for (let i = 0; i < 12; i++) {
          this.particles.push(new GameParticle(item.x, item.y, item.color, 1.5));
        }
        
        item.dead = true;
        this.hudDirty = true;
      }
    }
  }

  explodePlayer() {
    sounds.playExplosion('player');
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;
    for (let i = 0; i < 40; i++) {
      this.particles.push(new GameParticle(px, py, '#00f0ff', 2.0));
      this.particles.push(new GameParticle(px, py, '#ff007f', 1.5));
    }
  }

  // --- Real-time updates ---
  update() {
    this.starfield.update();
    
    if (this.state !== GameState.PLAYING) return;
    
    this.player.update();
    
    // Keyboard inputs handling (W,A,S,D / Arrow Keys)
    let moveX = 0;
    let moveY = 0;
    
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveX = -1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveX = 1;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) moveY = -1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) moveY = 1;
    
    if (moveX !== 0 || moveY !== 0) {
      // Normalize direction vectors
      const len = Math.hypot(moveX, moveY);
      this.player.x += (moveX / len) * PLAYER_SPEED;
      this.player.y += (moveY / len) * PLAYER_SPEED;
    } else if (this.isMouseActive) {
      // Smoothly slide player towards mouse/touch coordinate
      const targetX = this.mouse.x - this.player.width / 2;
      const targetY = this.mouse.y - this.player.height / 2;
      
      this.player.x += (targetX - this.player.x) * 0.15;
      this.player.y += (targetY - this.player.y) * 0.15;
    }

    // Keep Player Ship within Screen bounds
    this.player.x = Math.max(0, Math.min(LOGICAL_WIDTH - this.player.width, this.player.x));
    this.player.y = Math.max(LOGICAL_HEIGHT * 0.3, Math.min(LOGICAL_HEIGHT - this.player.height - 10, this.player.y));
    
    // Auto fire weapon if key space is held down or mouse button clicked
    if (this.keys[' '] || this.mouse.down) {
      this.fireLaser();
    }

    // Update Lasers (後ろから update するのは従来どおり。削除は後段で一括して詰める)
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.update(this.enemies);
      if (laser.isOutOfBounds()) {
        laser.dead = true;
      }
    }
    compactArray(this.lasers);

    // Spawn and Update Enemies
    this.spawnEnemies();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.player.x + this.player.width / 2, this.player.y, this.lasers, this.lasers);
      
      if (enemy.isOutOfBounds()) {
        enemy.dead = true;
        // Penalty for letting normal enemies pass (lose small shield energy)
        if (enemy.type !== 'boss') {
          this.player.shield = Math.max(this.player.shield - 8, 0);
          this.hudDirty = true;
          if (this.player.shield <= 0 && this.player.lives > 0) {
            const dead = this.player.hit(0); // will trigger life loss
            if (dead) {
              this.explodePlayer();
              if (this.player.lives <= 0) {
                this.gameOver();
              } else {
                this.player.resetPosition();
              }
            }
          }
        }
      }
    }

    compactArray(this.enemies);

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();
      if (particle.alpha <= 0) {
        particle.dead = true;
      }
    }
    compactArray(this.particles);

    // Update Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.update();
      if (p.isOutOfBounds()) {
        p.dead = true;
      }
    }
    compactArray(this.powerups);

    this.checkCollisions();

    // 当たり判定で dead になった分をまとめて取り除く
    compactArray(this.lasers);
    compactArray(this.enemies);
    compactArray(this.powerups);

    // HUD 更新はフレーム末に 1 回だけ (描画は 1 フレームに 1 度なので表示は同じ)
    if (this.hudDirty) {
      this.hudDirty = false;
      this.updateHUD();
    }
  }

  // --- HUD Updates ---
  updateHUD() {
    this.scoreValElement.textContent = String(this.score).padStart(6, '0');
    this.levelValElement.textContent = this.level;
    this.homingValElement.textContent = (this.player && this.player.homing) ? this.player.homing : 0;
    
    // Heart icons representation
    if (this.player.lives > 5) {
      this.livesValElement.textContent = `♥ x ${this.player.lives}`;
    } else {
      this.livesValElement.textContent = '♥'.repeat(Math.max(0, this.player.lives));
    }
    
    // Shield bar percent
    this.shieldBarElement.style.width = `${Math.max(0, this.player.shield)}%`;
    
    // Weapon stats bar fill
    let currentWeapon;
    if (this.player.weaponTier < WEAPONS.length) {
      currentWeapon = WEAPONS[this.player.weaponTier];
    } else {
      const extraTiers = this.player.weaponTier - (WEAPONS.length - 1);
      currentWeapon = { name: `HYPER PULSE +${extraTiers}` };
    }
    
    this.weaponBarElement.style.width = `100%`;
    this.weaponNameElement.textContent = currentWeapon.name;
    
    // Swap HUD weapon bar theme color on tiers
    const displayTier = this.player.weaponTier % 4;
    this.weaponBarElement.className = 'progress-bar-fill';
    if (displayTier === 0) this.weaponBarElement.classList.add('fill-blue');
    else if (displayTier === 1) this.weaponBarElement.style.backgroundColor = 'var(--neon-blue)';
    else if (displayTier === 2) this.weaponBarElement.style.backgroundColor = 'var(--neon-purple)';
    else if (displayTier === 3) this.weaponBarElement.style.backgroundColor = 'var(--neon-pink)';
  }

  // --- Rendering Loop ---
  // 背面 (WebGL): 星 → パーティクル → 自機レーザー
  // 前面 (2D)   : パワーアップ → 敵 → 自機 → 敵レーザー
  // 重ね順は従来の 1 枚構成と同じ。
  draw() {
    const ctx = this.ctx;
    const gl = (this.glLayer && this.glLayer.ok) ? this.glLayer : null;

    if (gl) {
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      gl.beginFrame();
      gl.pushStars(this.starfield.stars);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      this.starfield.draw(ctx);
    }

    if (this.state === GameState.START) {
      this.updateDemoParticles();
      if (gl) {
        gl.pushParticles(this.particles);
        gl.endFrame();
      } else {
        for (let i = 0; i < this.particles.length; i++) this.particles[i].draw(ctx);
      }
      return;
    }

    if (gl) {
      // 全パーティクル・全自機レーザーを間引きなしで積む
      gl.pushParticles(this.particles);
      gl.pushLasers(this.lasers, true);
      gl.endFrame();
    } else {
      // --- 2D フォールバック: 従来どおり間引いて描く ---
      let partStep = 1;
      if (this.player) {
        if (this.player.clones >= 15) partStep = 4;
        else if (this.player.clones >= 10) partStep = 2;
      }
      for (let i = 0; i < this.particles.length; i += partStep) {
        this.particles[i].draw(ctx);
      }

      let pStep = 1;
      if (this.player) {
        if (this.player.clones >= 15) pStep = 4;
        else if (this.player.clones >= 10) pStep = 2;
      }
      let pIdx = 0;
      for (let i = 0; i < this.lasers.length; i++) {
        const laser = this.lasers[i];
        if (!laser.isPlayer) continue;
        if (pIdx % pStep === 0) laser.draw(ctx);
        pIdx++;
      }
    }

    // Draw powerups
    this.powerups.forEach(p => p.draw(ctx));

    // Draw enemies
    this.enemies.forEach(enemy => enemy.draw(ctx));

    // Draw player
    if (this.player && this.state !== GameState.GAMEOVER) {
      this.player.draw(ctx);
    }

    // Draw enemy lasers (Highest layer so they are never hidden by player lasers/clones)
    // 敵弾は多くても数百発なので 2D のまま前面に描く
    for (let i = 0; i < this.lasers.length; i++) {
      const laser = this.lasers[i];
      if (!laser.isPlayer) laser.draw(ctx);
    }
  }

  // タイトル画面の火の粉。更新だけ行い、描画は呼び出し側に任せる
  updateDemoParticles() {
    if (Math.random() < 0.05) {
      const colors = ['#00f0ff', '#ff007f', '#00ff66', '#9d00ff'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new GameParticle(Math.random() * LOGICAL_WIDTH, 0, c, 0.4));
    }

    this.particles.forEach((part) => {
      part.update();
    });
    this.particles = this.particles.filter(p => p.alpha > 0);
  }

  gameLoop() {
    const frameStart = performance.now();

    // 実際に表示されたフレーム間隔 (vsync 込み)。GPU が苦しくなるとここが伸びる
    if (this.lastFrameStart > 0) {
      const delta = frameStart - this.lastFrameStart;
      if (delta < 500) this.frameDeltaAvg += (delta - this.frameDeltaAvg) * 0.05;
    }
    this.lastFrameStart = frameStart;

    this.update();
    this.draw();

    // update+draw の CPU 時間
    const cpuMs = performance.now() - frameStart;
    this.frameCpuAvg += (cpuMs - this.frameCpuAvg) * 0.05;
    this.adjustBulletCap();

    requestAnimationFrame(() => this.gameLoop());
  }

  // フレーム時間に余裕があるうちは 1 体あたりの発射弾数の上限を上げ続け、
  // 落ち始めたら素早く下げる。結果として、そのマシンの限界付近で落ち着く。
  adjustBulletCap() {
    if (this.state !== GameState.PLAYING) return;

    const cpuBound = this.frameCpuAvg > BULLET_CAP_DROP_CPU_MS;
    const gpuBound = this.frameDeltaAvg > BULLET_CAP_DROP_FRAME_MS && this.bulletCap > BULLET_CAP_MIN;

    if (cpuBound || gpuBound) {
      this.bulletCap = Math.max(BULLET_CAP_MIN, this.bulletCap - BULLET_CAP_FALL);
    } else if (this.frameCpuAvg < BULLET_CAP_RAISE_CPU_MS && this.frameDeltaAvg < BULLET_CAP_HOLD_FRAME_MS) {
      // CPU にも表示にも余裕があるあいだだけ上げ続ける
      this.bulletCap += BULLET_CAP_RISE;
    }
  }
}

// Initialise Game when page loads
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

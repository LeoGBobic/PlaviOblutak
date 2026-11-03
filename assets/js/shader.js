// WebGL animated Adriatic-water background for the homepage hero.
(function() {
  const canvas = document.getElementById('shader-canvas-ANIMATION_35');

  // Sync the WebGL drawing-buffer size with the CSS-driven layout size.
  // This fires on initial layout and whenever the element is resized.
  function syncSize() {
    const w = canvas.clientWidth  || 1280;
    const h = canvas.clientHeight || 720;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncSize).observe(canvas);
  }
  syncSize();

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;
  const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
  const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

// Smooth harmonic multi-octave water noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Layered expressive ocean swell with natural rhythm
float oceanWave(vec2 p, float t) {
    float wave = 0.0;
    // Primary deep undulating swell
    wave += sin(p.x * 2.0 + t * 0.55 + sin(p.y * 1.4 + t * 0.38) * 0.9) * 0.50;
    // Cross swell creating natural oceanic diamond interference
    wave += sin(p.x * 1.35 - p.y * 1.8 + t * 0.44) * 0.35;
    // Fluid cresting rhythm
    wave += cos(p.y * 2.8 + t * 0.60 + p.x * 1.1) * 0.28;
    return wave;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = uv;
    p.x *= aspect;

    float t = u_time * 0.64;

    // Organic ocean wave displacement with moderate expression
    float swell = oceanWave(p * 1.35, t);
    
    // Noise octaves for fluid water texture without harsh isolines
    float n1 = snoise(p * 1.5 + vec2(t * 0.20, t * 0.10) + swell * 0.32);
    float n2 = snoise(p * 3.0 - vec2(t * 0.24, -t * 0.15) + n1 * 0.35);
    
    // Combined fluid height map
    float waterDepth = swell * 0.55 + n1 * 0.32 + n2 * 0.18;

    // Distinct Adriatic color palette: deep midnight base, rich royal sapphire, vibrant azure, warm Mediterranean stone mineral
    vec3 abyssNavy = vec3(0.025, 0.095, 0.20);     // #061833
    vec3 deepSapphire = vec3(0.05, 0.20, 0.42);    // #0d336b
    vec3 adriaticAzure = vec3(0.08, 0.42, 0.66);   // #146ba8 - expressive blue
    vec3 sunlitAqua = vec3(0.16, 0.60, 0.82);      // #2999d1 - visible luminous swell
    vec3 stoneFoamGlance = vec3(0.86, 0.78, 0.62); // Warm Brač limestone shimmer

    // Smooth gradient transitions mimicking deep sea light transmission
    float depthFactor = smoothstep(-0.85, 0.75, waterDepth);
    vec3 oceanCol = mix(abyssNavy, deepSapphire, depthFactor);

    // Visible, expressive swell highlights (balanced, not overpowering)
    float crestFactor = smoothstep(-0.05, 0.70, waterDepth + n2 * 0.28);
    oceanCol = mix(oceanCol, adriaticAzure, crestFactor * 0.80);

    // Luminous rolling crest shimmers
    float shimmer = smoothstep(0.35, 0.80, swell + n1 * 0.45);
    oceanCol = mix(oceanCol, sunlitAqua, shimmer * 0.48);

    // Subtle warm mineral stone sheen on crest peaks
    float microSheen = smoothstep(0.65, 0.94, waterDepth + n2 * 0.28);
    oceanCol = mix(oceanCol, stoneFoamGlance, microSheen * 0.24);

    // Soft peripheral falloff to ensure typography and buttons remain crystal clear
    float vignette = 1.0 - length((uv - vec2(0.38, 0.5)) * vec2(0.65, 0.85)) * 0.30;
    vignette = clamp(vignette, 0.75, 1.0);
    oceanCol *= vignette;

    gl_FragColor = vec4(oceanCol, 1.0);
}`;
  function cs(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  // u_mouse is in pixel coordinates matching u_resolution (ShaderToy convention).
  // Shaders that need normalized coords should use: u_mouse / u_resolution.
  let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = 1.0 - (event.clientY - rect.top) / rect.height;
      mouse.x = nx * canvas.width;
      mouse.y = ny * canvas.height;
    }
  });

  function render(t) {
    if (typeof ResizeObserver === 'undefined') syncSize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (uTime) gl.uniform1f(uTime, t * 0.001);
    if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
    if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  render(0);
})();

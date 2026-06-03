"use client";

import { useEffect, useRef } from "react";

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);
    float t = u_time * 0.06;
    vec2 noiseUv = uvAspect + t;
    float n1 = snoise(noiseUv * 1.5) * 0.5;
    float n2 = snoise(noiseUv * 3.0 + 50.0) * 0.25;
    float n3 = snoise(noiseUv * 6.0 + 100.0) * 0.125;
    float noise = n1 + n2 + n3;
    vec2 mousePos = u_mouse;
    float mouseDist = length(uv - mousePos);
    float mouseGlow = smoothstep(0.4, 0.0, mouseDist) * 0.3;
    vec2 displaced = uv + vec2(noise * 0.08, noise * 0.05);
    vec3 purple = vec3(0.376, 0.478, 0.984);
    vec3 slate  = vec3(0.369, 0.369, 0.369);
    vec3 dark   = vec3(0.086, 0.090, 0.102);
    vec3 whisper= vec3(0.906, 0.906, 0.906);
    vec3 charcoal=vec3(0.141, 0.141, 0.141);
    vec3 light  = vec3(0.965, 0.965, 0.965);
    float g1 = displaced.x + displaced.y * 0.5 + noise * 0.3;
    float g2 = sin(displaced.x * 3.14 + t) * 0.5 + 0.5;
    float g3 = cos(displaced.y * 2.5 - t * 0.5) * 0.5 + 0.5;
    vec3 color = mix(purple, slate, smoothstep(0.0, 0.33, g1));
    color = mix(color, dark, smoothstep(0.33, 0.55, g1));
    color = mix(color, whisper, smoothstep(0.55, 0.7, g2));
    color = mix(color, light, smoothstep(0.7, 0.85, g3));
    color = mix(color, charcoal, smoothstep(0.85, 1.0, g1));
    color = mix(color, light, mouseGlow);
    float vignette = 1.0 - length((uv - 0.5) * 1.2);
    vignette = smoothstep(0.0, 0.7, vignette);
    color *= 0.85 + vignette * 0.15;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function initWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) return null;

  function compileShader(src: string, type: number) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    return s;
  }

  const vs = compileShader(vertexShader, gl.VERTEX_SHADER);
  const fs = compileShader(fragmentShader, gl.FRAGMENT_SHADER);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const posLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    uResolution: gl.getUniformLocation(program, "u_resolution"),
    uTime: gl.getUniformLocation(program, "u_time"),
    uMouse: gl.getUniformLocation(program, "u_mouse"),
  };
}

type HeroGradientCanvasProps = {
  className?: string;
  visible?: boolean;
};

export default function HeroGradientCanvas({ className = "", visible = true }: HeroGradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = initWebGL(canvas);
    if (!ctx) return;

    const { gl, uResolution, uTime, uMouse } = ctx;
    let rafId = 0;
    const startTime = performance.now();
    let isVisible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = 1.0 - e.clientY / window.innerHeight;
    };

    const render = () => {
      rafId = requestAnimationFrame(render);
      if (!isVisible || !visible) return;

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const time = (performance.now() - startTime) / 1000;
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      observer.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`h-full w-full transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}

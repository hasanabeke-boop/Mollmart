"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface WaveFieldProps {
  className?: string;
  opacity?: number;
}

export default function WaveField({ className = "", opacity = 1 }: WaveFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const scrollVelocityRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const currentTimeRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d1b2a, 0.002);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0x0d1b2a, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const vertexShader = `
      uniform float time;
      uniform float speed;
      uniform float amplitude;
      uniform float scrollSpeed;
      attribute float opaque;
      varying vec3 vPos;
      varying float vOpaque;
      varying vec2 vPixelPos;
      void main() {
        vec3 pos = position;
        float x = pos.x;
        float t = time * speed;
        pos.y += sin(x * 0.4 + t) * 2.5 * amplitude;
        pos.y += sin(x * 1.2 - t * 1.3) * 0.8 * amplitude;
        pos.z += cos(x * 0.3 + t * 0.7) * 1.5;
        pos.z += sin(x * 0.8 + t * 0.5) * 0.5;
        pos.z += pos.z * scrollSpeed * 0.3;
        vPos = pos;
        vOpaque = opaque;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = 2.0;
        vPixelPos = floor(gl_Position.xy / 1.5) * 1.5;
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec3 color;
      uniform float blend;
      uniform vec3 mainColor;
      uniform vec3 subColor;
      uniform vec3 thirdColor;
      uniform float brightness;
      uniform float blur;
      uniform float pixelSize;
      uniform float lineThickness;
      varying vec3 vPos;
      varying float vOpaque;
      varying vec2 vPixelPos;
      void main() {
        vec3 finalColor = color;
        float colorMix = sin(vPos.x * 0.05 + time * 0.3) * 0.5 + 0.5;
        finalColor = mix(finalColor, mainColor, colorMix * 0.8);
        finalColor = mix(finalColor, subColor, sin(colorMix * 3.14) * blend);
        finalColor = mix(finalColor, thirdColor, cos(colorMix * 1.57) * blend * 0.5);
        float line = smoothstep(lineThickness, 0.0, abs(fract(vPos.x * 2.0) - 0.5) * 2.0);
        line *= smoothstep(0.0, blur, vOpaque);
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        line *= pulse;
        finalColor *= brightness;
        gl_FragColor = vec4(finalColor, line * vOpaque);
      }
    `;

    const ribbonCount = window.innerWidth < 768 ? 6 : 10;
    const pointsPerRibbon = window.innerWidth < 768 ? 200 : 400;
    const ribbons: THREE.Points[] = [];

    for (let r = 0; r < ribbonCount; r++) {
      const points: number[] = [];
      const opaques: number[] = [];

      for (let i = 0; i < pointsPerRibbon; i++) {
        const xBase = (i - pointsPerRibbon / 2) * 0.12;
        const x = xBase + (r - (ribbonCount - 1) / 2) * 1.5;
        const y = Math.sin(xBase * 0.4) * 3.0;
        const z = Math.cos(xBase * 0.2) * 2.0;
        const opaque = Math.sin((i / (pointsPerRibbon - 1)) * Math.PI);
        points.push(x, y, z);
        opaques.push(opaque);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      geometry.setAttribute("opaque", new THREE.Float32BufferAttribute(opaques, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x6080ff) },
          time: { value: 0.0 },
          speed: { value: 1.0 },
          amplitude: { value: 1.0 },
          scrollSpeed: { value: 0.0 },
          blend: { value: 0.15 },
          mainColor: { value: new THREE.Color(0x4488ff) },
          subColor: { value: new THREE.Color(0xffaa33) },
          thirdColor: { value: new THREE.Color(0x44ffcc) },
          brightness: { value: 1.2 },
          blur: { value: 0.5 },
          pixelSize: { value: 1.5 },
          lineThickness: { value: 0.05 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
      });

      const ribbon = new THREE.Points(geometry, material);
      scene.add(ribbon);
      ribbons.push(ribbon);
    }

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onScroll = () => {
      scrollVelocityRef.current = (window.scrollY - lastScrollYRef.current) * 0.01;
      lastScrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      currentTimeRef.current += 0.008;
      scrollVelocityRef.current *= 0.95;

      ribbons.forEach((r) => {
        const mat = r.material as THREE.ShaderMaterial;
        mat.uniforms.time.value = currentTimeRef.current;
        mat.uniforms.scrollSpeed.value = scrollVelocityRef.current;
      });

      camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      ribbons.forEach((r) => {
        r.geometry.dispose();
        (r.material as THREE.ShaderMaterial).dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity,
        transition: "opacity 0.5s ease",
      }}
    />
  );
}

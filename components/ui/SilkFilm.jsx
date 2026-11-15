"use client";
import { useEffect, useRef } from "react";

// Generative stand-in for the hero film: slow-motion silk folds drifting through lavender haze,
// with a soft walking silhouette. Raw WebGL so it costs nothing to load. Pauses off-screen.
const FRAG = `
precision highp float;
uniform vec2 r; uniform float t; uniform float dark;
float n(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(n(i),n(i+vec2(1,0)),f.x),mix(n(i+vec2(0,1)),n(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
  float s=t*.06;
  // silk: domain-warped sine folds
  vec2 q=vec2(fbm(p*1.2+s),fbm(p*1.2-s+3.1));
  float folds=sin((p.x*2.2+p.y*1.1+q.x*3.2+s*2.)*3.1);
  float sheen=pow(.5+.5*folds,6.)*.85+pow(.5+.5*sin((p.y*1.6-q.y*2.5+s)*4.),12.)*.4;
  vec3 pearl=vec3(.98,.97,.99), lav=vec3(.79,.71,.89), soft=vec3(.91,.87,.96), am=vec3(.43,.31,.66), plum=vec3(.12,.08,.19);
  vec3 col=mix(lav,soft,fbm(p*.8+q+s));
  col=mix(col,am,smoothstep(.55,.95,fbm(p*1.5-q*1.3-s))*.55);
  col+=sheen*vec3(1.,.98,1.)*.55;
  // haze
  float haze=fbm(p*.6+vec2(s*1.5,0.));
  col=mix(col,pearl,smoothstep(.3,.9,haze)*.45);
  // walking silhouette (very soft) — sways as it approaches
  float sway=sin(t*.9)*.02;
  vec2 m=p-vec2(.18+sway,-.05);
  float body=smoothstep(.16,.0,length(vec2(m.x*(2.6+m.y*1.4),max(abs(m.y)-.32,0.))));
  float head=smoothstep(.07,.0,length(m-vec2(0.,.42)));
  float fig=clamp(body+head,0.,1.)*.32*(.8+.2*sin(t*.5));
  col=mix(col,plum*1.6+am*.3,fig);
  col=mix(col,col*vec3(.35,.3,.5),dark);
  gl_FragColor=vec4(col,1.);
}`;

export default function SilkFilm({ className = "", dark = 0, paused = false }) {
  const canvas = useRef(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const c = canvas.current;
    const gl = c.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const uD = gl.getUniformLocation(prog, "dark");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5) * 0.6; // soft by design; cheap fill rate
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      gl.viewport(0, 0, c.width, c.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf, visible = true, time = 8;
    let last = performance.now();
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = (now - last) / 1000;
      last = now;
      if (!visible) return;
      if (!pausedRef.current && !reduce) time += dt;
      gl.uniform2f(uR, c.width, c.height);
      gl.uniform1f(uT, time);
      gl.uniform1f(uD, dark);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [dark]);

  return <canvas ref={canvas} className={`block h-full w-full ${className}`} aria-hidden />;
}

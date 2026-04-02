import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface ShaderRevealProps {
  frontImage: string;
  backImage: string;

  /** Fluid impulse strength from mouse */
  mouseForce?: number;
  /** Effective radius of the revealed “ink” */
  cursorSize?: number;
  /** Simulation resolution (0.25–1.0) */
  resolution?: number;

  /** Fluid sim knobs (kept from previous version) */
  isViscous?: boolean;
  viscous?: number;
  iterationsViscous?: number;
  iterationsPoisson?: number;
  dt?: number;
  BFECC?: boolean;
  isBounce?: boolean;

  /** Auto-demo (idle motion) */
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  takeoverDuration?: number;
  autoResumeDelay?: number;
  autoRampDuration?: number;

  /** How strongly dye controls the reveal */
  revealStrength?: number;
  /** How soft the reveal edge is */
  revealSoftness?: number;

  style?: React.CSSProperties;
  className?: string;
}

interface SimOptions {
  iterations_poisson: number;
  iterations_viscous: number;
  mouse_force: number;
  resolution: number;
  cursor_size: number;
  viscous: number;
  isBounce: boolean;
  dt: number;
  isViscous: boolean;
  BFECC: boolean;
}

interface ShaderRevealWebGL {
  resize: () => void;
  start: () => void;
  pause: () => void;
  dispose: () => void;
  output?: {
    simulation: {
      options: SimOptions;
      resize: () => void;
    };
    resize: () => void;
    update: () => void;
  };
  autoDriver?: {
    enabled: boolean;
    speed: number;
    resumeDelay: number;
    forceStop: () => void;
  };
}

const ShaderReveal: React.FC<ShaderRevealProps> = ({
  frontImage,
  backImage,

  mouseForce = 50,
  cursorSize = 250,
  resolution = 0.5,

  isViscous = true,
  viscous = 30,
  iterationsViscous = 24,
  iterationsPoisson = 28,
  dt = 0.014,
  BFECC = true,
  isBounce = false,

  autoDemo = true,
  autoSpeed = 0.55,
  autoIntensity = 2.2,
  takeoverDuration = 0.25,
  autoResumeDelay = 1200,
  autoRampDuration = 0.6,

  revealStrength = 0.75,
  revealSoftness = 1,

  style,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const webglRef = useRef<ShaderRevealWebGL | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const frontTexRef = useRef<THREE.Texture | null>(null);
  const backTexRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;

    class CommonClass {
      width = 0;
      height = 0;
      aspect = 1;
      pixelRatio = 1;
      container: HTMLElement | null = null;
      renderer: THREE.WebGLRenderer | null = null;
      clock: THREE.Clock | null = null;
      time = 0;
      delta = 0;

      init(parent: HTMLElement) {
        this.container = parent;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        this.renderer.autoClear = true;
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        const el = this.renderer.domElement;
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.display = "block";
        el.style.borderRadius = "inherit";
        this.clock = new THREE.Clock();
        this.clock.start();
      }

      resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.aspect = this.width / this.height;
        if (this.renderer)
          this.renderer.setSize(this.width, this.height, false);
      }

      update() {
        if (!this.clock) return;
        this.delta = this.clock.getDelta();
        this.time += this.delta;
      }
    }
    const Common = new CommonClass();

    class MouseClass {
      coords = new THREE.Vector2(0, 0);
      coords_old = new THREE.Vector2(0, 0);
      diff = new THREE.Vector2(0, 0);

      container: HTMLElement | null = null;
      docTarget: Document | null = null;
      listenerTarget: Window | null = null;

      isHoverInside = false;
      hasUserControl = false;
      isAutoActive = false;

      autoIntensity = 2.0;
      takeoverActive = false;
      takeoverStartTime = 0;
      takeoverDuration = 0.25;
      takeoverFrom = new THREE.Vector2();
      takeoverTo = new THREE.Vector2();

      onInteract: (() => void) | null = null;

      private _onMouseMove = this.onDocumentMouseMove.bind(this);
      private _onTouchStart = this.onDocumentTouchStart.bind(this);
      private _onTouchMove = this.onDocumentTouchMove.bind(this);
      private _onTouchEnd = this.onTouchEnd.bind(this);
      private _onDocumentLeave = this.onDocumentLeave.bind(this);

      init(containerElem: HTMLElement) {
        this.container = containerElem;
        this.docTarget = containerElem.ownerDocument || null;
        const defaultView =
          this.docTarget?.defaultView ||
          (typeof window !== "undefined" ? window : null);
        if (!defaultView) return;
        this.listenerTarget = defaultView;

        this.listenerTarget.addEventListener("mousemove", this._onMouseMove);
        this.listenerTarget.addEventListener("touchstart", this._onTouchStart, {
          passive: true,
        });
        this.listenerTarget.addEventListener("touchmove", this._onTouchMove, {
          passive: true,
        });
        this.listenerTarget.addEventListener("touchend", this._onTouchEnd);
        this.docTarget?.addEventListener("mouseleave", this._onDocumentLeave);
      }

      dispose() {
        if (this.listenerTarget) {
          this.listenerTarget.removeEventListener(
            "mousemove",
            this._onMouseMove,
          );
          this.listenerTarget.removeEventListener(
            "touchstart",
            this._onTouchStart,
          );
          this.listenerTarget.removeEventListener(
            "touchmove",
            this._onTouchMove,
          );
          this.listenerTarget.removeEventListener("touchend", this._onTouchEnd);
        }
        if (this.docTarget) {
          this.docTarget.removeEventListener(
            "mouseleave",
            this._onDocumentLeave,
          );
        }
        this.listenerTarget = null;
        this.docTarget = null;
        this.container = null;
      }

      private isPointInside(clientX: number, clientY: number) {
        if (!this.container) return false;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      }

      private updateHoverState(clientX: number, clientY: number) {
        this.isHoverInside = this.isPointInside(clientX, clientY);
        return this.isHoverInside;
      }

      private setCoordsFromClient(x: number, y: number) {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const nx = (x - rect.left) / rect.width;
        const ny = (y - rect.top) / rect.height;
        this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
      }

      setNormalized(nx: number, ny: number) {
        this.coords.set(nx, ny);
      }

      onDocumentMouseMove(event: MouseEvent) {
        if (!this.updateHoverState(event.clientX, event.clientY)) return;
        if (this.onInteract) this.onInteract();

        if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
          if (!this.container) return;
          const rect = this.container.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width;
          const ny = (event.clientY - rect.top) / rect.height;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
          this.takeoverStartTime = performance.now();
          this.takeoverActive = true;
          this.hasUserControl = true;
          this.isAutoActive = false;
          return;
        }

        this.setCoordsFromClient(event.clientX, event.clientY);
        this.hasUserControl = true;
      }

      onDocumentTouchStart(event: TouchEvent) {
        if (event.touches.length !== 1) return;
        const t = event.touches[0];
        if (!this.updateHoverState(t.clientX, t.clientY)) return;
        if (this.onInteract) this.onInteract();
        this.setCoordsFromClient(t.clientX, t.clientY);
        this.hasUserControl = true;
      }

      onDocumentTouchMove(event: TouchEvent) {
        if (event.touches.length !== 1) return;
        const t = event.touches[0];
        if (!this.updateHoverState(t.clientX, t.clientY)) return;
        if (this.onInteract) this.onInteract();
        this.setCoordsFromClient(t.clientX, t.clientY);
      }

      onTouchEnd() {
        this.isHoverInside = false;
      }

      onDocumentLeave() {
        this.isHoverInside = false;
      }

      update() {
        if (this.takeoverActive) {
          const t =
            (performance.now() - this.takeoverStartTime) /
            (this.takeoverDuration * 1000);
          if (t >= 1) {
            this.takeoverActive = false;
            this.coords.copy(this.takeoverTo);
            this.coords_old.copy(this.coords);
            this.diff.set(0, 0);
          } else {
            const k = t * t * (3 - 2 * t);
            this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
          }
        }

        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);
      }
    }
    const Mouse = new MouseClass();

    class AutoDriver {
      mouse: MouseClass;
      manager: WebGLManager;
      enabled: boolean;
      speed: number;
      resumeDelay: number;
      rampDurationMs: number;

      active = true;
      current = new THREE.Vector2();
      target = new THREE.Vector2();
      lastTime = performance.now();
      activationTime = performance.now();
      margin = 0.2;
      private _tmpDir = new THREE.Vector2();

      constructor(
        mouse: MouseClass,
        manager: WebGLManager,
        opts: {
          enabled: boolean;
          speed: number;
          resumeDelay: number;
          rampDuration: number;
        },
      ) {
        this.mouse = mouse;
        this.manager = manager;
        this.enabled = opts.enabled;
        this.speed = opts.speed;
        this.resumeDelay = opts.resumeDelay || 3000;
        this.rampDurationMs = (opts.rampDuration || 0) * 1000;

        const r = Math.random;
        this.current.set(
          (r() * 2 - 1) * (1 - this.margin),
          (r() * 2 - 1) * (1 - this.margin),
        );
        this.pickNewTarget();

        const initialDir = this._tmpDir
          .subVectors(this.target, this.current)
          .normalize();
        const initialOffset = 0.05;

        this.mouse.coords_old.set(
          this.current.x - initialDir.x * initialOffset,
          this.current.y - initialDir.y * initialOffset,
        );
        this.mouse.setNormalized(this.current.x, this.current.y);
        this.mouse.isAutoActive = true;
      }

      pickNewTarget() {
        const r = Math.random;
        this.target.set(
          (r() * 2 - 1) * (1 - this.margin),
          (r() * 2 - 1) * (1 - this.margin),
        );
      }

      forceStop() {
        this.active = false;
        this.mouse.isAutoActive = false;
      }

      update() {
        if (!this.enabled) return;
        const now = performance.now();
        const idle = now - this.manager.lastUserInteraction;
        if (idle < this.resumeDelay) {
          if (this.active) this.forceStop();
          return;
        }
        if (this.mouse.isHoverInside) {
          if (this.active) this.forceStop();
          return;
        }
        if (!this.active) {
          this.active = true;
          this.current.copy(this.mouse.coords);
          this.lastTime = now;
          this.activationTime = now;
          this.pickNewTarget();
        }

        this.mouse.isAutoActive = true;

        let dtSec = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (dtSec > 0.2) dtSec = 0.016;

        const dir = this._tmpDir.subVectors(this.target, this.current);
        const dist = dir.length();
        if (dist < 0.01) {
          this.pickNewTarget();
          return;
        }
        dir.normalize();

        let ramp = 1;
        if (this.rampDurationMs > 0) {
          const t = Math.min(
            1,
            (now - this.activationTime) / this.rampDurationMs,
          );
          ramp = t * t * (3 - 2 * t);
        }

        const step = this.speed * dtSec;
        const move = Math.min(step * ramp, dist);
        this.current.addScaledVector(dir, move);
        this.mouse.setNormalized(this.current.x, this.current.y);
      }
    }

    const face_vert = `
      precision highp float;
      attribute vec3 position;
      varying vec2 vUv;
      uniform vec2 boundarySpace;
      void main() {
        vec3 pos = position;
        vec2 scale = 1.0 - boundarySpace * 2.0;
        pos.xy = pos.xy * scale;
        vUv = vec2(0.5) + pos.xy * 0.5;
        gl_Position = vec4(pos, 1.0);
      }
    `;

    const mouse_vert = `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      varying vec2 vUv;
      uniform vec2 center;
      uniform vec2 scale;
      uniform vec2 px;
      void main() {
        vec2 pos = position.xy * scale * 2.0 * px + center;
        vUv = uv;
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;

    const advection_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D velocity;
      uniform float dt;
      uniform bool isBFECC;
      uniform vec2 fboSize;
      uniform vec2 px;

      void main() {
        vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;

        if (!isBFECC) {
          vec2 vel = texture2D(velocity, vUv).xy;
          vec2 uv2 = vUv - vel * dt * ratio;
          vec2 newVel = texture2D(velocity, uv2).xy;
          gl_FragColor = vec4(newVel, 0.0, 0.0);
        } else {
          vec2 spot_new = vUv;
          vec2 vel_old = texture2D(velocity, vUv).xy;
          vec2 spot_old = spot_new - vel_old * dt * ratio;
          vec2 vel_new1 = texture2D(velocity, spot_old).xy;
          vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
          vec2 error = spot_new2 - spot_new;
          vec2 spot_new3 = spot_new - error / 2.0;
          vec2 vel_2 = texture2D(velocity, spot_new3).xy;
          vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
          vec2 newVel2 = texture2D(velocity, spot_old2).xy;
          gl_FragColor = vec4(newVel2, 0.0, 0.0);
        }
      }
    `;

    const divergence_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D velocity;
      uniform float dt;
      uniform vec2 px;

      void main() {
        float x0 = texture2D(velocity, vUv - vec2(px.x, 0.0)).x;
        float x1 = texture2D(velocity, vUv + vec2(px.x, 0.0)).x;
        float y0 = texture2D(velocity, vUv - vec2(0.0, px.y)).y;
        float y1 = texture2D(velocity, vUv + vec2(0.0, px.y)).y;
        float divergence = (x1 - x0 + y1 - y0) * 0.5;
        gl_FragColor = vec4(divergence / dt);
      }
    `;

    const externalForce_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 force;
      uniform vec2 center;
      uniform vec2 scale;
      uniform vec2 px;

      void main() {
        vec2 circle = (vUv - 0.5) * 2.0;
        float d = 1.0 - min(length(circle), 1.0);
        d *= d;
        gl_FragColor = vec4(force * d, 0.0, 1.0);
      }
    `;

    const poisson_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D pressure;
      uniform sampler2D divergence;
      uniform vec2 px;

      void main() {
        float p0 = texture2D(pressure, vUv + vec2(px.x * 2.0, 0.0)).r;
        float p1 = texture2D(pressure, vUv - vec2(px.x * 2.0, 0.0)).r;
        float p2 = texture2D(pressure, vUv + vec2(0.0, px.y * 2.0)).r;
        float p3 = texture2D(pressure, vUv - vec2(0.0, px.y * 2.0)).r;
        float div = texture2D(divergence, vUv).r;
        float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
        gl_FragColor = vec4(newP);
      }
    `;

    const pressure_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D pressure;
      uniform sampler2D velocity;
      uniform vec2 px;
      uniform float dt;

      void main() {
        float step = 1.0;
        float p0 = texture2D(pressure, vUv + vec2(px.x * step, 0.0)).r;
        float p1 = texture2D(pressure, vUv - vec2(px.x * step, 0.0)).r;
        float p2 = texture2D(pressure, vUv + vec2(0.0, px.y * step)).r;
        float p3 = texture2D(pressure, vUv - vec2(0.0, px.y * step)).r;
        vec2 v = texture2D(velocity, vUv).xy;
        vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
        v = v - gradP * dt;
        gl_FragColor = vec4(v, 0.0, 1.0);
      }
    `;

    const viscous_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D velocity;
      uniform sampler2D velocity_new;
      uniform float v;
      uniform vec2 px;
      uniform float dt;

      void main() {
        vec2 old = texture2D(velocity, vUv).xy;
        vec2 new0 = texture2D(velocity_new, vUv + vec2(px.x * 2.0, 0.0)).xy;
        vec2 new1 = texture2D(velocity_new, vUv - vec2(px.x * 2.0, 0.0)).xy;
        vec2 new2 = texture2D(velocity_new, vUv + vec2(0.0, px.y * 2.0)).xy;
        vec2 new3 = texture2D(velocity_new, vUv - vec2(0.0, px.y * 2.0)).xy;
        vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
        newv /= 4.0 * (1.0 + v * dt);
        gl_FragColor = vec4(newv, 0.0, 0.0);
      }
    `;

    const dye_advection_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tDye;
      uniform sampler2D tVelocity;
      uniform float dt;
      uniform vec2 fboSize;
      uniform float dissipation;

      void main() {
        vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
        vec2 vel = texture2D(tVelocity, vUv).xy;
        vec2 coord = vUv - vel * dt * ratio;
        vec4 dye = texture2D(tDye, coord);
        dye *= dissipation;
        gl_FragColor = dye;
      }
    `;

    const dye_splat_frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tDye;
      uniform vec2 center;
      uniform float radius;
      uniform float strength;

      void main() {
        vec4 base = texture2D(tDye, vUv);

        float dist = length(vUv - center);
        float r = radius;
        float falloff = exp(- (dist * dist) / (r * r + 1e-6));

        float added = strength * falloff;
        float v = clamp(base.r + added, 0.0, 1.0);

        gl_FragColor = vec4(v, v, v, 1.0);
      }
    `;

    const composite_frag = `
      precision highp float;
      varying vec2 vUv;

      uniform sampler2D frontTex;
      uniform sampler2D backTex;
      uniform sampler2D tDye;

      uniform float revealStrength;
      uniform float revealSoftness;

      uniform vec2 frontTexResolution;
      uniform vec2 backTexResolution;
      uniform vec2 canvasResolution;

      vec2 getCoverUv(vec2 uv, vec2 texRes, vec2 canvasRes) {
        vec2 ratio = vec2(
          min((canvasRes.x / canvasRes.y) / (texRes.x / texRes.y), 1.0),
          min((canvasRes.y / canvasRes.x) / (texRes.y / texRes.x), 1.0)
        );

        vec2 newUv = vec2(
          uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
          uv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );

        return newUv;
      }

      void main() {
        float dye = texture2D(tDye, vUv).r;

        float m = dye * revealStrength;
        float mask = smoothstep(0.0, revealSoftness, m);
        mask = clamp(mask, 0.0, 1.0);

        vec2 frontUv = getCoverUv(vUv, frontTexResolution, canvasResolution);
        vec2 backUv = getCoverUv(vUv, backTexResolution, canvasResolution);

        vec4 front = texture2D(frontTex, frontUv);
        vec4 back = texture2D(backTex, backUv);

        vec4 color = mix(front, back, mask);
        float alpha = max(color.a, max(front.a, back.a));

        gl_FragColor = vec4(color.rgb, alpha);
      }
    `;

    type Uniforms = Record<string, { value: unknown }>;

    class ShaderPass {
      props: Record<string, unknown>;
      uniforms?: Uniforms;
      scene: THREE.Scene | null = null;
      camera: THREE.Camera | null = null;
      material: THREE.RawShaderMaterial | null = null;
      geometry: THREE.PlaneGeometry | null = null;
      plane: THREE.Mesh | null = null;

      constructor(props: Record<string, unknown>) {
        this.props = props || {};
        this.uniforms = (this.props.material as Record<string, unknown>)
          ?.uniforms as Uniforms | undefined;
      }

      init(..._args: unknown[]): void {
        void _args;
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        if (this.uniforms) {
          this.material = new THREE.RawShaderMaterial(
            this.props.material as THREE.ShaderMaterialParameters,
          );
          this.geometry = new THREE.PlaneGeometry(2, 2);
          this.plane = new THREE.Mesh(this.geometry, this.material);
          this.scene.add(this.plane);
        }
      }

      update(..._args: unknown[]): void | THREE.WebGLRenderTarget | null {
        void _args;
        if (!Common.renderer || !this.scene || !this.camera) return;
        Common.renderer.setRenderTarget(
          (this.props.output as THREE.WebGLRenderTarget) || null,
        );
        Common.renderer.render(this.scene, this.camera);
        Common.renderer.setRenderTarget(null);
      }
    }

    class Advection extends ShaderPass {
      constructor(simProps: Record<string, unknown>) {
        super({
          material: {
            vertexShader: face_vert,
            fragmentShader: advection_frag,
            uniforms: {
              boundarySpace: { value: simProps.cellScale },
              px: { value: simProps.cellScale },
              fboSize: { value: simProps.fboSize },
              velocity: {
                value: (simProps.src as THREE.WebGLRenderTarget).texture,
              },
              dt: { value: simProps.dt },
              isBFECC: { value: true },
            },
          },
          output: simProps.dst as THREE.WebGLRenderTarget,
        });
        this.uniforms = (this.props.material as Record<string, unknown>)
          .uniforms as Uniforms;
        this.init();
      }

      override update(args?: { dt?: number; BFECC?: boolean }): void {
        if (!args) {
          super.update();
          return;
        }
        if (!this.uniforms) return;
        if (typeof args.dt === "number") this.uniforms.dt.value = args.dt;
        if (typeof args.BFECC === "boolean")
          this.uniforms.isBFECC.value = args.BFECC;
        super.update();
      }
    }

    class ExternalForce extends ShaderPass {
      mouseMesh!: THREE.Mesh;

      constructor(simProps: Record<string, unknown>) {
        super({ output: simProps.dst as THREE.WebGLRenderTarget });
        this.init(simProps);
      }

      override init(simProps: Record<string, unknown>): void {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        const mouseG = new THREE.PlaneGeometry(1, 1);
        const mouseM = new THREE.RawShaderMaterial({
          vertexShader: mouse_vert,
          fragmentShader: externalForce_frag,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          uniforms: {
            px: { value: simProps.cellScale },
            force: { value: new THREE.Vector2(0, 0) },
            center: { value: new THREE.Vector2(0, 0) },
            scale: {
              value: new THREE.Vector2(
                simProps.cursor_size as number,
                simProps.cursor_size as number,
              ),
            },
          },
        });
        this.mouseMesh = new THREE.Mesh(mouseG, mouseM);
        this.scene.add(this.mouseMesh);
      }

      override update(args?: {
        mouse_force?: number;
        cellScale?: THREE.Vector2;
        cursor_size?: number;
      }): void {
        if (!args) return;
        const uniforms = (this.mouseMesh.material as THREE.RawShaderMaterial)
          .uniforms;
        const mouseForce = args.mouse_force || 20;
        const cellScale = args.cellScale || new THREE.Vector2();
        const cursorSize = args.cursor_size || 100;

        const forceX = (Mouse.diff.x / 2) * mouseForce;
        const forceY = (Mouse.diff.y / 2) * mouseForce;

        const cursorSizeX = cursorSize * cellScale.x;
        const cursorSizeY = cursorSize * cellScale.y;

        const centerX = Math.min(
          Math.max(Mouse.coords.x, -1 + cursorSizeX + cellScale.x * 2.0),
          1 - cursorSizeX - cellScale.x * 2.0,
        );
        const centerY = Math.min(
          Math.max(Mouse.coords.y, -1 + cursorSizeY + cellScale.y * 2.0),
          1 - cursorSizeY - cellScale.y * 2.0,
        );

        uniforms.force.value.set(forceX, forceY);
        uniforms.center.value.set(centerX, centerY);
        uniforms.scale.value.set(cursorSize as number, cursorSize as number);

        super.update();
      }
    }

    class Viscous extends ShaderPass {
      constructor(simProps: Record<string, unknown>) {
        super({
          material: {
            vertexShader: face_vert,
            fragmentShader: viscous_frag,
            uniforms: {
              boundarySpace: { value: simProps.boundarySpace },
              velocity: {
                value: (simProps.src as THREE.WebGLRenderTarget).texture,
              },
              velocity_new: {
                value: (simProps.dst_ as THREE.WebGLRenderTarget).texture,
              },
              v: { value: simProps.viscous },
              px: { value: simProps.cellScale },
              dt: { value: simProps.dt },
            },
          },
          output: simProps.dst as THREE.WebGLRenderTarget,
          output0: simProps.dst_ as THREE.WebGLRenderTarget,
          output1: simProps.dst as THREE.WebGLRenderTarget,
        });
        this.init();
      }

      override update(args?: {
        viscous?: number;
        iterations?: number;
        dt?: number;
      }): THREE.WebGLRenderTarget | null | undefined {
        if (!args) return null;
        if (!this.uniforms) return;
        const viscous = args.viscous ?? 30;
        const iterations = args.iterations ?? 32;
        const dt = args.dt ?? 0.014;
        this.uniforms.v.value = viscous;
        let fbo_in: THREE.WebGLRenderTarget | null = null;
        let fbo_out: THREE.WebGLRenderTarget | null = null;

        for (let i = 0; i < iterations; i++) {
          if (i % 2 === 0) {
            fbo_in = this.props.output0 as THREE.WebGLRenderTarget | null;
            fbo_out = this.props.output1 as THREE.WebGLRenderTarget | null;
          } else {
            fbo_in = this.props.output1 as THREE.WebGLRenderTarget | null;
            fbo_out = this.props.output0 as THREE.WebGLRenderTarget | null;
          }
          if (!fbo_in) continue;
          this.uniforms.velocity_new.value = fbo_in.texture;
          this.props.output = fbo_out;
          this.uniforms.dt.value = dt;
          super.update();
        }
        return fbo_out;
      }
    }

    class Divergence extends ShaderPass {
      constructor(simProps: Record<string, unknown>) {
        super({
          material: {
            vertexShader: face_vert,
            fragmentShader: divergence_frag,
            uniforms: {
              boundarySpace: { value: simProps.boundarySpace },
              velocity: {
                value: (simProps.src as THREE.WebGLRenderTarget).texture,
              },
              px: { value: simProps.cellScale },
              dt: { value: simProps.dt },
            },
          },
          output: simProps.dst as THREE.WebGLRenderTarget,
        });
        this.init();
      }

      override update(args?: { vel?: THREE.WebGLRenderTarget }): void {
        if (!args || !args.vel) return;
        if (this.uniforms) {
          this.uniforms.velocity.value = args.vel.texture;
        }
        super.update();
      }
    }

    class Poisson extends ShaderPass {
      constructor(simProps: Record<string, unknown>) {
        super({
          material: {
            vertexShader: face_vert,
            fragmentShader: poisson_frag,
            uniforms: {
              boundarySpace: { value: simProps.boundarySpace },
              pressure: {
                value: (simProps.dst_ as THREE.WebGLRenderTarget).texture,
              },
              divergence: {
                value: (simProps.src as THREE.WebGLRenderTarget).texture,
              },
              px: { value: simProps.cellScale },
            },
          },
          output: simProps.dst as THREE.WebGLRenderTarget,
          output0: simProps.dst_ as THREE.WebGLRenderTarget,
          output1: simProps.dst as THREE.WebGLRenderTarget,
        });
        this.init();
      }

      override update(args?: {
        iterations?: number;
      }): THREE.WebGLRenderTarget | null {
        if (!args) return null;
        let p_in: THREE.WebGLRenderTarget | null;
        let p_out: THREE.WebGLRenderTarget | null;
        const iter = args.iterations ?? 32;
        p_in = this.props.output0 as THREE.WebGLRenderTarget | null;
        p_out = this.props.output1 as THREE.WebGLRenderTarget | null;
        for (let i = 0; i < iter; i++) {
          if (i % 2 === 0) {
            p_in = this.props.output0 as THREE.WebGLRenderTarget | null;
            p_out = this.props.output1 as THREE.WebGLRenderTarget | null;
          } else {
            p_in = this.props.output1 as THREE.WebGLRenderTarget | null;
            p_out = this.props.output0 as THREE.WebGLRenderTarget | null;
          }
          if (!p_in) continue;
          if (this.uniforms) this.uniforms.pressure.value = p_in.texture;
          this.props.output = p_out;
          super.update();
        }
        return p_out || null;
      }
    }

    class Pressure extends ShaderPass {
      constructor(simProps: Record<string, unknown>) {
        super({
          material: {
            vertexShader: face_vert,
            fragmentShader: pressure_frag,
            uniforms: {
              boundarySpace: { value: simProps.boundarySpace },
              pressure: {
                value: (simProps.src_p as THREE.WebGLRenderTarget).texture,
              },
              velocity: {
                value: (simProps.src_v as THREE.WebGLRenderTarget).texture,
              },
              px: { value: simProps.cellScale },
              dt: { value: simProps.dt },
            },
          },
          output: simProps.dst as THREE.WebGLRenderTarget,
        });
        this.init();
      }

      override update(args?: {
        vel?: THREE.WebGLRenderTarget;
        pressure?: THREE.WebGLRenderTarget;
      }): void {
        if (!args || !args.vel || !args.pressure) return;
        if (this.uniforms) {
          this.uniforms.velocity.value = args.vel.texture;
          this.uniforms.pressure.value = args.pressure.texture;
        }
        super.update();
      }
    }

    class DyeAdvection extends ShaderPass {
      constructor(simProps: Record<string, unknown>) {
        super({
          material: {
            vertexShader: face_vert,
            fragmentShader: dye_advection_frag,
            uniforms: {
              boundarySpace: { value: simProps.cellScale },
              tDye: {
                value: (simProps.src as THREE.WebGLRenderTarget).texture,
              },
              tVelocity: {
                value: (simProps.velocity as THREE.WebGLRenderTarget).texture,
              },
              dt: { value: simProps.dt },
              fboSize: { value: simProps.fboSize },
              dissipation: { value: simProps.dissipation },
            },
          },
          output: simProps.dst as THREE.WebGLRenderTarget,
        });
        this.init();
      }

      override update(args?: {
        src?: THREE.WebGLRenderTarget;
        velocity?: THREE.WebGLRenderTarget;
        dt?: number;
        dissipation?: number;
      }): void {
        if (!args || !args.src || !args.velocity) return;
        if (!this.uniforms) return;
        this.uniforms.tDye.value = args.src.texture;
        this.uniforms.tVelocity.value = args.velocity.texture;
        this.uniforms.dt.value = args.dt;
        this.uniforms.dissipation.value = args.dissipation;
        super.update();
      }
    }

    class DyeSplat extends ShaderPass {
      constructor(simProps: Record<string, unknown>) {
        super({
          material: {
            vertexShader: face_vert,
            fragmentShader: dye_splat_frag,
            uniforms: {
              boundarySpace: { value: simProps.cellScale },
              tDye: {
                value: (simProps.src as THREE.WebGLRenderTarget).texture,
              },
              center: { value: new THREE.Vector2(0.5, 0.5) },
              radius: { value: simProps.radius },
              strength: { value: simProps.strength },
            },
          },
          output: simProps.dst as THREE.WebGLRenderTarget,
        });
        this.init();
      }

      override update(args?: {
        src?: THREE.WebGLRenderTarget;
        radius?: number;
        strength?: number;
        cellScale?: THREE.Vector2;
      }): void {
        if (!args || !args.src) return;
        if (!this.uniforms) return;

        const u = this.uniforms;
        u.tDye.value = args.src.texture;

        const center = new THREE.Vector2(
          (Mouse.coords.x + 1) * 0.5,
          (Mouse.coords.y + 1) * 0.5,
        );

        (u.center.value as THREE.Vector2).copy(center);
        u.radius.value = args.radius;
        u.strength.value = args.strength;

        super.update();
      }
    }

    class Simulation {
      options: SimOptions;
      fbos: Record<string, THREE.WebGLRenderTarget | null> = {
        vel_0: null,
        vel_1: null,
        vel_viscous0: null,
        vel_viscous1: null,
        div: null,
        pressure_0: null,
        pressure_1: null,
        dye_0: null,
        dye_1: null,
      };

      fboSize = new THREE.Vector2();
      cellScale = new THREE.Vector2();
      boundarySpace = new THREE.Vector2();

      advection!: Advection;
      externalForce!: ExternalForce;
      viscousPass!: Viscous;
      divergence!: Divergence;
      poisson!: Poisson;
      pressure!: Pressure;

      dyeAdvection!: DyeAdvection;
      dyeSplat!: DyeSplat;

      dyeDissipation = 0.985;

      constructor(options?: Partial<SimOptions>) {
        this.options = {
          iterations_poisson: iterationsPoisson,
          iterations_viscous: iterationsViscous,
          mouse_force: mouseForce,
          resolution,
          cursor_size: cursorSize,
          viscous,
          isBounce,
          dt,
          isViscous,
          BFECC,
          ...options,
        };
        this.init();
      }

      getFloatType() {
        const isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);
        return isIOS ? THREE.HalfFloatType : THREE.FloatType;
      }

      calcSize() {
        const width = Math.max(
          1,
          Math.round(this.options.resolution * Common.width),
        );
        const height = Math.max(
          1,
          Math.round(this.options.resolution * Common.height),
        );
        this.cellScale.set(1 / width, 1 / height);
        this.fboSize.set(width, height);
      }

      createAllFBO() {
        const type = this.getFloatType();
        const opts: THREE.RenderTargetOptions = {
          type,
          depthBuffer: false,
          stencilBuffer: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
        };

        for (const key of Object.keys(this.fbos)) {
          this.fbos[key] = new THREE.WebGLRenderTarget(
            this.fboSize.x,
            this.fboSize.y,
            opts,
          );
        }
      }

      createShaderPasses() {
        this.advection = new Advection({
          cellScale: this.cellScale,
          fboSize: this.fboSize,
          dt: this.options.dt,
          src: this.fbos.vel_0,
          dst: this.fbos.vel_1,
        });

        this.externalForce = new ExternalForce({
          cellScale: this.cellScale,
          cursor_size: this.options.cursor_size,
          dst: this.fbos.vel_1,
        });

        this.viscousPass = new Viscous({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          viscous: this.options.viscous,
          src: this.fbos.vel_1,
          dst: this.fbos.vel_viscous1,
          dst_: this.fbos.vel_viscous0,
          dt: this.options.dt,
        });

        this.divergence = new Divergence({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src: this.fbos.vel_viscous0,
          dst: this.fbos.div,
          dt: this.options.dt,
        });

        this.poisson = new Poisson({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src: this.fbos.div,
          dst: this.fbos.pressure_1,
          dst_: this.fbos.pressure_0,
        });

        this.pressure = new Pressure({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src_p: this.fbos.pressure_0,
          src_v: this.fbos.vel_viscous0,
          dst: this.fbos.vel_0,
          dt: this.options.dt,
        });

        this.dyeAdvection = new DyeAdvection({
          cellScale: this.cellScale,
          src: this.fbos.dye_0,
          velocity: this.fbos.vel_0,
          dt: this.options.dt,
          fboSize: this.fboSize,
          dissipation: this.dyeDissipation,
          dst: this.fbos.dye_1,
        });

        this.dyeSplat = new DyeSplat({
          cellScale: this.cellScale,
          src: this.fbos.dye_1,
          radius: 0.25,
          strength: 1.0,
          dst: this.fbos.dye_0,
        });
      }

      init() {
        this.calcSize();
        this.createAllFBO();
        this.createShaderPasses();
      }

      resize() {
        this.calcSize();
        for (const key of Object.keys(this.fbos)) {
          this.fbos[key]!.setSize(this.fboSize.x, this.fboSize.y);
        }
      }

      update() {
        if (this.options.isBounce) this.boundarySpace.set(0, 0);
        else this.boundarySpace.copy(this.cellScale);

        this.advection.update({
          dt: this.options.dt,
          BFECC: this.options.BFECC,
        });

        this.externalForce.update({
          mouse_force: this.options.mouse_force,
          cellScale: this.cellScale,
          cursor_size: this.options.cursor_size,
        });

        let vel: THREE.WebGLRenderTarget | null = this.fbos.vel_1;

        if (this.options.isViscous) {
          vel = this.viscousPass.update({
            viscous: this.options.viscous,
            iterations: this.options.iterations_viscous,
            dt: this.options.dt,
          }) as THREE.WebGLRenderTarget | null;
        }

        this.divergence.update({ vel: vel || this.fbos.vel_1! });

        const pressure = this.poisson.update({
          iterations: this.options.iterations_poisson,
        }) as THREE.WebGLRenderTarget | null;

        this.pressure.update({
          vel: vel || this.fbos.vel_1!,
          pressure: pressure || this.fbos.pressure_0!,
        });

        this.dyeAdvection.update({
          src: this.fbos.dye_0!,
          velocity: this.fbos.vel_0!,
          dt: this.options.dt,
          dissipation: this.dyeDissipation,
        });

        const speed = Mouse.diff.length();
        const baseRadius = 0.08;
        const baseStrength = 0.3;

        const radius = baseRadius * (cursorSize / 120);
        const strength =
          baseStrength * THREE.MathUtils.clamp(speed * 1.8, 0.4, 3.0);

        this.dyeSplat.update({
          src: this.fbos.dye_1!,
          radius,
          strength,
          cellScale: this.cellScale,
        });
      }
    }

    class Output {
      simulation: Simulation;
      scene: THREE.Scene;
      camera: THREE.Camera;
      mesh: THREE.Mesh;
      uniforms: {
        frontTex: { value: THREE.Texture | null };
        backTex: { value: THREE.Texture | null };
        tDye: { value: THREE.Texture | null };
        boundarySpace: { value: THREE.Vector2 };
        revealStrength: { value: number };
        revealSoftness: { value: number };
        frontTexResolution: { value: THREE.Vector2 };
        backTexResolution: { value: THREE.Vector2 };
        canvasResolution: { value: THREE.Vector2 };
      };

      constructor(frontTex: THREE.Texture, backTex: THREE.Texture) {
        this.simulation = new Simulation();
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        this.uniforms = {
          frontTex: { value: frontTex },
          backTex: { value: backTex },
          tDye: { value: this.simulation.fbos.dye_0!.texture },
          boundarySpace: { value: new THREE.Vector2() },
          revealStrength: { value: revealStrength },
          revealSoftness: { value: revealSoftness },
          frontTexResolution: {
            value: new THREE.Vector2(
              (frontTex.image as { width?: number })?.width ||
                (frontTex.source?.data as { width?: number })?.width ||
                1,
              (frontTex.image as { height?: number })?.height ||
                (frontTex.source?.data as { height?: number })?.height ||
                1,
            ),
          },
          backTexResolution: {
            value: new THREE.Vector2(
              (backTex.image as { width?: number })?.width ||
                (backTex.source?.data as { width?: number })?.width ||
                1,
              (backTex.image as { height?: number })?.height ||
                (backTex.source?.data as { height?: number })?.height ||
                1,
            ),
          },
          canvasResolution: {
            value: new THREE.Vector2(Common.width, Common.height),
          },
        };

        const material = new THREE.RawShaderMaterial({
          vertexShader: face_vert,
          fragmentShader: composite_frag,
          transparent: true,
          depthWrite: false,
          uniforms: this.uniforms,
        });

        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        this.scene.add(this.mesh);
      }

      resize() {
        this.simulation.resize();
        this.uniforms.canvasResolution.value.set(Common.width, Common.height);
      }

      update() {
        this.simulation.update();
      }

      render() {
        if (!Common.renderer) return;
        Common.renderer.setRenderTarget(null);
        Common.renderer.render(this.scene, this.camera);
      }
    }

    class WebGLManager implements ShaderRevealWebGL {
      props: Record<string, unknown>;
      output!: Output;
      autoDriver?: AutoDriver;
      lastUserInteraction = performance.now() - 10000;
      running = false;

      private _loop = this.loop.bind(this);
      private _resize = this.resize.bind(this);
      private _onVisibility?: () => void;

      constructor(props: {
        $wrapper: HTMLElement;
        frontTex: THREE.Texture;
        backTex: THREE.Texture;
      }) {
        this.props = props;

        Common.init(props.$wrapper);
        Mouse.init(props.$wrapper);
        Mouse.autoIntensity = autoIntensity;
        Mouse.takeoverDuration = takeoverDuration;
        Mouse.onInteract = () => {
          this.lastUserInteraction = performance.now();
          if (this.autoDriver) this.autoDriver.forceStop();
        };

        this.init();

        window.addEventListener("resize", this._resize);
        this._onVisibility = () => {
          const hidden = document.hidden;
          if (hidden) this.pause();
          else if (isVisibleRef.current) this.start();
        };
        document.addEventListener("visibilitychange", this._onVisibility);
      }

      init() {
        if (!Common.renderer) return;
        (this.props.$wrapper as HTMLElement).prepend(
          Common.renderer.domElement,
        );
        this.output = new Output(
          this.props.frontTex as THREE.Texture,
          this.props.backTex as THREE.Texture,
        );

        this.autoDriver = new AutoDriver(Mouse, this, {
          enabled: autoDemo,
          speed: autoSpeed,
          resumeDelay: autoResumeDelay,
          rampDuration: autoRampDuration,
        });

        if (this.autoDriver && this.autoDriver.enabled) {
          for (let i = 0; i < 3; i++) {
            this.autoDriver.update();
            Mouse.update();
            this.output.update();
          }
        }

        this.start();
      }

      resize() {
        Common.resize();
        this.output.resize();
      }

      render() {
        if (this.autoDriver) this.autoDriver.update();
        Mouse.update();
        Common.update();
        this.output.update();
        this.output.render();
      }

      loop() {
        if (!this.running) return;
        this.render();
        rafRef.current = requestAnimationFrame(this._loop);
      }

      start() {
        if (this.running) return;
        this.running = true;
        this._loop();
      }

      pause() {
        this.running = false;
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }

      dispose() {
        try {
          window.removeEventListener("resize", this._resize);
          if (this._onVisibility) {
            document.removeEventListener(
              "visibilitychange",
              this._onVisibility,
            );
          }
          Mouse.dispose();
          if (Common.renderer) {
            const canvas = Common.renderer.domElement;
            if (canvas && canvas.parentNode)
              canvas.parentNode.removeChild(canvas);
            Common.renderer.dispose();
          }
          this.output.mesh.geometry.dispose();
          (this.output.mesh.material as THREE.Material).dispose();
        } catch {
        }
      }
    }

    container.style.position = container.style.position || "relative";
    container.style.overflow = container.style.overflow || "hidden";

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    const loadTexture = (url: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          url,
          (tex) => {
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            resolve(tex);
          },
          undefined,
          (err) => reject(err),
        );
      });

    (async () => {
      try {
        const [frontTex, backTex] = await Promise.all([
          loadTexture(frontImage),
          loadTexture(backImage),
        ]);

        if (disposed) {
          frontTex.dispose();
          backTex.dispose();
          return;
        }

        frontTexRef.current = frontTex;
        backTexRef.current = backTex;

        const webgl = new WebGLManager({
          $wrapper: container,
          frontTex,
          backTex,
        });
        webgl.start();
        webglRef.current = webgl;

        const io = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            const isVisible =
              entry.isIntersecting && entry.intersectionRatio > 0;
            isVisibleRef.current = isVisible;
            if (!webglRef.current) return;
            if (isVisible && !document.hidden) {
              webglRef.current.start();
            } else {
              webglRef.current.pause();
            }
          },
          { threshold: [0, 0.01, 0.1] },
        );
        io.observe(container);
        intersectionObserverRef.current = io;

        const ro = new ResizeObserver(() => {
          if (!webglRef.current) return;
          if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
          resizeRafRef.current = requestAnimationFrame(() => {
            if (!webglRef.current) return;
            webglRef.current.resize();
          });
        });
        ro.observe(container);
        resizeObserverRef.current = ro;
      } catch {
      }
    })();

    return () => {
      disposed = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {
          /* noop */
        }
      }
      if (intersectionObserverRef.current) {
        try {
          intersectionObserverRef.current.disconnect();
        } catch {
          /* noop */
        }
      }
      if (webglRef.current) {
        webglRef.current.dispose();
      }
      webglRef.current = null;

      if (frontTexRef.current) {
        frontTexRef.current.dispose();
        frontTexRef.current = null;
      }
      if (backTexRef.current) {
        backTexRef.current.dispose();
        backTexRef.current = null;
      }
    };
  }, [
    frontImage,
    backImage,
    mouseForce,
    cursorSize,
    resolution,
    isViscous,
    viscous,
    iterationsViscous,
    iterationsPoisson,
    dt,
    BFECC,
    isBounce,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration,
    revealStrength,
    revealSoftness,
  ]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden ${className || ""}`}
      style={style}
    />
  );
};

export default ShaderReveal;

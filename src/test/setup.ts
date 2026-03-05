import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// ── AR test infrastructure mocks ──────────────────────────────────

/**
 * Mock MediaStream / MediaStreamTrack for getUserMedia tests.
 */
class MockMediaStreamTrack {
  kind = "video";
  enabled = true;
  readyState = "live" as MediaStreamTrackState;
  stop() {
    this.readyState = "ended" as MediaStreamTrackState;
  }
  getSettings(): MediaTrackSettings {
    return { width: 640, height: 480, frameRate: 30 } as MediaTrackSettings;
  }
  getCapabilities() {
    return {};
  }
  addEventListener() {}
  removeEventListener() {}
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[];
  constructor() {
    this.tracks = [new MockMediaStreamTrack()];
  }
  getTracks() {
    return this.tracks;
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video");
  }
  getAudioTracks() {
    return [];
  }
}

if (!navigator.mediaDevices) {
  Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    value: {},
  });
}

Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
  writable: true,
  value: vi.fn().mockResolvedValue(new MockMediaStream()),
});

/**
 * Minimal WebGL context stub so `<Canvas>` and BufferGeometry don't crash in JSDOM.
 */
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (
  contextId: string,
  ...args: unknown[]
) {
  if (contextId === "webgl2" || contextId === "webgl") {
    return {
      canvas: this,
      drawingBufferWidth: 300,
      drawingBufferHeight: 150,
      getExtension: () => null,
      getParameter: () => 0,
      createTexture: () => ({}),
      bindTexture: () => {},
      texParameteri: () => {},
      texImage2D: () => {},
      createBuffer: () => ({}),
      bindBuffer: () => {},
      bufferData: () => {},
      createProgram: () => ({}),
      createShader: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      attachShader: () => {},
      linkProgram: () => {},
      getProgramParameter: () => true,
      getShaderParameter: () => true,
      useProgram: () => {},
      getAttribLocation: () => 0,
      getUniformLocation: () => ({}),
      enableVertexAttribArray: () => {},
      vertexAttribPointer: () => {},
      uniform1i: () => {},
      uniform1f: () => {},
      uniform2f: () => {},
      uniform3f: () => {},
      uniform4f: () => {},
      uniformMatrix4fv: () => {},
      viewport: () => {},
      clear: () => {},
      clearColor: () => {},
      enable: () => {},
      disable: () => {},
      blendFunc: () => {},
      depthFunc: () => {},
      cullFace: () => {},
      frontFace: () => {},
      activeTexture: () => {},
      drawArrays: () => {},
      drawElements: () => {},
      createFramebuffer: () => ({}),
      bindFramebuffer: () => {},
      framebufferTexture2D: () => {},
      checkFramebufferStatus: () => 36053,
      createRenderbuffer: () => ({}),
      bindRenderbuffer: () => {},
      renderbufferStorage: () => {},
      framebufferRenderbuffer: () => {},
      pixelStorei: () => {},
      scissor: () => {},
      colorMask: () => {},
      depthMask: () => {},
      stencilMask: () => {},
      deleteTexture: () => {},
      deleteBuffer: () => {},
      deleteFramebuffer: () => {},
      deleteRenderbuffer: () => {},
      deleteProgram: () => {},
      deleteShader: () => {},
      generateMipmap: () => {},
      isContextLost: () => false,
    } as unknown as WebGLRenderingContext;
  }
  return originalGetContext.call(this, contextId, ...(args as []));
} as typeof HTMLCanvasElement.prototype.getContext;

/** Export mock helpers for use in individual test files */
export { MockMediaStream, MockMediaStreamTrack };

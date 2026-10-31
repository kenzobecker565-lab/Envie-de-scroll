# Code-driven video frameworks and fast headless rendering for 2D cartoon YouTube Shorts (state as of 2026-10-28)

Context: the project's current pipeline is `studio/render.mjs`. It opens 4 Playwright pages on `studio/editor/player.html` (Canvas 2D engine in `studio/engine/*.js`), calls `window.__studio.seek(t)`, then `page.screenshot({type:'png', clip})`, and pipes the PNGs to ffmpeg (`libx264 -preset slow -crf 17 -tune animation`, BT.709 tags, AAC 192k, loudnorm -14 LUFS, `+faststart`) — [render.mjs](/home/user/Envie-de-scroll/studio/render.mjs). A 35 s, 1080x1920, 30 fps render (1,050 frames) takes about 11 min, which is about 1.6 frames/s.

Local benchmarks referenced below ("Local benchmark") were run on 2026-10-28 in the same cloud container: 4 vCPU, 15 GB RAM, no GPU, Playwright 1.56.1 with `chromium_headless_shell-1194`, ffmpeg 6.1.1, Node 22. They used the real episode `03_la_flaque`, with frames taken from 10 s into the episode. Scripts are in the session scratchpad: `/tmp/claude-0/-home-user-Envie-de-scroll/92128204-77ea-5b0a-8e94-e3864e44088c/scratchpad/bench/capture.mjs`, `flags.mjs`, `e2e.mjs` and `nodecanvas.mjs`. That folder is temporary, so the numbers are repeated here.

## Q1. Remotion, Motion Canvas, Revideo: licenses, rendering pipelines, speed, fit for character animation

### Takeaway
Remotion is the most mature and best-maintained option (v4.0.539, published 2026-10-26). It is free only for individuals, for-profit companies with up to 3 employees, and non-profits. Paid use starts at $25/month per seat or $0.01 per render with a $100/month minimum. Its renderer still works by taking browser screenshots in parallel tabs, so with no GPU it would hit the same CPU limits as the custom pipeline. Motion Canvas (MIT) has had no release since Dec 2024 and renders from its editor UI. Revideo (MIT) is the headless, library-style fork of Motion Canvas and is still published (0.11.0, July 2026).

### Cited Findings
**Remotion: license and pricing**
- Free License eligibility: "an individual", "a for-profit organization with up to 3 employees", "a non-profit or not-for-profit organization", or someone "evaluating whether Remotion is a good fit, and are not yet using it in a commercial way". It allows commercial use for creating videos. Everyone else needs a Company License — [Remotion LICENSE.md](https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md)
- Company License pricing on remotion.pro (page © 2026): "Remotion for Creators" costs $25/month per seat. "Remotion for Automators" costs $0.01 per render with a $100/month minimum (the example is 10,000 renders for $100). Enterprise starts at $500/month. The page restates "free to use for individuals and companies up to three people". It gives no effective date for these prices — [remotion.pro/license](https://www.remotion.pro/license)
- Remotion 5.0 license changes: contractors now count toward the team-size threshold, and the company license is tied to new Terms & Conditions. The free tier is unchanged (individuals, ≤3 employees, non-profits). The migration page says 5.0 is not yet released — [Remotion v5.0 migration](https://remotion.dev/docs/5-0-migration) (via search summary)
- npm `remotion` latest = 4.0.539 (published 2026-10-26). The alpha tag is 4.1.0-alpha12, and there is no 5.x on the latest tag — npm registry (`npm view remotion dist-tags`, queried 2026-10-28)

**Remotion: rendering pipeline**
- `renderMedia()`: `concurrency` accepts a number, a percentage, or null. "Default is half of the CPU threads available." `imageFormat` is `jpeg` (default, "fastest"), `png` (for transparency) or `none`. `jpegQuality` defaults to the browser default, which is 80 in Chromium. Reusing a browser via `openBrowser()` speeds up rendering. Other options: `hardwareAcceleration` (since v4.0.228), `chromeMode` (since v4.0.248), and `disallowParallelEncoding` (lower memory use, may be slower) — [Remotion renderMedia docs](https://www.remotion.dev/docs/renderer/render-media)
- Performance guidance: tune `--concurrency` with `npx remotion benchmark`. GPU-dependent content includes "WebGL content, 2D Canvas graphics, and certain CSS effects such as box-shadow, filter: blur(), and gradients". "Compute instances in the cloud do not have a GPU and may take a long time to render these effects." The docs recommend replacing such effects with precomputed images. PNG is slower than JPEG. VP8/VP9 are very slow to encode — [Remotion performance docs](https://www.remotion.dev/docs/performance)
- In headless mode Chromium disables the GPU by default, which causes "a significant slowdown in rendering time" for WebGL, box-shadow, gradients, blur, and many 2D Canvas operations — [Remotion GPU docs](https://www.remotion.dev/docs/gpu)
- `--gl` options: `angle` will be the default in 5.0 (it uses the GPU if present and otherwise falls back to SwiftShader, and can leak memory on long renders). `swangle` is the default on Lambda and Cloud Run and is recommended for WebGL/Three.js without a GPU ("Rendering might be slow"). `angle-egl` is for cloud instances with a GPU. `vulkan` is available since 4.0.41 — [Remotion GL options](https://www.remotion.dev/docs/gl-options)
- Cloud GPU recipe: AWS `g4dn.xlarge` (~$375/month), NVIDIA driver plus `libvulkan1`, `--chrome-mode="chrome-for-testing"` and `--gl=vulkan`. The page says the render "should be significantly faster" but gives no numbers — [Remotion cloud GPU guide](https://www.remotion.dev/docs/miscellaneous/cloud-gpu)
- Lambda: concurrency = frameCount / framesPerLambda (default framesPerLambda is between 20 and ∞). Marketing figures: an "80 sec video rendered in 15 sec", and a 2 h video in 12 min (framesPerLambda=1080, ARM64, 2048 MB, warm, us-east-1). The resolution is not stated — [Remotion Lambda](https://remotion.dev/lambda), [Lambda concurrency](https://www.remotion.dev/docs/lambda/concurrency) (via search summary)
- Add-on packages relevant to character animation exist at 4.0.539: `@remotion/lottie`, `@remotion/rive`, `@remotion/skia` (React Native Skia), `@remotion/three` (React Three Fiber), `@remotion/motion-blur`, and `@remotion/web-renderer` ("Render videos in the browser") — npm registry, queried 2026-10-28
- Physics helper `spring({frame, fps, config})` defaults: mass 1, damping 10, stiffness 100, overshootClamping false. It also supports `durationInFrames`, `delay` and `reverse` — [Remotion spring docs](https://www.remotion.dev/docs/spring)

**Motion Canvas**
- MIT license, 19.5k GitHub stars — [motion-canvas GitHub](https://github.com/motion-canvas/motion-canvas)
- npm `@motion-canvas/core` latest = 3.17.2, published 2024-12-14, with no newer release as of 2026-10-28 — npm registry
- Rendering: the editor's RENDER button plays through the animation and saves each frame as PNG, JPEG or WebP into `/output`. The docs suggest ffmpeg to assemble the frames. The rendering docs mention no headless/CLI path — [Motion Canvas rendering docs](https://motioncanvas.io/docs/rendering)

**Revideo**
- A fork of Motion Canvas turned into a library. MIT license. Headless rendering via `renderVideo()` or a CLI render endpoint. It runs "anywhere Node and a headless browser run", including Google Cloud Run. Parallelized rendering "split[s] a render across workers". It collects anonymous telemetry via PostHog (`DISABLE_TELEMETRY=true` turns it off). The repo now lives at midrender/revideo and is "the engine behind Midrender" (4.2k stars) — [Revideo GitHub](https://github.com/redotvideo/revideo)
- npm `@revideo/core` latest = 0.11.0, published 2026-07-10 — npm registry
- The founders' 2024 launch claimed 60 s of full-HD video rendered in 14.3 s on a MacBook, with a WebCodecs-based renderer. This is a vendor claim seen only in a search snippet and not verified — [Product Hunt Revideo](https://www.producthunt.com/posts/revideo); [YC Revideo](https://www.ycombinator.com/companies/revideo)

**HyperFrames (HeyGen), a new 2026 alternative relevant to AI agents**
- HeyGen open-sourced HyperFrames, which turns HTML into MP4 and is aimed at AI agents. GSAP is its default animation adapter, and it also uses Puppeteer, FFmpeg and Lottie. It renders deterministically with `HeadlessExperimental.beginFrame` in `chrome-headless-shell` on Linux, splits long videos across N Chrome processes and concatenates the chunks with FFmpeg — [HeyGen research: HTML to video](https://www.heygen.com/research/html-to-video)
- npm `hyperframes` 0.8.214, Apache-2.0, repo github.com/heygen-com/hyperframes, modified 2026-10-28 — npm registry

### Inferences
- License: if the channel is run by an individual or a company with 3 people or fewer, Remotion is free for commercial use. From 5.0, contractors count toward that headcount. A larger company would pay at least $25/month per creator seat or the $100/month Automator minimum.
- Speed: Remotion captures frames from Chromium tabs with JPEG by default and no GPU in the cloud. On this 4-vCPU container it would likely land near the "JPEG capture + parallel tabs" numbers measured in Q2 (about 10 fps for this scene complexity), not dramatically faster. Its real gains come from defaults that already avoid PNG, built-in concurrency tuning, and the option of Lambda fan-out (paid AWS plus a license above 3 people).
- Character animation: none of Remotion, Motion Canvas or Revideo provides rigging or bone tools natively. Characters are drawn in code (SVG, Canvas or Skia) or imported as Lottie or Rive. The custom engine already does procedural drawing (`draw-minuton.js`), so migrating would mainly bring tooling (Studio preview, timeline, Player), not better character rendering.
- Motion Canvas looks unmaintained (no release for about 22 months). Revideo is the maintained descendant if a generator/timeline API is preferred, but it is a small project tied to one startup (Midrender).
- HyperFrames is the closest match to an "AI agent writes HTML/GSAP, renders MP4" workflow and is Apache-2.0. However, it is very young (0.x) and its beginFrame path is Linux-only.

### Gaps
- No independent, published fps benchmark for Remotion (local or Lambda) at 1080x1920 on CPU-only machines was found. Running `npx remotion benchmark` locally would be needed.
- Whether Remotion 5.0 will ship before the channel goes live is unknown, and so is the exact date its license terms take effect.
- Revideo's current renderer internals (WebCodecs vs ffmpeg) and its CPU-only speed could not be verified from primary docs.

## Q2. Fastest headless rendering approaches and typical frames/sec (CPU-only Linux)

### Takeaway
In the current pipeline the bottleneck is Playwright's PNG screenshot (about 915 ms/frame), not drawing or encoding. Switching to CDP `Page.captureScreenshot` with `optimizeForSpeed:true` (JPEG q92, or lossless PNG), or to `canvas.toDataURL('image/jpeg')`, cut a measured 35 s render from about 660 s to about 80–165 s in this container with no other change. The remaining limits are the engine's own drawing time (about 135–160 ms/frame, probably the full-frame `ctx.filter = blur(...)`) and x264 preset choice. Leaving the browser entirely (skia-canvas or @napi-rs/canvas in Node, raw RGBA piped to ffmpeg) removes capture overhead, but the engine would need porting.

### Cited Findings
**Local benchmark: capture methods on the real episode (single page, 45 frames, ms/frame)**

| Method | ms/frame | fps | avg size |
|---|---|---|---|
| `seek` only (draw in page, includes evaluate round-trip) | 160.9 | 6.2 | — |
| `seek` + Playwright `page.screenshot` PNG (current pipeline) | **914.8** | **1.1** | 1,692 KiB |
| `seek` + Playwright `page.screenshot` JPEG q90 | 205.8 | 4.9 | 261 KiB |
| `seek` + CDP `Page.captureScreenshot` JPEG q90 `optimizeForSpeed` | 208.8 | 4.8 | 261 KiB |
| `seek` + CDP `Page.captureScreenshot` PNG `optimizeForSpeed` (lossless) | 286.8 | 3.5 | 2,219 KiB |
| `seek` + `canvas.toDataURL('image/jpeg',0.92)` in the same evaluate | 179.4 | 5.6 | 288 KiB |
| `seek` + `canvas.toDataURL('image/png')` | 301.2 | 3.3 | 2,645 KiB |
| `seek` + `getImageData` raw RGBA sent as base64 | 448.3 | 2.2 | 8,100 KiB |

— Local benchmark (`capture.mjs`)

**Local benchmark: Chromium launch flags (draw time inside the page, 30 frames)**
- Default headless shell: 135 ms/frame. `--disable-gpu`: 149 ms. `--disable-accelerated-2d-canvas`: 160 ms. Forcing `--use-angle=swiftshader --enable-unsafe-swiftshader`: **895 ms**, about 6.6x slower, because the GPU-emulated canvas path runs on the CPU. The WebGL renderer string in every case was "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))", so WebGL works by default in Playwright's headless shell, but through software emulation — Local benchmark (`flags.mjs`)
- The engine applies a full-frame `ctx.filter = 'blur(6px)'` and a dynamic `blur(...)` filter, plus radial gradients and `drawImage` of full-frame plates, on every frame — [studio/engine/studio.js](/home/user/Envie-de-scroll/studio/engine/studio.js) (grep)

**Local benchmark: x264 encode speed alone (150 PNG frames, 1080x1920, `-crf 17 -tune animation`, yuv420p, 4 vCPU)**
- `-preset slow` 14.1 fps; `medium` 26.0 fps; `veryfast` 45.2 fps. Output was about 2.1–2.2 MB per 5 s (≈3.4 Mbps) for all three. Decoding the PNGs alone ran at 80.8 fps — Local benchmark

**Local benchmark: end-to-end, 300 frames (10 s), N pages → CDP capture → ffmpeg pipe → x264 crf 17 (video only)**

| Config | fps | Projected 35 s (1,050 frames) |
|---|---|---|
| Current-style PNG via Playwright (user-reported) | ~1.6 | ~660 s |
| CDP PNG `optimizeForSpeed`, 4 workers, x264 medium | 6.4 | ~164 s |
| CDP JPEG q92, 4 workers, x264 medium | 9.6 | ~110 s |
| CDP JPEG q92, 3 workers, x264 medium | 9.8 | ~107 s |
| CDP JPEG q92, 4 workers, x264 slow | 8.9 | ~118 s |
| CDP JPEG q92, 4 workers, x264 veryfast | 13.1 | ~80 s |

— Local benchmark (`e2e.mjs`)

**Local benchmark: canvas in Node, no browser (synthetic cartoon-like scene: gradient, 40 ellipses, 300 outlined Bézier shapes, text; raw RGBA piped to ffmpeg `-f rawvideo -pix_fmt rgba`, x264 medium, single process)**
- skia-canvas 4.0.0: draw 12.7 ms plus `toBufferSync('raw')` 52.8 ms (skia-canvas records draw calls and rasterizes at export, so the two together, about 65 ms, are the real cost), about 11.2 fps end-to-end. With a 6 px blur filter on 40 shapes: about 68 ms, 11.1 fps.
- @napi-rs/canvas 1.0.13: draw 3.6 ms plus `getImageData` 56.8 ms, 11.5 fps end-to-end. The variant with `ctx.filter='blur(6px)'` did not finish within a 200 s timeout (unexplained; possibly a very slow filter path) — Local benchmark (`nodecanvas.mjs`)
- The scene is lighter than the real engine, so these numbers show the capture-free ceiling (about 11 fps single process, here limited by x264 sharing 4 cores), not a like-for-like comparison.

**Libraries and APIs**
- skia-canvas: MIT, v4.0 (npm 4.0.0, 2026-10-12). It is "unusually fast" and renders asynchronously on a user-configurable native worker pool. Output formats include PNG, JPEG, WebP and RAW plus PDF and SVG. GPU rendering on Vulkan (credited contributor). It runs on standard Linux hosts, Lambda and Vercel. Apple-Silicon benchmarks vs node-canvas: Path2D drawing 6.7x faster (async), text 5.7x, gradients 16.3x, image scale/rotate 33.5x — [skia-canvas GitHub](https://github.com/samizdatco/skia-canvas)
- node-canvas (`canvas`): MIT, v3 stable (npm 3.2.3), v4 pre-release adds worker-thread support. `toBuffer('raw')` returns "unencoded data in BGRA order on little-endian (most) systems, ARGB on big-endian systems; top-to-bottom" with length `height * stride`. ffmpeg therefore needs `-pix_fmt bgra`. `createJPEGStream()` runs on the main thread — [node-canvas GitHub](https://github.com/Automattic/node-canvas)
- `HeadlessExperimental.beginFrame`: "Sends a BeginFrame to the target and returns when the frame was completed. Optionally captures a screenshot". It needs BeginFrameControl and `--run-all-compositor-stages-before-draw`, and returns `hasDamage` — [CDP HeadlessExperimental](https://chromium.googlesource.com/devtools/devtools-frontend.git/+/HEAD/node_modules/devtools-protocol/pdl/domains/HeadlessExperimental.pdl)
- HeyGen's production recipe for frame-exact capture: binary `chrome-headless-shell` with `--deterministic-mode --enable-begin-frame-control --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging --disable-image-animation-resync --enable-surface-synchronization`. Screenshots use JPEG quality 80 with `optimizeForSpeed:true`. A naive `seek` + `Page.captureScreenshot` "can return before layout, fonts, styles, and painting have settled". `--deterministic-mode` crashes on macOS and Windows. Long videos are split across N Chrome processes and the MP4 chunks concatenated. No fps figures are given — [HeyGen research](https://www.heygen.com/research/html-to-video)
- Puppeteer screenshots are slow mainly because of the emulation done on each call. Setting the viewport once and avoiding `fullPage` is much faster. A proposed "burst mode" gave 2.5x in Puppeteer-Sharp — [Puppeteer burstMode issue (via lightrun)](https://lightrun.com/answers/puppeteer-puppeteer-new-burstmode-for-screenshots)
- `puppeteer-capture` captures frames deterministically through `HeadlessExperimental.beginFrame` rather than in real time — [puppeteer-capture README](https://cdn.jsdelivr.net/npm/puppeteer-capture@1.58.0/README.md)
- WebGL software fallback: Chromium is removing the automatic WebGL→SwiftShader fallback. The intent to remove was posted in Feb 2025, the deprecation started in Chrome 130, and context creation fails from M139 unless opted in with `--enable-unsafe-swiftshader` (paired with `--use-gl=angle --use-angle=swiftshader-webgl`). The opt-in is meant for headless/testing on trusted content — [Intent to Remove: SwiftShader Fallback](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM); [Chromium SwiftShader doc](https://chromium.googlesource.com/chromium/src/+/798e59c5275d4131797e8ea2e96e6c6000256b58/docs/gpu/swiftshader.md); [Samsung policy page](https://developer.samsung.com/browser/policy/enable-unsafe-swift-shader.html)
- PixiJS v8 can run outside the browser only through a custom `DOMAdapter` that supplies createCanvas and WebGL contexts, which must be set before `init`. No official Node renderer exists, and WebGL without a GPU context is the open question — [PixiJS environments guide](https://pixijs.com/8.x/guides/concepts/environments); npm pixi.js 8.22.0 (MIT)

### Inferences
- **Quick win (about 4–8x, minimal code change):** in `render.mjs`, replace `page.screenshot({type:'png'})` with a CDP session (`page.context().newCDPSession(page)` then `Page.captureScreenshot({format:'jpeg', quality:92–95, optimizeForSpeed:true})`, or `format:'png', optimizeForSpeed:true` to stay lossless). Tell ffmpeg the matching decoder (`-c:v mjpeg` or `png`). Alternatively, return `canvas.toDataURL('image/jpeg', 0.95)` from the same `evaluate` as `seek`, which saves one CDP round-trip. JPEG at q≥90 adds slight loss before x264 re-encodes at 4:2:0. For flat cartoon colours this is usually invisible, but lossless fast-PNG is the safe choice if banding or ringing shows up on outlines.
- **Encoder preset:** with JPEG capture, `-preset slow` costs about 7% vs medium (118 s vs 110 s) because it shares CPU with Chromium. Keep `slow` or `medium` for finals and `veryfast` for drafts.
- **Workers:** 3 pages did as well as 4 on 4 vCPU, because x264 and the Chromium GPU/compositor process also need CPU. A good rule is workers ≈ vCPU − 1.
- **Next bottleneck is the engine draw (about 135–160 ms/frame):** cache static layers (backgrounds, the full-frame blurred layer) into OffscreenCanvas or ImageBitmap once per shot instead of re-blurring every frame. Precompute blurred plates (Remotion's docs give the same advice for effects without a GPU). Avoid `ctx.filter` on full frames. If the blur is a depth-of-field background that changes slowly, re-blur only every N frames.
- **Do not force SwiftShader/ANGLE for Canvas 2D:** the CPU raster path is 6.6x faster than GPU emulation in this container. WebGL-based stacks (PixiJS, Three.js ortho, Remotion `--gl=swangle`) run on SwiftShader software emulation without a GPU and depend on a deprecated opt-in flag, so they are a poor fit for this container.
- **Going browser-less** (skia-canvas, preferred for its worker pool and RAW output, or @napi-rs/canvas) removes screenshot and base64 overhead. Write raw RGBA to ffmpeg stdin with `-f rawvideo -pix_fmt rgba -s 1080x1920 -r 30 -i -`. Across processes this should beat the browser path if the scene is ported (most of `draw-*.js` is plain Canvas 2D). The price is losing the browser editor preview unless the engine stays isomorphic. Check `ctx.filter` support and speed per library first (the @napi-rs blur run did not finish).
- **Parallel chunks:** splitting the timeline into K ranges, encoding each to its own MP4 with identical settings and joining with the ffmpeg concat demuxer (`-c copy`) is the pattern used by HeyGen, Remotion and Revideo. It also allows caching unchanged shots between iterations by hashing shot code and inputs.
- **beginFrame** improves correctness (frames always fully painted) more than speed. The current engine draws synchronously inside `seek`, so the "frame not settled" problem mostly affects DOM/CSS/font content, not a single canvas.

### Gaps
- There are no reliable public fps numbers for CDP `Page.startScreencast` vs captureScreenshot at 1080x1920. Screencast is real-time and not frame-exact, so it was not benchmarked.
- The engine was not ported to skia-canvas, so the real browser-less speed for this exact scene is unmeasured.
- No GPU was available to measure GPU-accelerated Chromium or WebGL rendering.

## Q3. Quality: motion blur, 60 vs 30 fps, anti-aliasing, colour, YouTube Shorts encoding and ffmpeg flags

### Takeaway
YouTube's official recommendations for 1080p SDR are H.264 High Profile, progressive, CABAC, 2 consecutive B-frames, closed GOP of half the frame rate, 4:2:0, BT.709, about 8 Mbps at 30 fps or 12 Mbps at 60 fps, AAC-LC 48 kHz (stereo 384 kbps), and MP4 with moov at the front. HEVC uploads are accepted. Motion blur in code renderers is done by averaging sub-frames: Remotion's `CameraMotionBlur` defaults to 10 samples at a 180° shutter, so it multiplies render cost. 60 fps doubles render time for limited gain on cartoon content.

### Cited Findings
- YouTube recommended upload encoding: MP4, "No Edit Lists", moov atom at the front (Fast Start). Audio AAC-LC, Opus or Eclipsa, 48 kHz, stereo 384 kbps (mono 128 kbps). Video H.264, progressive, High Profile, CABAC, "2 consecutive B frames", closed GOP of half the frame rate, variable bitrate with no limit required, 4:2:0. Upload at the recorded frame rate (24/25/30/48/50/60 common). 1080p SDR 24–30 fps is 8 Mbps and 48–60 fps is 12 Mbps. SDR colour is BT.709 for primaries, transfer and matrix. YouTube advises against the RGB matrix and converts full range to limited range. The page gives no Shorts-specific settings — [YouTube Help: recommended upload encoding settings](https://support.google.com/youtube/answer/1722171?hl=en)
- Supported upload formats include .MOV, .MP4, WebM, DNxHR, ProRes, CineForm and "HEVC (H.265)". AV1 is not listed — [YouTube Help: supported file formats](https://support.google.com/youtube/troubleshooter/2888402?hl=en)
- Shorts: vertical or square videos up to 3 minutes count as Shorts for uploads on or after Oct 15, 2024. The standard size is 1080x1920 (9:16). Third-party guides suggest 30 or 60 fps (secondary sources) — [vidIQ Shorts guide 2026](https://vidiq.com/blog/post/youtube-shorts-vertical-video); [async.com guide](https://async.com/blog/how-long-can-youtube-shorts-be/)
- Remotion `CameraMotionBlur`: `shutterAngle` (default 180) and `samples` (default 10). Each output frame renders the content at several time offsets and averages them. 5–10 samples are recommended, and the technique "is destructive to colors", so samples should stay low. Children must be absolutely positioned — [Remotion CameraMotionBlur](https://www.remotion.dev/docs/motion-blur/camera-motion-blur)
- ffmpeg `tmix` "Mix successive video frames" with `frames` (1–1024, default 3), `weights` (default "1 1 1") and `scale`. It can average sub-frames rendered at a higher fps — local `ffmpeg -h filter=tmix` (ffmpeg 6.1.1); [FFmpeg filters doc](https://ffmpeg.org/ffmpeg-filters.html)
- Measured bitrate of the current settings (`-crf 17 -tune animation`) on this episode: about 3.4 Mbps at 1080x1920 30 fps (2,132,008 bytes per 5 s at preset slow), below YouTube's 8 Mbps reference — Local benchmark
- The container's ffmpeg 6.1.1 has encoders libx264, libx265, libsvtav1, librav1e and libaom-av1 — local `ffmpeg -encoders`
- The current pipeline already converts to BT.709 limited range (`scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`), sets colour tags, normalises loudness to -14 LUFS / -1.5 dBTP and uses `+faststart` — [render.mjs](/home/user/Envie-de-scroll/studio/render.mjs)

### Inferences
- **Recommended final encode** (assembled from YouTube's recommendations and the local tests):
  `ffmpeg -f image2pipe -c:v mjpeg -framerate 30 -i - -i audio.wav -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 14 -tune animation -profile:v high -bf 2 -g 15 -keyint_min 15 -sc_threshold 0 -maxrate 16M -bufsize 32M -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest out.mp4`.
  Lowering CRF from 17 to about 14 brings the bitrate closer to YouTube's 8 Mbps reference. That gives YouTube's transcoder a cleaner source (more bitrate in the upload means less generational loss). The file stays small for a 35 s Short. `-g 15` follows "closed GOP, half the frame rate", and x264 GOPs are closed by default. If the pixel source is node-canvas raw output, use `-pix_fmt bgra`; for skia-canvas raw or getImageData use `rgba`.
- **H.264 vs HEVC/AV1 uploads:** YouTube re-encodes everything (to AVC, VP9 or AV1 for delivery), so the upload codec mainly matters for upload size. H.264 high-bitrate is the safest. HEVC is accepted but slower to encode on CPU and brings no visible gain after YouTube's re-encode. AV1 is not in the supported list, so avoid it.
- **30 vs 60 fps:** 60 fps doubles render and encode time (about 220 s instead of 110 s with the fast capture path) and needs 12 Mbps. Cartoon animation is commonly animated "on twos" (12 fps), so 30 fps is appropriate. Choose 60 only for fast camera pans or scrolling text, where judder is visible.
- **Motion blur options, cheapest first:**
  - Draw stylised smear or speed lines or ghost copies along the velocity vector inside the engine, at about 1x cost. This also fits the cartoon look.
  - Velocity-aware blur only on fast-moving actors: render that actor 3–5 times at sub-frame offsets with alpha 1/n into an offscreen layer, so only that sprite's cost is multiplied.
  - Full-frame sub-frame accumulation: render at 4x fps (120 fps) and run `tmix=frames=2:weights='1 1'` then `fps=30` (or `tmix=frames=4` for a 360° shutter). This costs 4x render time and was not measured here.
- **Anti-aliasing:** Canvas 2D paths are anti-aliased by default. Rendering at 2x (`deviceScaleFactor: 2`) and downscaling with lanczos costs about 4x pixels and is rarely needed at 1080x1920. Thicker outlines (≥3 px) and avoiding sub-pixel jitter of static elements (round positions of static props) usually help more.
- **Colour:** canvas content is sRGB. The current BT.709 limited-range conversion and tags match YouTube's guidance. Keep a single conversion step and never upload RGB/4:4:4.

### Gaps
- No official YouTube page gives Shorts-specific encoding guidance or confirms whether Shorts get VP9 or AV1 transcodes depending on upload bitrate. No primary source was found on whether 60 fps Shorts perform better algorithmically.
- The cost and visual quality of tmix or sub-frame motion blur on this engine were not measured.

## Q4. Other frameworks (Theatre.js, GSAP, PixiJS v8, Three.js ortho, Skia) and easing/spring libraries usable in a deterministic frame renderer

### Takeaway
For an agent-written deterministic renderer, the best fits are a pure function of time t: GSAP timelines driven by `seek()` (free for commercial use since April 2025) or hand-written easing and spring math (Remotion's `spring()` or Motion's sampleable `spring` generator). Theatre.js is effectively stalled. PixiJS and Three.js are GPU-oriented, and without a GPU they fall back to SwiftShader software WebGL.

### Cited Findings
- GSAP: since April 30, 2025 the Standard "No Charge" license makes all of GSAP, including former Club plugins such as SplitText and MorphSVG, free for commercial use. The only prohibited use is in no-code visual animation tools that compete with Webflow — [Webflow: GSAP becomes free](https://webflow.com/blog/gsap-becomes-free); [GSAP standard license](https://gsap.com/community/standard-license/). npm gsap 3.15.0 (2026-04-13) — npm registry
- HyperFrames uses GSAP as its default animation adapter for deterministic HTML-to-video — [HeyGen research](https://www.heygen.com/research/html-to-video)
- Theatre.js: npm `@theatre/core` 0.7.2 (Apache-2.0), last published 2024-05-19. Snyk rates maintenance "INACTIVE". The README said development moved to a private repo, with "1.0 is around the corner" — npm registry; [Snyk advisor](https://snyk.io/advisor/npm-package/theatre); [theatre-js GitHub](https://github.com/theatre-js/theatre)
- PixiJS 8.22.0 (MIT, 2026-10-01) and three 0.186.1 (MIT, 2026-09-24) are actively released — npm registry. PixiJS headless use needs a custom `DOMAdapter` — [PixiJS environments](https://pixijs.com/8.x/guides/concepts/environments)
- Motion (formerly Framer Motion and Popmotion): npm `motion` 14.7.1 (MIT, 2026-10-27). `popmotion` 11.0.5 was last published 2022-08-15 — npm registry
- Motion's `spring({keyframes:[0,100]})` returns a generator that "can be sampled in a non-linear fashion, meaning you can sample the spring at any time" via `next(t)` with t in ms. Defaults are stiffness 100 and damping 10. "Springs with damping: 0 will run forever." Motion also defines springs by `visualDuration` and `bounce` — [motion.dev spring](https://motion.dev/docs/spring); [motion.dev/dom/spring](https://motion.dev/dom/spring)
- Remotion `spring()` defaults are mass 1, damping 10 and stiffness 100, plus `durationInFrames`, `delay`, `reverse` and `overshootClamping`. It is driven by `frame` and `fps` — [Remotion spring](https://www.remotion.dev/docs/spring)
- Skia in Node: skia-canvas (MIT, v4.0.0) and @napi-rs/canvas (MIT, 1.0.13) implement the Canvas 2D API, including Path2D. @remotion/skia wraps React Native Skia for Remotion — [skia-canvas GitHub](https://github.com/samizdatco/skia-canvas); npm registry

### Inferences
- **Determinism rules for any library** (also listed in HeyGen's authoring rules: no `Date.now()`, no unseeded `Math.random()`, no network at render time): every animated value must be a pure function of `t` (or the frame index). For GSAP, build a paused master timeline and call `tl.seek(t, false)` (or `tl.progress(t / tl.duration())`) per frame, never relying on the ticker. For Theatre.js, setting `sequence.position = t` is equivalent, but the stalled project makes it a risky dependency.
- **Spring formula** to embed directly (no dependency, matches the stiffness/damping/mass conventions used by react-spring, Motion and Remotion). With k = stiffness, c = damping, m = mass, ω0 = √(k/m), ζ = c / (2√(k·m)) and x(t) the displacement toward the target (x0 = from − to, v0 = initial velocity):
  - underdamped (ζ<1): ωd = ω0√(1−ζ²); x(t) = e^(−ζω0 t)·(x0·cos(ωd t) + ((v0 + ζω0 x0)/ωd)·sin(ωd t))
  - critically damped (ζ=1): x(t) = e^(−ω0 t)·(x0 + (v0 + ω0 x0)·t)
  - overdamped (ζ>1): uses the two real roots r1,2 = −ω0(ζ ∓ √(ζ²−1))
  - value(t) = to + x(t). This is closed-form, so it is O(1) per frame and seekable, unlike step integrators. That matters for parallel workers that render frames out of order.
- **Procedural animation helpers** (all pure math): cubic-bezier easings (CSS `cubic-bezier`), squash/stretch from velocity, secondary motion with lagged springs, and seeded noise (for example a small seeded PRNG plus simplex noise) for idle breathing and blinking. These avoid heavy dependencies and keep frames independent.
- **Rendering backend choice for this container (no GPU):** Canvas 2D (browser CPU raster, or skia-canvas in Node) beats PixiJS or Three.js ortho running on SwiftShader. WebGL stacks only pay off on a GPU instance (for example g4dn with `--gl=vulkan`/`angle-egl` per Remotion's guide), which costs about $375/month.

### Gaps
- No benchmark was found comparing PixiJS or Three.js on SwiftShader against Canvas 2D for 1080x1920 cartoon scenes. It was not measured locally either.
- Theatre.js's private-repo status in 2025–2026 could not be confirmed from primary sources beyond the npm publish date.

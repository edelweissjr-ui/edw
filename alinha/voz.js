/* Reconhecimento da voz do profissional — Alinha
   Cria uma "impressão" da voz (timbre por faixas de frequência + tom) a partir de ~20 s de leitura
   e, na consulta, compara cada frase com ela: parecida → Profissional; diferente → Paciente.
   Tudo roda no navegador. Nenhum áudio é gravado ou enviado: só números (médias) são guardados. */
window.AlinhaVoz = (function () {
  "use strict";
  const NB = 18, FMIN = 90, FMAX = 5000, TICK = 50;
  const BORDAS = Array.from({ length: NB + 1 }, (_, i) => FMIN * Math.pow(FMAX / FMIN, i / NB));

  function medidor(stream) {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 2048; an.smoothingTimeConstant = 0;
    src.connect(an);
    const freq = new Float32Array(an.frequencyBinCount), tempo = new Float32Array(an.fftSize);
    const hzPorBin = ctx.sampleRate / an.fftSize;
    let quadros = [], ruido = 0.004;
    const id = setInterval(() => {
      an.getFloatTimeDomainData(tempo);
      let soma = 0; for (let i = 0; i < tempo.length; i++) soma += tempo[i] * tempo[i];
      const rms = Math.sqrt(soma / tempo.length);
      if (rms < ruido * 2) { ruido = ruido * 0.95 + rms * 0.05; return; } // silêncio: atualiza o ruído de fundo
      if (rms < Math.max(0.008, ruido * 3)) return;
      an.getFloatFrequencyData(freq);
      const v = new Array(NB).fill(0);
      for (let b = 0; b < NB; b++) {
        const i0 = Math.max(1, Math.floor(BORDAS[b] / hzPorBin)), i1 = Math.max(i0 + 1, Math.floor(BORDAS[b + 1] / hzPorBin));
        let e = 0; for (let i = i0; i < i1 && i < freq.length; i++) e += Math.pow(10, freq[i] / 10);
        v[b] = Math.log10(e / (i1 - i0) + 1e-12);
      }
      const m = v.reduce((a, x) => a + x, 0) / NB;
      quadros.push({ v: v.map((x) => x - m), f0: tom(tempo, ctx.sampleRate) });
      if (quadros.length > 4000) quadros.splice(0, 1000);
    }, TICK);
    return {
      pegar() { const q = quadros; quadros = []; return q; },
      espiar() { return quadros.length; },
      parar() { clearInterval(id); try { src.disconnect(); ctx.close(); } catch (e) { /* */ } }
    };
  }

  // tom (frequência fundamental) por autocorrelação, entre 70 e 400 Hz
  function tom(buf, sr) {
    const n = buf.length, minL = Math.floor(sr / 400), maxL = Math.floor(sr / 70);
    let e0 = 0; for (let i = 0; i < n; i++) e0 += buf[i] * buf[i];
    if (e0 < 1e-6) return null;
    let melhor = 0, lag = 0;
    for (let L = minL; L <= maxL; L++) {
      let c = 0; for (let i = 0; i < n - L; i++) c += buf[i] * buf[i + L];
      c /= e0; if (c > melhor) { melhor = c; lag = L; }
    }
    return melhor > 0.35 && lag ? sr / lag : null;
  }

  const media = (arr) => arr.reduce((a, x) => a + x, 0) / (arr.length || 1);
  const dp = (arr, m) => Math.sqrt(media(arr.map((x) => (x - m) * (x - m))));
  const semitom = (f) => 12 * Math.log2(f / 100);
  function resumo(quadros) {
    const mv = Array.from({ length: NB }, (_, b) => media(quadros.map((q) => q.v[b])));
    const tons = quadros.map((q) => q.f0).filter(Boolean).map(semitom).sort((a, b) => a - b);
    return { mv, tom: tons.length >= 3 ? tons[Math.floor(tons.length / 2)] : null };
  }
  function pontuar(perfil, quadros) {
    const r = resumo(quadros);
    const zs = Math.sqrt(media(r.mv.map((x, b) => Math.pow((x - perfil.mv[b]) / Math.max(perfil.sd[b], 0.12), 2))));
    const zt = r.tom != null && perfil.tom != null ? Math.min(4, Math.abs(r.tom - perfil.tom) / Math.max(perfil.tomSd, 1.5)) : 0;
    return zs + 0.6 * zt;
  }

  // cria o perfil a partir dos quadros da leitura
  function criarPerfil(quadros) {
    if (quadros.length < 120) throw new Error("Pouca fala captada. Leia o texto em voz alta, perto do microfone.");
    const r = resumo(quadros);
    const blocos = []; for (let i = 0; i + 20 <= quadros.length; i += 20) blocos.push(quadros.slice(i, i + 20));
    const sd = Array.from({ length: NB }, (_, b) => dp(blocos.map((bl) => media(bl.map((q) => q.v[b]))), r.mv[b]));
    const tonsBl = blocos.map((bl) => resumo(bl).tom).filter((x) => x != null);
    const perfil = { mv: r.mv, sd, tom: r.tom, tomSd: tonsBl.length > 2 ? dp(tonsBl, r.tom) : 2, versao: 1, criadoEm: new Date().toISOString() };
    const notas = blocos.map((bl) => pontuar(perfil, bl));
    perfil.limiar = Math.max(1.6, (media(notas) + 2.5 * dp(notas, media(notas))) * 1.25);
    return perfil;
  }

  // classifica um trecho de fala: devolve { quem, confianca } ou null se houver pouca voz
  function classificar(perfil, quadros) {
    if (!perfil || quadros.length < 6) return null;
    const s = pontuar(perfil, quadros);
    const quem = s <= perfil.limiar ? "profissional" : "paciente";
    const confianca = Math.min(1, Math.abs(s - perfil.limiar) / perfil.limiar);
    return { quem, confianca, nota: s };
  }

  return { medidor, criarPerfil, classificar };
})();

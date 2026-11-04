/**
 * Draft Copilot tab: the interactive ADP consumption-curve demo.
 * Re-renders the SVG from draft-curves.ts when the position, the superflex toggle or the
 * viewport class changes; moves the crosshair and rewrites the readout on hover and slider input.
 * Re-initialises on every astro:page-load because the view-transition router swaps the body.
 */
import draft from '../data/draft.json';
import {
  adpChart, anchorsFor, cursorLayout, geometry, logLogCurve, readCurve, scales,
  LAST_PICK, MAX_RANK, POSITIONS, ROUNDS, SERIES_COLOR, TEAMS,
  type AdpState, type Pos,
} from './draft-curves';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const isPos = (v: string | undefined): v is Pos => !!v && (POSITIONS as readonly string[]).includes(v);

function init(): void {
  const rootEl = document.getElementById('adp-demo');
  if (!rootEl || rootEl.dataset.ready === '1') return;
  rootEl.dataset.ready = '1';
  const root: HTMLElement = rootEl;

  const chartEl = root.querySelector<HTMLElement>('#adp-chart');
  const sliderEl = root.querySelector<HTMLInputElement>('#adp-rank');
  const sfxEl = root.querySelector<HTMLInputElement>('#adp-superflex');
  const outPosEl = root.querySelector<HTMLElement>('#adp-r-pos');
  const outRankEl = root.querySelector<HTMLElement>('#adp-r-rank');
  const outPickEl = root.querySelector<HTMLElement>('#adp-r-pick');
  const outRoundEl = root.querySelector<HTMLElement>('#adp-r-round');
  const outNoteEl = root.querySelector<HTMLElement>('#adp-r-note');
  const outValEl = root.querySelector<HTMLElement>('#adp-rank-out');
  if (!chartEl || !sliderEl || !sfxEl || !outPosEl || !outRankEl || !outPickEl || !outRoundEl || !outNoteEl || !outValEl) return;
  const chart: HTMLElement = chartEl;
  const slider: HTMLInputElement = sliderEl;
  const sfx: HTMLInputElement = sfxEl;
  const outPos: HTMLElement = outPosEl;
  const outRank: HTMLElement = outRankEl;
  const outPick: HTMLElement = outPickEl;
  const outRound: HTMLElement = outRoundEl;
  const outNote: HTMLElement = outNoteEl;
  const outVal: HTMLElement = outValEl;
  const posBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('.dc-pos'));
  const mq = window.matchMedia('(max-width: 640px)');

  const state: AdpState = {
    anchors: draft.anchors,
    superflexQb: draft.superflexQb,
    superflex: sfx.checked,
    selected: 'RB',
    rank: clamp(Math.round(Number(slider.value) || 18), 1, 60),
    narrow: mq.matches,
  };
  const pressed = posBtns.find((b) => b.getAttribute('aria-pressed') === 'true');
  if (pressed && isPos(pressed.dataset.pos)) state.selected = pressed.dataset.pos;

  const curveFor = (pos: Pos) => logLogCurve(anchorsFor(state, pos));
  const setAttrs = (id: string, attrs: Record<string, string | number>): void => {
    const el = chart.querySelector<SVGElement>(`#${id}`);
    if (!el) return;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  };

  function placeCursor(): void {
    const g = geometry(state.narrow);
    const c = cursorLayout(state);
    setAttrs('adp-cur-v', { x1: c.x, x2: c.x });
    setAttrs('adp-cur-h', { x2: c.x, y1: c.y, y2: c.y });
    setAttrs('adp-cur-dot', { cx: c.x, cy: c.y, style: `fill:${c.color}` });
    setAttrs('adp-cur-tag-rect', { x: c.tag.x, y: c.tag.y, width: c.tag.w, height: c.tag.h });
    const text = chart.querySelector<SVGTextElement>('#adp-cur-tag-text');
    if (text) {
      text.setAttribute('x', String(c.tag.x + 9));
      text.setAttribute('y', String(c.tag.y + c.tag.h - 8));
      text.setAttribute('font-size', String(g.fs));
      text.textContent = c.label;
    }
  }

  function readout(): void {
    const r = readCurve(state);
    const who = `${r.pos}${r.rank}`;
    outPos.textContent = r.pos;
    outRank.textContent = String(r.rank);
    outPick.textContent = r.beyond ? `past pick ${LAST_PICK}` : `pick ${r.pick}`;
    outRound.textContent = r.beyond
      ? `After round ${ROUNDS}, the end of a ${ROUNDS}-round draft`
      : `Round ${r.round}, pick ${r.slot} in a ${TEAMS}-team league`;
    outNote.textContent =
      r.kind === 'anchor'
        ? `${who} is one of the curve's anchors, so this value is stated, not interpolated.`
        : r.kind === 'beyond'
          ? `Past the last anchor (${r.pos}${r.lo}), so the curve extends the final segment's slope.`
          : `Interpolated in log-log space between the ${r.pos}${r.lo} and ${r.pos}${r.hi} anchors.`;
    outVal.textContent = String(r.rank);
    root.style.setProperty('--c', SERIES_COLOR[state.selected]);
    root.dataset.pos = state.selected;
    root.dataset.superflex = String(state.superflex);
    posBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pos === state.selected)));
    slider.max = String(MAX_RANK[state.selected]);
    if (slider.value !== String(state.rank)) slider.value = String(state.rank);
    slider.setAttribute('aria-valuetext', `${who}, ${r.beyond ? `past pick ${LAST_PICK}` : `pick ${r.pick}`}`);
  }

  function render(): void {
    chart.innerHTML = adpChart(state);
    readout();
  }

  function setRank(rank: number): void {
    const r = clamp(Math.round(rank), 1, MAX_RANK[state.selected]);
    if (r === state.rank) return;
    state.rank = r;
    placeCursor();
    readout();
  }

  function select(pos: Pos, rank = state.rank): void {
    state.selected = pos;
    state.rank = clamp(rank, 1, MAX_RANK[pos]);
    render();
  }

  slider.addEventListener('input', () => setRank(Number(slider.value)));
  posBtns.forEach((b) => b.addEventListener('click', () => { if (isPos(b.dataset.pos)) select(b.dataset.pos); }));
  sfx.addEventListener('change', () => { state.superflex = sfx.checked; render(); });
  mq.addEventListener('change', () => { state.narrow = mq.matches; render(); });

  const pointerAt = (ev: MouseEvent): { rank: number; yv: number } | null => {
    const svg = chart.querySelector('svg');
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const g = geometry(state.narrow);
    const sc = scales(g);
    const xv = ((ev.clientX - box.left) / box.width) * g.W;
    const yv = ((ev.clientY - box.top) / box.height) * g.H;
    return { rank: sc.rankAt(xv), yv };
  };

  chart.addEventListener('pointermove', (ev: PointerEvent) => {
    if (ev.pointerType === 'touch') return;
    const p = pointerAt(ev);
    if (p) setRank(p.rank);
  });

  chart.addEventListener('click', (ev: MouseEvent) => {
    const p = pointerAt(ev);
    if (!p) return;
    const sc = scales(geometry(state.narrow));
    const rank = clamp(Math.round(p.rank), 1, 60);
    // A click near another curve selects that position; otherwise it just sets the rank.
    let best: { pos: Pos; dist: number } | null = null;
    for (const pos of POSITIONS) {
      if (rank > MAX_RANK[pos]) continue;
      const pick = curveFor(pos)(rank);
      if (pick > LAST_PICK) continue;
      const dist = Math.abs(sc.sy(pick) - p.yv);
      if (!best || dist < best.dist) best = { pos, dist };
    }
    if (best && best.dist <= 22 && best.pos !== state.selected) select(best.pos, rank);
    else setRank(rank);
  });

  render();
}

document.addEventListener('astro:page-load', init);

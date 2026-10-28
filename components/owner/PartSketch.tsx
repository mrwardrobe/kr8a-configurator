import type { PanelPart } from '../../lib/componentOrders';

export default function PartSketch({ part }: { part: PanelPart }) {
  const edge = (value: string) => !value.trim() ? '#b6afa4' : value.toLowerCase().trim() === 'none' ? '#b6afa4' : '#2b3a31';
  return <figure className="part-sketch"><svg viewBox="0 0 340 210" role="img" aria-label={`${part.label || 'Panel'}: finished length ${part.length} mm, width ${part.width} mm. L edges run along the length; W edges run along the width.`}>
    <rect x="64" y="49" width="212" height="112" fill="#e8e0d2" />
    <path d="M64 49H276" stroke={edge(part.edges.length1)} strokeWidth="5" /><path d="M64 161H276" stroke={edge(part.edges.length2)} strokeWidth="5" />
    <path d="M64 49V161" stroke={edge(part.edges.width1)} strokeWidth="5" /><path d="M276 49V161" stroke={edge(part.edges.width2)} strokeWidth="5" />
    <g fill="currentColor" fontSize="10" fontFamily="monospace" textAnchor="middle"><text x="170" y="22">L1 · {part.length || '—'} mm</text><text x="170" y="194">L2 · {part.length || '—'} mm</text><text x="29" y="105" transform="rotate(-90 29 105)">W1 · {part.width || '—'} mm</text><text x="315" y="105" transform="rotate(90 315 105)">W2 · {part.width || '—'} mm</text></g>
    {part.grain === 'length' && <path d="M111 105H229M217 98L229 105L217 112M123 98L111 105L123 112" fill="none" stroke="#6a6259" strokeWidth="1.5" />}
    {part.grain === 'width' && <path d="M170 70V140M163 82L170 70L177 82M163 128L170 140L177 128" fill="none" stroke="#6a6259" strokeWidth="1.5" />}
    {(part.grain === 'none' || part.grain === 'unconfirmed') && <text x="170" y="108" textAnchor="middle" fill="#6a6259" fontSize="11">{part.grain === 'none' ? 'Non-directional finish' : 'Confirm grain direction'}</text>}
  </svg><figcaption>Face view · orientation guide, not a scale drawing.<br />Green edges have a specified edging treatment.</figcaption></figure>;
}

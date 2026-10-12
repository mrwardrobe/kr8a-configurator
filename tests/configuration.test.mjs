import test from 'node:test';
import assert from 'node:assert/strict';
import { BASES, FINISHES, HANDLES, LIMITS, PANEL_MM, bayOptions, bayWidth, decodeConfig, defaultSideboardConfig, designSummary, encodeConfig, normalizeConfig } from '../lib/sideboardEngine.ts';
import { priceDesign } from '../lib/pricing.ts';

test('shared URL retains a fully specified design', () => {
  const design = normalizeConfig({ ...defaultSideboardConfig, width: 1800, fronts: ['D', 'R', 'O'], inside: ['I', 'S', 'V'], shelves: [1, 0, 2], finish: 'walnut', interior: 'chalk', base: 'timber', handle: 'bar' });
  assert.deepEqual(decodeConfig(encodeConfig(design)), design);
  assert.equal(decodeConfig('not-json'), null);
});

test('every offered bay count stays inside the declared prototype proportions', () => {
  for (let width = LIMITS.width.min; width <= LIMITS.width.max; width += LIMITS.width.step) {
    const options = bayOptions(width);
    assert.ok(options.length > 0);
    for (const count of options) {
      const clear = bayWidth(width, count);
      assert.ok(clear >= 350 && clear <= 800);
      assert.equal(Math.round((clear * count + (count + 1) * PANEL_MM) * 1000) / 1000, width);
    }
  }
});

test('unsupported dimensions and fit-outs are normalized before preview or export', () => {
  const design = normalizeConfig({ width: -50, height: 600, depth: 9999, fronts: ['R', 'D', 'O', 'D'], inside: ['I', 'I', 'I', 'V'], shelves: [99, 99, -1, 99], finish: 'imaginary', base: 'imaginary', handle: 'imaginary' });
  assert.equal(design.width, LIMITS.width.min);
  assert.equal(design.depth, LIMITS.depth.max);
  assert.equal(design.fronts.length, 3);
  assert.ok(design.fronts.every(front => front !== 'R'));
  assert.ok(design.inside.every(inside => inside !== 'I'));
  assert.ok(design.shelves.every(count => count >= 0 && count <= 3));
  assert.ok(FINISHES.some(item => item.id === design.finish));
  assert.ok(BASES.some(item => item.id === design.base));
  assert.ok(HANDLES.some(item => item.id === design.handle));
});

test('review summary and pricing status come from the validated design', () => {
  const design = normalizeConfig({ ...defaultSideboardConfig, width: 2200 });
  assert.equal(designSummary(design)[0][1], '2200 × 750 × 450 mm');
  assert.equal(priceDesign(design).status, 'unavailable');
  assert.deepEqual(priceDesign(design, () => ({ amountPence: 123456, rulesVersion: 'test-only' })), { status: 'quoted', currency: 'GBP', amountPence: 123456, rulesVersion: 'test-only' });
  assert.throws(() => priceDesign(design, () => ({ amountPence: -1, rulesVersion: 'bad' })));
});

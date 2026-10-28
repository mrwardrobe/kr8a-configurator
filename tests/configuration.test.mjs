import test from 'node:test';
import assert from 'node:assert/strict';
import { BASES, FINISHES, HANDLES, LIMITS, PANEL_MM, REVEAL_MM, bayOptions, bayWidth, decodeConfig, defaultSideboardConfig, designSummary, encodeConfig, illustrativePrice, normalizeConfig } from '../lib/sideboardEngine.ts';
import { priceDesign } from '../lib/pricing.ts';

test('shared URL retains a fully specified design', () => {
  const design = normalizeConfig({ ...defaultSideboardConfig, width: 1800, fronts: ['D', 'R', 'O'], inside: ['I', 'S', 'V'], shelves: [1, 0, 2], finish: 'walnut', interior: 'chalk', base: 'timber', handle: 'bar' });
  assert.deepEqual(decodeConfig(encodeConfig(design)), design);
  assert.equal(decodeConfig('not-json'), null);
});

test('shared designs retain every shelf offset and base without changing price or summary', () => {
  for (const base of BASES) {
    for (let shelfPosition = -50; shelfPosition <= 50; shelfPosition += 10) {
      const design = normalizeConfig({ ...defaultSideboardConfig, base: base.id, shelfPosition, width: 1800, fronts: ['D', 'R', 'O'], inside: ['I', 'S', 'S'], shelves: [1, 0, 3], light: true });
      const reopened = decodeConfig(encodeConfig(design));
      assert.deepEqual(reopened, design);
      assert.deepEqual(designSummary(reopened), designSummary(design));
      assert.equal(illustrativePrice(reopened), illustrativePrice(design));
    }
  }
});

test('malformed design links are rejected rather than silently becoming a default design', () => {
  const valid = encodeConfig(defaultSideboardConfig);
  for (const invalid of [valid.replace('DDDD', 'XXXX'), valid.replace('SSSS', 'SS'), valid.replace('1111', '9999'), valid.replace('2000', 'oops'), valid.replace('oak', 'imaginary'), Buffer.from('{}').toString('base64url'), Buffer.from('null').toString('base64url'), Buffer.from('[]').toString('base64url')]) {
    assert.equal(decodeConfig(invalid), null, invalid);
  }
  assert.deepEqual(decodeConfig(Buffer.from(JSON.stringify(defaultSideboardConfig)).toString('base64url')), defaultSideboardConfig);
});

test('every offered bay count stays inside the declared prototype proportions', () => {
  for (let width = LIMITS.width.min; width <= LIMITS.width.max; width += LIMITS.width.step) {
    const options = bayOptions(width);
    assert.ok(options.length > 0);
    for (const count of options) {
      const clear = bayWidth(width, count);
      assert.ok(clear >= 350 && clear <= 800);
      assert.equal(Math.round((clear * count + 2 * PANEL_MM + (count + 1) * REVEAL_MM) * 1000) / 1000, width);
    }
  }
});

test('unsupported dimensions and fit-outs are normalized before preview or export', () => {
  const design = normalizeConfig({ width: 2400, height: 600, depth: 9999, fronts: ['R', 'D', 'O'], inside: ['I', 'I', 'I'], shelves: [99, 99, -1], finish: 'imaginary', base: 'imaginary', handle: 'imaginary' });
  assert.equal(design.width, LIMITS.width.max);
  assert.equal(design.depth, LIMITS.depth.max);
  assert.ok(bayOptions(design.width).includes(design.fronts.length));
  assert.ok(design.fronts.every(front => front !== 'R'));
  assert.ok(design.inside.every((inside, index) => inside !== 'I' || design.fronts[index] === 'D'));
  assert.ok(design.shelves.every(count => count >= 0 && count <= 3));
  assert.ok(FINISHES.some(item => item.id === design.finish));
  assert.ok(BASES.some(item => item.id === design.base));
  assert.ok(HANDLES.some(item => item.id === design.handle));
});

test('Claude default share code and illustrative price match the supplied prototype', () => {
  assert.equal(encodeConfig(defaultSideboardConfig), 'K3-2000-750-450-DDDD-SSSS-1111-0-oak-mat-plt-psh-0');
  assert.equal(illustrativePrice(defaultSideboardConfig), 1495);
  assert.deepEqual(decodeConfig(encodeConfig(defaultSideboardConfig)), defaultSideboardConfig);
});

test('prior preview options migrate into the Claude option vocabulary', () => {
  const migrated = normalizeConfig({ ...defaultSideboardConfig, version: 1, finish: 'walnut', interior: 'match', base: 'timber', handle: 'push' });
  assert.equal(migrated.finish, 'wal');
  assert.equal(migrated.interior, 'mat');
  assert.equal(migrated.base, 'leg');
  assert.equal(migrated.handle, 'psh');
});

test('review summary and pricing status come from the validated design', () => {
  const design = normalizeConfig({ ...defaultSideboardConfig, width: 2200 });
  assert.equal(designSummary(design)[0][1], '2200 × 750 × 450 mm');
  assert.equal(priceDesign(design).status, 'unavailable');
  assert.deepEqual(priceDesign(design, () => ({ amountPence: 123456, rulesVersion: 'test-only' })), { status: 'quoted', currency: 'GBP', amountPence: 123456, rulesVersion: 'test-only' });
  assert.throws(() => priceDesign(design, () => ({ amountPence: -1, rulesVersion: 'bad' })));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { approveOrder, blankChecks, designFromInput, isReviewed, materialTotals, newHardware, newOrderJob, newPanel, orderCsv, orderIssues, panelIssues, parseOrderBackup, reviseJob, seedFromDesign, workspaceBackup } from '../lib/componentOrders.ts';
import { defaultSideboardConfig, encodeConfig, normalizeConfig } from '../lib/sideboardEngine.ts';
import { ownerWorkspaceAvailable } from '../lib/ownerAccess.ts';

function checkedPanel(id = 'panel-1') {
  return { ...newPanel(id), label: 'Test panel', length: 1000, width: 500, thickness: 18, material: 'TEST-DECOR TEXTURE', grain: 'length', quantity: 2,
    edges: { length1: 'TEST EDGE 2 mm', length2: 'none', width1: 'TEST EDGE 2 mm', width2: 'none' }, machining: 'none', verified: true };
}
function checkedJob() {
  return { ...newOrderJob('test-job'), title: 'Test order', reference: 'TEST-001', supplier: 'Test supplier', reviewer: 'Test owner', units: 3, panels: [checkedPanel()], checks: { complete: true, dimensions: true, materials: true, supplier: true } };
}

test('panel validation rejects incomplete sizes, quantities, edging, grain and machining', () => {
  assert.ok(panelIssues(newPanel('blank')).length >= 6);
  assert.deepEqual(panelIssues(checkedPanel()), []);
  for (const patch of [{ length: 0 }, { width: NaN }, { thickness: Infinity }, { length: 6000.1 }, { length: 1.25 }, { quantity: 1.5 }, { quantity: 0 }, { quantity: 1001 }, { grain: 'unconfirmed' }, { material: '' }, { edges: { length1: '', length2: 'none', width1: 'none', width2: 'none' } }, { machining: '' }, { verified: false }]) {
    assert.ok(panelIssues({ ...checkedPanel(), ...patch }).length > 0, JSON.stringify(patch));
  }
});

test('batch totals use exact panel area and correct long/short edge lengths, grouped by material and thickness', () => {
  const job = checkedJob();
  const groups = materialTotals(job);
  assert.deepEqual(groups, [{ material: 'TEST-DECOR TEXTURE', thickness: 18, pieces: 6, area: 3, edgedLength: 9 }]);
  const expanded = materialTotals({ ...job, panels: [...job.panels, { ...checkedPanel('back'), thickness: 9 }, { ...checkedPanel('other'), material: 'OTHER' }] });
  assert.equal(expanded.length, 3);
  assert.equal(expanded.reduce((n, g) => n + g.pieces, 0), 18);
  assert.equal(materialTotals({ ...job, units: 0 }).length, 0);
});

test('reviewed exports require a complete current review and owner attribution', () => {
  const job = checkedJob();
  assert.deepEqual(orderIssues(job), []);
  assert.throws(() => orderCsv(job, true));
  const approved = approveOrder(job, '2026-10-28T12:00:00.000Z');
  assert.equal(isReviewed(approved), true);
  const csv = orderCsv(approved, true);
  assert.match(csv, /OWNER REVIEWED/);
  assert.match(csv, /FINISHED PANEL SIZES/);
  assert.match(csv, /"Test owner"/);
  assert.match(csv, /"2","6","1000","500","18"/);
  assert.equal(isReviewed({ ...approved, reviewer: 'Another owner' }), false);
  assert.equal(isReviewed({ ...approved, approval: { ...approved.approval, at: 'invalid' } }), false);
  assert.throws(() => approveOrder({ ...job, checks: blankChecks() }, '2026-10-28T12:00:00Z'));
  assert.throws(() => approveOrder({ ...job, units: 0 }, '2026-10-28T12:00:00Z'));
  assert.throws(() => approveOrder({ ...job, supplier: '' }, '2026-10-28T12:00:00Z'));
});

test('editing a reviewed project invalidates approval and clears review checks', () => {
  const approved = approveOrder(checkedJob(), '2026-10-28T12:00:00Z');
  for (const patch of [{ units: 4 }, { notes: 'Updated machining reference' }, { supplier: 'Another supplier' }, { panels: [{ ...approved.panels[0], width: 450 }] }]) {
    const edited = reviseJob(approved, patch);
    assert.equal(edited.revision, approved.revision + 1);
    assert.equal(edited.approval, null);
    assert.deepEqual(edited.checks, blankChecks());
    assert.throws(() => orderCsv(edited, true));
  }
});

test('hardware lines use supplier codes and multiply quantities without panel dimensions', () => {
  const job = { ...checkedJob(), hardware: [{ ...newHardware('hinge'), label: 'Test hinge', code: 'TEST-HINGE', quantity: 4, verified: true }] };
  assert.deepEqual(orderIssues(job), []);
  const csv = orderCsv(approveOrder(job, '2026-10-28T12:00:00Z'), true);
  assert.match(csv, /"Hardware","Test hinge","4","12","","","","TEST-HINGE"/);
  assert.ok(orderIssues({ ...job, hardware: [{ ...job.hardware[0], code: '' }] }).length > 0);
});

test('design imports seed only provisional carcass parts and retain signed shelf offsets', () => {
  const config = normalizeConfig({ ...defaultSideboardConfig, shelfPosition: -40 });
  const code = encodeConfig(config);
  assert.deepEqual(designFromInput(code), config);
  assert.deepEqual(designFromInput(`https://kr8a.com/configurator?c=${code}`), config);
  assert.deepEqual(designFromInput(JSON.stringify({ document: 'KR8A design brief', config })), config);
  assert.equal(designFromInput(JSON.stringify({ document: 'KR8A design brief', config: {} })), null);
  assert.equal(designFromInput('https://example.com/no-design'), null);
  assert.equal(designFromInput('not a design'), null);
  const job = seedFromDesign(config, 'imported');
  assert.equal(job.source.kind, 'prototype');
  assert.equal(job.source.code, code);
  assert.match(job.source.note, /Incomplete/);
  assert.ok(job.panels.length > 0);
  assert.ok(job.panels.every(p => !p.verified && !p.material));
  assert.throws(() => orderCsv(job, true));
  assert.match(orderCsv(job), /DRAFT — DO NOT ORDER/);
});

test('CSV exports quote delimiters/newlines and defuse formula injection in owner-entered cells', () => {
  for (const dangerous of ['=IMPORTXML("url")', '+SUM(1,2)', '-1+1', '@SUM(1)', '  =HYPERLINK("url")', '\t=1+1', '\r=1+1']) {
    const csv = orderCsv({ ...checkedJob(), title: dangerous });
    assert.ok(csv.includes('"\''), dangerous);
    assert.ok(!csv.includes(`,"${dangerous.replaceAll('"', '""')}",`), dangerous);
  }
  const csv = orderCsv({ ...checkedJob(), notes: 'A "quoted", note\nNext line' });
  assert.match(csv, /"A ""quoted"", note\nNext line"/);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
});

test('backups retain specifications but cannot import trusted approval or row checks', () => {
  const job = approveOrder(checkedJob(), '2026-10-28T12:00:00Z');
  const restored = parseOrderBackup(workspaceBackup([job]));
  assert.equal(restored.length, 1);
  assert.equal(restored[0].panels[0].length, 1000);
  assert.equal(restored[0].panels[0].material, 'TEST-DECOR TEXTURE');
  assert.equal(restored[0].panels[0].verified, false);
  assert.equal(restored[0].approval, null);
  assert.deepEqual(restored[0].checks, blankChecks());
  assert.equal(restored[0].revision, job.revision + 1);
  assert.throws(() => parseOrderBackup('{}'));
  assert.throws(() => parseOrderBackup(workspaceBackup([job, job])));
  assert.throws(() => parseOrderBackup(workspaceBackup([{ ...job, panels: [checkedPanel(), checkedPanel()] }])));
  assert.throws(() => parseOrderBackup('x'.repeat(2_000_001)));
});

test('owner workspace is absent from production and unknown environments until owner authentication exists', () => {
  assert.equal(ownerWorkspaceAvailable('preview', 'production'), true);
  assert.equal(ownerWorkspaceAvailable(undefined, 'development'), true);
  for (const env of ['production', 'development', 'staging', 'untrusted']) assert.equal(ownerWorkspaceAvailable(env, 'production'), false);
  assert.equal(ownerWorkspaceAvailable('production', 'development'), false);
  assert.equal(ownerWorkspaceAvailable(undefined, 'production'), false);
});

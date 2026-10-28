import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfiguratorSession, writeDraft, DRAFT_KEY, SAVED_KEY } from '../lib/configuratorStorage.ts';
import { defaultSideboardConfig, normalizeConfig, encodeConfig } from '../lib/sideboardEngine.ts';

const memoryStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const restricted = { getItem() { throw new Error('Unavailable'); }, setItem() { throw new Error('Quota exceeded'); } };

test('shared designs open even when storage is blocked or missing', () => {
  const design = normalizeConfig({ ...defaultSideboardConfig, width: 1800, shelfPosition: -30, finish: 'wal' });
  for (const storage of [restricted, null]) {
    const session = readConfiguratorSession(storage, encodeConfig(design));
    assert.deepEqual(session.config, design);
    assert.equal(session.storageAvailable, false);
    assert.equal(session.invalidLink, false);
    assert.equal(writeDraft(storage, design, 'Bedroom'), false);
  }
});

test('drafts retain the design and its name and migrate existing config-only drafts', () => {
  const storage = memoryStorage();
  const design = normalizeConfig({ ...defaultSideboardConfig, depth: 350 });
  storage.setItem(DRAFT_KEY, JSON.stringify(design));
  assert.deepEqual(readConfiguratorSession(storage, null).config, design);
  assert.equal(writeDraft(storage, design, 'My alcove'), true);
  const restored = readConfiguratorSession(storage, null);
  assert.equal(restored.name, 'My alcove');
  assert.deepEqual(restored.config, design);
});

test('shared links take precedence over local drafts; invalid links start a new design', () => {
  const storage = memoryStorage();
  writeDraft(storage, normalizeConfig({ ...defaultSideboardConfig, width: 1200 }), 'Local design');
  const shared = readConfiguratorSession(storage, encodeConfig(defaultSideboardConfig));
  assert.deepEqual(shared.config, defaultSideboardConfig);
  assert.equal(shared.name, '');
  const invalid = readConfiguratorSession(storage, 'broken-link');
  assert.deepEqual(invalid.config, defaultSideboardConfig);
  assert.equal(invalid.invalidLink, true);
  writeDraft(storage, defaultSideboardConfig, 'Same design on this device');
  assert.equal(readConfiguratorSession(storage, encodeConfig(defaultSideboardConfig)).name, 'Same design on this device');
});

test('corrupt draft data does not prevent recovery of independently saved designs', () => {
  const storage = memoryStorage();
  storage.setItem(DRAFT_KEY, '{broken');
  storage.setItem(SAVED_KEY, JSON.stringify([null, {}, { name: 'Saved piece', config: defaultSideboardConfig, savedAt: '2026-10-28' }]));
  const session = readConfiguratorSession(storage, null);
  assert.equal(session.savedDesigns.length, 1);
  assert.equal(session.savedDesigns[0].name, 'Saved piece');
  assert.deepEqual(session.savedDesigns[0].config, defaultSideboardConfig);
  assert.equal(writeDraft(storage, defaultSideboardConfig, 'Recovered'), true);
});

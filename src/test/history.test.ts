import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager } from '@/history/HistoryManager';

describe('HistoryManager', () => {
  let hm: HistoryManager;

  beforeEach(() => {
    hm = new HistoryManager();
  });

  it('starts with empty history and cannot undo or redo', () => {
    expect(hm.canUndo()).toBe(false);
    expect(hm.canRedo()).toBe(false);
    expect(hm.getCurrentIndex()).toBe(-1);
  });

  it('pushes commands and updates undo availability', () => {
    let value = 0;
    hm.push({
      id: 'cmd1',
      type: 'draw',
      description: 'Draw 1',
      timestamp: Date.now(),
      undo: () => {
        value = 0;
      },
      redo: () => {
        value = 1;
      },
    });

    expect(hm.canUndo()).toBe(true);
    expect(hm.canRedo()).toBe(false);
    expect(hm.getCurrentIndex()).toBe(0);
  });

  it('correctly executes undo and redo operations', async () => {
    let value = 10;
    hm.push({
      id: 'cmd1',
      type: 'layer_property',
      description: 'Set Value to 20',
      timestamp: Date.now(),
      undo: () => {
        value = 10;
      },
      redo: () => {
        value = 20;
      },
    });

    value = 20;
    await hm.undo();
    expect(value).toBe(10);
    expect(hm.canUndo()).toBe(false);
    expect(hm.canRedo()).toBe(true);

    await hm.redo();
    expect(value).toBe(20);
    expect(hm.canUndo()).toBe(true);
    expect(hm.canRedo()).toBe(false);
  });

  it('supports jumpToIndex to travel back and forward in time', async () => {
    let state = 0;

    hm.push({
      id: '1',
      type: 'draw',
      description: 'State 1',
      timestamp: Date.now(),
      undo: () => { state = 0; },
      redo: () => { state = 1; },
    });
    state = 1;

    hm.push({
      id: '2',
      type: 'draw',
      description: 'State 2',
      timestamp: Date.now(),
      undo: () => { state = 1; },
      redo: () => { state = 2; },
    });
    state = 2;

    // Jump back to initial state
    await hm.jumpToIndex(-1);
    expect(state).toBe(0);

    // Jump forward to state 2
    await hm.jumpToIndex(1);
    expect(state).toBe(2);
  });
});

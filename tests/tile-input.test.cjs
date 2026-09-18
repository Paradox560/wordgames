const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseTilePaste, pasteTiles, tilesComplete, nextTile, previousEmptyTile, pasteWordle, wordleComplete, numbwordComplete } = require('../.test-build/tile-input.js');
const empty = count => Array(count).fill('');
const guess = (word = '', colors = Array(5).fill('unknown')) => ({ letters: word ? [...word] : empty(5), colors });

test('a typed letter advances to the next tile, including the next row', () => {
  assert.equal(nextTile(0, 16), 1);
  assert.equal(nextTile(3, 16), 4);
  assert.equal(nextTile(15, 16), 15);
});
test('empty Backspace moves backward without erasing the preceding tile', () => {
  const values = ['A', '', 'B', ''];
  assert.equal(previousEmptyTile(values, 1), 0);
  assert.equal(previousEmptyTile(values, 2), null);
  assert.equal(previousEmptyTile(values, 3), 2);
  assert.equal(previousEmptyTile(empty(4), 0), null);
  assert.deepEqual(values, ['A', '', 'B', '']);
});
test('a full rack pastes from the beginning even when the last tile is focused', () => {
  const pasted = pasteTiles(empty(6), 5, 'p l a n e t');
  assert.deepEqual(pasted.values, [...'PLANET']);
  assert.equal(pasted.focus, 5);
});
test('partial rack paste starts at the focused tile and preserves the rest', () => {
  const pasted = pasteTiles(['A', '', '', 'D', 'E', 'F'], 1, 'bc');
  assert.deepEqual(pasted.values, [...'ABCDEF']);
  assert.equal(pasted.focus, 3);
});
test('a full row fills the current row, regardless of focused column', () => {
  const pasted = pasteTiles(empty(16), 6, 'word', { rowLength: 4 });
  assert.deepEqual(pasted.values, [...empty(4), ...'WORD', ...empty(8)]);
  assert.equal(pasted.focus, 8);
});
test('whole grids paste in reading order in all supported dimensions', () => {
  for (const size of [3, 4, 5]) {
    const text = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.slice(0, size * size);
    const rows = Array.from({ length: size }, (_, row) => text.slice(row * size, (row + 1) * size));
    const pasted = pasteTiles(empty(size * size), size * size - 1, rows.join('\n'), { rowLength: size });
    assert.deepEqual(pasted.values, [...text]);
    assert.equal(pasted.focus, size * size - 1);
  }
});
test('spaces, tabs, commas, pipes and semicolons are accepted separators', () => {
  assert.deepEqual(parseTilePaste(' a,b; c|d\te\nf '), [...'ABCDEF']);
});
test('invalid paste content is rejected rather than silently removed', () => {
  for (const value of ['', ' , ; ', 'AB3D', 'AB-DC', 'CAFÉ', 'ABC!', 'ABC😀']) {
    assert.throws(() => parseTilePaste(value));
  }
});
test('overlong and overflowing pastes do not modify any tiles', () => {
  const original = [...'ABCDEF'];
  assert.throws(() => pasteTiles(original, 0, 'ABCDEFG'));
  assert.throws(() => pasteTiles(original, 5, 'XY'));
  assert.deepEqual(original, [...'ABCDEF']);
});
test('duplicate letters remain available for racks and word grids', () => {
  assert.deepEqual(pasteTiles(empty(6), 0, 'LETTER').values, [...'LETTER']);
  assert.equal(tilesComplete([...'LETTER']), true);
});
test('Spelling Bee and Letter Boxed reject duplicate letter pastes atomically', () => {
  const original = empty(7);
  assert.throws(() => pasteTiles(original, 0, 'LETTERS', { unique: true }));
  assert.deepEqual(original, empty(7));
  assert.equal(tilesComplete([...'LETTERS'], { unique: true }), false);
});
test('complete Bee boards preserve center-first order', () => {
  assert.deepEqual(pasteTiles(empty(7), 6, 'ACDEILN', { unique: true }).values, [...'ACDEILN']);
});
test('Letter Boxed supports one side and the entire square', () => {
  assert.deepEqual(pasteTiles(empty(12), 4, 'LSH', { rowLength: 3, unique: true }).values.slice(3, 6), [...'LSH']);
  assert.deepEqual(pasteTiles(empty(12), 10, 'BKT LSH AMP CIR', { rowLength: 3, unique: true }).values, [...'BKTLSHAMPCIR']);
});
test('Quartiles pastes fragments without splitting them into letters', () => {
  const pasted = pasteTiles(empty(20), 6, 'in ter nat ional', { maxLength: 5, rowLength: 4 });
  assert.deepEqual(pasted.values.slice(4, 8), ['IN', 'TER', 'NAT', 'IONAL']);
  assert.equal(pasted.focus, 8);
});
test('Quartiles supports twenty fragments and rejects oversized fragments', () => {
  const fragments = Array.from({ length: 20 }, (_, i) => String.fromCharCode(65 + i));
  assert.deepEqual(pasteTiles(empty(20), 19, fragments.join(' '), { maxLength: 5, rowLength: 4 }).values, fragments);
  assert.throws(() => pasteTiles(empty(20), 0, 'toolong', { maxLength: 5 }));
});
test('Weaver pastes a whole pair or an individual word', () => {
  assert.deepEqual(pasteTiles(['COLD', ''], 1, 'warm', { maxLength: 4 }).values, ['COLD', 'WARM']);
  assert.deepEqual(pasteTiles(empty(2), 1, 'stone\nshore', { maxLength: 5 }).values, ['STONE', 'SHORE']);
});
test('submission waits for every required tile, with the correct length', () => {
  assert.equal(tilesComplete([]), false);
  assert.equal(tilesComplete(['A', '', 'C']), false);
  assert.equal(tilesComplete(['A', '2', 'C']), false);
  assert.equal(tilesComplete(['A', 'BC', 'D']), false);
  assert.equal(tilesComplete(['IN', 'TER', 'A'], { maxLength: 5 }), true);
  assert.equal(tilesComplete(['COLD', 'WAR'], { minLength: 4, maxLength: 4 }), false);
  assert.equal(tilesComplete(['COLD', 'WARM'], { minLength: 4, maxLength: 4 }), true);
});
test('resetting or resizing a grid produces an incomplete board', () => {
  for (const length of [6, 7, 8, 9, 12, 16, 20, 25]) assert.equal(tilesComplete(empty(length)), false);
});
test('Wordle single-word paste fills the focused guess only', () => {
  const pasted = pasteWordle([[...'CRANE'], empty(5)], 1, 4, 'alley');
  assert.deepEqual(pasted.values, [[...'CRANE'], [...'ALLEY']]);
});
test('Wordle supports partial-letter paste and rejects row overflow', () => {
  assert.deepEqual(pasteWordle([[...'CRANE']], 0, 1, 'oo').values, [[...'COONE']]);
  assert.throws(() => pasteWordle([empty(5)], 0, 4, 'ab'));
});
test('Wordle whole-grid paste creates rows and replaces the existing board', () => {
  const pasted = pasteWordle([[...'OLDEN'], [...'STALE'], [...'CRANE']], 2, 3, 'alley\napple');
  assert.deepEqual(pasted.values, [[...'ALLEY'], [...'APPLE']]);
  assert.equal(pasted.row, 1);
  assert.equal(pasted.column, 4);
});
test('Wordle supports six guesses and rejects excessive or incomplete grids', () => {
  assert.equal(pasteWordle([empty(5)], 0, 0, Array(6).fill('CRANE').join('\n')).values.length, 6);
  assert.throws(() => pasteWordle([empty(5)], 0, 0, Array(7).fill('CRANE').join('\n')));
  assert.throws(() => pasteWordle([empty(5)], 0, 0, 'CRANES'));
});
test('Wordle waits for letters and all feedback colors', () => {
  assert.equal(wordleComplete([guess()]), false);
  assert.equal(wordleComplete([guess('APPLE')]), false);
  assert.equal(wordleComplete([guess('APPLE', ['green', 'yellow', 'gray', 'yellow', 'gray'])]), true);
  assert.equal(wordleComplete([guess('APPL', Array(5).fill('green'))]), false);
  assert.equal(wordleComplete([guess('APPLE', Array(5).fill('blue'))]), false);
});
test('Wordle ignores empty optional rows but blocks partial guesses', () => {
  const full = guess('APPLE', Array(5).fill('green'));
  assert.equal(wordleComplete([full, guess()]), true);
  assert.equal(wordleComplete([full, { letters: ['A', '', '', '', ''], colors: Array(5).fill('gray') }]), false);
  assert.equal(wordleComplete(Array(7).fill(full)), false);
});
test('Numbword allows score-only searches in every length mode', () => {
  for (const length of [4, 5, 6]) {
    assert.equal(numbwordComplete(length, '', '', ''), false);
    assert.equal(numbwordComplete(length, '50', '', ''), true);
    assert.equal(numbwordComplete(length, String(length), '', ''), true);
    assert.equal(numbwordComplete(length, String(26 * length), '', ''), true);
  }
});
test('Numbword blocks invalid totals and contradictory optional clues', () => {
  for (const total of ['4', '131', '50.5', 'no', 'Infinity']) assert.equal(numbwordComplete(5, total, '', ''), false);
  assert.equal(numbwordComplete(5, '50', 'AP', 'ST'), true);
  assert.equal(numbwordComplete(5, '50', 'P', 'P'), false);
  assert.equal(numbwordComplete(5, '50', 'ABCDEF', ''), false);
  assert.equal(numbwordComplete(5, '50', 'A P', ''), false);
  assert.equal(numbwordComplete(5, '50', 'AAAAAA', ''), true);
});

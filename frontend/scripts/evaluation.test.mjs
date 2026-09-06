import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const evaluation = JSON.parse(readFileSync(new URL('../data/evaluation.json', import.meta.url), 'utf8'));
const sum = (values) => values.reduce((total, value) => total + value, 0);
const rounded = (value) => Number(value.toFixed(4));

test('the matrix has eight balanced classes and 800 test records', () => {
  const { classMetrics: classes, confusionMatrix: matrix, recordCount } = evaluation;
  assert.equal(classes.length, 8);
  assert.equal(new Set(classes.map((item) => item.category)).size, 8);
  assert.equal(matrix.length, classes.length);
  matrix.forEach((row, i) => {
    assert.equal(row.length, classes.length);
    assert.ok(row.every((value) => Number.isInteger(value) && value >= 0));
    assert.equal(sum(row), classes[i].support);
    assert.equal(classes[i].support, 100);
  });
  assert.equal(sum(matrix.flat()), recordCount);
  assert.equal(recordCount, evaluation.protocol.test);
});

test('all displayed test metrics agree with the confusion matrix', () => {
  const matrix = evaluation.confusionMatrix;
  const scores = evaluation.classMetrics.map((item, i) => {
    const precision = matrix[i][i] / sum(matrix.map((row) => row[i]));
    const recall = matrix[i][i] / sum(matrix[i]);
    const f1 = 2 * precision * recall / (precision + recall);
    assert.equal(rounded(precision), item.precision, item.category + ' precision');
    assert.equal(rounded(recall), item.recall, item.category + ' recall');
    assert.equal(rounded(f1), item.f1, item.category + ' F1');
    return f1;
  });
  assert.equal(sum(matrix.map((row, i) => row[i])), 540);
  assert.equal(sum(matrix.map((row, i) => row[i])) / evaluation.recordCount, evaluation.accuracy);
  assert.equal(rounded(sum(scores) / scores.length), evaluation.macroF1);
  const weighted = sum(scores.map((f1, i) => f1 * evaluation.classMetrics[i].support)) / evaluation.recordCount;
  assert.equal(rounded(weighted), evaluation.weightedF1);
});

test('selection is distinct from highest validation score and test results', () => {
  const models = evaluation.validationModels;
  assert.equal(models.length, 8);
  assert.deepEqual(models.filter((model) => model.selected).map((model) => model.id), ['scibert-plus']);
  const best = [...models].sort((a, b) => b.macroF1 - a.macroF1)[0];
  assert.equal(best.id, 'ensemble');
  assert.equal(best.selected, false);
  assert.equal(evaluation.modelAlias, 'champion');
  assert.equal(evaluation.protocol.testEvaluations, 1);
  assert.ok(models.every((model) => model.macroF1 >= 0 && model.macroF1 <= 1 && model.accuracy >= 0 && model.accuracy <= 1));
});

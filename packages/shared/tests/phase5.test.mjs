import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJobPath } from '../src/storage/pathBuilder.js';

test('build storage job path', ()=>{ assert.equal(buildJobPath('/tmp','p1','j1'), '/tmp/projects/p1/jobs/j1'); });

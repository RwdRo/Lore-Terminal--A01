import { describe, it, expect } from 'vitest';
import { loreToIndex } from './loreIndex.js';

describe('loreToIndex', () => {
  it('should return an empty index for empty content', () => {
    const content = '';
    const index = loreToIndex(content);
    expect(index.size).toBe(0);
  });

  it('should correctly index a single entry', () => {
    const content = '# Chapter 1\n\nOnce upon a time...';
    const index = loreToIndex(content);
    expect(index.size).toBe(1);
    expect(index.get('chapter-1')).toEqual({ title: 'Chapter 1', content: '\n\nOnce upon a time...' });
  });

  it('should correctly index multiple entries', () => {
    const content = '# Chapter 1\n\nContent 1\n\n# Chapter 2\n\nContent 2';
    const index = loreToIndex(content);
    expect(index.size).toBe(2);
    expect(index.get('chapter-1')).toEqual({ title: 'Chapter 1', content: '\n\nContent 1' });
    expect(index.get('chapter-2')).toEqual({ title: 'Chapter 2', content: '\n\nContent 2' });
  });

  it('should handle different heading levels', () => {
    const content = '## Sub-chapter 1\n\nContent 1.1';
    const index = loreToIndex(content);
    expect(index.size).toBe(1);
    expect(index.get('sub-chapter-1')).toEqual({ title: 'Sub-chapter 1', content: '\n\nContent 1.1' });
  });
});

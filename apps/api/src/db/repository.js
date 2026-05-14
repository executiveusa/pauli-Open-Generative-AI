/**
 * In-memory repository with optional JSON persistence.
 * MVP: in-memory Maps. Swap out for SQLite/Postgres later via same interface.
 */

import { writeJson, readJson, deleteJson } from '../storage/local.js';

class Repository {
  constructor(name) {
    this._name = name;
    this._store = new Map();
  }

  async put(id, value) {
    this._store.set(id, value);
    writeJson(`db/${this._name}/${id}.json`, value).catch(err => {
      console.error(`[repository] Failed to persist ${this._name}/${id}:`, err.message);
    });
    return value;
  }

  async get(id) {
    if (this._store.has(id)) return this._store.get(id);
    // Try disk on cold start
    const v = await readJson(`db/${this._name}/${id}.json`);
    if (v) this._store.set(id, v);
    return v ?? null;
  }

  async list(filterFn = null) {
    const all = [...this._store.values()];
    return filterFn ? all.filter(filterFn) : all;
  }

  async patch(id, updates) {
    const existing = await this.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    return this.put(id, updated);
  }

  async delete(id) {
    deleteJson(`db/${this._name}/${id}.json`).catch(() => {});
    return this._store.delete(id);
  }
}

export const projects    = new Repository('projects');
export const assets      = new Repository('assets');
export const characters  = new Repository('characters');
export const jobs        = new Repository('jobs');
export const artifacts   = new Repository('artifacts');

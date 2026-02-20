// AppStorage.js
// IndexedDB-backed storage wrapper with scopes (app/company/location),
// hierarchical keys, versioning+migrations, TTLs, batching, and defaults helpers.
// Uses #private methods/fields BUT avoids cross-class private access by exposing
// internal bridge methods (getRecordInternal/putRecordInternal/deleteRecordInternal).

export default class AppStorage {
    constructor({
        dbName = "cmsStorage",
        namespace = "cms",
        dbVersion = 2,
    } = {}) {
        this.dbName = dbName;
        this.namespace = namespace;
        this.dbVersion = dbVersion;

        /** @type {IDBDatabase|null} */
        this.db = null;
    }

    /* ================= Scopes ================= */

    app() {
        return new ScopedStore(this, this.#makeKey("app", "root"));
    }

    company(companyID) {
        if (companyID == null || companyID === "") {
            throw new Error("companyID is required");
        }
        return new ScopedStore(this, this.#makeKey("company", "root", { companyID }));
    }

    location(companyID, locationID) {
        if (companyID == null || companyID === "") {
            throw new Error("companyID is required");
        }
        if (locationID == null || locationID === "") {
            throw new Error("locationID is required");
        }
        return new ScopedStore(
            this,
            this.#makeKey("location", "root", { companyID, locationID })
        );
    }

    /* ================= DB lifecycle ================= */

    async open() {
        if (this.db) return this.db;

        this.db = await new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, this.dbVersion);

            req.onupgradeneeded = (event) => {
                this.#runMigrations(req.result, req.transaction, event.oldVersion);
            };

            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        // Best-effort cleanup on open
        try {
            await this.cleanupExpired();
        } catch { }

        return this.db;
    }

    close() {
        if (this.db) this.db.close();
        this.db = null;
    }

    /* ================= Public maintenance ================= */

    async cleanupExpired({ limit = 500 } = {}) {
        const db = await this.open();
        const now = Date.now();

        const tx = db.transaction("kv", "readwrite");
        const store = tx.objectStore("kv");
        const index = store.index("byExpiresAt");

        let deleted = 0;

        await new Promise((resolve, reject) => {
            const req = index.openCursor(IDBKeyRange.upperBound(now));
            req.onerror = () => reject(req.error);
            req.onsuccess = (e) => {
                const cursor = e.target.result;
                if (!cursor || deleted >= limit) return resolve();
                cursor.delete();
                deleted++;
                cursor.continue();
            };
        });

        await idbTxDone(tx);
        return deleted;
    }

    /* ================= Internal bridge methods ================= */
    // These allow ScopedStore (a different class) to perform DB ops without
    // violating #private access rules. Treat as internal, not part of your public API.

    async getRecordInternal(id) {
        return await this.#getRecord(id);
    }

    async putRecordInternal(record) {
        return await this.#putRecord(record);
    }

    async deleteRecordInternal(id) {
        return await this.#deleteRecord(id);
    }

    /* ================= Private: migrations ================= */

    #runMigrations(db, tx, oldVersion) {
        // v1: create stores + expiresAt index
        if (oldVersion < 1) {
            const kv = db.createObjectStore("kv", { keyPath: "id" });
            kv.createIndex("byExpiresAt", "expiresAt", { unique: false });

            const meta = db.createObjectStore("meta", { keyPath: "key" });
            meta.put({ key: "schemaVersion", value: 1, updatedAt: Date.now() });
        }

        // v2: ensure expiresAt index exists + bump schemaVersion
        if (oldVersion < 2) {
            const kv = tx.objectStore("kv");
            if (!kv.indexNames.contains("byExpiresAt")) {
                kv.createIndex("byExpiresAt", "expiresAt", { unique: false });
            }
            tx.objectStore("meta").put({
                key: "schemaVersion",
                value: 2,
                updatedAt: Date.now(),
            });
        }

        // Future migrations:
        // if (oldVersion < 3) { ... }
    }

    /* ================= Private: root ops ================= */

    async #getRecord(id) {
        const db = await this.open();
        const tx = db.transaction("kv", "readonly");
        const store = tx.objectStore("kv");
        return await idbRequestToPromise(store.get(id));
    }

    async #putRecord(record) {
        const db = await this.open();
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(record);
        await idbTxDone(tx);
    }

    async #deleteRecord(id) {
        const db = await this.open();
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").delete(id);
        await idbTxDone(tx);
    }

    #makeKey(scope, rootKey, { companyID, locationID } = {}) {
        const ns = this.namespace;

        if (scope === "app") return `${ns}::app::${rootKey}`;
        if (scope === "company") return `${ns}::company::${String(companyID)}::${rootKey}`;
        if (scope === "location") {
            return `${ns}::location::${String(companyID)}::${String(locationID)}::${rootKey}`;
        }

        throw new Error(`Unknown scope: ${scope}`);
    }
}

/* ================= Scoped Store ================= */

class ScopedStore {
    #root;
    #id;

    #batch = null; // { record, dirty }
    #subscribers = new Set();

    constructor(root, id) {
        this.#root = root;
        this.#id = id;
    }

    subscribe(fn) {
        if (typeof fn !== "function") throw new Error("subscribe(fn): fn must be a function");
        this.#subscribers.add(fn);
        return () => this.#subscribers.delete(fn);
    }

    /* ---------- Reads ---------- */

    async get(path, defaultValue) {
        const record = await this.#getLiveRecord();
        const obj = record?.value ?? {};
        if (!path) return obj;

        const v = getByPath(obj, path);
        return v === undefined ? defaultValue : v;
    }

    async has(path) {
        const record = await this.#getLiveRecord();
        if (!record) return false;
        if (!path) return true;
        return hasByPath(record.value, path);
    }

    /* ---------- Writes ---------- */

    async set(path, value, { ttlMs } = {}) {
        if (!path) throw new Error("set(path, value): path is required");

        const record = await this.#getOrCreateRecord();
        setByPath(record.value, path, value);

        record.updatedAt = Date.now();
        if (ttlMs != null) record.expiresAt = Date.now() + Math.max(0, ttlMs);

        await this.#commit(record);
        return value;
    }

    async merge(path, patchObj, { ttlMs } = {}) {
        if (!path) throw new Error("merge(path, patchObj): path is required");
        if (!patchObj || typeof patchObj !== "object") return;

        const record = await this.#getOrCreateRecord();
        const current = getByPath(record.value, path);
        const base = isPlainObject(current) ? current : {};
        const merged = deepMerge(base, patchObj);

        setByPath(record.value, path, merged);

        record.updatedAt = Date.now();
        if (ttlMs != null) record.expiresAt = Date.now() + Math.max(0, ttlMs);

        await this.#commit(record);
        return merged;
    }

    async delete(path) {
        if (!path) {
            await this.clear();
            return true;
        }

        const record = await this.#getLiveRecord();
        if (!record) return false;

        const did = deleteByPath(record.value, path);
        if (!did) return false;

        record.updatedAt = Date.now();
        await this.#commit(record);
        return true;
    }

    async clear() {
        await this.#root.deleteRecordInternal(this.#id);
        this.#notify({ type: "clear" });
    }

    /* ---------- Defaults helpers ---------- */

    async ensure(path, defaults, { persist = true, ttlMs } = {}) {
        if (!path) throw new Error("ensure(path, defaults): path is required");

        const record = await this.#getOrCreateRecord();

        if (hasByPath(record.value, path)) {
            return getByPath(record.value, path);
        }

        const value = (typeof defaults === "function") ? defaults() : defaults;
        setByPath(record.value, path, value);

        record.updatedAt = Date.now();
        if (ttlMs != null) record.expiresAt = Date.now() + Math.max(0, ttlMs);

        if (persist) await this.#commit(record);
        return value;
    }

    async ensureMerge(path, defaultsObj, { persist = true, ttlMs } = {}) {
        if (!path) throw new Error("ensureMerge(path, defaultsObj): path is required");
        if (!defaultsObj || typeof defaultsObj !== "object") return this.get(path);

        const record = await this.#getOrCreateRecord();
        const existing = getByPath(record.value, path);

        const nextVal = isPlainObject(existing)
            ? mergeDefaults(existing, defaultsObj)
            : defaultsObj;

        setByPath(record.value, path, nextVal);

        record.updatedAt = Date.now();
        if (ttlMs != null) record.expiresAt = Date.now() + Math.max(0, ttlMs);

        if (persist) await this.#commit(record);
        return getByPath(record.value, path);
    }

    /* ---------- TTL controls (scope-wide) ---------- */

    async setTtl(ttlMs) {
        const record = await this.#getOrCreateRecord();
        record.updatedAt = Date.now();
        record.expiresAt = Date.now() + Math.max(0, ttlMs);
        await this.#commit(record);
    }

    async removeTtl() {
        const record = await this.#getLiveRecord();
        if (!record) return;
        record.updatedAt = Date.now();
        record.expiresAt = null;
        await this.#commit(record);
    }

    /* ---------- Batching ---------- */

    async transaction(fn) {
        if (typeof fn !== "function") throw new Error("transaction(fn): fn must be a function");

        const outer = !!this.#batch;
        if (!outer) {
            const record = await this.#getOrCreateRecord();
            this.#batch = { record, dirty: false };
        }

        try {
            await fn(this);
        } finally {
            if (!outer) {
                const { record, dirty } = this.#batch;
                this.#batch = null;

                if (dirty) {
                    record.updatedAt = Date.now();
                    await this.#root.putRecordInternal(record);
                    this.#notify({ type: "transaction" });
                }
            }
        }
    }

    /* ================= Internals ================= */

    async #getLiveRecord() {
        const record = this.#batch?.record ?? await this.#root.getRecordInternal(this.#id);
        if (!record) return null;

        if (record.expiresAt != null && record.expiresAt <= Date.now()) {
            if (this.#batch) {
                // In a batch: reset to new record but don't delete until commit
                this.#batch.record = this.#newRecord();
                this.#batch.dirty = true;
            } else {
                await this.#root.deleteRecordInternal(this.#id);
            }
            return null;
        }

        return record;
    }

    async #getOrCreateRecord() {
        if (this.#batch) return this.#batch.record;
        const existing = await this.#getLiveRecord();
        return existing ?? this.#newRecord();
    }

    #newRecord() {
        const now = Date.now();
        return {
            id: this.#id,
            value: {},
            createdAt: now,
            updatedAt: now,
            expiresAt: null,
        };
    }

    async #commit(record) {
        if (this.#batch) {
            this.#batch.record = record;
            this.#batch.dirty = true;
            this.#notify({ type: "set", batched: true });
            return;
        }
        await this.#root.putRecordInternal(record);
        this.#notify({ type: "set" });
    }

    #notify(evt) {
        for (const fn of this.#subscribers) {
            try { fn(evt); } catch { }
        }
    }
}

/* ================= IndexedDB helpers ================= */

function idbRequestToPromise(req) {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function idbTxDone(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
    });
}

/* ================= Path + merge helpers ================= */

function toPathParts(path) {
    // supports "a.b.c" and "a[0].b"
    return String(path)
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .map(s => s.trim())
        .filter(Boolean);
}

function getByPath(obj, path) {
    const parts = toPathParts(path);
    let cur = obj;
    for (const p of parts) {
        if (!cur || typeof cur !== "object") return undefined;
        cur = cur[p];
    }
    return cur;
}

function hasByPath(obj, path) {
    const parts = toPathParts(path);
    let cur = obj;
    for (const p of parts) {
        if (!cur || typeof cur !== "object") return false;
        if (!(p in cur)) return false;
        cur = cur[p];
    }
    return true;
}

function setByPath(obj, path, value) {
    const parts = toPathParts(path);
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const next = cur[p];
        if (!isPlainObject(next)) cur[p] = {};
        cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
}

function deleteByPath(obj, path) {
    const parts = toPathParts(path);
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!cur || typeof cur !== "object") return false;
        cur = cur[p];
    }
    const last = parts[parts.length - 1];
    if (!cur || typeof cur !== "object" || !(last in cur)) return false;
    delete cur[last];
    return true;
}

function isPlainObject(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base, patch) {
    const out = { ...base };
    for (const [k, v] of Object.entries(patch)) {
        if (isPlainObject(v) && isPlainObject(out[k])) {
            out[k] = deepMerge(out[k], v);
        } else {
            out[k] = v; // arrays + primitives replace
        }
    }
    return out;
}

function mergeDefaults(existing, defaultsObj) {
    // Existing wins; defaults fill holes. Arrays are replaced, not merged.
    const out = { ...defaultsObj, ...existing };

    for (const [k, defVal] of Object.entries(defaultsObj)) {
        const curVal = existing?.[k];
        if (isPlainObject(defVal) && isPlainObject(curVal)) {
            out[k] = mergeDefaults(curVal, defVal);
        } else if (curVal === undefined) {
            out[k] = defVal;
        } else {
            out[k] = curVal;
        }
    }

    return out;
}

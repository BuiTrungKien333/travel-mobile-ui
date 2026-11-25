import {
  localMemorySchema,
  type LocalMemory,
} from "../schemas/local-memory-schema";

type EncryptedRecord = {
  id: string;
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
};

async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("tripzy-memories", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("photos", { keyPath: "id" });
      request.result.createObjectStore("keys");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function encryptionKey(db: IDBDatabase) {
  const candidate = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return new Promise<CryptoKey>((resolve, reject) => {
    const transaction = db.transaction("keys", "readwrite");
    const store = transaction.objectStore("keys");
    const request = store.get("device");
    let value: CryptoKey;
    request.onsuccess = () => {
      value = request.result instanceof CryptoKey ? request.result : candidate;
      if (!request.result) store.put(value, "device");
    };
    transaction.oncomplete = () => resolve(value);
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function withDatabase<T>(
  action: (db: IDBDatabase, key: CryptoKey) => Promise<T>,
) {
  const db = await database();
  try {
    return await action(db, await encryptionKey(db));
  } finally {
    db.close();
  }
}

export async function readLocalMemories(): Promise<LocalMemory[]> {
  return withDatabase(async (db, key) => {
    const records = await new Promise<EncryptedRecord[]>((resolve, reject) => {
      const request = db.transaction("photos").objectStore("photos").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return Promise.all(
      records.map(async (record) => {
        const data = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: record.iv },
          key,
          record.data,
        );

        return localMemorySchema.parse(
          JSON.parse(new TextDecoder().decode(data)),
        );
      }),
    );
  });
}

export async function writeLocalMemory(memory: LocalMemory) {
  await withDatabase(async (db, key) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(JSON.stringify(localMemorySchema.parse(memory))),
    );

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("photos", "readwrite");
      transaction.objectStore("photos").put({ id: memory.id, iv, data });
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
  });
}

export async function createLocalMemory(
  uri: string,
  metadata: Omit<LocalMemory, "photo">,
): Promise<LocalMemory> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Photo unavailable");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Invalid photo");
  const photo = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Invalid photo"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const memory = localMemorySchema.parse({ ...metadata, photo });
  await writeLocalMemory(memory);

  return memory;
}

export async function deleteLocalMemory(memory: LocalMemory) {
  await withDatabase(
    async (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("photos", "readwrite");
        transaction.objectStore("photos").delete(memory.id);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
      }),
  );
}

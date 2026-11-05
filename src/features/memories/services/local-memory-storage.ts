import {
  localMemorySchema,
  type LocalMemory,
} from "../schemas/local-memory-schema";

const DIRECTORY = "tripzy-memories";
const key = (id: string) => `tripzy.memory.${id}`;

export async function readLocalMemories(): Promise<LocalMemory[]> {
  const { Directory, File, Paths } = await import("expo-file-system");
  const { getItemAsync } = await import("expo-secure-store");
  const directory = new Directory(Paths.document, DIRECTORY);
  if (!directory.exists) return [];
  const files = directory
    .list()
    .filter(
      (entry) =>
        entry instanceof File && /^local-[\w-]+\.jpg$/.test(entry.name),
    );
  const records = await Promise.all(
    files.map(async (file) => {
      const value = await getItemAsync(key(file.name.slice(0, -4)));
      return value
        ? localMemorySchema.parse({ ...JSON.parse(value), photo: file.uri })
        : null;
    }),
  );
  return records.filter((record) => record !== null);
}

export async function writeLocalMemory(memory: LocalMemory) {
  const { setItemAsync } = await import("expo-secure-store");
  await setItemAsync(
    key(memory.id),
    JSON.stringify(localMemorySchema.parse(memory)),
  );
}

export async function createLocalMemory(
  uri: string,
  metadata: Omit<LocalMemory, "photo">,
): Promise<LocalMemory> {
  const { Directory, File, Paths } = await import("expo-file-system");
  const directory = new Directory(Paths.document, DIRECTORY);
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, `${metadata.id}.jpg`);
  await new File(uri).copy(file);
  try {
    const memory = localMemorySchema.parse({ ...metadata, photo: file.uri });
    await writeLocalMemory(memory);
    return memory;
  } catch (error) {
    if (file.exists) file.delete();
    throw error;
  }
}

export async function deleteLocalMemory(memory: LocalMemory) {
  const { deleteItemAsync } = await import("expo-secure-store");
  const { File, Directory, Paths } = await import("expo-file-system");
  const file = new File(
    new Directory(Paths.document, DIRECTORY),
    `${memory.id}.jpg`,
  );
  // Remove the index first; an interrupted cleanup must not resurrect a deleted memory.
  await deleteItemAsync(key(memory.id));
  if (file.exists) file.delete();
}

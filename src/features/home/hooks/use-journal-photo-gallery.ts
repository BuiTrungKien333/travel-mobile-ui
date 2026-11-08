import { useCallback, useRef, useState } from "react";
import type { Memory } from "../types/home-types";
import type { PhotoSelection } from "../utils/photo-viewer-geometry";

/** Keep the viewer's pages stable while background queries update the album. */
export function useJournalPhotoGallery() {
  const [opened, setOpened] = useState<{
    selection: PhotoSelection;
    memories: Memory[];
  } | null>(null);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const readers = useRef(new Map<string, () => PhotoSelection | null>());
  const registerPhoto = useCallback(
    (id: string, read: () => PhotoSelection | null) => {
      readers.current.set(id, read);
      return () => {
        readers.current.delete(id);
      };
    },
    [],
  );
  const getSelection = useCallback(
    (id: string) => readers.current.get(id)?.() ?? null,
    [],
  );
  const openPhoto = useCallback(
    (selection: PhotoSelection, memories: Memory[]) => {
      setActivePhotoId(selection.id);
      setOpened({ selection, memories: [...memories] });
    },
    [],
  );
  const closePhoto = useCallback(() => {
    setOpened(null);
    setActivePhotoId(null);
  }, []);
  return {
    opened,
    activePhotoId,
    setActivePhotoId,
    registerPhoto,
    getSelection,
    openPhoto,
    closePhoto,
  };
}

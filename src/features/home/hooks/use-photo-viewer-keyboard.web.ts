import { useEffect } from "react";
import type { PhotoViewerKeyboardOptions } from "./use-photo-viewer-keyboard";

export function usePhotoViewerKeyboard({
  blocked,
  onBack,
  onPrevious,
  onNext,
  onToggleControls,
}: PhotoViewerKeyboardOptions) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented
      )
        return;

      if (event.key === "Escape") {
        event.preventDefault();
        onBack();
      } else if (!blocked && !event.repeat) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onPrevious();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onNext();
        } else if (
          event.key === " " &&
          event.target instanceof HTMLElement &&
          event.target.getAttribute("role") === "img"
        ) {
          event.preventDefault();
          onToggleControls();
        }
      }
    }
    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [blocked, onBack, onPrevious, onNext, onToggleControls]);
}

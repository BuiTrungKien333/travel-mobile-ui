export type PhotoViewerKeyboardOptions = {
  blocked: boolean;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleControls: () => void;
};

/** Native uses the system back/escape actions and accessible image actions. */
export function usePhotoViewerKeyboard(_options: PhotoViewerKeyboardOptions) {
  // Keyboard listeners are supplied by the web-specific implementation.
}

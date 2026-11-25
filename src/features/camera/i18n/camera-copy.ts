import { useI18n } from "@/hooks/use-i18n";

const vi = {
  networkError:
    "Chưa kết nối được máy chủ. Ảnh vẫn ở trong ứng dụng; kiểm tra Wi-Fi và địa chỉ máy chủ rồi thử lại.",
  uploadTimeout:
    "Máy chủ phản hồi chậm. Ảnh vẫn được giữ; hãy thử đồng bộ lại.",
  storageUnavailable:
    "Máy chủ chưa sẵn sàng lưu ảnh. Ảnh trong ứng dụng vẫn được giữ.",
  sessionExpired:
    "Phiên đăng nhập đã hết hạn. Ảnh vẫn được giữ; đăng nhập lại để đồng bộ.",
  localPhotoMissing:
    "Chưa đọc được bản ảnh trong thiết bị. Hãy mở lại ảnh ở Xem sau để thử lại.",
  importTitle: "Thêm ảnh vào kỷ niệm",
  importLocalHint:
    "Ảnh được giữ trong ứng dụng trước khi đồng bộ. Ảnh lỗi có thể thử lại trong Xem sau.",
  importInboxHint:
    "Ảnh được giữ trong Xem sau trên thiết bị. Chọn chuyến đi sau để đồng bộ.",
  importWaiting: "Đang chờ",
  importSaving: "Đang lưu vào ứng dụng…",
  importSaved: "Đã giữ trong Xem sau",
  importUploaded: "Đã đồng bộ",
  importSaveFailed: "Chưa lưu được ảnh này. Hãy thử lại trước khi đóng.",
  importUploadFailed: "Chưa đồng bộ. Bản sao trong ứng dụng vẫn được giữ.",
  importSessionChanged:
    "Phiên đăng nhập đã thay đổi. Vui lòng mở lại thư viện sau khi đăng nhập.",
  importSummary: "ảnh đã lưu",
  importSynced: "đã đồng bộ",
  importRetry: "Thử lại ảnh lỗi",
  importDone: "Xong",
  importPhoto: "Ảnh",
  importLimit:
    "Mỗi lần chọn tối đa 10 ảnh. Hãy chọn lại để giữ đủ các ảnh bạn muốn.",
  libraryCopyError:
    "Ảnh đã giữ trong ứng dụng, nhưng chưa chép được vào thư viện điện thoại. Bạn vẫn có thể xem và đồng bộ ảnh.",
  savedPrivateInbox: "Đã giữ ảnh trong ứng dụng và Xem sau",
  savedAwaitingUpload:
    "Đã giữ ảnh trong ứng dụng. Chạm dấu tích để thử đồng bộ lại.",
  unsavedTitle: "Ảnh chưa được lưu",
  unsavedHint:
    "Chưa giữ được bản sao ảnh trong ứng dụng. Rời màn hình sẽ bỏ ảnh đang chụp. Bạn có thể ở lại để thử lưu lại.",
  keepPhoto: "Giữ ảnh và thử lại",
  leavePhoto: "Bỏ ảnh và rời màn hình",
  uploading: "Đang upload ảnh…",
  savingDevice: "Đang lưu ảnh vào thiết bị…",
  uploaded: "Đã upload ảnh vào kỷ niệm",
  uploadError:
    "Chưa đồng bộ được ảnh. Bản sao vẫn được giữ trong ứng dụng. Chạm dấu tích để thử lại.",
  tooLarge: "Ảnh vượt dung lượng máy chủ cho phép. Hãy chọn ảnh nhỏ hơn.",
  invalidType: "Máy chủ hỗ trợ ảnh JPEG, PNG, GIF và WebP. Hãy chọn ảnh khác.",
  imageTooLarge: "Kích thước ảnh vượt giới hạn máy chủ. Hãy chọn ảnh nhỏ hơn.",
  futureDate:
    "Kỷ niệm chỉ lưu được vào ngày đã qua hoặc hôm nay. Hãy chọn lại ngày.",
  back: "Quay lại",
  capture: "Chụp khoảnh khắc",
  gallery: "Chọn ảnh trong máy",
  flip: "Đổi camera trước/sau",
  flashOn: "Bật flash",
  flashOff: "Tắt flash",
  zoom: "Phóng to kỹ thuật số",
  memories: "kỷ niệm",
  albumHint: "Xem album chuyến đi",
  details: "Chi tiết chuyến đi",
  home: "Trang chủ",
  journal: "Kỷ niệm",
  permission: "Ghi lại hành trình của bạn",
  permissionHint:
    "Cho phép dùng camera để chụp ảnh. Bạn vẫn có thể chọn ảnh từ thư viện.",
  allow: "Cho phép camera",
  settings: "Mở cài đặt",
  ready: "Đang mở camera…",
  error: "Chưa thể mở camera. Bạn thử lại hoặc chọn ảnh trong máy nhé.",
  photoError: "Chưa thể xử lý ảnh. Bạn thử lại nhé.",
  saveError:
    "Chưa thể lưu ảnh. Chuyến đi đã thay đổi hoặc phiên xem trước đã đầy.",
  retry: "Thử lại",
  save: "Lưu khoảnh khắc",
  retake: "Chụp lại",
  confirmHint: "Chạm dấu tích để thử lưu lại ảnh",
  saved: "Đã thêm vào kỷ niệm",
  build: "Cần cập nhật bản cài ứng dụng",
  buildHint: "Cài bản ứng dụng mới để chụp ảnh và chọn ảnh trong máy.",
  missing: "Chưa có chuyến đi phù hợp để ghi lại khoảnh khắc.",
  selectTrip: "Chọn chuyến đi và địa điểm để lưu khoảnh khắc này.",
  insecure:
    "Trình duyệt chỉ cho phép camera qua HTTPS hoặc localhost. Hãy mở địa chỉ HTTPS hoặc dùng ứng dụng trên điện thoại.",
  unsupported:
    "Môi trường này không hỗ trợ camera. Hãy dùng trình duyệt hệ thống hoặc chọn ảnh trong máy.",
  embedded:
    "Trình xem trước này đang chặn camera. Hãy mở cùng địa chỉ trong Chrome hoặc Edge để chụp và chọn ảnh. Bạn có thể bật chế độ màn hình điện thoại trong công cụ nhà phát triển của trình duyệt.",
  permissionError:
    "Chưa đọc được quyền camera. Hãy thử cấp quyền lại hoặc kiểm tra quyền Camera của ứng dụng trong Cài đặt.",
  denied:
    "Quyền camera chưa được cấp. Nếu đã chặn, hãy bật Camera trong cài đặt ứng dụng hoặc quyền trang web của trình duyệt.",
  startError:
    "Camera chưa khởi động được. Hãy đóng ứng dụng khác đang dùng camera, kiểm tra thiết bị camera rồi thử lại.",
  quick: "Chụp nhanh",
  quickHint: "Lưu vào thiết bị và Xem sau · Chọn chuyến đi sau",
  later: "Xem sau",
  savedPrivate:
    "Đã giữ ảnh trong ứng dụng. Chạm dấu tích để thử lưu vào thư viện thiết bị lại.",
  savedDevice: "Đã lưu vào thư viện thiết bị và album chuyến đi",
  savedInbox: "Đã lưu vào thư viện thiết bị và Xem sau",
  savedDownload: "Đã lưu trong ứng dụng và gửi ảnh đến trình tải xuống",
};

const en: typeof vi = {
  networkError:
    "Cannot reach the server. Your photo is kept in the app; check Wi-Fi and the server address, then retry.",
  uploadTimeout:
    "The server is taking too long. Your photo is safe; retry syncing.",
  storageUnavailable:
    "Server photo storage is unavailable. Your copy is kept in the app.",
  sessionExpired:
    "Your session has expired. Your photo is safe; sign in again to sync.",
  localPhotoMissing:
    "Cannot read this photo on the device. Open it in Saved for later and retry.",
  importTitle: "Add photos to memories",
  importLocalHint:
    "Photos are kept in the app before syncing. Retry failed uploads in Saved for later.",
  importInboxHint:
    "Photos stay in Saved for later on this device. Choose a trip later to sync them.",
  importWaiting: "Waiting",
  importSaving: "Saving in the app…",
  importSaved: "Kept in Saved for later",
  importUploaded: "Synced",
  importSaveFailed: "Couldn't keep this photo. Retry before closing.",
  importUploadFailed: "Couldn't sync. The copy in the app is still kept.",
  importSessionChanged:
    "Your session changed. Reopen the library after signing in.",
  importSummary: "photos kept",
  importSynced: "synced",
  importRetry: "Retry failed photos",
  importDone: "Done",
  importPhoto: "Photo",
  importLimit:
    "Select up to 10 photos at a time. Please select again to include all the photos you want.",
  libraryCopyError:
    "The photo is kept in the app, but couldn't be copied to your phone library. You can still view and sync it.",
  savedPrivateInbox: "Photo kept in the app and Saved for later",
  savedAwaitingUpload: "Photo kept in the app. Tap the check to retry syncing.",
  unsavedTitle: "Photo not saved",
  unsavedHint:
    "The app couldn't keep a copy yet. Leaving will discard this capture. Stay to retry saving.",
  keepPhoto: "Keep photo and retry",
  leavePhoto: "Discard photo and leave",
  uploading: "Uploading photo…",
  savingDevice: "Saving photo to your device…",
  uploaded: "Photo uploaded to memories",
  uploadError:
    "Couldn't sync. A copy is still kept in the app. Tap the check to retry.",
  tooLarge:
    "This photo exceeds the server's size limit. Choose a smaller image.",
  invalidType:
    "The server accepts JPEG, PNG, GIF and WebP. Choose another image.",
  imageTooLarge:
    "This photo exceeds the server's image dimensions. Choose a smaller image.",
  futureDate:
    "Memories need a past or present date. Please choose another day.",
  back: "Back",
  capture: "Capture a moment",
  gallery: "Choose a photo",
  flip: "Switch cameras",
  flashOn: "Turn flash on",
  flashOff: "Turn flash off",
  zoom: "Digital zoom",
  memories: "memories",
  albumHint: "View this trip's album",
  details: "Trip details",
  home: "Home",
  journal: "Memories",
  permission: "Capture your journey",
  permissionHint:
    "Allow camera access to take photos. You can still choose an image from your library.",
  allow: "Allow camera",
  settings: "Open settings",
  ready: "Opening camera…",
  error:
    "Couldn't open the camera. Try again or choose an image from your library.",
  photoError: "Couldn't process this image. Please try again.",
  saveError:
    "Couldn't save. The trip has changed or this preview session is full.",
  retry: "Try again",
  save: "Save moment",
  retake: "Retake",
  confirmHint: "Tap the check to retry saving this photo",
  saved: "Added to memories",
  build: "An updated app build is needed",
  buildHint:
    "Install the updated app to take photos and choose images from your library.",
  missing: "No available trip to capture a moment for.",
  selectTrip: "Choose a trip and place to save this moment.",
  insecure:
    "Camera access requires HTTPS or localhost. Open an HTTPS address or use the mobile app.",
  unsupported:
    "This environment does not support camera access. Use your system browser or choose a photo.",
  embedded:
    "This preview blocks camera access. Open the same address in Chrome or Edge to capture and choose photos. You can use your browser's developer tools to preview a phone screen.",
  permissionError:
    "Couldn't read camera access. Try again or check the app's Camera permission in Settings.",
  denied:
    "Camera permission was not granted. If blocked, enable Camera in app settings or your browser's site permissions.",
  startError:
    "The camera couldn't start. Close other apps using it, check your camera device, and try again.",
  quick: "Quick capture",
  quickHint: "Save on device and in Saved for later · Organize later",
  later: "Saved for later",
  savedPrivate:
    "Kept in the app. Tap the check to retry saving to your device's photo library.",
  savedDevice: "Saved to your photo library and trip album",
  savedInbox: "Saved to your photo library and Saved for later",
  savedDownload: "Saved in the app and sent to your downloads",
};

export function useCameraCopy() {
  const { locale } = useI18n();
  return { locale, copy: locale === "vi" ? vi : en };
}

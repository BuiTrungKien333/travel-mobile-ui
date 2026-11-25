import { useI18n } from "@/hooks/use-i18n";

const vi = {
  selectMultiple: "Chọn nhiều",
  selectAll: "Chọn tất cả",
  clearSelection: "Bỏ chọn tất cả",
  cancelSelection: "Hủy chọn",
  selectedCount: "Đã chọn {count} địa điểm",
  assignSelected: "Xếp {count} địa điểm vào ngày…",
  assignTitle: "Chọn ngày để xếp lịch",
  dayLabel: "Ngày",
  assignHint: "Các điểm đã chọn sẽ được thêm cuối lịch ngày này.",
  assignConfirm: "Thêm vào ngày {day}",
  dayCapacity:
    "Ngày này sẽ vượt giới hạn 100 điểm dừng. Hãy chọn ít điểm hơn hoặc chọn ngày khác.",
  schedule: "Xếp vào lịch",
  clearTime: "Bỏ giờ đến",
  edit: "Sửa điểm dừng",
  details: "Điểm dừng",
  day: "Chọn ngày",
  noDayStops: "Ngày này chưa có điểm dừng.",
  noTripDates: "Chọn ngày bắt đầu và kết thúc để xếp lịch cho chuyến đi.",
  pickSaved: "Xếp địa điểm đã lưu",
  saved: "Đã lưu lịch trình",
  saving: "Đang lưu lịch trình…",
  originSearchLoading: "Đang tìm địa điểm đã lưu…",
  originLocationError:
    "Chưa lấy được vị trí. Kiểm tra GPS và quyền vị trí, hoặc chọn địa điểm hay nhập địa chỉ thủ công.",
  originSearchEmpty:
    "Chưa có địa điểm phù hợp trong danh mục. Bạn có thể nhập địa chỉ thủ công hoặc chọn một điểm trong ngày.",
  originSearchError:
    "Chưa tải được gợi ý. Bạn vẫn có thể chọn điểm trong ngày hoặc nhập thủ công.",
  originNoCoordinates: "Chưa có tọa độ để tính tuyến và giờ đến.",
  remove: "Gỡ khỏi ngày",
  removeDayHint:
    "Gỡ địa điểm khỏi ngày đang xem? Lịch của các ngày khác vẫn được giữ.",
  removeHint:
    "Địa điểm sẽ trở về Chờ xếp lịch nếu không còn nằm ở ngày nào khác.",
  reload: "Bỏ bản chỉnh sửa và tải lại",
  conflict: "Lịch trình đã thay đổi. Tải lại trước khi lưu để tránh ghi đè.",
  invalid: "Kiểm tra ngày, giờ và thứ tự các điểm dừng.",
  duration: "Nhập thời lượng từ 1 đến 1.440 phút.",
  membership: "Một địa điểm không còn trong chuyến. Hãy tải lại lịch trình.",
  readOnly: "Ngày này chỉ có thể xem.",
  error: "Chưa thể tải hoặc lưu lịch trình. Hãy thử lại.",
  mapEmpty: "Thêm điểm dừng vào ngày này để xem trên bản đồ.",
  staticMap: "Ảnh bản đồ Mapbox với các điểm dừng theo thứ tự",
  routeLoading: "Đang tính tuyến đường…",
  routeUnavailable: "Chưa có tuyến đường. Bạn vẫn có thể xem các điểm dừng.",
  routeTooMany: "Tuyến đường hỗ trợ tối đa 25 điểm dừng mỗi ngày.",
  routeMissingCoordinates: "Một số điểm dừng chưa có tọa độ.",
  routeNotConfigured: "Máy chủ chưa kết nối Mapbox Directions.",
  routeModes: { DRIVE: "Ô tô", WALK: "Đi bộ", BICYCLE: "Xe đạp" },
  visitFailed: "Chưa lưu được trạng thái đã ghé. Hãy thử lại.",
  capture: "Chụp khoảnh khắc",
  memoriesError: "Chưa thể tải kỷ niệm của ngày này.",
  memoriesLoading: "Đang tải kỷ niệm…",
  previousMemories: "Trang trước",
  optimizeLoading: "Đang tìm thứ tự di chuyển tốt hơn…",
  optimizeUnavailable:
    "Chưa có gợi ý tuyến đường. Bạn có thể sắp xếp thủ công.",
};

const en: typeof vi = {
  selectMultiple: "Select multiple",
  selectAll: "Select all",
  clearSelection: "Deselect all",
  cancelSelection: "Cancel selection",
  selectedCount: "{count} places selected",
  assignSelected: "Schedule {count} places…",
  assignTitle: "Choose a day",
  dayLabel: "Day",
  assignHint:
    "Selected places will be added to the end of this day's itinerary.",
  assignConfirm: "Add to day {day}",
  dayCapacity:
    "This would exceed 100 stops for the day. Select fewer places or another day.",
  schedule: "Schedule stop",
  clearTime: "Clear arrival time",
  edit: "Edit stop",
  details: "Stop details",
  day: "Choose a day",
  noDayStops: "There are no stops on this day yet.",
  noTripDates: "Set a start and end date to schedule stops for this trip.",
  pickSaved: "Schedule a saved place",
  saved: "Itinerary saved",
  saving: "Saving itinerary…",
  originSearchLoading: "Searching saved places…",
  originLocationError:
    "Couldn't get your location. Check GPS and location permission, or choose a place or enter an address manually.",
  originSearchEmpty:
    "No matching saved place. Enter an address manually or choose a stop from this day.",
  originSearchError:
    "Suggestions are unavailable. Choose a stop from this day or enter an address manually.",
  originNoCoordinates:
    "Coordinates are needed to calculate routes and arrivals.",
  remove: "Remove from day",
  removeDayHint:
    "Remove this stop from the selected day? Other days keep their schedules.",
  removeHint: "The place returns to Unscheduled if it is not on another day.",
  reload: "Discard edits and reload",
  conflict:
    "The itinerary changed elsewhere. Reload before saving to avoid overwriting changes.",
  invalid: "Check the date, time, and order of the stops.",
  duration: "Enter a duration from 1 to 1,440 minutes.",
  membership: "A place is no longer in the trip. Reload the itinerary.",
  readOnly: "This day is read-only.",
  error: "Couldn't load or save the itinerary. Please try again.",
  mapEmpty: "Add stops to this day to see them on the map.",
  staticMap: "Mapbox map image showing the ordered stops",
  routeLoading: "Calculating route…",
  routeUnavailable: "A route is unavailable. You can still see the stops.",
  routeTooMany: "Routes support up to 25 stops per day.",
  routeMissingCoordinates: "Some stops are missing coordinates.",
  routeNotConfigured: "Mapbox Directions is not configured on the server.",
  routeModes: { DRIVE: "Drive", WALK: "Walk", BICYCLE: "Cycle" },
  visitFailed: "Couldn't save the visit. Try again.",
  capture: "Capture a moment",
  memoriesError: "Couldn't load memories for this day.",
  memoriesLoading: "Loading memories…",
  previousMemories: "Previous page",
  optimizeLoading: "Finding a better stop order…",
  optimizeUnavailable:
    "No route suggestion is available. You can reorder stops manually.",
};

export function useItineraryCopy() {
  const { locale } = useI18n();
  return { copy: locale === "vi" ? vi : en, locale };
}

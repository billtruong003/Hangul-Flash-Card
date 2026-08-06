# Hangul Flashcards

Ứng dụng web học bảng chữ cái Hangul (tiếng Hàn) dành cho người Việt, theo phương pháp gợi nhớ chủ
động (active recall). Toàn bộ giao diện bằng tiếng Việt, chạy hoàn toàn trên trình duyệt — không cần
tài khoản, không có backend, tiến độ lưu trong LocalStorage.

## Tính năng

- **Hai chiều học**: `Chữ → Âm` (nhìn ㄴ, chọn `n`) và `Âm → Chữ` (nhìn `n`, chọn ㄴ).
- **40 chữ cái** chia thành 4 nhóm: phụ âm cơ bản (14), nguyên âm cơ bản (10), phụ âm căng (5),
  nguyên âm ghép (11). Bật/tắt từng nhóm trong bảng cài đặt.
- **Chọn câu hỏi thích ứng**: chữ chưa gặp, chữ hay sai và chữ vừa trả lời sai xuất hiện nhiều hơn;
  chữ đã thuộc vẫn xuất hiện nhưng thưa hơn hẳn.
- **Đáp án nhiễu có chủ đích**: ưu tiên các chữ dễ nhầm (ㄱ/ㅋ/ㄲ, ㅁ/ㅂ/ㅍ, ㅗ/ㅛ…), sau đó tới
  chữ cùng nhóm.
- **Bảng chữ Hangul tra cứu**: mở ra xem cả 40 chữ bất cứ lúc nào. Trên desktop là cột thu gọn nằm
  cạnh thẻ học, trên điện thoại là drawer trượt từ dưới lên. Bài quiz vẫn dùng được khi bảng đang mở.
- **Đếm riêng câu trả lời có trợ giúp**: đúng sau khi tra bảng vẫn là đúng, nhưng không tính vào tiến
  độ thuộc chữ.
- **Chế độ kiểm tra**: khóa hẳn bảng tra cứu để mọi câu trả lời đều tự lực.
- **Thống kê phiên**: đúng, có trợ giúp, sai, chuỗi hiện tại, chuỗi cao nhất, số chữ đã thuộc trên
  tổng số chữ đang học.
- **Ôn chữ sai**: chỉ hỏi những chữ từng trả lời sai, ưu tiên chữ có tỉ lệ đúng thấp nhất.
- **Phát âm tùy chọn** qua Web Speech API (`ko-KR`), tự tắt nếu trình duyệt không hỗ trợ.
- **Phím tắt trên desktop**, dark mode theo cài đặt hệ thống, tôn trọng `prefers-reduced-motion`.

## Bắt đầu

Yêu cầu Node.js 20.19+ (khuyến nghị 22 hoặc mới hơn).

```bash
npm install
npm run dev
```

Mở địa chỉ mà Vite in ra (mặc định http://localhost:5173).

## Các lệnh npm

| Lệnh                 | Mô tả                                             |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Chạy dev server của Vite                          |
| `npm run build`      | Kiểm tra kiểu rồi build bản production vào `dist` |
| `npm run preview`    | Xem thử bản build production                      |
| `npm run lint`       | Chạy ESLint                                       |
| `npm run typecheck`  | Chạy `tsc --noEmit`                               |
| `npm run test`       | Chạy Vitest một lượt                              |
| `npm run test:watch` | Chạy Vitest ở chế độ watch                        |
| `npm run format`     | Định dạng lại mã nguồn bằng Prettier              |
| `npm run quality`    | lint → typecheck → test → build                   |

## Cách dùng

1. Chọn tab `Chữ → Âm` hoặc `Âm → Chữ`.
2. Chạm vào một trong bốn đáp án. Đúng thì thẻ chuyển tiếp sau ~0,7 giây; sai thì đáp án đúng được
   tô xanh và thẻ chờ ~1,35 giây để bạn kịp nhìn.
3. Mở biểu tượng bánh răng để bật/tắt nhóm chữ đang học. Luôn phải giữ ít nhất một nhóm.
4. Khi đã tích lũy đủ lỗi sai, bấm **Ôn chữ sai** để luyện riêng những chữ đó.
5. Bí chữ nào thì bấm **Hiện bảng Hangul** để tra. Chạm vào một ô để xem cách đọc, ghi chú và nghe
   phát âm. Bảng không bao giờ tự điền đáp án — bạn vẫn phải tự chọn.

### Trả lời có trợ giúp

Một câu hỏi bị đánh dấu **có trợ giúp** nếu bạn mở bảng tra cứu trong lúc câu hỏi đang hiển thị, hoặc
nếu bảng đã mở sẵn từ trước khi câu hỏi xuất hiện. Trả lời đúng khi đó hiện dòng `Đúng — có trợ giúp`
và:

- cộng vào ô thống kê **Có trợ giúp**, không cộng vào ô **Đúng**;
- không tăng chuỗi đúng, nhưng cũng không làm đứt chuỗi (khác với trả lời sai);
- không tính là một lần đúng để xét "đã thuộc";
- giữ chữ đó ở mức ưu tiên cao trong các câu hỏi sau.

Trả lời sai vẫn là sai như trước, dù có tra bảng hay không.

Nếu muốn tự kiểm tra nghiêm túc, bật **Ẩn bảng trong chế độ kiểm tra** trong phần cài đặt: nút mở bảng
bị khóa suốt phiên và mọi câu trả lời đều là tự lực. Tùy chọn này mặc định tắt.

### Phím tắt (desktop)

| Phím    | Tác dụng                                        |
| ------- | ----------------------------------------------- |
| `1`–`4` | Chọn đáp án tương ứng                           |
| `←` `→` | Đổi tab (không hoạt động khi đang hiện kết quả) |
| `R`     | Bật/tắt chế độ ôn chữ sai                       |

Phím tắt bị vô hiệu khi hộp thoại xác nhận đang mở.

### Âm thanh

Nút **Âm thanh** dùng Web Speech API với locale `ko-KR`. Trình duyệt chỉ đọc khi bạn trả lời đúng
hoặc khi bạn tự bấm nút loa — ứng dụng không tự phát liên tục. Nếu trình duyệt không hỗ trợ tổng hợp
giọng nói, nút sẽ bị mờ và mọi thứ còn lại vẫn hoạt động bình thường. Với phụ âm và nguyên âm đứng
một mình, chất lượng đọc của trình duyệt có thể không chuẩn — hãy coi đây là phần bổ trợ.

## Kiến trúc

```text
src/
  components/     Thành phần giao diện (không chứa logic học)
    ActionBar.tsx      5 nút hành động
    AnswerButton.tsx   Một ô đáp án + trạng thái đúng / có trợ giúp / sai
    ChartSurface.tsx   Hai vỏ bọc của bảng tra cứu: cột desktop và drawer mobile
    ConfirmDialog.tsx  Modal xác nhận tự viết
    HangulChart.tsx    Lưới 40 chữ + ô chi tiết cách đọc
    QuizCard.tsx       Thẻ câu hỏi + vùng aria-live
    SettingsPanel.tsx  Bật/tắt nhóm chữ và chế độ kiểm tra
    StatsPanel.tsx     Thống kê phiên + thanh tiến độ
    TabBar.tsx         Hai tab học
    icons.tsx          Icon SVG nội tuyến (không thêm thư viện)
  data/
    hangul.ts       40 chữ cái đã gõ kiểu, kèm giải thích và danh sách chữ dễ nhầm
    tabs.ts         Nhãn hai tab
  hooks/
    useDialogBehavior.ts  Bẫy focus, Esc, trả focus — dùng chung cho modal và drawer
    useMediaQuery.ts      Phân biệt desktop / mobile khi CSS không đủ
    usePersistedState.ts  Đọc/ghi LocalStorage
    useQuiz.ts            Vòng đời câu hỏi: sinh, đánh dấu trợ giúp, trả lời, chuyển tiếp
  lib/
    progress.ts     Tính độ chính xác, điều kiện "đã thuộc", cập nhật tiến độ
    quiz.ts         Trọng số thích ứng, chọn chữ kế tiếp, sinh đáp án, lọc chữ sai
    speech.ts       Bọc Web Speech API
    storage.ts      Đọc/ghi và **kiểm tra** dữ liệu LocalStorage
  test/
    fixtures.ts     PRNG có seed + factory cho test
    setup.ts        Cấu hình jsdom cho Vitest
  types/index.ts    Kiểu dùng chung
  App.tsx           Ghép các phần lại, xử lý phím tắt và trạng thái bảng tra cứu
```

Nguyên tắc phân tách: `lib/` là các hàm thuần, không biết gì về React; `hooks/` giữ trạng thái;
`components/` chỉ nhận props và vẽ. Nhờ vậy toàn bộ thuật toán học kiểm thử được mà không cần render.

## Thuật toán học

### Điều kiện "đã thuộc" (`lib/progress.ts`)

Một chữ được tính là đã thuộc khi thỏa **cả ba**, và chỉ tính những lần trả lời **không có trợ giúp**:

- ít nhất 5 lần đúng tự lực,
- đang có ít nhất 3 lần đúng tự lực liên tiếp,
- độ chính xác tự lực từ 80% trở lên.

Độ chính xác tự lực = `số lần đúng tự lực / tổng số lần trả lời`. Lần đúng có trợ giúp nằm ở mẫu số
nhưng không nằm ở tử số, nên tra bảng luôn kéo lùi tiến độ chứ không bao giờ đẩy một chữ lên "đã
thuộc".

Trả lời sai làm chuỗi đúng liên tiếp về 0. Trả lời đúng có trợ giúp thì giữ nguyên chuỗi — không cộng,
cũng không xóa.

### Trọng số chọn câu hỏi (`lib/quiz.ts` → `computeWeight`)

Chế độ học bình thường:

| Tình trạng chữ                   | Trọng số                            |
| -------------------------------- | ----------------------------------- |
| Chưa từng xuất hiện              | 12                                  |
| Đã thuộc                         | 0,25 (thấp nhưng khác 0)            |
| Còn lại                          | `1 + (1 − độ chính xác tự lực) × 6` |
| Lần trả lời gần nhất bị sai      | cộng thêm 3                         |
| Lần trả lời gần nhất có trợ giúp | cộng thêm 1,5                       |

Thứ tự ưu tiên vì vậy là: chưa gặp → vừa sai → vừa phải tra bảng → đúng tự lực → đã thuộc. Câu trả
lời có trợ giúp còn kéo độ chính xác xuống, nên nó giảm trọng số ít hơn hẳn một câu đúng tự lực.

Chế độ **Ôn chữ sai** dùng công thức riêng: `1 + (1 − độ chính xác tự lực) × 12 + min(số lần sai, 5)`
— bỏ qua trạng thái "đã thuộc" vì lúc này người học chủ động muốn ôn.

Hàm này thuần và không tự sinh ngẫu nhiên; `pickNextCharacter` nhận nguồn ngẫu nhiên từ bên ngoài nên
test có thể truyền PRNG có seed để kết quả lặp lại được.

`pickNextCharacter` bốc ngẫu nhiên theo trọng số tích lũy và **luôn loại chữ vừa hiện ra** khi còn
ít nhất hai lựa chọn.

### Sinh đáp án (`lib/quiz.ts` → `buildAnswerOptions`)

1. Luôn có đáp án đúng.
2. Lấy chữ nhiễu từ `confusableIds` trước (xáo trộn thứ tự).
3. Thiếu thì lấy tiếp từ **cùng nhóm**, rồi mới tới phần còn lại của bộ chữ đang bật.
4. Không cho hai lựa chọn trùng nhãn phát âm — nhờ vậy ㅙ và ㅞ (đều đọc là `we`) không bao giờ xuất
   hiện cùng nhau, tránh câu hỏi có hai đáp án đúng. Chỉ khi bộ chữ quá nhỏ mới chấp nhận trùng nhãn.
5. Xáo trộn vị trí bốn đáp án.

Bên trong ứng dụng, đáp án được nhận diện bằng **id ổn định** (`c-n`, `v-wae`…) chứ không phải chuỗi
phiên âm, vì nhiều chữ có phiên âm giống nhau.

## Lưu trữ

Khóa LocalStorage: `hangul-flashcards` (bản cũ nằm ở `hangul-flashcards:v1`).

```ts
type PersistedState = {
  version: 2;
  progress: Record<string, CharacterProgress>;
  settings: { enabledCategories: string[]; soundEnabled: boolean; testMode: boolean };
  bestStreak: number;
};

type CharacterProgress = {
  shownCount: number;
  unassistedCorrectCount: number;
  assistedCorrectCount: number;
  incorrectCount: number;
  currentUnassistedCorrectStreak: number;
  lastShownAt: number | null;
  lastResult?: 'correct-unassisted' | 'correct-assisted' | 'incorrect';
};
```

`parsePersistedState` kiểm tra từng trường khi đọc: version lạ thì bỏ toàn bộ; id chữ lạ bị loại; số
âm/không phải số bị đưa về 0; `lastResult` không hợp lệ bị bỏ; danh sách nhóm rỗng hoặc không hợp lệ
quay về mặc định. JSON hỏng cũng không làm ứng dụng chết. Trạng thái tạm — câu hỏi hiện tại, kết quả
vừa hiện, thống kê phiên, và **cờ đã tra bảng của câu hỏi đang hiển thị** — không được lưu.

### Nâng cấp từ version 1

Version 1 chưa có bảng tra cứu, nên mọi câu trả lời đã ghi đều là tự lực. Khi đọc dữ liệu cũ:

| Version 1              | Version 2                        |
| ---------------------- | -------------------------------- |
| `correctCount`         | `unassistedCorrectCount`         |
| `currentCorrectStreak` | `currentUnassistedCorrectStreak` |
| —                      | `assistedCorrectCount` = 0       |
| —                      | `settings.testMode` = `false`    |

`lastResult` được suy ra từ dữ liệu cũ (còn chuỗi đúng → `correct-unassisted`, từng sai → `incorrect`)
để chữ đã học không bị mất mức ưu tiên sau khi nâng cấp. Dữ liệu nằm ở khóa cũ được đọc, chuyển đổi,
ghi sang khóa mới, rồi khóa cũ mới bị xóa — không mất tiến độ nào.

Nút **Bắt đầu lại phiên** chỉ xóa thống kê phiên, giữ nguyên tiến độ dài hạn. Nút **Xóa toàn bộ tiến
độ** mở hộp thoại xác nhận tự viết (không dùng `confirm()` của trình duyệt) và xóa sạch dữ liệu.

## Kiểm thử

96 test bằng Vitest:

- `src/lib/quiz.test.ts` (28) — xáo trộn, sinh đáp án (có đáp án đúng, đủ 4 lựa chọn, không trùng id,
  không trùng nhãn phát âm, ưu tiên chữ dễ nhầm và cùng nhóm), thứ tự trọng số thích ứng (vừa sai >
  vừa tra bảng > đúng tự lực > đã thuộc > 0), không lặp lại chữ vừa hỏi, lọc chữ sai.
- `src/lib/progress.test.ts` (16) — độ chính xác tự lực, đủ/thiếu từng điều kiện "đã thuộc", trả lời
  có trợ giúp không đẩy được chữ lên "đã thuộc", cập nhật tiến độ không đột biến dữ liệu cũ.
- `src/lib/storage.test.ts` (11) — dữ liệu hỏng, version lạ, id lạ, nhóm chữ không hợp lệ, và toàn bộ
  đường nâng cấp từ version 1 kể cả khi dữ liệu còn nằm ở khóa cũ.
- `src/components/HangulChart.test.tsx` (8) — nhóm chữ, đánh dấu đã thuộc và chữ đang hỏi, click và
  focus đều báo "đã tra bảng", chọn chữ hiện giải thích và gọi phát âm.
- `src/App.test.tsx` (33) — smoke test toàn ứng dụng trên jsdom: trả lời đúng/sai, tự chuyển thẻ, phím
  tắt, ghi LocalStorage, chế độ ôn chữ sai, hộp thoại xác nhận, đổi nhóm chữ, nâng cấp dữ liệu cũ,
  drawer đóng bằng `Esc` và trả focus, bảng dạng cột trên desktop, toàn bộ luật tính điểm có trợ giúp,
  và chế độ kiểm tra.

Các test thuần dùng PRNG có seed (`src/test/fixtures.ts`) nên kết quả lặp lại được.

## Trợ năng

- Tab, nút và ô đáp án đều là phần tử `<button>` thật, có `aria-label` tiếng Việt.
- Kết quả trả lời được đọc lên qua vùng `aria-live="polite"`.
- Ba kết quả không chỉ phân biệt bằng màu: mỗi loại có icon riêng và chữ "Chính xác" / "Đúng — có trợ
  giúp" / "Chưa đúng".
- Trong bảng tra cứu, "đã thuộc" và "đang được hỏi" nằm cả trong tên trợ năng của ô, không chỉ ở
  viền và màu nền.
- Viền focus luôn hiển thị (`:focus-visible`).
- Hộp thoại xác nhận (`role="alertdialog"`) và drawer bảng chữ trên mobile (`role="dialog"`,
  `aria-modal`) dùng chung một hook: bẫy focus, đóng bằng `Esc`, trả focus về đúng nút đã mở nó. Trên
  desktop bảng chữ là cột thường (`<aside>`), không phải modal, nên không giam focus.
- Mọi animation tự tắt khi hệ điều hành bật `prefers-reduced-motion`.

## Ghi chú về `overrides` trong package.json

```json
"overrides": { "rollup": "npm:@rollup/wasm-node@^4.55.1" }
```

Máy dùng để tạo dự án này bật Windows Application Control, chính sách đó chặn nạp file `.node` chưa
ký của Rollup nên `vite build` và `vitest` không chạy được. Dòng override thay bằng bản WebAssembly
của Rollup — chạy đúng trên mọi hệ điều hành, chỉ chậm hơn một chút. Nếu máy bạn không bị chặn, cứ
xóa khối `overrides` rồi `npm install` lại để dùng bản native.

## Công nghệ

Vite · React 19 · TypeScript · Tailwind CSS v4 · Vitest · ESLint · Prettier. Không dùng thư viện
component, không backend, không cơ sở dữ liệu.

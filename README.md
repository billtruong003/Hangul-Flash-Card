# Hangul Flashcards

Ứng dụng web học bảng chữ cái Hangul (tiếng Hàn) dành cho người Việt, theo phương pháp gợi nhớ chủ
động (active recall). Toàn bộ giao diện bằng tiếng Việt, chạy hoàn toàn trên trình duyệt — không cần
tài khoản, không có backend, tiến độ lưu trong LocalStorage.

## Tính năng

Ứng dụng có **bốn khu vực học**, đi theo đúng thứ tự một người học cần: nhận mặt chữ → viết được →
ráp thành âm tiết → nghe hiểu câu. Chuyển khu vực bằng thanh dưới cùng (điện thoại) hoặc hàng nút
trên đầu (desktop).

### Học chữ

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
- **Phát âm chuẩn quốc tế**: cách đọc ghi theo Revised Romanization (`g`, `eo`, `ae`, `kk`…) thay vì
  phiên âm bồi. Quy luật biến âm theo vị trí (`ㄱ` đầu đọc `g`, cuối đọc `k`) được ghi riêng chứ
  không nhồi chung vào một nhãn.
- **Nghe từng âm** qua Web Speech API (`ko-KR`). Máy không có giọng tiếng Hàn thì nút tự tắt và ứng
  dụng im lặng, chứ không đọc Hangul bằng giọng tiếng Anh.

### Viết

- **Tô theo thứ tự nét**: vệt mờ chỉ nét đang tới, chấm xanh đánh số chỉ chỗ đặt bút. Nút **Xem mẫu**
  vẽ lại từng nét một.
- **Chấm điểm hình học, chạy hoàn toàn offline** — không tải model, không gọi mạng. Mỗi nét phải qua
  năm cửa độc lập: khoảng cách trung bình, điểm đầu/cuối, hướng đi, hình dáng và độ dài.
- **Phân biệt "sai nét" với "đúng nét nhưng ngược chiều"**. Đây mới là chỗ dạy được _thứ tự_ thay vì
  chỉ dạy hình dáng: ㅇ vẽ ngược chiều kim đồng hồ trông y hệt lúc xong nhưng vẫn bị loại.
- **Ẩn vệt mờ** để viết từ trí nhớ. Khi đang tô thì ngưỡng chấm chặt hơn so với lúc viết chay.
- Điểm 0–100 mỗi lần viết; nét phải làm lại chỉ được nửa điểm.

### Ghép chữ

- Đề bài là **cách đọc + nghĩa** (`gam` — quả hồng), người học chọn phụ âm đầu, nguyên âm và phụ âm
  cuối để ráp ra `감`. Chữ Hangul không hiện ở đề, nếu không thì thành bài chép lại.
- **Xem các chữ ghép lại thành một khối** ngay khi chọn — đây chính là quy luật cần thấy tận mắt.
- Sau khi đúng thì hiện rõ quy luật vị trí: `ㅁ` ở cuối âm tiết đọc `m`.
- ㄸ ㅃ ㅉ không có trong danh sách phụ âm cuối, vì chúng mở đầu âm tiết được nhưng không đóng được.

### Nghe

- Nghe câu tiếng Hàn rồi **chọn nghĩa tiếng Việt** trong 4 lựa chọn. Đáp án là nghĩa chứ không phải
  chữ Hàn, nên không thể đoán bằng cách nhìn mặt chữ.
- Ba mức: **từ đơn → cụm nói → câu**. Đáp án nhiễu lấy cùng mức.
- Trả lời xong mới hiện chữ Hàn, phiên âm, và **tách từng từ — bấm vào từ nào nghe riêng từ đó**, để
  người học khoanh đúng chỗ mình nghe hụt thay vì phát lại cả câu.

### Dùng chung cho mọi khu vực

- **Bảng chữ Hangul tra cứu** và **nút âm thanh** luôn với tới được, ở khu vực nào cũng vậy.
- **Tiến độ tách riêng từng khu vực**: luyện viết không làm xê dịch tiến độ trắc nghiệm, và ngược lại.
- **Mở lại đúng chỗ đang dở** — khu vực cuối cùng bạn ở được ghi nhớ.
- **Phím tắt trên desktop**, dark mode theo cài đặt hệ thống, tôn trọng `prefers-reduced-motion`.

## Bắt đầu

Yêu cầu **Node.js 22.10 trở lên**.

Bản build và dev server chạy được trên Node 20, nhưng `npm run test` thì không: `jsdom@30` kéo theo
`undici@8`, mà gói này gọi `worker_threads.markAsUncloneable` — hàm chỉ có từ Node 22.10. Trên Node
20 toàn bộ test sẽ đổ với `TypeError: webidl.util.markAsUncloneable is not a function`, và thông báo
đó không hề gợi ý rằng nguyên nhân là phiên bản Node.

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

0. Chọn khu vực học ở thanh dưới cùng: **Học chữ**, **Viết**, **Ghép chữ** hay **Nghe**.
1. Trong **Học chữ**, chọn tab `Chữ → Âm` hoặc `Âm → Chữ`.
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

Nút loa tuân theo cùng một nguyên tắc: **nghe mà lộ đáp án thì tính là có trợ giúp**. Ở tab
`Chữ → Âm`, nghe `가` chính là được cho luôn đáp án `g`, nên bấm nghe trước khi trả lời sẽ bị tính.
Ở tab `Âm → Chữ` thì không — nghe âm không hé lộ chữ nào viết ra âm đó, nên bạn cứ nhìn, nghe kỹ,
rồi mới chọn.

Nếu muốn tự kiểm tra nghiêm túc, bật **Ẩn bảng trong chế độ kiểm tra** trong phần cài đặt: nút mở bảng
bị khóa suốt phiên và mọi câu trả lời đều là tự lực. Tùy chọn này mặc định tắt.

### Phím tắt (desktop)

| Phím            | Tác dụng                                                       |
| --------------- | -------------------------------------------------------------- |
| `1`–`4`         | Chọn đáp án tương ứng                                          |
| `←` `→`         | Đổi tab con trong khu vực đang mở (khóa khi đang hiện kết quả) |
| `Shift`+`←` `→` | Chuyển sang khu vực học khác                                   |
| `R`             | Bật/tắt chế độ ôn chữ sai                                      |

Phím mũi tên không kèm `Shift` thuộc về khu vực đang mở, còn kèm `Shift` thì luôn là chuyển khu vực —
nhờ vậy không bao giờ có hai nghĩa cùng lúc. Phím tắt bị vô hiệu khi hộp thoại xác nhận đang mở.

### Âm thanh

Nút **Âm thanh** dùng Web Speech API với locale `ko-KR`. Trình duyệt chỉ đọc khi bạn trả lời đúng
hoặc khi bạn tự bấm nút loa — ứng dụng không tự phát liên tục.

Điều quan trọng: ứng dụng **không bao giờ đưa chữ cái rời cho bộ đọc**. Ký tự `ㄱ` (U+3131) bị các
bộ tổng hợp giọng nói đọc thành _tên chữ cái_ — "기역" — hoặc bỏ qua hẳn. Vì vậy mỗi chữ mang theo
một âm tiết thật trong trường `demoSyllable` (`ㄱ` → `가`, `ㅏ` → `아`), và đó mới là thứ được phát.
Chữ latin (`g`, `eo`) chỉ để nhìn, không bao giờ được đọc lên.

Nếu máy bạn không cài giọng tiếng Hàn, nút sẽ bị mờ và ứng dụng **im lặng** thay vì đọc Hangul bằng
giọng tiếng Anh — nghe như vậy còn hại hơn không nghe gì. Danh sách giọng chỉ biết được bất đồng bộ,
nên `useSpeech` chờ sự kiện `voiceschanged`, đồng thời vẫn poll và có timeout, vì sự kiện đó có thể
bắn ra với danh sách rỗng hoặc không bao giờ bắn.

Trong bảng tra cứu, mỗi ô có dấu loa nhỏ: chạm vào ô là nghe. Ô chi tiết bên dưới có thêm nút
**Chậm** phát ở tốc độ 0.55 để nghe rõ từng chi tiết.

## Kiến trúc

```text
src/
  components/     Thành phần giao diện (chỉ nhận props và vẽ, không chứa logic học)
    ActionButton.tsx   Một nút hành động, dùng chung cho hai hàng nút
    AnswerButton.tsx   Một ô đáp án + trạng thái đúng / có trợ giúp / sai
    AppShell.tsx       Khung trang: header, slot cài đặt, slot nội dung, footer, slot nav
    ChartSurface.tsx   Hai vỏ bọc của bảng tra cứu: cột desktop và drawer mobile
    ConfirmDialog.tsx  Modal xác nhận tự viết
    GlobalActions.tsx  Nút dùng chung mọi khu vực: bảng tra, âm thanh, xóa tiến độ
    HangulChart.tsx    Lưới 40 chữ + ô chi tiết cách đọc
    QuizActions.tsx    Nút chỉ thuộc phần Học chữ: bắt đầu lại, ôn chữ sai
    QuizCard.tsx       Thẻ câu hỏi + vùng aria-live
    SectionNav.tsx     Chuyển giữa 4 khu vực — là <nav>, KHÔNG phải tablist thứ hai
    SettingsPanel.tsx  Bật/tắt nhóm chữ và chế độ kiểm tra
    StatsPanel.tsx     Thống kê phiên + thanh tiến độ
    StrokePad.tsx      Vùng viết SVG: vệt mờ, số nét, thu nét người dùng vẽ
    TabBar.tsx         Tab con TRONG một khu vực (tự ẩn khi chỉ có một tab)
    icons.tsx          Icon SVG nội tuyến (không thêm thư viện)
  data/
    hangul.ts       40 chữ cái: RR chuẩn, âm tiết mẫu để đọc, quy luật âm đầu/âm cuối
    sections.ts     Nhãn 4 khu vực học
    sentences.ts    30 câu nghe hiểu, ba mức, kèm nghĩa và cách tách từ
    strokes.ts      Toạ độ đường tim nét của cả 40 chữ, đúng thứ tự viết
    syllables.ts    Âm tiết để luyện ghép, kèm nghĩa tiếng Việt
    tabs.ts         Nhãn hai tab của phần Học chữ
  hooks/          Nơi giữ trạng thái
    useChart.ts             Bảng tra cứu — toàn cục, nhưng chỉ Học chữ tính là trợ giúp
    useDialogBehavior.ts    Bẫy focus, Esc, trả focus — dùng chung cho modal và drawer
    useKeyboardShortcuts.ts Phím tắt, gắn vào window
    useLearningTelemetry.ts Bộ đếm phiên học trong bộ nhớ cho sự kiện analytics
    useLettersQuiz.ts       Toàn bộ dây nối của phần Học chữ
    useListening.ts         Chọn câu, sinh đáp án, chấm, đếm số lần nghe lại
    useMediaQuery.ts        Phân biệt desktop / mobile khi CSS không đủ
    usePersistedState.ts    Đọc/ghi LocalStorage
    useQuiz.ts              Vòng đời câu hỏi: sinh, đánh dấu trợ giúp, trả lời, chuyển tiếp
    useSectionNav.ts        Khu vực đang mở + chiều học của phần Học chữ
    useSpeech.ts            Máy này có đọc được tiếng Hàn không — chỉ biết được bất đồng bộ
    useStrokePractice.ts    Nét nào đang tới, chấm điểm, ghi kết quả
    useSyllableBuilder.ts   Âm tiết đang hỏi, các chữ đã chọn, kiểm tra
  lib/            Hàm thuần, không biết gì về React
    analytics.ts    Lớp adapter analytics — nơi duy nhất biết tới Vercel
    progress.ts     Tính độ chính xác, điều kiện "đã thuộc", cập nhật tiến độ
    quiz.ts         Trọng số thích ứng, chọn chữ kế tiếp, sinh đáp án, lọc chữ sai
    speech.ts       Bọc Web Speech API — chọn giọng, né các lỗi đã biết của trình duyệt
    storage.ts      Đọc/ghi và **kiểm tra** dữ liệu LocalStorage
    stroke.ts       Chấm nét viết tay: 5 cửa độc lập + phát hiện vẽ ngược
    syllable.ts     Ghép/tách âm tiết và phiên âm RR — bọc es-hangul
  sections/       Tầng lắp ghép: nối hook vào component, mỗi khu vực một file
    LettersSection.tsx
    ListeningSection.tsx
    SyllableSection.tsx
    WritingSection.tsx
  test/
    appHarness.ts   Helper thao tác giao diện dùng chung cho test cấp ứng dụng
    fixtures.ts     PRNG có seed, factory tiến độ, transport analytics ghi lại
    setup.ts        Cấu hình jsdom cho Vitest + vá PointerEvent mà jsdom không có
  types/index.ts    Kiểu dùng chung
  App.tsx           Chọn khu vực nào đang hiện và nối các mảnh lại
  main.tsx          Gốc ứng dụng — nơi gắn <Analytics /> và <SpeedInsights />
```

Nguyên tắc phân tách: `lib/` là các hàm thuần, không biết gì về React; `hooks/` giữ trạng thái;
`components/` chỉ nhận props và vẽ; `sections/` là chỗ duy nhất state gặp markup — mỗi khu vực học
một file. Nhờ vậy toàn bộ thuật toán học (chọn câu hỏi, chấm nét viết, ghép âm tiết) kiểm thử được
mà không cần render gì cả.

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
  version: 3;
  progress: Record<string, CharacterProgress>; // Học chữ
  strokes: Record<string, StrokeProgress>; // Viết   — khóa theo id chữ
  syllables: Record<string, SyllableProgress>; // Ghép  — khóa theo chính âm tiết
  listening: Record<string, ListeningProgress>; // Nghe  — khóa theo id câu
  settings: { enabledCategories: string[]; soundEnabled: boolean; testMode: boolean };
  bestStreak: number;
  ui: { section: 'letters' | 'writing' | 'syllables' | 'listening' };
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

Bốn khu vực giữ tiến độ ở bốn map **ngang hàng nhau**, không lồng vào trong `progress`. Nhờ vậy dữ
liệu version 2 nằm nguyên vẹn trong blob version 3 — người đang học dở bảng chữ cái không mất gì khi
nâng cấp. `ui` tách khỏi `settings` vì vị trí đang xem không phải là lựa chọn của người dùng.

`isKnownSentenceId` đặc biệt quan trọng: **kho câu sẽ thay đổi giữa các bản phát hành**, và lặng lẽ
bỏ id không còn tồn tại đúng là hành vi mong muốn.

### Nâng cấp từ version 2

Thuần **cộng thêm**. Ba khu vực mới chưa từng tồn tại trước version 3 nên không có gì để chuyển đổi —
chúng đơn giản bắt đầu rỗng, còn `progress`, `settings` và `bestStreak` giữ nguyên từng byte.

### Nâng cấp từ version 1

Version 1 chưa có bảng tra cứu, nên mọi câu trả lời đã ghi đều là tự lực. Khi đọc dữ liệu cũ:

| Version 1              | Version 2 trở đi                 |
| ---------------------- | -------------------------------- |
| `correctCount`         | `unassistedCorrectCount`         |
| `currentCorrectStreak` | `currentUnassistedCorrectStreak` |
| —                      | `assistedCorrectCount` = 0       |
| —                      | `settings.testMode` = `false`    |

`lastResult` được suy ra từ dữ liệu cũ (còn chuỗi đúng → `correct-unassisted`, từng sai → `incorrect`)
để chữ đã học không bị mất mức ưu tiên sau khi nâng cấp. Dữ liệu nằm ở khóa cũ được đọc, chuyển đổi,
ghi sang khóa mới, rồi khóa cũ mới bị xóa — không mất tiến độ nào.

Nút **Bắt đầu lại phiên** chỉ xóa thống kê phiên của phần Học chữ, giữ nguyên tiến độ dài hạn. Nút
**Xóa toàn bộ tiến độ** mở hộp thoại xác nhận tự viết (không dùng `confirm()` của trình duyệt) và xóa
sạch dữ liệu của **cả bốn khu vực**.

## Analytics

Ứng dụng gửi một ít dữ liệu sử dụng ẩn danh về Vercel để hiểu người học dùng sản phẩm thế nào. Không
có đăng nhập, không có backend, không có cơ sở dữ liệu — và tiến độ học **không bao giờ rời khỏi máy
bạn**.

### Cài đặt

Hai gói được dùng:

```bash
npm install @vercel/analytics @vercel/speed-insights
```

Đây là dự án Vite + React, không phải Next.js, nên phải nhập từ đường dẫn `/react`:

```tsx
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
```

Cả hai được gắn đúng một lần ở `src/main.tsx` — gốc thật của ứng dụng, không phải trong `App.tsx`. Nhờ
vậy `App` và toàn bộ test component không hề nạp gói của Vercel. Hai component này không vẽ gì ra màn
hình và tự tắt khi chạy ngoài môi trường Vercel, nên `npm run dev`, test và build đều không bị ảnh
hưởng.

Sau khi deploy, cần bật thủ công trong dashboard Vercel: tab **Analytics** → _Enable_, và tab **Speed
Insights** → _Enable_. Chưa bật thì script vẫn nạp nhưng không có báo cáo nào.

### Kiến trúc

`src/lib/analytics.ts` là **nơi duy nhất** biết tới Vercel Analytics. Component và hook chỉ gọi các hàm
mang nghĩa nghiệp vụ (`trackQuizAnswer`, `trackChartOpened`…), nên đổi nhà cung cấp sau này chỉ cần
sửa một file.

Bên trong là một lớp transport thay được:

- Mặc định ở production: gọi `track()` của `@vercel/analytics`.
- Mặc định khi chạy Vitest (`import.meta.env.MODE === 'test'`): `null`, tức là không làm gì. Không test
  nào phải mock gói của Vercel.
- Test nào cần quan sát sự kiện thì tự gắn transport ghi lại bằng `recordAnalytics()`.

Mọi lần gửi đều nằm trong `try/catch`. Analytics hỏng thì người học không bao giờ biết.

`src/hooks/useLearningTelemetry.ts` giữ bộ đếm phiên học trong bộ nhớ (`useRef`) để phát hai sự kiện
bắt đầu/kết thúc phiên. Nó **không** ghi vào LocalStorage và biến mất khi tải lại trang.

`lib/quiz.ts`, `lib/progress.ts` và hàm tính trọng số vẫn thuần tuyệt đối — không có lời gọi analytics
nào trong đó.

### Sự kiện được thu thập

| Sự kiện                       | Khi nào                                                                                 | Thuộc tính                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `quiz_answer`                 | Mỗi lần trả lời một câu                                                                 | `direction`, `category`, `result`, `reviewMode`, `testMode` |
| `character_mastered`          | Đúng lúc một chữ chuyển sang "đã thuộc"                                                 | `category`                                                  |
| `chart_opened`                | Người dùng chủ động mở bảng tra cứu                                                     | `direction`, `mobile`                                       |
| `review_started`              | Bật chế độ ôn chữ sai                                                                   | `mistakeBucket`: `1-5` \| `6-10` \| `11+`                   |
| `test_mode_started`           | Bật chế độ kiểm tra                                                                     | không có                                                    |
| `learning_session_started`    | Câu trả lời đầu tiên của một phiên                                                      | không có                                                    |
| `learning_session_completed`  | Người dùng bấm "Bắt đầu lại phiên" hoặc xóa tiến độ, sau khi đã trả lời ít nhất một câu | `answers`, `accuracy`, `assisted` (đều đã gom nhóm)         |
| `learning_categories_changed` | Bật/tắt một nhóm chữ                                                                    | `enabledCount`                                              |
| `section_changed`             | Chuyển sang khu vực học khác                                                            | `section`                                                   |
| `stroke_attempt`              | Viết xong một chữ                                                                       | `category`, `clean` (không nét nào phải làm lại)            |
| `syllable_built`              | Kiểm tra một âm tiết đã ghép và ghép đúng                                               | `hasBatchim`, `correct`                                     |
| `listening_answer`            | Chọn nghĩa cho một câu nghe                                                             | `level`, `correct`, `replayed`                              |

Số liệu phiên học được gom nhóm trước khi rời khỏi trình duyệt, không bao giờ gửi con số chính xác:

- `answers`: `1-9` | `10-24` | `25-49` | `50+`
- `accuracy`: `<50` | `50-69` | `70-84` | `85+` — tính theo _độ chính xác tự lực_, tức số câu đúng
  không tra bảng chia cho tổng số câu đã trả lời
- `assisted`: `0` | `1-4` | `5+`

Sự kiện chỉ phát khi người dùng thật sự hành động. React render lại không sinh thêm sự kiện, và
`character_mastered` chỉ phát đúng một lần ở thời điểm chuyển trạng thái chứ không phát lại mỗi lần
trả lời đúng một chữ đã thuộc.

`quiz_answer` **không** mang thuộc tính khu vực, dù giờ đã có bốn khu vực: sự kiện đó chỉ phát ra từ
phần Học chữ, nên thêm vào chỉ là gắn một hằng số vào mọi câu trả lời. Muốn biết người học đi lại
giữa các khu vực thì đọc `section_changed`. Có một test khóa cứng đúng tập khóa của `quiz_answer` để
điều này không bị vô tình phá.

### Quyền riêng tư

Ứng dụng vẫn ẩn danh và local-first. Những thứ **không bao giờ** được gửi đi:

- nội dung LocalStorage,
- tiến độ học chi tiết của từng chữ,
- định danh người dùng cố định, cookie, hay dấu vân tay trình duyệt,
- chữ Hangul cụ thể đang được hỏi,
- lịch sử đúng/sai theo từng chữ,
- bất cứ thông tin nào cho phép dựng lại quá trình học của một cá nhân.

Chỉ có metadata gộp ở mức nhóm chữ và giá trị đã gom nhóm được gửi đi. Toàn bộ tiến độ học nằm trong
LocalStorage của trình duyệt bạn; xóa dữ liệu trang web là xóa sạch. Không cần tài khoản, không cần
đăng nhập, không có backend nào lưu gì về bạn.

Nếu muốn không gửi gì cả, gỡ hai dòng `<Analytics />` và `<SpeedInsights />` trong `src/main.tsx` —
phần còn lại của ứng dụng chạy y nguyên.

## Kiểm thử

137 test bằng Vitest:

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
- `src/lib/analytics.test.ts` (16) — từng hàm gom nhóm, hình dạng payload của mọi sự kiện, và transport
  an toàn (im lặng mặc định, nuốt lỗi, gỡ được).
- `src/App.analytics.test.tsx` (25) — sự kiện phát ra từ thao tác thật: một câu trả lời một sự kiện,
  render lại không nhân đôi, câu có trợ giúp báo đúng `result`, `character_mastered` chỉ phát lúc
  chuyển trạng thái, `chart_opened` một lần mỗi lần mở, `review_started` / `test_mode_started` chỉ khi
  bật, vòng đời phiên học, và analytics hỏng không làm hỏng bài quiz.

Các test thuần dùng PRNG có seed (`src/test/fixtures.ts`) nên kết quả lặp lại được. Helper thao tác
giao diện dùng chung nằm ở `src/test/appHarness.ts`.

Test không đụng tới cài đặt bên trong gói của Vercel — chỉ kiểm tra lớp adapter và cách ứng dụng gọi
nó.

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

Vite · React 19 · TypeScript · Tailwind CSS v4 · Vitest · ESLint · Prettier · Vercel Web Analytics ·
Vercel Speed Insights. Không dùng thư viện component, không backend, không cơ sở dữ liệu, không đăng
nhập.

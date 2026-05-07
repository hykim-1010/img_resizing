# PROJECT STATUS — IMG Resizer

> 마지막 업데이트: 2026-04-17

---

## 프로젝트 목적

웹 운영 기획자를 위한 **브라우저 기반 이미지 리사이징 툴**.
모든 이미지 처리는 Canvas API로 브라우저 내에서 완결되며, 서버 통신 없음.

- 스택: React + Vite + Tailwind CSS + Canvas API
- 로컬 실행: `npm run dev`
- 빌드: `npm run build`

---

## 현재 완료된 것

### Step 1 — 프로젝트 초기화
- React 19 + Vite 8 + Tailwind CSS 4 세팅 완료
- CLAUDE.md 기준 디렉토리 구조 및 빈 파일 생성 완료
- App.jsx: Header + 전체 레이아웃 골격 (업로드 / 설정+미리보기 2단 / 즐겨찾기)

### Step 2 — 이미지 업로드
- `Uploader.jsx` 구현 완료
  - 드래그 앤 드롭 + 클릭 업로드
  - 드래그 상태별 UI (기본 / dragover / 페이지 전체 dragover)
  - 업로드 완료 시 원본 미리보기 + 파일명 + 원본 사이즈 표시
  - 미지원 형식 드롭 시 토스트 메시지
  - 이미지 상태는 App.jsx에서 관리

### Step 3 — Canvas 리사이징 로직
- `useImageResize.js` 구현 완료
  - 모드 ① 가로 기준: 가로 고정, 세로 비율 자동
  - 모드 ② 세로 기준: 세로 고정, 가로 비율 자동
  - 모드 ③ 가로×세로 지정 (기본 여백 / fitHeight 크롭 / fitWidth 크롭)
  - `hasMargin` 반환 (후처리 버튼 노출 조건)
  - JPG 배경 흰색 처리, quality 적용

---

## 아직 안 된 것

### Step 4 — 설정 UI + 결과 미리보기 + 다운로드
- `ResizeSettings.jsx` — 미구현 (현재 `return null`)
- `Preview.jsx` — 미구현 (현재 `return null`)
- `Downloader.jsx` — 미구현 (현재 `return null`)
- App.jsx와 `useImageResize` 훅의 연결 미완

### Step 5 — 즐겨찾기 CRUD
- `useFavorites.js` — 미구현 (현재 빈 객체 반환)
- `Favorites.jsx` — 미구현 (현재 `return null`)
- localStorage 연동 미완

### Step 6 — UI 다듬기 및 반응형
- 모바일(~768px) 단일 컬럼 레이아웃 미적용
- 토스트 위치 (현재 하단 중앙 → 우하단 고정으로 변경 필요)
- 빈 상태 안내 UX 미완
- 파비콘 및 페이지 타이틀 미적용

### 기타
- 에러 처리 전반 미완 (canvas.toBlob 실패, 잘못된 입력값 등)
- 관리자 페이지 연결 없음 (현재 범위 외)

---

## 주의할 점

- 환경변수는 `.env`에 있으며 GitHub에 올리지 않음 (`.gitignore` 처리 확인 필요)
- 이미지 처리 로직은 반드시 `useImageResize` 훅 안에서만 작성, 컴포넌트 직접 작성 금지
- 즐겨찾기 데이터는 `useFavorites` 훅을 통해서만 읽고 씀

---

## 다음 작업 우선순위

1. **코드 구조 파악** — `src/` 전체 흐름 재확인 (App ↔ 훅 ↔ 컴포넌트 연결)
2. **실행 방법 점검** — `npm run dev` 정상 실행 및 업로드 기능 동작 확인
3. **우선순위 높은 버그 3개 정리** — Step 3까지 구현된 코드 기준으로 식별
4. **배포 전 체크리스트 작성** — Step 4~6 완료 후 작성 예정

---

## 배포 전 체크리스트 (Step 4~6 완료 후 검토)

- [ ] 모드 ①②③ 리사이징 결과가 올바른지 수동 검증
- [ ] JPG/PNG 각각 quality 적용 후 파일 용량 확인
- [ ] 즐겨찾기 추가·삭제·순서 변경 후 새로고침 시 localStorage 유지 확인
- [ ] 즐겨찾기 클릭 → 설정 자동 적용 → 다운로드 플로우 E2E 확인
- [ ] 모바일(375px) 레이아웃 깨짐 없는지 확인
- [ ] 이미지 미업로드 상태에서 다운로드 버튼 비활성화 확인
- [ ] 미지원 파일 형식 드롭 시 토스트 메시지 노출 확인
- [ ] `npm run build` 빌드 오류 없음 확인
- [ ] 파비콘 및 페이지 타이틀 "IMG Resizer" 확인

# IMG Resizer — Project Rules

## 프로젝트 개요
웹 운영 기획자를 위한 브라우저 기반 이미지 리사이징 툴.
모든 이미지 처리는 Canvas API로 브라우저 내에서 처리한다. 서버 통신 없음.

## 기술 스택
- React + Vite
- Tailwind CSS
- Canvas API (이미지 처리)
- localStorage (즐겨찾기 저장)

## 디렉토리 구조
src/
├── components/
│   ├── Uploader.jsx       # 드래그 앤 드롭 업로드 영역
│   ├── ResizeSettings.jsx # 리사이징 모드 및 설정 UI
│   ├── Preview.jsx        # 결과 미리보기 + 후처리 버튼
│   ├── Downloader.jsx     # 다운로드 버튼
│   └── Favorites.jsx      # 즐겨찾기 목록 및 관리
├── hooks/
│   ├── useImageResize.js  # Canvas 기반 리사이징 로직
│   └── useFavorites.js    # 즐겨찾기 CRUD + localStorage
├── App.jsx
└── main.jsx

## 코딩 규칙
- 컴포넌트는 함수형으로 작성, Props는 명시적으로 구조분해
- 스타일은 Tailwind CSS 클래스만 사용, 인라인 스타일 금지
- Canvas 처리 로직은 useImageResize 훅에만 집중, 컴포넌트에 직접 작성 금지
- 즐겨찾기 데이터는 useFavorites 훅을 통해서만 읽고 씀
- 토스트 메시지는 전역 상태로 관리

## 즐겨찾기 데이터 구조
{
  id: string,           // crypto.randomUUID()
  label: string,        // 사용자 지정 별칭
  width: number,        // 가로 px
  height: number,       // 세로 px (모드 ①②에서는 0으로 저장)
  format: 'jpg'|'png',
  quality: number,      // 1~100
  mode: 1|2|3,          // 리사이징 모드
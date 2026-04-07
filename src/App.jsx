import Uploader from './components/Uploader';
import ResizeSettings from './components/ResizeSettings';
import Preview from './components/Preview';
import Downloader from './components/Downloader';
import Favorites from './components/Favorites';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">IMG Resizer</h1>
          <p className="text-sm text-gray-500 mt-1">
            브라우저에서 바로 이미지를 리사이징하고 최적화하세요 — 서버 전송 없음
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* 업로드 영역 */}
        <section>
          <Uploader onUpload={() => {}} />
        </section>

        {/* 설정 + 미리보기 2단 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ResizeSettings settings={{}} onChange={() => {}} />
          </div>
          <div>
            <Preview imageData={null} />
            <Downloader imageData={null} settings={{}} />
          </div>
        </section>

        {/* 즐겨찾기 영역 */}
        <section>
          <Favorites onApply={() => {}} />
        </section>
      </main>
    </div>
  );
}

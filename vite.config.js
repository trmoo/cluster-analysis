/*! 군집 분석 실험실 (cluster-analysis)
 *  © 2026 티쳐무 · 모든 권리 보유
 *  학교 수업 목적으로만 이용해 주세요. 자세한 내용은 LICENSE 파일을 보세요.
 */
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 빌드 결과에 남길 저작권 배너. `/*!` 로 시작해야 압축해도 지워지지 않는다.
const 배너 = `/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포·상업적 이용을 금합니다. */`;

export default defineConfig({
  base: './',                       // GitHub Pages 하위 경로에서도 열리도록 상대 경로
  plugins: [viteSingleFile()],      // dist/index.html 한 파일로 묶어 더블클릭 실행
  esbuild: { legalComments: 'inline' },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { banner: 배너 } },
  },
});

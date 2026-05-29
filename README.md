# React + TypeScript + Vite

## MS-46 Frontend Performance Notes

Bundle analysis was run with:

```bash
npm run build
npm exec --yes vite-bundle-visualizer -- --template raw-data --output /private/tmp/medsphere-ms46-bundle-analysis.json --open false
```

Measured on May 29, 2026:

| Area | Before MS-46 pass | After MS-46 pass |
| --- | ---: | ---: |
| Startup app JS (`index-*.js`) | 639.79 kB / gzip 200.58 kB | 539.89 kB / gzip 174.25 kB |
| Largest portal page chunk | `ReportBuilderPage` 24.09 kB / gzip 7.91 kB | `ReportBuilderPage` 24.10 kB / gzip 7.87 kB |
| Report chart code | Full `echarts` chunk 588.20 kB / gzip 195.71 kB | Lazy `ReportChart` 23.57 kB / gzip 9.28 kB plus deferred shared ECharts renderer |

Performance work completed:

- Auth pages, portal layouts, and major portal pages are loaded with `React.lazy` and Suspense skeleton fallbacks.
- Heavy widgets are deferred: import wizard, report chart, consultation audio panel, CMS preview, and CMS section editor.
- High-traffic list/table loading states use animated skeleton placeholders instead of text-only waits.
- Pure table/list/card components are memoized, and expensive list/chart computations use `useMemo`.
- Event handlers passed into memoized children were stabilized with `useCallback` in the main filtered/list pages.
- Images include `loading="lazy"` and async decoding.

The production build still reports a large deferred ECharts renderer chunk. That chunk is not part of the startup app bundle; it loads only when chart routes or chart components are requested.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

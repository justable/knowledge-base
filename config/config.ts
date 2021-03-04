import path from 'path';
import { defineConfig } from 'dumi';
import navs from './navs';

export default defineConfig({
  title: 'knowledge-base',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  outputPath: 'docs-dist',
  mode: 'site',
  alias: {
    '@images': path.resolve(__dirname, '../public/images'),
  },
  resolve: {
    includes: ['docs', 'src'],
  },
  extraBabelPlugins: [
    [
      'import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
      },
    ],
  ],
  base: '/knowledge-base',
  publicPath: '/knowledge-base/',
  exportStatic: {},
  styles: [
    'global.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css',
  ],
  navs,
  menus: {
    '/components': [
      {
        title: '数据录入',
        children: [
          'components/Modal/index.md',
          'components/Message/index.md',
          'components/TextEllipsis/index.md',
        ],
      },
      {
        title: '反馈',
        children: [
          'components/AvatarCutter/index.md',
          'components/Clipboard/index.md',
          'components/FileUploader/index.md',
        ],
      },
    ],
  },

  // more config: https://d.umijs.org/config
});

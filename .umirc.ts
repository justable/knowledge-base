import path from 'path';
import { defineConfig } from 'dumi';

export default defineConfig({
  title: 'knowledge-base',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  outputPath: 'docs-dist',
  mode: 'site',
  alias: {
    '@images': path.resolve(__dirname, 'public/images'),
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
  navs: [
    {
      title: '博客',
      path: '/blog',
    },
    {
      title: '前端',
      // 可通过如下形式嵌套二级导航菜单，目前暂不支持更多层级嵌套：
      children: [
        { title: 'javascript', path: '/javascript' },
        { title: 'typescript', path: '/typescript' },
        { title: 'react', path: '/react' },
        { title: 'vue', path: '/vue' },
        { title: 'css', path: '/css' },
        { title: 'jest', path: '/jest' },
        { title: 'webpack', path: '/webpack' },
        { title: 'rollup', path: '/rollup' },
        { title: 'browser', path: '/browser' },
        { title: 'babel', path: '/babel' },
      ],
    },
    {
      title: '后端',
      children: [
        { title: 'nodejs', path: '/nodejs' },
        { title: 'java', path: '/java' },
      ],
    },
    {
      title: '计算机基础',
      children: [
        { title: '计算机网络', path: '/network' },
        { title: '计算机原理', path: '/computer' },
        { title: 'linux', path: '/linux' },
      ],
    },
    {
      title: '个人项目',
      path: '/project',
    },
    {
      title: '其他',
      children: [
        { title: '产品设计', path: '/productdesign' },
        { title: '编程规范', path: '/programmingprinciples' },
        { title: 'english', path: '/english' },
        { title: 'unread', path: '/unread' },
        { title: 'windows', path: '/windows' },
        { title: 'mac', path: '/mac' },
      ],
    },
    {
      title: '组件',
      path: '/components',
    },
    {
      title: 'GitHub',
      path: 'https://github.com/justable/knowledge-base',
    },
  ],
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

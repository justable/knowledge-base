const nav = [
  {
    title: '博客',
    path: '/blog',
  },
  {
    title: '前端',
    path: '/js',
    children: [
      { title: 'Javascript', path: '/js' },
      { title: 'Typescript', path: '/typescript' },
      { title: 'React', path: '/react' },
      { title: 'Vue', path: '/vue' },
      { title: 'CSS', path: '/css' },
      { title: 'Jest', path: '/jest' },
      { title: 'Webpack', path: '/webpack' },
      { title: 'Rollup', path: '/rollup' },
      { title: 'Browser', path: '/browser' },
      { title: 'Babel', path: '/babel' },
      { title: '微信', path: '/weixin' },
    ],
  },
  {
    title: '后端',
    path: '/nodejs',
    children: [
      { title: 'Nodejs', path: '/nodejs' },
      { title: 'Java', path: '/java' },
      { title: '数据库', path: '/db' },
    ],
  },
  {
    title: '计算机基础',
    path: '/network',
    children: [
      { title: '计算机网络', path: '/network' },
      { title: '计算机原理', path: '/computer' },
      { title: 'Linux', path: '/linux' },
      { title: '算法', path: '/algorithm' },
      { title: 'Docker', path: '/docker' },
    ],
  },
  {
    title: '个人项目',
    path: '/project',
  },
  {
    title: '其他',
    path: '/productdesign',
    children: [
      { title: '产品设计', path: '/productdesign' },
      { title: '编程规范', path: '/programmingprinciples' },
      { title: 'English', path: '/english' },
      { title: 'Unread', path: '/unread' },
      { title: 'Windows', path: '/windows' },
      { title: 'Mac', path: '/mac' },
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
];

export default nav;

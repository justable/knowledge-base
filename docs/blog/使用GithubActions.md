# 使用 GithubActions

## 概述

Github Actions 是个 CI 工具，我们可以利用它在 git push 的时候同步部署到 Github Page 上。当然 Github Actions 的作用不仅于此。

## 配置 Github Page

- 创建`.github/workflows/gh-pages.yml`
- 如下配置即可

```yaml
name: github pages
on:
  push:
    branches:
      - main # default branch
jobs:
  deploy:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run docs:build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GH_TOKEN }}
          publish_dir: ./docs-dist
```

其中的`secrets.GH_TOKEN`是在仓库的[/Settings/Secrets](https://github.com/justable/knowledge-base/settings/secrets/actions)中配置的。`peaceiris/actions-gh-pages@v3`会自动为该仓库生成一个 ghpage 分支，我们就可以通过`[yourname].github.io/[仓库名]`访问了。

有时我们希望使用 yarn 代替 npm，可以做如下修改：

```yaml
name: github pages
on:
  push:
    branches:
      - main # default branch
jobs:
  deploy:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: '12.x'
      - name: Get yarn cache directory path
        id: yarn-cache-dir-path
        run: echo "::set-output name=dir::$(yarn cache dir)"
      - uses: actions/cache@v2
        id: yarn-cache # use this to check for `cache-hit` (`steps.yarn-cache.outputs.cache-hit != 'true'`)
        with:
          path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-
      - run: |
          npm install -g yarn
          yarn install
      - run: yarn docs:build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GH_TOKEN }}
          publish_dir: ./docs-dist
```

下面是另一个把 github pages 部署到其他仓库的例子：

```yaml
# This is a basic workflow to help you get started with Actions

name: Blog CI

# Controls when the action will run. Triggers the workflow on push or pull request
# events but only for the master branch
on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master
  repository_dispatch:

# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - uses: actions/checkout@v2

      # Setup node
      - uses: actions/setup-node@v1
        with:
          node-version: '12.x'

      - name: Get yarn cache directory path
        id: yarn-cache-dir-path
        run: echo "::set-output name=dir::$(yarn cache dir)"

      # Cache node modules
      - uses: actions/cache@v2
        id: yarn-cache # use this to check for `cache-hit` (`steps.yarn-cache.outputs.cache-hit != 'true'`)
        with:
          path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-

      # Install dependencies
      - run: |
          npm install -g yarn
          npm install -g hexo-cli
          npm install -g yuque-hexo
          yarn install
          YUQUE_TOKEN=${{ secrets.YUQUE_TOKEN }} yuque-hexo sync

      # Generate files
      - run: hexo generate

      # Deploy blog
      - run: |
          git clone "https://${{ secrets.GH_REF }}" deploy_git
          mv ./deploy_git/.git ./public/
          cd ./public
          git config user.name "justable"
          git config user.email "1214327383@qq.com"
          git add .
          git commit -m "GitHub Actions Auto Builder at $(date +'%Y-%m-%d %H:%M:%S')"
          git push --force --quiet "https://${{ secrets.GH_TOKEN }}@${{ secrets.GH_REF }}" master:master
```

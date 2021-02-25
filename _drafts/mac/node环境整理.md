## brew

详细命令可以执行`man brew`查看，在 mac 中可以使用这种格式的命令`$(brew --cache)$(brew --prefix)`，替换镜像源参考[这里](https://mirrors.tuna.tsinghua.edu.cn/help/homebrew/)。

- 安装 brew：`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"`
- 卸载 brew：`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/uninstall.sh)"`
- 显示 homebrew 位置：brew --repository => /usr/local/Homebrew，其实是个本地 git 仓库，brew 安装 formula 的原理也是拉取 git 仓库
- 显示 Cellar 位置：brew --cellar => /usr/local/Cellar，这里是 formula 真实的安装路径
- 显示 formula 安装位置：brew --prefix formula => /usr/local/opt/formula，这里是指向 Cellar 的符号链接的位置
- 显示 formula 的路径：brew formula formula => /usr/local/Homebrew/Library/Taps/homebrew/homebrew-core/Formula
- 清华镜像源：https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git，https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git
- 中科大镜像源：https://mirrors.ustc.edu.cn/brew.git，https://mirrors.ustc.edu.cn/homebrew-core.git
- 切换回默认镜像源：https://mirrors.tuna.tsinghua.edu.cn/help/homebrew/
- diy 安装的需要 brew link 手动关联到 Cellar 目录： brew diy -h
- 移除没用的 symlinks：brew prune -n formula
- link 指定的 formula：brew link -n formula，会在系统的/usr/local/bin 目录增加指定的 formula 的可执行命令的符号链接，指向 Cellar 的安装目录的 bin
- unlink 指定的 formula：brew unlink -n formula
- 显示 brew cache 即 formula 的下载包的存放位置：brew --cache
- 查询 services 相关命令：brew services -h
- 查询 cask 相关命令：brew cask -h

## nvm

具体参考[这里](https://github.com/nvm-sh/nvm#installing-and-updating)，官方不推荐使用 brew 安装。

### 安装

1. `git clone https://github.com/nvm-sh/nvm.git ~/.nvm`
2. 切到最新分支`git checkout v0.35.3`
3. 执行`. nvm.sh`

接着添加下面配置：

```shell
# .bash_profile
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

### 卸载

1. `rm -rf "$NVM_DIR"`

接着删除以下配置：

```shell
# .bash_profile
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
[[ -r $NVM_DIR/bash_completion ]] && \. $NVM_DIR/bash_completion
```

## nrm

npm install -g nrm

## yarn

curl -o- -L https://yarnpkg.com/install.sh | bash

## FAQ

- `/bin/bash -c`的作用

让 bash 将一个字符串作为完整的命令来执行，同`/usr/bin/ruby -e`。

- 如何把自己安装的软件关联到 brew 中

brew 的所有安装文件会放在 Cellar 目录下，然后在系统 bin 目录符号链接到 Cellar 目录中，所以我们把自己安装的软件放到 Cellar 中，在使用 brew link 进行关联。

- 安装 brew 时出错 Failed during: /usr/local/bin/brew update --force

删除`~/Library/Caches/Homebrew/portable-ruby-2.3.3.leopard_64.bottle.1.tar.gz`重新安装

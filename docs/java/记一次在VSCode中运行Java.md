# 记一次在 VSCode 中运行 Java

> 以 Mac OS 为例

## 配置过程

> 配置过程详见[官方文档](https://code.visualstudio.com/docs/java/java-tutorial#_settings-for-the-jdk)。

1. 安装 Java 在 VSCode 中的扩展包`Java Extension Pack`。

2. 下载 jdk，建议下载 jdk11+，`Java Extension Pack`要求 jdk11+。官网下载网速很慢，可以在[清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/AdoptOpenJDK/15/jdk/x64/mac/)下载。系统默认安装在`/Library/Java/JavaVirtualMachines/adoptopenjdk-15.jdk/Contents/Home`下，然后在`~/.bash_profile` 中增加`export JAVA_HOME=/Library/Java/JavaVirtualMachines/adoptopenjdk-15.jdk/Contents/Home`。VSCode 的 User Setting 增加：

```json
{
  "java.home": "/Library/Java/JavaVirtualMachines/adoptopenjdk-15.jdk/Contents/Home"
}
```

上面配置是指定 Java Language Server 启动所使用的 jdk，如果不指定，会自动按下面顺序搜索：

- the JDK_HOME environment variable
- the JAVA_HOME environment variable
- on the current system path

```json
{
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-1.8",
      "path": "/Library/Java/JavaVirtualMachines/jdk1.8.0_144.jdk/Contents/Home"
    },
    {
      "name": "JavaSE-11",
      "path": "/usr/local/jdk-11.0.3",
      "sources": "/usr/local/jdk-11.0.3/lib/src.zip",
      "javadoc": "https://docs.oracle.com/en/java/javase/11/docs/api"
    },
    {
      "name": "JavaSE-15",
      "path": "/Library/Java/JavaVirtualMachines/adoptopenjdk-15.jdk/Contents/Home",
      "default": true
    }
  ]
}
```

上面配置可以指定本机所有 jdk 版本，设置`default: true`的为编译项目时所使用的版本。

其他配置：

```json
{
  "java.format.enabled": true,
  "java.format.onType.enabled": true,
  "java.format.comments.enabled": true,
  "java.completion.enabled": true,
  "java.completion.guessMethodArguments": true,
  // 支持同时运行多个java
  "java.debug.settings.console": "externalTerminal",
  "java.jdt.ls.vmargs": "-XX:+UseParallelGC -XX:GCTimeRatio=4 -XX:AdaptiveSizePolicyWeight=90 -Dsun.zip.disableMemoryMapping=true -Xmx1G -Xms100m -javaagent:\"c:\\Users\\12143\\.vscode\\extensions\\gabrielbb.vscode-lombok-1.0.1\\server\\lombok.jar\"",
  "editor.suggestSelection": "first",
  "vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue",
  "redhat.telemetry.enabled": true,
  "java.debug.settings.console": "externalTerminal",
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "java.configuration.updateBuildConfiguration": "interactive"
}
```

3. 安装 Maven，我安装在了`/Users/zhuzy/java/apache-maven-3.6.3`。配置 User Setting：

```json
{
  // 指定maven的settings.xml
  "java.configuration.maven.userSettings": "/Users/zhuzy/java/apache-maven-3.6.3/conf/settings.xml",
  // 指定maven的可执行路径
  "maven.executable.path": "/Users/zhuzy/java/apache-maven-3.6.3/bin/mvn",
  // 配置maven的环境变量，会在maven第一次执行前加入到terminal的session中
  "maven.terminal.customEnv": [
    {
      "environmentVariable": "JAVA_HOME",
      "value": "/Library/Java/JavaVirtualMachines/adoptopenjdk-15.jdk/Contents/Home"
    }
  ]
}
```

4. 配置阿里云 Maven 镜像

在`/Users/zhuzy/java/apache-maven-3.6.3/conf/settings.xml`加入：

```xml
<mirror>
  <id>aliyunmaven</id>
  <mirrorOf>*</mirrorOf>
  <name>阿里云公共仓库</name>
  <url>https://maven.aliyun.com/repository/public</url>
</mirror>
```

5. 安装 Tomcat 扩展包`Tomcat for Java`。

6. 安装 Tomcat，我安装在了`/Users/zhuzy/java/apache-tomcat-9.0.41`。Spring Boot 内置 Tomcat，其实不需要自己下载 Tomcat。

7. 安装扩展包`Spring Boot Extension Pack`，主要方便 Spring Boot 开发。

8. 安装 Lombok 扩展包。

## 默认快捷键

- `⇧⌘P`然后输入`java`查看相关命令
- ⌘+SHIFT+O 或 ⌘+SHIFT+V 自动引入依赖包
- ⌘+. 自动解决问题
- ⌘+F12 进入实现类

以上插件会在 VSCode 的左边新增多个操作区域，请使用 Java Projects 区域管理 Maven，在 Spring Boot Dashboard 会有问题。

## 快速创建项目骨架

![](@images/vscode_create_javaproject.png)

多模块项目：依次生成多个子项目即可，CTRL+SHIFT+P -> java: create project -> maven

## 格式化 java 代码

安装 prettier 扩展，增加如下配置：

```json
{
  "java.format.settings.url": "eclipse-formatter.xml",
  "editor.defaultFormatter": "redhat.java"
}
```

eclipse-formatter.xml 可以通过`⇧⌘P`输入 java: format 生成。

## 自动 import 依赖包

> Alt+Shift+o

```json
{
  "java.actionsOnPaste.organizeImports": true,
  "java.saveActions.organizeImports": true
}
```

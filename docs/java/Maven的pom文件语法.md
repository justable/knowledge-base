# Maven 的 pom 文件语法

- parent 标签

多个项目常常会有共同的依赖，把这些公共依赖提取到 parent 项目中管理，然后在多个项目中通过 parent 标签依赖 parent 项目。比如：

```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>2.5.0-M1</version>
  <relativePath/>
</parent>
```

- repositories 标签

> [阿里远程仓库](https://maven.aliyun.com/mvn/guide)

配置 remote repository。maven 优先在 local repository 查找目标包，如果没找到就会去 remote repository 找，并缓存到 local repository。

比如下面配置会把 grails-core 相关的包的远程仓库改为阿里仓库。

```xml
<repositories>
  <repository>
    <id>grails-core</id>
    <url>https://maven.aliyun.com/repository/grails-core</url>
    <releases>
      <enabled>true</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>
```

- pluginRepositories 标签

配置镜像时别忘了 pluginRepositories 标签，负责拉取 maven 插件。

```xml
<pluginRepositories>
  <repository>
    <id>grails-core</id>
    <url>https://maven.aliyun.com/repository/grails-core</url>
    <releases>
      <enabled>true</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</pluginRepositories>
```

- mirrors 标签

相当于一个拦截器，它会拦截 maven 对 remote repository 的相关请求，把请求里的 remote repository 地址，重定向到 mirror 里配置的地址。

```xml
<mirrors>
  <mirror>
    <id>aliyunmaven</id>
    <mirrorOf>*</mirrorOf>
    <name>阿里云公共仓库</name>
    <url>https://maven.aliyun.com/repository/public</url>
  </mirror>
</mirrors>
```

上面会把所有请求重定向到 aliyun，导致 repositories 配置无效。

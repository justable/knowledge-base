# Maven 的 pom 文件语法

- dependencyManagement 标签

dependencyManagement 只是对依赖包的申明，不会被打包进去。在多模块项目中，dependencyManagement 通常定义在父模块，子模块定义的 dependencies 如果缺省某项属性，就会继承 dependencyManagement 中的属性，比如版本号，这样就可以在父模块中统一管理。

- plugins 标签

plugins 和 dependences 不同，不会被打包进去。

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

设置 remote repository。maven 优先在 local repository 查找目标包，如果没找到就会去 remote repository 找，并缓存到 local repository。

阿里的远程仓库会有多个子仓库，比如下面配置会把远程仓库改为阿里的 public 仓库。

```xml
<repositories>
  <repository>
    <id>public</id>
    <name>aliyun</name>
    <url>https://maven.aliyun.com/repository/public</url>
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
    <id>public</id>
    <name>aliyun</name>
    <url>https://maven.aliyun.com/repository/public</url>
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

> 优先级高于 repositories 标签

相当于一个拦截器，它会拦截 maven 对 remote repository 的相关请求，把请求里的 remote repository 地址，重定向到 mirror 里配置的地址。

```xml
<mirrors>
  <mirror>
    <id>aliyun-public</id>
    <!-- 拦截所有的远程请求 -->
    <mirrorOf>*</mirrorOf>
    <name>阿里云公共仓库</name>
    <url>https://maven.aliyun.com/repository/public</url>
  </mirror>
  <mirror>
    <!-- 推荐只配置这个即可 -->
    <id>aliyun-central</id>
    <mirrorOf>central</mirrorOf>
    <name>阿里云central仓库</name>
    <url>https://maven.aliyun.com/repository/central</url>
  </mirror>
  <mirror>
    <!-- 设置私服 -->
    <id>nexus-snapshots</id>
    <mirrorOf>snapshots</mirrorOf>
    <url>http://47.112.201.193:8081/nexus/content/repositories/snapshots</url>
  </mirror>
</mirrors>
```

`<mirrorOf>*</mirrorOf>`放在前面会导致后面的失效。

这里必须要提醒！mrrior 标签配置多个，生效的只有第一个！只有第一个仓库无法访问的时候，才会使用第二个。注意是无法访问的时候，如果能访问，但是仓库中没有你要找的包，他不会去访问第二个仓库！

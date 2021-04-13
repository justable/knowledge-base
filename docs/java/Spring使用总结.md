# Spring 使用总结

## application.yml

> 常用的核心参数名可以去[官网查询](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#common-application-properties)。

application.yml 会在 Spring Boot 启动时被加载,参数会存放在全局 context 中,可以通过`@Value("${ruoyi.captchaType}")`获取，第三方框架也是通过这种方式获取到我们配置的参数从而正常执行的。

比如下面的配置就会被 mybatis 框架所读取。

```yml
# MyBatis配置
mybatis:
  # 搜索指定包别名
  typeAliasesPackage: com.tingyu.tieba.**.domain
  # 配置mapper的扫描，找到所有的mapper.xml映射文件
  mapperLocations: classpath*:mapper/**/*Mapper.xml
  # 加载全局的配置文件
  configLocation: classpath:mybatis/mybatis-config.xml
```

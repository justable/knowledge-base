# Mybatis 使用简介

## 标签介绍

### resultType

指定 sql 执行结果的 DO。

### resultMap

可以为 sql 执行的结果与 DO 字段之间做自定义的映射关系，不可以和 resultType 同时使用。

## 开启驼峰映射

```xml
<settings>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
</settings>
```

## 自动生成实体对象

使用 mybatis-plus-generator，
sys_ba,sys_ba_owner,sys_ban,sys_ban_owner,sys_comment,sys_dict_data,sys_dict_type,sys_follow,sys_login_info,sys_role,sys_user,sys_user_online,sys_user_role

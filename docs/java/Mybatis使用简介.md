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

使用 mybatis-plus-generator。

## @param

用于在 DAO 层为字段重命名，

```java
public BigDecimal delete(@Param("id") BigInteger userId);
```

也可以为对象重命名，

```java
public List<BaDO> list(@Param("baDO") BaDO baDO);
```

此时在 xml 中得使用对象引用，不使用@param 时默认也可以使用`_parameter.id` 来访问。

```xml
<select id="list" resultType="com.tingyu.tieba.ba.dataobject.BaDO" parameterType="com.tingyu.tieba.ba.dataobject.BaDO">
    <include refid="COMMON_SELECT"/>
    WHERE
    <if test="baDO.id != null">
        id = #{baDO.id} and
    </if>
    <if test="baDO.parentId != null">
        parent_id = #{baDO.parentId} and
    </if>
    <if test="baDO.baName != null">
        ba_name like '#{baDO.baName}%' and
    </if>
    <if test="baDO.level != null">
        level = #{baDO.level} and
    </if>
    IS_DELETED = 'n'
</select>
```

## parameterType

用于指定对应的 mapper 接口接受的参数类型

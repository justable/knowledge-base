# SSH 免密连接

我们希望达到如下效果：

- 在 terminal 中输入`ssh username@host`无需输入密码即可连接远程服务器
- 如果把上述命令简化成`ssh ali1`这样的别名就更好了

执行如下步骤：

1. 在本机执行`ssh-keygen -t rsa`生成公钥和私钥，会在`~/.ssh/`目录下生成（可跳过）
2. 执行`ssh-copy-id username@host -p port`将公钥上传到服务器的`~/.ssh/authorized_keys`文件中（同一对密钥可以管理多个远程连接）
3. 本机新建`~/.ssh/config`文件，配置如下信息即可为命令取别名

```
Host ali1
    HostName 172.24.67.199

    Port 22

    User root

    IdentityFile ~/.ssh/id_rsa
```

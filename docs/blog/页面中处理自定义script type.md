# 页面中处理自定义 script type

浏览器不会处理不符合 MIME 类型的 script 标签，如果是外部资源，依然会下载且触发相关事件但不会执行。

我们可以利用这点，实现自定义编译器。运行时的 babel 就是这么做的，我们定义 type="text/babel"，浏览器会忽视这段代码，然后 babel 对这段代码进行处理最终输出标准的浏览器能够运行的代码。

下面举个例子，这个例子定义了一个 type="hello-world"的 script 标签，然后把它的代码当作 JS 执行。

```html
<script src="./hello-world.js">
  <script type="hello-world">
    console.log('Hello World')
</script>
<script>
  HelloWorld.parse();
</script>
```

```javascript
// hello-world.js
function createSrcipt(oldScript, remoteCode) {
  const mimeType = oldScript.getAttribute('type').toLowerCase();

  const baton = document.createComment(
    ' The previous code has been automatically translated from "' +
      mimeType +
      '" to "text/ecmascript". ',
  );
  const compiledScript = document.createElement('script');
  oldScript.parentNode.insertBefore(baton, oldScript);
  oldScript.parentNode.removeChild(oldScript);

  const oldAttrs = oldScript.attributes;
  for (let i = 0; i < oldAttrs.length; i++) {
    compiledScript.setAttribute(oldAttrs[i].name, oldAttrs[i].value);
  }

  compiledScript.type = 'text/ecmascript';
  if (remoteCode) {
    compiledScript.src =
      'data:text/javascript,' +
      encodeURIComponent(compilers[mimeType](remoteCode));
  }
  compiledScript.text = compilers[mimeType](oldScript.text);

  baton.parentNode.insertBefore(compiledScript, baton);
}
const compilers = {
  'hello-world': function(code) {
    // 进行代码编译，这里就直接返回了
    return code;
  },
};

function getRemoteSrc(script) {
  var req = new XMLHttpRequest();
  req.onload = function reqSuccess() {
    createScript(this.refScript, this.responseText);
  };
  req.onerror = function reqError(e) {
    throw new URIError('The script ' + e.target.src + ' is not accessible.');
  };
  req.refScript = script;
  req.open('GET', script.src, true);
  req.send(null);
}

function parseScripts() {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const current = scripts[i];
    if (
      current.hasAttribute('type') &&
      compilers.hasOwnProperty(current.getAttribute('type').toLowerCase())
    ) {
      current.hasAttribute('src')
        ? getRemoteSrc(current)
        : createSrcipt(current);
    }
  }
}

const HelloWorld = {
  parse: parseScripts,
};
```

[https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Code_snippets/Rosetta](https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Code_snippets/Rosetta)

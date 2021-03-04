# Prettier 使用小结

> _JavaScript · TypeScript · Flow · JSX · JSON_ > _CSS · SCSS · Less_ > _HTML · Vue · Angular_ > _GraphQL · Markdown · YAML_

## 加入 Git Hook

```json
// package.json
{
  "gitHooks": {
    "pre-commit": "lint-staged",
    "commit-msg": "node scripts/verifyCommit.js"
  },
  "lint-staged": {
    // 或使用stylelint处理 "**/*.less": "stylelint --syntax less",
    "**/*.{js,jsx,tsx,ts,css,less,md,json}": ["prettier --write"]
  },
  "devDependencies": {
    "yorkie": "^2.0.0"
  }
}
```

## VSCode 保存时自动格式化

安装 Prettier-Code formatter extensions，暂只支持 javascript，javascriptreact，typescript，typescriptreact，json，graphql。

```json
// User Setting
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  // 下面 Prettier 默认支持
  "[javascript]": {
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.formatOnSave": true
  },
  "[json]": {
    "editor.formatOnSave": true
  },
  "[graphql]": {
    "editor.formatOnSave": true
  },
  // 下面 Prettier 默认不支持
  "[vue]": {
    "editor.formatOnSave": false
  },
  "[markdown]": {
    "editor.formatOnSave": true
  },
  "[vue-html]": {
    "editor.formatOnSave": false
  },
  "[html]": {
    "editor.formatOnSave": false,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.formatOnSave": true
  },
  "[less]": {
    "editor.formatOnSave": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "postcss": "css"
  }
}
```

格式化规则按照下面优先级读取：

1. Prettier configuration file
1. .editorconfig
1. Visual Studio Code Settings (Ignored if any other configuration is present)

## 和 linter 的集成

如果自动 format 使用的 prettier，githook 是用 linter 格式化的，可能会冲突，需要把 linter 的 config 配置改成

- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier)
- [tslint-config-prettier](https://github.com/alexjoverm/tslint-config-prettier)
- [stylelint-config-prettier](https://github.com/prettier/stylelint-config-prettier)

## 自定义设置 parser

可能有的人需要把自定义的扩展名文件使用指定的 parser 转换，可以这样，

```json
// .prettierrc
{
  "overrides": [
    {
      "files": ".prettierrc",
      "options": { "parser": "json" }
    },
    {
      "files": "*.hhh",
      "options": {
        "parser": "vue"
      }
    }
  ]
}
```

支持的 parser：

- `"babel"` (via [@babel/parser](https://github.com/babel/babel/tree/main/packages/babel-parser)) _Named `"babylon"` until v1.16.0_
- `"babel-flow"` (same as `"babel"` but enables Flow parsing explicitly to avoid ambiguity) _First available in v1.16.0_
- `"babel-ts"` (similar to `"typescript"` but uses Babel and its TypeScript plugin) _First available in v2.0.0_
- `"flow"` (via [flow-parser](https://github.com/facebook/flow/tree/master/src/parser))
- `"typescript"` (via [@typescript-eslint/typescript-estree](https://github.com/typescript-eslint/typescript-eslint)) _First available in v1.4.0_
- `"espree"` (via [espree](https://github.com/eslint/espree)) _First available in v2.2.0_
- `"meriyah"` (via [meriyah](https://github.com/meriyah/meriyah)) _First available in v2.2.0_
- `"css"` (via [postcss-scss](https://github.com/postcss/postcss-scss) and [postcss-less](https://github.com/shellscape/postcss-less), autodetects which to use) _First available in v1.7.1_
- `"scss"` (same parsers as `"css"`, prefers postcss-scss) _First available in v1.7.1_
- `"less"` (same parsers as `"css"`, prefers postcss-less) _First available in v1.7.1_
- `"json"` (via [@babel/parser parseExpression](https://babeljs.io/docs/en/next/babel-parser.html#babelparserparseexpressioncode-options)) _First available in v1.5.0_
- `"json5"` (same parser as `"json"`, but outputs as [json5](https://json5.org/)) _First available in v1.13.0_
- `"json-stringify"` (same parser as `"json"`, but outputs like `JSON.stringify`) _First available in v1.13.0_
- `"graphql"` (via [graphql/language](https://github.com/graphql/graphql-js/tree/master/src/language)) _First available in v1.5.0_
- `"markdown"` (via [remark-parse](https://github.com/wooorm/remark/tree/main/packages/remark-parse)) _First available in v1.8.0_
- `"mdx"` (via [remark-parse](https://github.com/wooorm/remark/tree/main/packages/remark-parse) and [@mdx-js/mdx](https://github.com/mdx-js/mdx/tree/master/packages/mdx)) _First available in v1.15.0_
- `"html"` (via [angular-html-parser](https://github.com/ikatyang/angular-html-parser/tree/master/packages/angular-html-parser)) _First available in 1.15.0_
- `"vue"` (same parser as `"html"`, but also formats vue-specific syntax) _First available in 1.10.0_
- `"angular"` (same parser as `"html"`, but also formats angular-specific syntax via [angular-estree-parser](https://github.com/ikatyang/angular-estree-parser)) _First available in 1.15.0_
- `"lwc"` (same parser as `"html"`, but also formats LWC-specific syntax for unquoted template attributes) _First available in 1.17.0_
- `"yaml"` (via [yaml](https://github.com/eemeli/yaml) and [yaml-unist-parser](https://github.com/ikatyang/yaml-unist-parser)) _First available in 1.14.0_
- [Custom parsers](https://prettier.io/docs/en/api.html#custom-parser-api)

## 已知问题

### 无法自动 format css 文件

当指定扩展名设置 css 时无效，

```json
{
  "editor.formatOnSave": false,
  "[css]": {
    "editor.formatOnSave": true
  }
}
```

可以改为全局设置，

```json
{
  "editor.formatOnSave": true
}
```

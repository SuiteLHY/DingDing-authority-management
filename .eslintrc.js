module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/essential', '@vue/prettier'],
  rules: {
	// @Reference <a href='https://github.com/prettier/eslint-plugin-prettier/issues/219#issuecomment-610262026'>error  Delete `··`  prettier/prettier · Issue #219 · prettier/eslint-plugin-prettier</a>
	'endOfLine': 'auto',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prettier/prettier': [
      'error',
      {
        semi: false,
        singleQuote: true
      }
    ]
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}

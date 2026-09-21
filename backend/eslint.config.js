// Usa as ferramentas de lint já instaladas na raiz quando npm run lint é executado.
import js from '@eslint/js';
import globals from 'globals';
export default [
  { ignores: ['data/**', 'node_modules/**'] },
  { files: ['**/*.js'], ...js.configs.recommended, languageOptions: { globals: globals.node },
    rules: { ...js.configs.recommended.rules, 'no-unused-vars': ['error', { args: 'none' }] } }
];

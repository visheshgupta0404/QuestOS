import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['.next/**','node_modules/**','test-results/**','.questos/**']},js.configs.recommended,...tseslint.configs.recommended,{files:['**/*.{ts,tsx}'],rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}},{files:['**/*.mjs'],languageOptions:{globals:{console:'readonly',process:'readonly'}}});

// @ts-nocheck
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

// flat-config addons
const prettier = require('eslint-config-prettier'); // turns off rules that conflict with Prettier
const importPlugin = require('eslint-plugin-import'); // import sorting & hygiene
const unusedImports = require('eslint-plugin-unused-imports'); // remove unused imports

module.exports = tseslint.config(
  // ---------- TypeScript files ----------
  {
    files: ['**/*.ts'],
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic, // styley stuff (still okay; Prettier disables conflicting bits)
      ...angular.configs.tsRecommended,
      prettier, // <- keep LAST so it wins
    ],
    processor: angular.processInlineTemplates,
    rules: {
      /* your angular selectors */
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'explicit',
            methods: 'explicit',
            properties: 'explicit',
            parameterProperties: 'explicit',
          },
        },
      ],

      /* general */
      'no-empty-function': ['warn'],

      /* ==== unused stuff (vars = warn, imports = auto-fix) ==== */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'unused-imports/no-unused-imports': 'warn', // quick fix removes them

      /* ==== import ordering (nice & readable) ==== */
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      /* ==== optional: member ordering (warn only) ==== */
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: [
            // fields
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-decorated-field',
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',

            // constructor
            'public-constructor',
            'protected-constructor',
            'private-constructor',

            // accessors
            'public-instance-get',
            'public-instance-set',
            'protected-instance-get',
            'protected-instance-set',
            'private-instance-get',
            'private-instance-set',

            // methods
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],
    },
  },

  // ---------- Templates ----------
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      prettier,
    ],
    rules: {},
  },
);

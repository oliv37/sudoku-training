// @ts-check
/// <reference types="node" />
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.createProcessor(),
    // Type information, needed by rules such as no-uncalled-signals.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // Project conventions (CLAUDE.md), not enabled by the recommended presets:
      // signals for state, `input()`/`output()`/`model()`, readonly outputs.
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/computed-must-return': 'error',
      // Host bindings in the `host` object, not @HostBinding / @HostListener.
      '@angular-eslint/prefer-host-metadata-property': 'error',
      // `@Service()` rather than `@Injectable({ providedIn: 'root' })`.
      '@angular-eslint/prefer-service-decorator': 'error',
      // Prerendering: no direct `document` access (does not exist at build time).
      '@angular-eslint/no-global-document': 'error',
    },
  },
  {
    // The board layers: inside an <svg>, a custom element is not drawn, so a layer is an
    // attribute on a <g> (g[appBoardGridLines]). Everywhere else, components are elements.
    files: ['src/app/board/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'app', style: 'kebab-case' },
          { type: 'attribute', prefix: 'app', style: 'camelCase' },
        ],
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // Project conventions (CLAUDE.md), not enabled by the recommended presets.
      '@angular-eslint/template/prefer-ngsrc': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-style-binding': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
    },
  },
]);

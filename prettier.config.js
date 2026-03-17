/** @type {import("prettier").Config} */
export default {
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  trailingComma: 'all',
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.svelte',
      options: {
        parser: 'svelte',
      },
    },
  ],
};

import config from "@vunachain/config-eslint";

// For Solidity contracts and hardhat environment, we extend the standard config
// but disable project-level type checking for non-source files
export default [
  ...config.map((conf) => {
    // Disable parserOptions.project for hardhat environment
    if (conf.languageOptions?.parserOptions?.project) {
      return {
        ...conf,
        languageOptions: {
          ...conf.languageOptions,
          parserOptions: {
            ...conf.languageOptions.parserOptions,
            project: false,
          },
        },
      };
    }
    return conf;
  }),
  {
    ignores: [
      "node_modules/",
      "dist/",
      "artifacts/",
      "cache/",
      "typechain-types/",
      "test/**",
      "scripts/**",
      "hardhat.config.cjs",
    ],
  },
];

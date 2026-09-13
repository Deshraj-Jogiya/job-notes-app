// Minimal Karma config adding a headless-Chrome launcher with --no-sandbox --
// needed to run tests as root in a container (CI runners and this project's
// own Docker-based verification both do), which plain "ChromeHeadless" can't do.
// CHROME_BIN must be set by the environment (e.g. to a system Chromium
// install) -- Puppeteer's own bundled Chromium download has no arm64 Linux
// build, so it can't be relied on here.

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    singleRun: false,
    restartOnFileChange: true,
  });
};

## [1.0.3](https://github.com/arlophoenix/swiss-pairing-cli/compare/v1.0.2...v1.0.3) (2026-03-13)


### Bug Fixes

* **build:** forward source argument in prepare-commit-msg hook ([#60](https://github.com/arlophoenix/swiss-pairing-cli/issues/60)) ([d7119ac](https://github.com/arlophoenix/swiss-pairing-cli/commit/d7119ac55233b1365c9cfb1f902a0c4d228eb849))

## [1.0.2](https://github.com/arlophoenix/swiss-pairing-cli/compare/v1.0.1...v1.0.2) (2026-03-12)


### Bug Fixes

* **build:** pad random id to guarantee minimum 10-char length ([011d3ff](https://github.com/arlophoenix/swiss-pairing-cli/commit/011d3ffd9684d608218eea5d9055b01c880fd809))

## [1.0.1](https://github.com/arlophoenix/swiss-pairing-cli/compare/v1.0.0...v1.0.1) (2026-03-12)


### Bug Fixes

* **build:** fix prettier glob and exclude generated changelog ([5f0be62](https://github.com/arlophoenix/swiss-pairing-cli/commit/5f0be624f1f4ff78a8e64b9b94af838e25d8b7a6))

# 1.0.0 (2026-03-12)


### Bug Fixes

* **build:** cross-platform ci support ([ef639ae](https://github.com/arlophoenix/swiss-pairing-cli/commit/ef639ae512918502e8f5e2443f608a9e33d01635))
* **build:** disable husky in release job and fix hook shebangs for linux ([1431ab8](https://github.com/arlophoenix/swiss-pairing-cli/commit/1431ab8820c071a68700a3721964327a1b5d49f8))
* **build:** enforce lf line endings and skip 1password in ci ([3ed8a4e](https://github.com/arlophoenix/swiss-pairing-cli/commit/3ed8a4ec0629e2dc382ec72fd0c8626ea734e265))
* **build:** inline source glob to fix windows ci compatibility ([5d7236d](https://github.com/arlophoenix/swiss-pairing-cli/commit/5d7236d0de2439ff901f0386139da2586d436ce8))
* **core:** always return matches with top ranked teams first regardless of order ([70eab43](https://github.com/arlophoenix/swiss-pairing-cli/commit/70eab43acfe23375c234b990f961ef52c8177bad))
* **test:** normalize backslash line continuations in fixture files ([51ae335](https://github.com/arlophoenix/swiss-pairing-cli/commit/51ae335e2ff1c50763eac8191bbbfe7fc0b7a301))
* **test:** normalize line continuations when reading txt fixtures for csv/json comparison ([0c82616](https://github.com/arlophoenix/swiss-pairing-cli/commit/0c826164947c4c3affa492f0b228a0c5d1bd11a4))
* **test:** pin platform to linux in generate-distinct-id beforeeach ([81c1d41](https://github.com/arlophoenix/swiss-pairing-cli/commit/81c1d41bfcfecf0271ad028bbbdd766c2b9c7aa3))
* **test:** pin platform to linux in xdg-config-home branch test ([2880da7](https://github.com/arlophoenix/swiss-pairing-cli/commit/2880da761b892c95fd23de955d1a226d06d79979))
* **test:** replace single quotes in fixtures and fix windows env isolation ([886bf27](https://github.com/arlophoenix/swiss-pairing-cli/commit/886bf2767028b5c4dd38f8cb6f3c77fed8544522))


### Performance Improvements

* **build:** replace jest performance test with tinybench benchmark script ([9440ddb](https://github.com/arlophoenix/swiss-pairing-cli/commit/9440ddb77a56b0585d640248e660774b0c642b59))

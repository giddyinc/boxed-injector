.PHONY: test coverage dist

clean:
	rm -rf coverage dist .nyc_output

test: lint
	NODE_ENV=test ./node_modules/.bin/nyc ./node_modules/.bin/mocha test/*.ts src/**/*.test.ts --opts .mocharc

coverage:
	./node_modules/.bin/nyc report --reporter=text-lcov | coveralls

prepublish: clean
	./node_modules/.bin/babel src --out-dir dist --ignore test.js

watch:
	mocha src/**/*.test.js test --opts .mocharc --watch

lint:
	./node_modules/.bin/eslint src test

dev:
	./node_modules/.bin/babel src --out-dir dist --watch




.PHONY: test coverage dist

clean:
	rm -rf coverage dist .nyc_output

test:
	make lint
	./node_modules/.bin/nyc ./node_modules/.bin/mocha test src --opts .mocharc

coverage:
	./node_modules/.bin/nyc report --reporter=text-lcov | coveralls

prepublish: clean
	./node_modules/.bin/babel src --out-dir dist

watch:
	mocha src/**/*.test.js test --opts .mocharc --watch

lint:
	./node_modules/.bin/eslint src test

prepublish:
	./node_modules/.bin/gulp prepublish

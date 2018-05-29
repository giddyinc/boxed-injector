.PHONY: test coverage dist

clean:
	npm run clean

test: lint
	NODE_ENV=test ./node_modules/.bin/nyc ./node_modules/.bin/mocha test/*.ts src/**/*.test.ts --opts .mocharc

coverage:
	./node_modules/.bin/nyc report --reporter=text-lcov | coveralls

prepublish: clean
	npm run prepublish

watch:
	mocha src/**/*.test.js test --opts .mocharc --watch

lint:
	npm run lint

noemit:
	tsc -p ./tsconfig.test.json
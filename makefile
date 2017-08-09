.PHONY: test

clean:
	rm -rf coverage dist .nyc_output

test: prepublish
	make lint
	NODE_ENV=test ./node_modules/.bin/nyc --all --require babel-register ./node_modules/.bin/mocha test

coverage:
	./node_modules/.bin/nyc report --reporter=text-lcov | coveralls

prepublish: clean
	./node_modules/.bin/babel src --out-dir dist

watch:
		mocha --require babel-register --watch

lint:
	./node_modules/.bin/eslint src test

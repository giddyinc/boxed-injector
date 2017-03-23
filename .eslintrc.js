module.exports = {
  "extends": "xo-space",
  "env": {
    "mocha": true
  },
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  "plugins": [
    "react"
  ],
  "rules": {
    "guard-for-in": [0],
    "react/jsx-uses-vars": "error",
    "no-multiple-empty-lines": 1
  }
}
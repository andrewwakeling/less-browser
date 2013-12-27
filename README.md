This documentation is supplementary to [LESS's documentation.](https://github.com/less/less.js/blob/master/README.md).

less-browser
==
Fork focused on using less.js in **production** for the browser.

## Why?
There has been [confusion](https://github.com/less/less-docs/issues/6) over whether less.js should run in production.

My opinion is that the ability for LESS to run client-side on the browser, is LESS's strongest and unique feature in comparison to other stylesheet languages.
This is my work to make that feature *shine*.

## What happened to "that" browser feature in less.js?
A large majority of **development** browser specific functionality was cut out of the original less.js.
This was to provide a more predictable and concise API, which I have labelled "browser-core".
A lot of thought was put into this reduction and I believe that it would be possible to implement existing functionality by utilizing the new API of browser-core.
I envisage that this functionality would be broken up into two parts; `browser-development` and `browser-util`.

## Warning
This work is very experimental. It currently does not have any testing, so if you decide to use this, you do so at your own risk.

## Preparation and Building

Ensure grunt modules are loaded:
````
npm install
````

Ensure bower components are installed:
````
bower install
````

Build with:
````
grunt browsercore
````
`less-browser-core.js` will be built in `dist`.

## Usage
Unlike the original functionality in less.js, `browser-core` does not automatically load LESS.
It is not aware of LESS templates defined in link tags but instead, encourages you to load the templates yourself.

*TODO More documentation coming shortly*

## API
`renderTemplate(url, options, callback(err, style, identifier)`
`loadTemplate(url, options, callback(err, render(err, style, identifier)))`
`removeTemplate(...)`

*TODO: More documentation coming shortly*

License
==
[As per less.js's licensing.](https://github.com/less/less.js/blob/master/LICENSE)
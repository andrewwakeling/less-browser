This documentation is supplementary to [LESS's documentation.](https://github.com/less/less.js/blob/master/README.md).

browser-core
==
Fork focused on using less.js in **production** for the browser.

## Why?
There has been [confusion](https://github.com/less/less-docs/issues/6) over whether less.js should run in production.

My opinion is that the ability for LESS to run client-side on the browser, is LESS's strongest and unique feature in comparison to other stylesheet languages.
This is my work to make that feature *shine*.

## What happened to "that" feature in less.js?
A large majority of functionality was cut out of the original browser.js to provide a more predictable and concise API, which I have labelled "browser-core".
A lot of thought was put into this reduction and I believe that it would be possible to recreate existing functionality by utilizing the new API of browser-core.

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
*TODO*

## API
*TODO*

License
==
[As per less.js's licensing.](https://github.com/less/less.js/blob/master/LICENSE)
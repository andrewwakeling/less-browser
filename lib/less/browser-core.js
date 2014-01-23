/* global less, window, _stylesheet */
/**
 * browser-core.js - A significantly cut-down and refactored version of browser.js intended for usage in production
 *
 * Minimum usage requires the declaration of less.templateLoader = function(url, options, callback(err, data)).
 */

/**
 * Describe an error as a string.
 *
 * @param e - LessError, shammed LessError (see shammedLessError()) or one of the in-built Error prototypes.
 * @param rootHref
 */
function describeError(e, rootHref) {
    var template = '{line} {content}';
    var filename = e.filename || rootHref;
    var errors = [];
    var content = (e.type || "Syntax") + "Error: " + (e.message || 'There is an error in your .less file') +
        " in " + filename + " ";

    var errorline = function (e, i, classname) {
        if (e.extract[i] !== undefined) {
            errors.push(template.replace(/\{line\}/, (parseInt(e.line, 10) || 0) + (i - 1))
                .replace(/\{class\}/, classname)
                .replace(/\{content\}/, e.extract[i]));
        }
    };

    if (e.extract && e.line) {
        errorline(e, 0, '');
        errorline(e, 1, 'line');
        errorline(e, 2, '');
        content += 'on line ' + e.line + ', column ' + (e.column + 1) + ':\n' +
            errors.join('\n');
    } else if (e.stack) {
        content += e.stack;
    }
    return content;
}

function extractUrlParts(url, baseUrl) {
    // urlParts[1] = protocol&hostname || /
    // urlParts[2] = / if path relative to host base
    // urlParts[3] = directories
    // urlParts[4] = filename
    // urlParts[5] = parameters

    var urlPartsRegex = /^((?:[a-z-]+:)?\/+?(?:[^\/\?#]*\/)|([\/\\]))?((?:[^\/\\\?#]*[\/\\])*)([^\/\\\?#]*)([#\?].*)?$/i,
        urlParts = url.match(urlPartsRegex),
        returner = {}, directories = [], i, baseUrlParts;

    if (!urlParts) {
        throw new Error("Could not parse sheet href - '" + url + "'");
    }

    // Stylesheets in IE don't always return the full path
    if (!urlParts[1] || urlParts[2]) {
        baseUrlParts = baseUrl.match(urlPartsRegex);
        if (!baseUrlParts) {
            throw new Error("Could not parse page url - '" + baseUrl + "'");
        }
        urlParts[1] = urlParts[1] || baseUrlParts[1] || "";
        if (!urlParts[2]) {
            urlParts[3] = baseUrlParts[3] + urlParts[3];
        }
    }

    if (urlParts[3]) {
        directories = urlParts[3].replace(/\\/g, "/").split("/");

        // extract out . before .. so .. doesn't absorb a non-directory
        for (i = 0; i < directories.length; i++) {
            if (directories[i] === ".") {
                directories.splice(i, 1);
                i -= 1;
            }
        }

        for (i = 0; i < directories.length; i++) {
            if (directories[i] === ".." && i > 0) {
                directories.splice(i - 1, 2);
                i -= 2;
            }
        }
    }

    returner.hostPart = urlParts[1];
    returner.directories = directories;
    returner.path = urlParts[1] + directories.join("/");
    returner.fileUrl = returner.path + (urlParts[4] || "");
    returner.url = returner.fileUrl + (urlParts[5] || "");
    return returner;
}

function pathDiff(url, baseUrl) {
    // diff between two paths to create a relative path

    var urlParts = extractUrlParts(url),
        baseUrlParts = extractUrlParts(baseUrl),
        i, max, urlDirectories, baseUrlDirectories, diff = "";
    if (urlParts.hostPart !== baseUrlParts.hostPart) {
        return "";
    }
    max = Math.max(baseUrlParts.directories.length, urlParts.directories.length);
    for (i = 0; i < max; i++) {
        if (baseUrlParts.directories[i] !== urlParts.directories[i]) {
            break;
        }
    }
    baseUrlDirectories = baseUrlParts.directories.slice(i);
    urlDirectories = urlParts.directories.slice(i);
    for (i = 0; i < baseUrlDirectories.length - 1; i++) {
        diff += "../";
    }
    for (i = 0; i < urlDirectories.length - 1; i++) {
        diff += urlDirectories[i] + "/";
    }
    return diff;
}

/**
 * Creates an object which isn't an authentic LessError, but will attempt to be one.
 * @param type
 * @param message
 */
function shammedLessError(type, message) {
    return {
        type: type,
        message: message
    };
}

/**
 * Load the resource specified by originalHref.
 *
 * Note: This function is also invoked by the parser via less.Parser.fileLoader.
 *
 * INVESTIGATE: If loadFile was invoked via the parser, returning an in-built error causes the parser to follow a strange code path.
 * INVESTIGATE: If loadFile fails to load a file, the parser still continues to attempt to import other files.
 *
 * @param originalHref
 * @param currentFileInfo (see below)
 * @param callback - callback(e, contents, fullPath, newFileInfo)
 * @param env - The parsing environment
 * @param appendScript -
 *
 * currentFileInfo
 * - relativeUrls: option - whether to adjust URL's to be relative
 * - filename: full resolved filename of current file
 * - rootpath: path to append to normal URLs for this node
 * - currentDirectory: path to the current file, absolute
 * - rootFilename: filename of the base file
 * - entryPath: absolute path to the entry file
 * - reference: whether the file should not be output and only output parts that are referenced
 */
function loadFile(originalHref, currentFileInfo, callback, env, appendScript) {
    if (currentFileInfo && currentFileInfo.currentDirectory && !/^([a-z-]+:)?\//.test(originalHref)) {
        originalHref = currentFileInfo.currentDirectory + originalHref;
    }

    // sheet may be set to the stylesheet for the initial load or a collection of properties including
    // some env variables for imports
    var hrefParts = extractUrlParts(originalHref, window.location.href);
    var href = hrefParts.url;
    var newFileInfo = {
        currentDirectory: hrefParts.path,
        filename: href
    };

    if (currentFileInfo) {
        newFileInfo.entryPath = currentFileInfo.entryPath;
        newFileInfo.rootpath = currentFileInfo.rootpath;
        newFileInfo.rootFilename = currentFileInfo.rootFilename;
        newFileInfo.relativeUrls = currentFileInfo.relativeUrls;
    } else {
        newFileInfo.entryPath = hrefParts.path;
        newFileInfo.rootpath = less.rootpath || hrefParts.path;
        newFileInfo.rootFilename = href;
        newFileInfo.relativeUrls = env.relativeUrls;
    }

    if (newFileInfo.relativeUrls) {
        if (env.rootpath) {
            newFileInfo.rootpath = extractUrlParts(env.rootpath + pathDiff(hrefParts.path, newFileInfo.entryPath)).path;
        } else {
            newFileInfo.rootpath = hrefParts.path;
        }
    }

    less.templateLoader(href, env.templateLoaderOptions || {}, function (err, data) {
        if (err) {
            callback(shammedLessError('File', "Error loading '" + href + "'."), null, href, null);
        } else {
            if (env.browser.prependScript) {
                data = env.browser.prependScript + data;
            }
            if (appendScript) {
                data = data + appendScript;
            }
            callback(null, data, href, newFileInfo);
        }
    });
}

/**
 * Load the LESS template specified by the path and any other resources it depends upon and calculate the transformed CSS.
 *
 * Note: Given that LESS has the ability to import other files, its not possible to separate the retrieval of resources from the parsing step.
 * @param path
 * @param env
 * @param callback - function(err, css, absoluteURL)
 */
function retrieveResourcesAndCalculateCSS(path, env, callback) {
    loadFile(path, null, function (err, data, absoluteURL, newFileInfo) {
        if (err) {
            callback(err, null, absoluteURL);
        } else {
            env.currentFileInfo = newFileInfo;
            new (less.Parser)(env).parse(data, function (err, root) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, root.toCSS(less), absoluteURL);
                }
            });
        }
    }, env, env.browser.appendScript);
}

/**
 * Serialize variables to a string containing LESS variable assignment expressions.
 * @param vars
 * @returns {string}
 */
function serializeVars(vars) {
    var s = "";
    for (var name in vars) {
        s += ((name.slice(0, 1) === '@') ? '' : '@') + name + ': ' +
            ((vars[name].slice(-1) === ';') ? vars[name] : vars[name] + ';');
    }
    return s;
}

/**
 * Object which tracks identifiers to their respective stylesheets.
 */
var styles = {};

/**
 * Create the stylesheet with the specified identifier and css. If an existing stylesheet correlates to the specified identifier, then it will be replaced.
 *
 * Note: This is an internal identifier, not the "id" attribute on the style element.
 *
 * @param id - identifier associated with the new stylesheet
 * @param css - CSS for the new stylesheet
 * @param callback - function(err, style)
 */
function createCSS(id, css, callback) {
    var idComment = '/* LESS: ' + id + ' */\n';
    _stylesheet.replaceStyleSheet(styles[id] && styles[id].parentNode ? styles[id] : null, idComment + css, function (err, style) {
        if (err) {
            callback(err);
        } else {
            styles[id] = style;
            callback(null, style);
        }
    });
}

/**
 * Load a LESS template but do not place it into the DOM until render() is called.
 *
 * @param url
 * @param options (see below)
 * @param callback - function(err, render(err, style, identifier))
 *
 * Options
 * templateLoaderOptions - an object which will be passed to the templateLoader handler. (Used to customize behaviour of templateLoader).
 * prependVars - declaration and assignment of the specified variables will be prepended to every template utilized by the specified url. (was globalVars)
 * appendVars - declaration and assignment of the specified variables will be appended ONLY to the parent template associated with the specified url.
 * This however, will also override variables in children templates too.
 *
 * For a better understand for the prependVars and appendVars requirement, see here: https://github.com/less/less.js/commit/daec7dff1c5d533bfaaee5315aa20c9bf56f1873
 */
function loadTemplate(url, options, callback) {
    var env = new less.tree.parseEnv(less);
    // To reduce property collision, place all browser settings into their own property.
    env.browser = {};
    if (options) {
        env.browser.templateLoaderOptions = options.templateLoaderOptions || {};
        if (options.prependVars) {
            env.browser.prependScript = serializeVars(options.prependVars);
        }
        if (options.appendVars) {
            env.browser.appendScript = serializeVars(options.appendVars);
        }
    }

    retrieveResourcesAndCalculateCSS(url, env, function (err, css, absoluteURL) {
        if (err) {
            return callback(describeError(err, absoluteURL));
        } else {
            var render = function(cb) {
                createCSS(absoluteURL, css, function (err, style) {
                    if (err) {
                        cb(describeError(err, absoluteURL));
                    } else {
                        cb(null, style, absoluteURL);
                    }
                });
            };

            callback(null, render);
        }
    });
}
less.loadTemplate = loadTemplate;

/**
 * Load and render the template into the DOM. If this template already exists in the DOM, it will be replaced.
 * @param url
 * @param options
 * @param callback(err, style, identifier)
 */
less.renderTemplate = function (url, options, callback) {
    loadTemplate(url, options, function (err, render) {
        if (err) {
            callback(err);
        } else {
            render(callback);
        }
    });
};

// Setup user functions
if (less.functions) {
    for (var func in less.functions) {
        less.tree.functions[func] = less.functions[func];
    }
}

/**
 * The following options were potentially being set before in less.js and they still can be set manually.
 *
 * less.optimization = 0;
 * less.dumpLineNumbers = 'comments' || 'mediaquery' || 'all';
 */

// Tell parser how to load resources
less.Parser.fileLoader = loadFile;

// TODO: Provide a function to remove templates by id.
less.removeTemplate = null;

// TODO: If we really want to re-use create-stylesheet stuff we should refactor this code to be better modularized.
less.stylesheettools = _stylesheet;

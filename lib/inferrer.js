"use strict";

// ---------------------------------------------------------------------------
// lib/inferrer.js
// Generates meaningful JSDoc descriptions from names alone — no AI, no
// external API. Every inference is a deterministic mapping: verb prefix +
// camelCase words → human-readable sentence.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// camelCase / PascalCase splitter
// "getUserById"  → ["get", "user", "by", "id"]
// "isHTTPValid"  → ["is", "http", "valid"]
// "firstName"    → ["first", "name"]
// ---------------------------------------------------------------------------
function splitCamel(name) {
    return name
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")   // "HTMLParser" → "HTML_Parser"
        .replace(/([a-z\d])([A-Z])/g, "$1_$2")          // "getUserId"  → "get_User_Id"
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map(function(w) { return w.toLowerCase(); });
}

function cap(str) { return str ? str[0].toUpperCase() + str.slice(1) : ""; }
function phrase(words) { return words.join(" "); }

// ---------------------------------------------------------------------------
// Verb prefix → sentence template
// Each key is a common verb prefix; the value is a function that accepts the
// remaining words and returns a complete description sentence.
// ---------------------------------------------------------------------------
var VERB_TEMPLATES = {
    get:         function(r) { return "Returns the " + phrase(r) + "."; },
    fetch:       function(r) { return "Fetches the " + phrase(r) + "."; },
    load:        function(r) { return "Loads the " + phrase(r) + "."; },
    read:        function(r) { return "Reads the " + phrase(r) + "."; },
    set:         function(r) { return "Sets the " + phrase(r) + "."; },
    update:      function(r) { return "Updates the " + phrase(r) + "."; },
    save:        function(r) { return "Saves the " + phrase(r) + "."; },
    write:       function(r) { return "Writes the " + phrase(r) + "."; },
    put:         function(r) { return "Stores the " + phrase(r) + "."; },
    patch:       function(r) { return "Partially updates the " + phrase(r) + "."; },
    is:          function(r) {
        if (!r.length) return "Returns a boolean result.";
        if (r.length === 1) return "Returns whether it is " + r[0] + ".";
        return "Returns whether the " + phrase(r.slice(0,-1)) + " is " + r[r.length-1] + ".";
    },
    has:         function(r) {
        return r.length ? "Returns whether the " + phrase(r) + " exists." : "Returns whether the condition is met.";
    },
    can:         function(r) { return r.length ? "Returns whether the " + phrase(r) + " is permitted." : "Returns whether the action is permitted."; },
    should:      function(r) { return r.length ? "Determines whether the " + phrase(r) + "." : "Determines whether to proceed."; },
    check:       function(r) { return r.length ? "Checks whether the " + phrase(r) + " is valid." : "Checks validity."; },
    create:      function(r) { return "Creates a new " + phrase(r) + "."; },
    make:        function(r) { return "Creates a new " + phrase(r) + "."; },
    build:       function(r) { return "Builds a " + phrase(r) + "."; },
    generate:    function(r) { return "Generates a " + phrase(r) + "."; },
    produce:     function(r) { return "Produces a " + phrase(r) + "."; },
    construct:   function(r) { return "Constructs a " + phrase(r) + "."; },
    init:        function(r) { return r.length ? "Initialises the " + phrase(r) + "." : "Initialises the instance."; },
    initialise:  function(r) { return r.length ? "Initialises the " + phrase(r) + "." : "Initialises the instance."; },
    initialize:  function(r) { return r.length ? "Initialises the " + phrase(r) + "." : "Initialises the instance."; },
    setup:       function(r) { return r.length ? "Sets up the " + phrase(r) + "." : "Sets up the environment."; },
    configure:   function(r) { return "Configures the " + phrase(r) + "."; },
    delete:      function(r) { return "Deletes the " + phrase(r) + "."; },
    remove:      function(r) { return "Removes the " + phrase(r) + "."; },
    destroy:     function(r) { return "Destroys the " + phrase(r) + "."; },
    clear:       function(r) { return "Clears the " + phrase(r) + "."; },
    reset:       function(r) { return "Resets the " + phrase(r) + " to its default state."; },
    parse:       function(r) { return "Parses the " + phrase(r) + "."; },
    format:      function(r) { return "Formats the " + phrase(r) + "."; },
    convert:     function(r) { return "Converts the " + phrase(r) + "."; },
    transform:   function(r) { return "Transforms the " + phrase(r) + "."; },
    map:         function(r) { return "Maps the " + phrase(r) + "."; },
    reduce:      function(r) { return "Reduces the " + phrase(r) + " to a single value."; },
    filter:      function(r) { return "Filters the " + phrase(r) + "."; },
    sort:        function(r) { return "Sorts the " + phrase(r) + "."; },
    validate:    function(r) { return "Validates the " + phrase(r) + "."; },
    verify:      function(r) { return "Verifies the " + phrase(r) + "."; },
    assert:      function(r) { return "Asserts that the " + phrase(r) + " is correct."; },
    ensure:      function(r) { return "Ensures the " + phrase(r) + " is in a valid state."; },
    find:        function(r) { return "Finds the " + phrase(r) + "."; },
    search:      function(r) { return "Searches for " + phrase(r) + "."; },
    query:       function(r) { return "Queries the " + phrase(r) + "."; },
    lookup:      function(r) { return "Looks up the " + phrase(r) + "."; },
    resolve:     function(r) { return "Resolves the " + phrase(r) + "."; },
    handle:      function(r) { return "Handles the " + phrase(r) + "."; },
    process:     function(r) { return "Processes the " + phrase(r) + "."; },
    execute:     function(r) { return "Executes the " + phrase(r) + "."; },
    run:         function(r) { return r.length ? "Runs the " + phrase(r) + "." : "Runs the operation."; },
    perform:     function(r) { return "Performs the " + phrase(r) + "."; },
    apply:       function(r) { return "Applies the " + phrase(r) + "."; },
    invoke:      function(r) { return "Invokes the " + phrase(r) + "."; },
    call:        function(r) { return "Calls the " + phrase(r) + "."; },
    dispatch:    function(r) { return "Dispatches the " + phrase(r) + "."; },
    emit:        function(r) { return r.length ? "Emits the " + phrase(r) + " event." : "Emits an event."; },
    publish:     function(r) { return "Publishes the " + phrase(r) + "."; },
    send:        function(r) { return "Sends the " + phrase(r) + "."; },
    receive:     function(r) { return "Receives the " + phrase(r) + "."; },
    subscribe:   function(r) { return "Subscribes to the " + phrase(r) + "."; },
    unsubscribe: function(r) { return "Unsubscribes from the " + phrase(r) + "."; },
    on:          function(r) { return r.length ? "Registers a listener for the " + phrase(r) + " event." : "Registers an event listener."; },
    off:         function(r) { return r.length ? "Removes a listener for the " + phrase(r) + " event." : "Removes an event listener."; },
    once:        function(r) { return r.length ? "Registers a one-time listener for the " + phrase(r) + " event." : "Registers a one-time event listener."; },
    enable:      function(r) { return r.length ? "Enables the " + phrase(r) + "." : "Enables the feature."; },
    disable:     function(r) { return r.length ? "Disables the " + phrase(r) + "." : "Disables the feature."; },
    toggle:      function(r) { return r.length ? "Toggles the " + phrase(r) + "." : "Toggles the current state."; },
    open:        function(r) { return r.length ? "Opens the " + phrase(r) + "." : "Opens the connection."; },
    close:       function(r) { return r.length ? "Closes the " + phrase(r) + "." : "Closes the connection."; },
    start:       function(r) { return r.length ? "Starts the " + phrase(r) + "." : "Starts the process."; },
    stop:        function(r) { return r.length ? "Stops the " + phrase(r) + "." : "Stops the process."; },
    pause:       function(r) { return "Pauses the " + phrase(r) + "."; },
    resume:      function(r) { return "Resumes the " + phrase(r) + "."; },
    connect:     function(r) { return r.length ? "Connects to the " + phrase(r) + "." : "Connects to the remote endpoint."; },
    disconnect:  function(r) { return r.length ? "Disconnects from the " + phrase(r) + "." : "Disconnects from the remote endpoint."; },
    register:    function(r) { return "Registers the " + phrase(r) + "."; },
    unregister:  function(r) { return "Unregisters the " + phrase(r) + "."; },
    add:         function(r) { return "Adds the " + phrase(r) + "."; },
    insert:      function(r) { return "Inserts the " + phrase(r) + "."; },
    append:      function(r) { return "Appends the " + phrase(r) + "."; },
    push:        function(r) { return "Pushes the " + phrase(r) + "."; },
    pop:         function(r) { return "Removes and returns the last " + phrase(r) + "."; },
    shift:       function(r) { return "Removes and returns the first " + phrase(r) + "."; },
    unshift:     function(r) { return "Inserts the " + phrase(r) + " at the start."; },
    merge:       function(r) { return "Merges the " + phrase(r) + "."; },
    join:        function(r) { return "Joins the " + phrase(r) + "."; },
    split:       function(r) { return "Splits the " + phrase(r) + "."; },
    flatten:     function(r) { return "Flattens the " + phrase(r) + "."; },
    concat:      function(r) { return "Concatenates the " + phrase(r) + "."; },
    clone:       function(r) { return "Returns a deep clone of the " + phrase(r) + "."; },
    copy:        function(r) { return "Returns a shallow copy of the " + phrase(r) + "."; },
    wrap:        function(r) { return "Wraps the " + phrase(r) + "."; },
    unwrap:      function(r) { return "Unwraps the " + phrase(r) + "."; },
    extend:      function(r) { return "Extends the " + phrase(r) + "."; },
    render:      function(r) { return "Renders the " + phrase(r) + "."; },
    show:        function(r) { return "Shows the " + phrase(r) + "."; },
    hide:        function(r) { return "Hides the " + phrase(r) + "."; },
    display:     function(r) { return "Displays the " + phrase(r) + "."; },
    log:         function(r) { return r.length ? "Logs the " + phrase(r) + "." : "Logs a message."; },
    print:       function(r) { return "Prints the " + phrase(r) + "."; },
    encode:      function(r) { return "Encodes the " + phrase(r) + "."; },
    decode:      function(r) { return "Decodes the " + phrase(r) + "."; },
    encrypt:     function(r) { return "Encrypts the " + phrase(r) + "."; },
    decrypt:     function(r) { return "Decrypts the " + phrase(r) + "."; },
    hash:        function(r) { return "Hashes the " + phrase(r) + "."; },
    sign:        function(r) { return "Signs the " + phrase(r) + "."; },
    normalise:   function(r) { return "Normalises the " + phrase(r) + "."; },
    normalize:   function(r) { return "Normalises the " + phrase(r) + "."; },
    serialise:   function(r) { return "Serialises the " + phrase(r) + "."; },
    serialize:   function(r) { return "Serialises the " + phrase(r) + "."; },
    deserialise: function(r) { return "Deserialises the " + phrase(r) + "."; },
    deserialize: function(r) { return "Deserialises the " + phrase(r) + "."; },
    extract:     function(r) { return "Extracts the " + phrase(r) + "."; },
    inject:      function(r) { return "Injects the " + phrase(r) + "."; },
    mount:       function(r) { return "Mounts the " + phrase(r) + "."; },
    unmount:     function(r) { return "Unmounts the " + phrase(r) + "."; },
    upload:      function(r) { return "Uploads the " + phrase(r) + "."; },
    download:    function(r) { return "Downloads the " + phrase(r) + "."; },
    collect:     function(r) { return "Collects the " + phrase(r) + "."; },
    scan:        function(r) { return "Scans the " + phrase(r) + "."; },
    watch:       function(r) { return "Watches the " + phrase(r) + " for changes."; },
    refresh:     function(r) { return "Refreshes the " + phrase(r) + "."; },
    reload:      function(r) { return "Reloads the " + phrase(r) + "."; },
    count:       function(r) { return "Returns the count of " + phrase(r) + "."; },
    list:        function(r) { return "Lists the available " + phrase(r) + "."; },
    compare:     function(r) { return "Compares the " + phrase(r) + "."; },
    calculate:   function(r) { return "Calculates the " + phrase(r) + "."; },
    compute:     function(r) { return "Computes the " + phrase(r) + "."; },
    measure:     function(r) { return "Measures the " + phrase(r) + "."; },
    retry:       function(r) { return "Retries the " + phrase(r) + "."; },
    cancel:      function(r) { return "Cancels the " + phrase(r) + "."; },
    abort:       function(r) { return "Aborts the " + phrase(r) + "."; },
    debounce:    function(r) { return "Debounces the " + phrase(r) + "."; },
    throttle:    function(r) { return "Throttles the " + phrase(r) + "."; },
    track:       function(r) { return "Tracks the " + phrase(r) + "."; },
    notify:      function(r) { return "Notifies about the " + phrase(r) + "."; },
    warn:        function(r) { return "Emits a warning for the " + phrase(r) + "."; },
    import:      function(r) { return "Imports the " + phrase(r) + "."; },
    export:      function(r) { return "Exports the " + phrase(r) + "."; },
    test:        function(r) { return "Tests whether the " + phrase(r) + " is correct."; },
};

// ---------------------------------------------------------------------------
// Well-known parameter name → description
// Matched case-insensitively; suffix matching covers "userId" → "id" lookup.
// ---------------------------------------------------------------------------
var PARAM_DESCRIPTIONS = {
    // identifiers
    "id":          "unique identifier",
    "uid":         "unique identifier",
    "uuid":        "universally unique identifier",
    "key":         "lookup key",
    "token":       "authentication token",
    "secret":      "secret key or credential",
    // paths
    "url":         "URL string",
    "uri":         "URI string",
    "href":        "hyperlink URL",
    "filepath":    "path to the file",
    "filename":    "file name",
    "dir":         "directory path",
    "dirname":     "directory path",
    "path":        "file or URL path",
    "src":         "source path or content",
    "dest":        "destination path",
    "basepath":    "base path prefix",
    "basedir":     "base directory path",
    // config / options
    "options":     "configuration options",
    "opts":        "configuration options",
    "config":      "configuration object",
    "cfg":         "configuration object",
    "settings":    "settings object",
    "args":        "arguments",
    "props":       "properties object",
    "params":      "parameters object",
    // functions / callbacks
    "callback":    "callback function invoked on completion",
    "cb":          "callback function",
    "fn":          "function to invoke",
    "func":        "function to invoke",
    "handler":     "event handler function",
    "listener":    "event listener function",
    "predicate":   "predicate function returning a boolean",
    "comparator":  "comparator function for ordering",
    "middleware":  "middleware function",
    // errors
    "error":       "error instance",
    "err":         "error instance",
    "exception":   "exception instance",
    "cause":       "underlying cause of the error",
    "reason":      "reason for rejection or failure",
    // HTTP
    "request":     "HTTP request object",
    "req":         "HTTP request object",
    "response":    "HTTP response object",
    "res":         "HTTP response object",
    "next":        "next middleware function",
    "body":        "request body",
    "headers":     "HTTP headers",
    "payload":     "request or event payload",
    "query":       "query parameters",
    "cookies":     "request cookies",
    // data
    "data":        "input data",
    "input":       "input value",
    "output":      "output value",
    "result":      "computed result",
    "value":       "value to process",
    "val":         "value to process",
    "values":      "array of values",
    "items":       "array of items",
    "list":        "list of entries",
    "collection":  "collection of items",
    // context
    "context":     "execution context",
    "ctx":         "execution context",
    "scope":       "scope object",
    "env":         "environment variables",
    "event":       "event object",
    "evt":         "event object",
    "e":           "event object",
    // strings
    "name":        "display name",
    "label":       "display label",
    "title":       "title string",
    "message":     "descriptive message",
    "msg":         "message string",
    "text":        "text content",
    "content":     "content string",
    "html":        "HTML string",
    "template":    "template string",
    "pattern":     "matching pattern",
    "regex":       "regular expression",
    "format":      "output format specifier",
    "encoding":    "character encoding",
    "prefix":      "string prefix",
    "suffix":      "string suffix",
    // numbers / ranges
    "index":       "zero-based index",
    "i":           "loop index",
    "j":           "inner loop index",
    "n":           "count or number",
    "count":       "number of items",
    "size":        "size or length",
    "length":      "length of the collection",
    "limit":       "maximum number of items to return",
    "offset":      "number of items to skip",
    "page":        "page number",
    "max":         "maximum allowed value",
    "min":         "minimum allowed value",
    "start":       "start value or index",
    "end":         "end value or index",
    "from":        "starting value or position",
    "to":          "ending value or position",
    "timeout":     "timeout duration in milliseconds",
    "delay":       "delay duration in milliseconds",
    "interval":    "interval duration in milliseconds",
    "retries":     "number of retry attempts",
    "attempts":    "number of attempts",
    // booleans
    "flag":        "boolean flag",
    "enabled":     "whether the feature is enabled",
    "disabled":    "whether the feature is disabled",
    "visible":     "whether the element is visible",
    "active":      "whether the item is active",
    "readonly":    "whether the field is read-only",
    "required":    "whether the field is required",
    "optional":    "whether the field is optional",
    "force":       "whether to force the operation",
    "silent":      "whether to suppress output",
    "debug":       "whether to enable debug logging",
    "verbose":     "whether to enable verbose output",
    "strict":      "whether to apply strict validation",
    "recursive":   "whether to recurse into nested structures",
    "overwrite":   "whether to overwrite existing data",
    // type / kind
    "type":        "type identifier",
    "kind":        "kind or category",
    "tag":         "tag or label",
    "category":    "category name",
    "group":       "group identifier",
    "version":     "version string",
    // targeting
    "target":      "target object or element",
    "source":      "source object or path",
    "base":        "base value or object",
    "parent":      "parent object",
    "node":        "AST or DOM node",
    "element":     "DOM element",
    // user / auth
    "user":        "user object",
    "account":     "account object",
    "session":     "session object",
    "role":        "user role identifier",
    "permission":  "permission identifier",
    // infra
    "stream":      "readable or writable stream",
    "buffer":      "data buffer",
    "chunk":       "data chunk",
    "batch":       "batch of items",
    "cache":       "cache object",
    "store":       "data store",
    "db":          "database connection",
    "database":    "database connection",
    "model":       "data model",
    "schema":      "schema definition",
    "service":     "service instance",
    "client":      "client instance",
    "server":      "server instance",
    "socket":      "socket connection",
    "logger":      "logger instance",
    "container":   "dependency injection container",
};

// ---------------------------------------------------------------------------
// Class name suffix → description template
// "UserService" → "Service responsible for user operations."
// ---------------------------------------------------------------------------
var CLASS_SUFFIX_TEMPLATES = {
    "error":       function(r) { return "Error thrown when " + phrase(r) + " related issues occur."; },
    "exception":   function(r) { return "Exception thrown when " + phrase(r) + " related issues occur."; },
    "service":     function(r) { return "Service responsible for " + phrase(r) + " operations."; },
    "manager":     function(r) { return "Manager responsible for " + phrase(r) + "."; },
    "handler":     function(r) { return "Handler for " + phrase(r) + " operations."; },
    "builder":     function(r) { return "Builder for constructing " + phrase(r) + " instances."; },
    "factory":     function(r) { return "Factory for creating " + phrase(r) + " instances."; },
    "repository":  function(r) { return "Repository for accessing and persisting " + phrase(r) + "."; },
    "store":       function(r) { return "Store for managing " + phrase(r) + " state."; },
    "controller":  function(r) { return "Controller managing " + phrase(r) + " logic."; },
    "middleware":  function(r) { return "Middleware for processing " + phrase(r) + "."; },
    "provider":    function(r) { return "Provider for " + phrase(r) + "."; },
    "resolver":    function(r) { return "Resolver for " + phrase(r) + "."; },
    "observer":    function(r) { return "Observer that monitors " + phrase(r) + " changes."; },
    "emitter":     function(r) { return "Event emitter for " + phrase(r) + " events."; },
    "container":   function(r) { return "Container for " + phrase(r) + "."; },
    "client":      function(r) { return "Client for communicating with the " + phrase(r) + "."; },
    "server":      function(r) { return "Server handling " + phrase(r) + " requests."; },
    "parser":      function(r) { return "Parser for " + phrase(r) + "."; },
    "formatter":   function(r) { return "Formatter for " + phrase(r) + "."; },
    "validator":   function(r) { return "Validator for " + phrase(r) + "."; },
    "transformer": function(r) { return "Transformer for converting " + phrase(r) + "."; },
    "adapter":     function(r) { return "Adapter for integrating " + phrase(r) + "."; },
    "wrapper":     function(r) { return "Wrapper around " + phrase(r) + "."; },
    "helper":      function(r) { return "Helper utilities for " + phrase(r) + "."; },
    "config":      function(r) { return "Configuration for " + phrase(r) + "."; },
    "options":     function(r) { return "Options for configuring " + phrase(r) + "."; },
    "context":     function(r) { return "Context for " + phrase(r) + "."; },
    "event":       function(r) { return "Event emitted when " + phrase(r) + " occurs."; },
    "model":       function(r) { return "Data model representing " + phrase(r) + "."; },
    "entity":      function(r) { return "Domain entity representing " + phrase(r) + "."; },
    "dto":         function(r) { return "Data transfer object for " + phrase(r) + "."; },
    "request":     function(r) { return "Request object for " + phrase(r) + "."; },
    "response":    function(r) { return "Response object for " + phrase(r) + "."; },
    "result":      function(r) { return "Result encapsulating " + phrase(r) + "."; },
    "queue":       function(r) { return "Queue for managing " + phrase(r) + "."; },
    "pool":        function(r) { return "Pool of reusable " + phrase(r) + " instances."; },
    "registry":    function(r) { return "Registry for tracking " + phrase(r) + "."; },
    "pipeline":    function(r) { return "Pipeline for processing " + phrase(r) + "."; },
    "strategy":    function(r) { return "Strategy for " + phrase(r) + "."; },
    "command":     function(r) { return "Command encapsulating a " + phrase(r) + " action."; },
    "task":        function(r) { return "Task representing a " + phrase(r) + " operation."; },
    "worker":      function(r) { return "Worker that processes " + phrase(r) + "."; },
    "cache":       function(r) { return "Cache for storing " + phrase(r) + "."; },
    "logger":      function(r) { return "Logger for recording " + phrase(r) + " events."; },
    "decorator":   function(r) { return "Decorator that adds " + phrase(r) + " behaviour."; },
    "interceptor": function(r) { return "Interceptor for " + phrase(r) + " operations."; },
    "scheduler":   function(r) { return "Scheduler for " + phrase(r) + " tasks."; },
    "dispatcher":  function(r) { return "Dispatcher for routing " + phrase(r) + "."; },
    "loader":      function(r) { return "Loader for " + phrase(r) + "."; },
    "writer":      function(r) { return "Writer for serialising " + phrase(r) + "."; },
    "reader":      function(r) { return "Reader for deserialising " + phrase(r) + "."; },
    "runner":      function(r) { return "Runner that executes " + phrase(r) + "."; },
    "executor":    function(r) { return "Executor for running " + phrase(r) + "."; },
    "tracker":     function(r) { return "Tracker for monitoring " + phrase(r) + "."; },
    "collector":   function(r) { return "Collector that gathers " + phrase(r) + "."; },
    "aggregator":  function(r) { return "Aggregator that combines " + phrase(r) + "."; },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Infer a one-line description for a function from its name and modifiers.
 * Examples:
 *   getUserById(...)  → "Returns the user by id."
 *   isActive(...)     → "Returns whether the active."
 *   calculate(...)    → "Calculates."
 *
 * @param {string|null} name - Function name.
 * @param {{ isAsync?: boolean }} [mods] - Modifier flags from the AST.
 * @returns {string} A sentence ending with a full stop.
 */
function inferFunctionDescription(name, mods) {
    if (!name) {
        return (mods && mods.isAsync)
            ? "Performs an asynchronous operation."
            : "Performs an operation.";
    }
    var words = splitCamel(name);
    var verb = words[0];
    var rest = words.slice(1);
    var template = VERB_TEMPLATES[verb];
    if (template) return cap(template(rest));
    // No matching verb prefix — humanise the whole name
    return cap(phrase(words)) + ".";
}

/**
 * Infer a short description for a parameter from its name.
 * Falls back to a humanised version of the camelCase name.
 *
 * @param {string} paramName - The parameter name as written in source.
 * @returns {string} A lowercase description phrase (no trailing period).
 */
function inferParamDescription(paramName) {
    var lower = paramName.toLowerCase();
    // 1. Direct match
    if (PARAM_DESCRIPTIONS[lower]) return PARAM_DESCRIPTIONS[lower];
    // 2. Suffix match: "userId" → words[-1] = "id" → "user unique identifier"
    var words = splitCamel(paramName);
    if (words.length >= 2) {
        var last = words[words.length - 1];
        if (PARAM_DESCRIPTIONS[last]) {
            var desc2 = PARAM_DESCRIPTIONS[last];
            // Boolean descriptors already contain "whether" — don't prepend prefix
            if (desc2.indexOf("whether") === 0) return desc2;
            var prefix = words.slice(0, -1).join(" ");
            return prefix + " " + desc2;
        }
    }
    // 3. Fallback: humanise the name
    return words.join(" ");
}

/**
 * Infer a one-line description for a class from its name.
 * Recognises common suffix patterns (Service, Repository, Error, etc.).
 *
 * @param {string|null} name - Class name.
 * @returns {string} A sentence ending with a full stop.
 */
function inferClassDescription(name) {
    if (!name) return "Represents an entity.";
    var words = splitCamel(name);
    var last = words[words.length - 1];
    var rest = words.slice(0, -1);
    var suffixFn = CLASS_SUFFIX_TEMPLATES[last];
    if (suffixFn && rest.length > 0) return cap(suffixFn(rest));
    return "Represents a " + phrase(words) + ".";
}

module.exports = { splitCamel, inferFunctionDescription, inferParamDescription, inferClassDescription };

/*
 * Main application.
 *
 * @author Chris Spiliotopoulos
 */
const path = require("path");
const nconf = require("nconf");
const Hapi = require("hapi");
const _ = require("lodash");
const winston = require("winston");
const recursive = require("recursive-readdir");
const pluginHapiSwaggered = require("hapi-swaggered");
const Vision = require("vision");
const Inert = require("inert");
const express = require("express");
const router = express.Router();
const DataPackage = require("./lib/datapackage");

/*
 * Load configuration environment
 */
nconf.argv().env();

const app = express();
router.get("/", function (req, res) {
  res.send({
    message: "success",
  });
});

app.use("/abc", router);
// set defaults
nconf.overrides({
  HOST: "localhost",
  PORT: 3000,
});

let log = null;

const Application = (function Bootstrap() {
  // the server instance
  let _server = null;

  // the data package instance
  let _datapackage = null;

  /**
   * Sets up the logging framework.
   *
   * @return {[type]} [description]
   */
  const _setupLogging = () => {
    log = winston.createLogger({
      level: "info",
      format: winston.format.simple(),
    });

    log.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      })
    );
  };

  /**
   * Sets up the server instance.
   *
   * @return {Promise} [description]
   */
  const _setupServer = async () => {
    /*
     * Hapi server instance
     */

    if (_.isUndefined(nconf.get("HOST"))) {
      nconf.set("HOST", "localhost");
    }

    if (_.isUndefined(nconf.get("PORT"))) {
      nconf.set("PORT", 1330);
    }

    _server = new Hapi.Server({
      host: nconf.get("HOST"),
      port: nconf.get("PORT"),
    });

    // load the data package instance
    _datapackage = await DataPackage.load(`${__dirname}/datapackage.json`);

    // setup routing
    await _setupRouting(_server);

    // setup the Swagger plugin
    await _setupSwaggerPlugin(_server);

    _server.route({
      method: "GET",
      path: "/{param*}",
      handler: {
        directory: {
          path: "src/views",
          index: ["index.html", "default.html"],
        },
      },
    });

    // start the server
    await _server.start();

    log.info(`Server launched [${nconf.get("HOST")}:${nconf.get("PORT")}]`);
  };

  // _server.route({
  //   path: "/",
  //   method: "GET",
  //   config: {
  //     tags: ["api"],
  //     description: "Get health status",
  //     handler() {
  //       return "ok";
  //     },
  //   },
  // });

  /**
   * Sets up Hapi Swagger plugin
   * @return {Promise} [description]
   */
  const _setupSwaggerPlugin = async (server) => {
    /*
     * Swagger plugin options
     */
    let host = `${nconf.get("HOST")}:${nconf.get("PORT")}`;
    let basePath;

    if (nconf.get("swagger") && !_.isEmpty(nconf.get("swagger:host"))) {
      host =
        nconf.get("swagger:host") !== ""
          ? nconf.get("swagger:host")
          : undefined;
    }

    if (nconf.get("swagger") && !_.isEmpty(nconf.get("swagger:basePath"))) {
      basePath =
        nconf.get("swagger:basePath") !== ""
          ? nconf.get("swagger:basePath")
          : undefined;
    }

    await server.register([
      Inert,
      Vision,
      {
        plugin: pluginHapiSwaggered,
        options: {
          host,
          basePath,
          schemes: ["http", "https"],
          cors: false,
          info: {
            title: "OpenReferral - Validator",
            description:
              "Validator API for Open Referral data resource bundles.",
            version: "1",
            contact: {
              name: "Chris Spiliotopoulos (@spilio)",
              url: "https://github.com/spilio",
              email: "chrysanthos.spiliotopoulos@gmail.com",
            },
            license: {
              name: "MIT",
              url: "https://opensource.org/licenses/MIT",
            },
          },
          tags: [
            { name: "open referral" },
            { name: "validator" },
            { name: "open api" },
          ],
          consumes: ["multipart/form-data"],
          produces: ["application/json"],
        },
      },
    ]);
  };

  /**
   * Sets up server routing.
   * @param  {[type]} server [description]
   * @return {[type]}        [description]
   */
  const _setupRouting = (server) =>
    new Promise((resolve, reject) => {
      try {
        /*
         * load controller routes
         */
        const normalizedPath = path.resolve(__dirname, "./rest");

        // load all controller modules recursively
        recursive(normalizedPath, (err, files) => {
          files.forEach((file) => {
            require(file)(server, _datapackage);
          });

          // done
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });

  /**
   * Starts the application
   * @return {[type]} [description]
   */
  const _start = async () => {
    // setup logging
    _setupLogging();

    // setup the server instance
    await _setupServer();
  };

  return {
    /*
     * Public
     */
    start: _start,
  };
})();


process.on('uncaughtException', (err) => {
  console.error(`Caught exception: ${err}`);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
/**
 * Start the application
 */
Application.start();

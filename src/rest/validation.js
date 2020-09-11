/**
 * Validation endpoint.
 *
 * @author Chris Spiliotopoulos
 */

const _ = require('lodash');
const Boom = require('boom');
const Joi = require('joi');
const fs = require('fs');
const extract = require('extract-zip');
const path = require('path');
const csv = require('csv-parser')
const async = require('async')

const {
  ValidationResult
} = require('../schemas/validation');

const DataPackage = require('../lib/datapackage');

module.exports = function(server, datapackage) {

  /**
   * Validates a CSV resource data file.
   */
  server.route({
    path: '/validate/csv',
    method: 'POST',
    config: {
      tags: ['api'],
      description: 'Validate a CSV data file using a specific Open Referral resource schema',
      notes: [
        'The operation validates an uploaded CSV data stream using the ',
        'definition of a specified resource as found in the standard Open Referral data package',
        'specification.  Clients should send a form payload containg a "type" field with the name ',
        'of the Open Referral logical resource and a "file" that contains the CSV data stream.'
      ].join(''),
      plugins: {
        'hapi-swaggered': {
          operationId: 'validateCsvResource'
        }
      },
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data'
      },
      response: {
        schema: ValidationResult
      },
      async handler(request, h) {

        // get the uploaded resource type
        const {
          payload
        } = request;

        const {
          type,
          file: stream
        } = payload;

        try {

          if (typeof type === 'undefined') {
            throw new Error('Form should contain the field "type" with a valid resource name');
          }

          if (typeof stream === 'undefined') {
            throw new Error('Form should contain the field "file" with a valid resource data stream');
          }

          const result = await datapackage.validateResource(stream, type);
          let csvPath = path.join(process.cwd(), "public/"+( (new Date()).getTime())+".csv" );

          await fs.writeFileSync(csvPath, stream._data);
          return new Promise(function(resolve,reject){
            fs.createReadStream(csvPath)
            .pipe(csv())
            .on('headers', (headers) => {
              result.header = headers.length;
              if (!result.valid) {
                resolve(h.response(result).code(422));
              }
              resolve(h.response(result).code(200));
            });          
          });          

        } catch (e) {
          return Boom.badRequest(e.message);
        }

      }
    }
  });

  server.route({
    path: '/validate/zip',
    method: 'POST',
    config: {
      tags: ['api'],
      description: 'Validate a CSV data file using a specific Open Referral resource schema',
      notes: [
        'The operation validates an uploaded CSV data stream using the ',
        'definition of a specified resource as found in the standard Open Referral data package',
        'specification.  Clients should send a form payload containg a "type" field with the name ',
        'of the Open Referral logical resource and a "file" that contains the CSV data stream.'
      ].join(''),
      plugins: {
        'hapi-swaggered': {
          operationId: 'validateCsvResource'
        }
      },
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data'
      },
      // response: {
      //   schema: ValidationResult
      // },
      async handler(request, h) {

        // get the uploaded resource type
        const {
          payload
        } = request;

        const {
          type,
          file: stream
        } = payload;

        try {

          if (typeof type === 'undefined') {
            throw new Error('Form should contain the field "type" with a valid resource name');
          }

          if (typeof stream === 'undefined') {
            throw new Error('Form should contain the field "file" with a valid resource data stream');
          }

          // validate the input stream using
          // the provided resource type definition
          await fs.writeFileSync('filename1.zip', stream._data);
                    
          let dirPath = path.join(process.cwd(), "public/"+( (new Date()).getTime()) );
          if (!fs.existsSync(dirPath)){
            fs.mkdirSync(dirPath);
          }

          let resultArr = {};
          await extract('filename1.zip', { dir: dirPath });
          const _files = [
            { name: "accessibility_for_disabilities", status: "No Data", result: "-", filename: 'accessibility_for_disabilities', class: ''},
            { name: "contact", status: "No Data", result: "-" , filename: 'contacts', class: ''},
            { name: "eligibilty", status: "No Data", result: "-" , filename: 'eligibilty', class: ''},
            { name: "funding", status: "No Data", result: "-" , filename: 'funding', class: ''},
            { name: "holiday_schedule", status: "No Data", result: "-" , filename: 'holiday_schedules', class: ''},
            { name: "language", status: "No Data", result: "-" , filename: 'languages', class: ''},
            { name: "location", status: "No Data", result: "-" , filename: 'locations', class: ''},
            { name: "meta_table_description", status: "No Data", result: "-" , filename: 'meta_table_descriptions', class: ''},
            { name: "metadata", status: "No Data", result: "-" , filename: 'metadata', class: ''},
            { name: "organization", status: "No Data", result: "-" , filename: 'organizations', class: ''},
            { name: "payment_accepted", status: "No Data", result: "-" , filename: 'payments_accepted', class: ''},
            { name: "phone", status: "No Data", result: "-" , filename: 'phones', class: ''},
            { name: "physical_address", status: "No Data", result: "-" , filename: 'physical_addresses', class: ''},
            { name: "postal_address", status: "No Data", result: "-" , filename: 'postal_addresses', class: ''},
            { name: "program", status: "No Data", result: "-" , filename: 'programs', class: ''},
            { name: "regular_schedule", status: "No Data", result: "-" , filename: 'regular_schedules', class: ''},
            { name: "required_document", status: "No Data", result: "-" , filename: 'required_documents', class: ''},
            { name: "service_area", status: "No Data", result: "-" , filename: 'service_areas', class: ''},
            { name: "service", status: "No Data", result: "-" , filename: 'services', class: ''},
            { name: "service_at_location", status: "No Data", result: "-" , filename: 'services_at_location', class: ''},
            { name: "service_taxonomy", status: "No Data", result: "-" , filename: 'services_taxonomy', class: ''},
            { name: "taxonomy", status: "No Data", result: "-" , filename: 'taxonomy', class: ''},

          ];

          for(let f of _files) {
            try {
              let cName = f.filename;
              let csvPath = path.join(dirPath, cName+".csv");
              if (fs.existsSync(csvPath)) {
                resultArr[cName] = await datapackage.validateResource(csvPath, f.name);
              }
            } catch(err) {
              console.error(err)
            }
          }
          return new Promise(function(resolve,reject){
            async.eachSeries(_files, function iteratee(f, callback) {
              try {
                let cName = f.filename;
                let csvPath = path.join(dirPath, cName+".csv");
                if (fs.existsSync(csvPath)) {
                  fs.createReadStream(csvPath)
                  .pipe(csv())
                  .on('headers', (headers) => {
                    resultArr[cName].header = headers.length;
                    callback(null);
                  })
                } else {
                  resultArr[cName].header = 0;
                  callback(null);
                }
              } catch(err) {
                callback(null);
              }
            }, function () {
              resolve(h.response(resultArr).code(200));
            });
          });

        } catch (e) { 
          return Boom.badRequest(e.message);
        }

      }
    }
  });


  /**
   * Validates a data package.
   */
  server.route({
    path: '/validate/datapackage',
    method: 'GET',
    config: {
      tags: ['api'],
      description: 'Validate a data package using the Open Referral specification.',
      notes: [
        'The operation expects the URI of a valid "datapackage.json" file that conforms to the Open Referral schema. ',
        'The validator will check all enlisted resources in turn and will return a collection of validation results ',
        'that correspond to each one of the resources.  The file can be either local or remote.'
      ].join(''),
      plugins: {
        'hapi-swaggered': {
          operationId: 'validateDatapackage'
        }
      },
      validate: {
        query: {
          uri: Joi.string().required()
            .description('Data package descriptor file URL'),
          relations: Joi.boolean().default(false)
            .description('Flag indicating whether to check data relations through foreign keys')
        }
      },
      response: {
        schema: Joi.array().items(ValidationResult).description('A collection of validation results')
      },
      async handler(request, h) {

        // get the uploaded resource type
        const {
          query
        } = request;

        const {
          uri,
          relations
        } = query;

        try {

          // load the data package
          const dp = await DataPackage.load(uri);

          // validate the full package
          const results = await dp.validatePackage({
            relations
          });

          // check if there is at least 1 failed validation
          const matches = _.find(results, {
            valid: false
          });

          // add the results to the response
          const res = h.response(results);

          // if there is a failed validation, return 400
          if (matches) {
            res.code(422);
          }

          return res;
        } catch (e) {
          return Boom.badRequest(e.message);
        }

      }
    }
  });

};

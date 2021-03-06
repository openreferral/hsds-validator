`Application enabling people to validate Open Referral's Human Service Data Specification data.`

# Running the service

### Running locally with NodeJS

In order to run the project locally you need to have the latest [NodeJS](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/) installed.

Once your environment is all set up, clone the repository, go into the root directory and install all dependencies by running

```bash
$ npm install
```
Once all the dependencies have been downloaded, run the application with

```bash
$ npm start
```

# Using the validator service

Once the service has been launched you can verify that the API is up by hitting http://localhost:1400/health.  If everything is ok you should get a blank page (or a 200 response).




## API operations

### `GET /health`

#### Description

Returns a 200 OK response

### `GET /validate/datapackage`

#### Description

Validate an HSDS data package.  The operation requires the URI of valid **datapackage.json** file to be provided as a query parameter.  The service will parse the contents of the data package and try to validate all enlisted resources.

#### Query parameters

- `uri`: A valid local or remote URI of a **datapackage.json** descriptor file.
- `relations`: (optional) A boolean flag indicating whether to enable data relations check through defined foreign keys - default is **false**

#### Response

The operation returns a collection of validation results, one per resource as defined within the data package descriptor.

#### Example call

Given we have a sample datapackage.json file at http://example.com/openreferral/datapackage.json that contains a small subset of resources, we can run the following command to validate the contained resources:

```bash
$ curl 'http://localhost:1400/validate/datapackage?uri=http://example.com/openreferral/datapackage.json'
```

If all data resources are valid, the service will return a response like:

```json
[{
  "valid": true,
  "resource": "organization"
}, {
  "valid": true,
  "resource": "program"
}]
```

In case something is wrong, the response would be something like:

```json
[
    {
        "valid": true,
        "resource": "organization"
    },
    {
        "valid": false,
        "errors": [
            {
                "row": 3,
                "description": "Foreign key \"organization_id\" violation in row 3"
            }
        ],
        "resource": "program"
    }
]
```

### `POST /validate/csv`

#### Description

Validate an HSDS data resource file.  The operation validates an uploaded CSV data stream using the definition of a specified resource as found in the standard Open Referral data packagespecification. Clients should send a form payload containg a **type** field with the name of the HSDS logical resource and a **file** that contains the CSV data stream.

#### Consumes

- multipart/form-data

#### Payload

- `type`: A valid HSDS resource name, e.g. **contact**
- `file`: The CSV file to be validated

#### Example call

```bash
$ curl -F 'type=contact' -F 'file=@/home/chris/contacts.csv' 'http://localhost:1400/validate/csv'
```

A successful validation would return something like:

```json
{
    "valid": true,
    "errors": []
}
```

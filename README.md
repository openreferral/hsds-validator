`Application enabling people to validate Open Referral's Human Service Data Specification data.`

# Running the service

### Running locally with NodeJS

In order to run the project locally you need to have the latest (NOT > Node v14.x, NPM v6.x) [NodeJS](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/) installed.

Once your environment is all set up, clone the repository, go into the root directory and install all dependencies by running

```bash
$ npm install
```
You _may_ need to install nodemon first using the following command:

``` bash
$ npm install -g nodemon
```

Once all the dependencies have been downloaded, run the application with

```bash
$ npm start
```

# Using the validator service

Once the service has been launched you can verify that the API is up by hitting http://localhost:3000/health.  If everything is ok you should get a blank page (or a 200 response).

## API operations

### `GET /health`

#### Description

Returns a 200 OK response

### `GET /resources`

#### Description

Returns a list of all HSDS resource definitions

### `GET /resources/{name}`

#### Description

Obtains a resource definition by name

#### Query parameters

- `name`: The name of the resource (HSDS entity) (e.g. location, organization, etc.)

#### Response

The operation returns the resource as defined within the default DataPackage

#### Example call

```bash
$ curl 'http://localhost:3000/resources/location
```

This will return a response similar to:

```json
[{
  "name": "location",
  "local": true,
  "remote": false,
  "multipart": false,
  "tabular": true,
  "source": "/Users/ajlevinson/Development/unity-foundation/hsds-validator/src/locations.csv",
  "schema": {
    "fields": [
      {
        "name": "id",
        "description": "Each location must have a unique identifier",
        "type": "string",
        "constraints": {
          "required": true
        },
        "format": "default"
      },
      {
        "name": "organization_id",
        "description": "Each location entry should be linked to a single organization. This is the organization that is responsible for maintaining information about this location. The identifier of the organization should be given here. Details of the services the organisation delivers at this location should be provided in the services_at_location table.",
        "type": "string",
        "format": "default"
      },
      {
        "name": "name",
        "description": "The name of the location",
        "type": "string",
        "format": "default"
      },
      {
        "name": "alternate_name",
        "description": "An alternative name for the location",
        "type": "string",
        "format": "default"
      },
      {
        "name": "description",
        "description": "A description of this location.",
        "type": "string",
        "constraints": {
          "required": false
        },
        "format": "default"
      },
      {
        "name": "transportation",
        "description": "A description of the access to public or private transportation to and from the location.",
        "type": "string",
        "format": "default"
      },
      {
        "name": "latitude",
        "description": "Y coordinate of location expressed in decimal degrees in WGS84 datum.",
        "type": "number",
        "format": "default"
      },
      {
        "name": "longitude",
        "description": "X coordinate of location expressed in decimal degrees in WGS84 datum.",
        "type": "number",
        "format": "default"
      }
    ],
    "primaryKey": "id",
    "foreignKeys": [
      {
        "fields": "organization_id",
        "reference": {
          "resource": "organization",
          "fields": "id"
        }
      }
    ],
    "missingValues": [
      ""
    ]
  }
}]
```

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
$ curl 'http://localhost:3000/validate/datapackage?uri=http://example.com/openreferral/datapackage.json'
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

#### Example validation call

```bash
$ curl -X POST -F 'type=contact' -F 'file=@/home/chris/contacts.csv' 'http://localhost:1400/validate/csv'
```

A successful validation would return something like:

```json
{
    "valid": true,
    "errors": []
}
```

## Deploying to AWS

The following commands will allow you to deploy the container to Amazon's Elastic Container Repository (ECR):

#### Authenticate with AWS (must have the AWS CLI for ECR installed and have valid API credentials)
```bash 
aws ecr get-login-password --region [region] | docker login --username AWS --password-stdin [AWS Account# ].dkr.ecr.[region].amazonaws.com
```
#### Build Docker image
 ```bash
 docker build -t [Image Name] .
 ```

#### Tag Docker Image
```bash
docker tag [Repo Name]:[latest|version] [AWS Account# ].dkr.ecr.[region].amazonaws.com/[Image Name]:[latest|version]
```

#### Push Image
```bash
docker push [AWS Account# ].dkr.ecr.[region].amazonaws.com/[Image Name]:[latest|version]
```

The image will now be available for deployment to any service appropriate for container deployment, such as ECS, EKS, or Lambda functions.
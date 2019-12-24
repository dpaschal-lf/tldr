const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});



function generateRandomKey ( length = 8){
  let output = '';
  const sourceChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-._~';
  while(output.length < length){
    output += sourceChars[Math.trunc(Math.random()*sourceChars.length)];
  }
  return output;
}

exports.default = (event,context, callback) => {
  callback(null, {
    body: JSON.stringify(event),
    statusCode: 200
  })
}

exports.handler = (event, context, callback)=>{
  switch(event.httpMethod){
    case 'GET':
      read(event, context, callback);
      break;
    case 'POST':
      create(event, context, callback);
      break;
  }
}

function read(event, context, callback){
  //       return   callback(null, {
  //   body: JSON.stringify(event),
  //   statusCode: 200
  // }) 
    const url = event.queryStringParameters ? event.queryStringParameters.url : event.pathParameters.shortURL;
    const ddb = new AWS.DynamoDB({
        region: 'us-west-2'
    });
    const params = {
        TableName: 'tldrURLData',
        Key: {
         "tinyURL": {
           S: url
          }
        }
    };
    ddb.getItem(params, (err,data)=>{
      if(err){
        callback(null,{
          body: "error: " + err
        });
        return;
      }
      const fullURL = data.Item.fullURL['S']
      callback(null,{
        headers: {
          Location: fullURL
        },
        body: 'redirecting to ' + fullURL,
        statusCode: 302
      })
      
    })

};

function create(event, context, callback){
    // TODO implement

    const ddb = new AWS.DynamoDB({
        // apiVersion: '2012-08-10',
        region: 'us-west-2'
    });

    const currentTime = ''+ Date.now();
    const randomKey = generateRandomKey();
    if(event.queryStringParameters===null){
      callback(null,{
        statusCode: 500,
        body: 'must supply url in query string'
      })
    }
    const params = {
        TableName: 'tldrURLData',
        Item: {
          'tinyURL' : {'S': randomKey},
          'added' : { 'N': currentTime },
          'fullURL': { 'S': event.queryStringParameters.url},
          'lastAccessed': {'N': currentTime}
        }
    };
      // return callback(null, {
      //   statusCode: 200,
      //   body: JSON.stringify(params)
      // })
    ddb.putItem(params, (err, data)=>{
      // callback(null, {
      //   statusCode: 200,
      //   body: 'straight up now tell me'
      // })
      if(!err){
        callback(null, {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ tinyURL: randomKey })
        });
      } else {
        callback( null, {
          statusCode: 500,
          body: "error: " + JSON.stringify(err)
        })
      }
    })

};

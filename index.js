var aws = require("aws-sdk");
var crypt = require('crypto');
var ses = new aws.SES({ region: "us-east-1" });
var DynamoDB = new aws.DynamoDB.DocumentClient();

// require('dotenv').config();

exports.handler = (event, context, callback) => {

    let message = JSON.parse(event.Records[0].Sns.Message);

    console.log(JSON.stringify(message));
    
    let username = message.username;
    // let token = message.token;

    // let SHA= crypt.createHash('sha256');
    // SHA.update(username+token);
    let HASH = message.token;

    let searchParams = {
        TableName: "dynamodb-table",
        Key: {
            "one-time-token": HASH
        }
    };
    

    console.log("Checking if record already present in DB!!");

    DynamoDB.get(searchParams, function(error, record){
        
        if(error) {

            console.log("Error in DynamoDB get method ",error);

        } else {

            console.log("Success in get method dynamoDB", record);
            console.log(JSON.stringify(record));
            let isPresent = false;

            if (record.Item == null || record.Item == undefined) {
                isPresent = false;
            } else {
                if(record.Item.ttl < Math.floor(Date.now() / 1000)){
                    isPresent = false;
                    console.log('inside ttl',isPresent);
                }   
                else{
                    isPresent = true;
                    console.log('inside ttl and about to send mail',isPresent);
                    sendEmail(message);
                }
                    
            }

            // if(!isPresent) {
            //     const current = Math.floor(Date.now() / 1000)
            //     let ttl = 60 * 5
            //     const expiresIn = ttl + current
            //     const params = {
            //         Item: {
            //             hash_value: HASH,
            //             ttl: expiresIn,
            //         },
            //         TableName: "dynamodb-table"
            //     }

            //     DynamoDB.put(params, function (error, data) {
            //         if (error){
            //             console.log("Error in putting item in DynamoDB ", error);
            //         } 
            //         else {
            //             sendEmail(message, question, answer);
            //         }
            //     });
                
            // } else {
            //     console.log("Item already present. No email sent!");
            // }
        }
    })
};

var sendEmail = (data) => {

    let link = `http://${data.domainName}/v1/verifyUserEmail?email=${data.username}&token=${data.token}`;

    let body = "Hello "+ data.first_name +",\n\n"+
    "You registered an account on our application, before being able to use your account you need to verify that this is your email address by clicking here:" +"\n\n\n"+
    "Kind Regards,"+data.username+"\n\n\n"+
    link
    let from = "no-reply@"+data.domainName
    let emailParams = {
        Destination: {
            ToAddresses: [data.username],
        },
        Message: {
            Body: {
                Text: { Data: body },
            },
            Subject: { Data: "User Verification Email" },
        },
        Source: from,
    };

    let sendEmailPromise = ses.sendEmail(emailParams).promise()
    sendEmailPromise
        .then(function(result) {
            console.log(result);
        })
        .catch(function(err) {
            console.error(err, err.stack);
        });
}


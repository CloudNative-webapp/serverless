var aws = require("aws-sdk");
var crypt = require('crypto');
var ses = new aws.SES({
    region: "us-east-1"
});
var DynamoDB = new aws.DynamoDB.DocumentClient();

// require('dotenv').config();

exports.handler = (event, context, callback) => {

    let message = JSON.parse(event.Records[0].Sns.Message);

    console.log(JSON.stringify(message));

    let verifyMsg = message.verify;
    console.log('verify email', verifyMsg)

    if (!verifyMsg) {
        console.log('in if loop of verify')
        sendEmail(message);
    }

};

var sendEmail = (data) => {

    let link = `https://${data.domainName}/v1/verifyUserEmail?email=${data.username}&token=${data.token}`;

    let body = "Hello " + data.first_name + ",\n\n" +
        "You registered an account on our application, before being able to use your account you need to verify that this is your email address by clicking here:" + "\n\n\n" +
        "Kind Regards," + data.username + "\n\n\n" +
        link
    let from = "no-reply@" + data.domainName
    let emailParams = {
        Destination: {
            ToAddresses: [data.username],
        },
        Message: {
            Body: {
                Text: {
                    Data: body
                },
            },
            Subject: {
                Data: "User Verification Email"
            },
        },
        Source: from,
    };

    let sendEmailPromise = ses.sendEmail(emailParams).promise()
    sendEmailPromise
        .then(function (result) {
            console.log(result);
        })
        .catch(function (err) {
            console.error(err, err.stack);
        });
}
const paytm = require('paytm-nodejs');
//const checksum = require('./Paytm/checksum');
const Promise = require('bluebird');
 

//test 
const config = {
    MID : 'ScGZuC54959978517229', // Get this from Paytm console
    KEY : 'efqzp%RCOhf102Pf', // Get this from Paytm console
    ENV : 'dev', // 'dev' for development, 'prod' for production
    CHANNEL_ID : 'WAP',
    INDUSTRY : 'Retail',  
    WEBSITE : 'Default',
    CALLBACK_URL : 'https://localhost:1111/paytm.js',  // webhook url for verifying payment
}
 
// your create payment controller function
exports.pay = async function(req,res)
{ 
    let data = 
    {
        TXN_AMOUNT : '100', // request amount
        ORDER_ID : 'ORDER_123456', // any unique order id 
        CUST_ID : 'CUST_123456' // any unique customer id		
    }

    console.log("==========Paytm request params========");
    console.log(data);
 return await new Promise((resolve,reject)=> {
// create Paytm Payment
paytm.createPayment(config,data,function(err,data)
{
    if(err)
    {
       console.log("Paytm error", err); // handle err
       reject({
        message: razor_error.message,
        payload: null,
        error: "Paytm order creation unsuccessful"
    })
    }else
    {
        console.log("======order success=====");
                console.log(data);
                resolve(data);
    }
 });
 let url = data.url;
let checksum = data.checksum;
})
}


    
        //success will return
 
        /*{ 
            MID: '###################',
            WEBSITE: 'DEFAULT',
            CHANNEL_ID: 'WAP',
            ORDER_ID: '#########',
            CUST_ID: '#########',
            TXN_AMOUNT: '##',
            CALLBACK_URL: 'localhost:8080/paytm/webhook',
            INDUSTRY_TYPE_ID: 'Retail',
            url: 'https://securegw-stage.paytm.in/order/process',
            checksum: '####################################' 
        }*/
 
        //store the url and checksum
       // let url = data.url;
        //let checksum = data.checksum;
 
      
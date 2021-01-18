//ssh -i AASSHH.pem ubuntu@ec2-18-217-153-2.us-east-2.compute.amazonaws.com

//cd Customer-Server/nodeSignUp

const mysql = require("mysql");
const express = require("express");
const url = require("url");
const bodyParser = require("body-parser");
const panelUser = require("./resources/panelUser");
const customer = require("./resources/customer");
const homeSlider = require("./resources/HomeSlider");
const homePost = require("./resources/HomePost");
const transactions = require("./resources/Transactions");
const featurePost = require("./resources/FeaturePost");
const notification = require("./resources/notification");
const subscription = require("./resources/Subscription");
const commonMethods = require("./resources/commonMethods");
const datetime = require("node-datetime");
const awsWorker = require("./resources/uploadFile/photoUploader");
const multer = require("multer");

const cors = require("cors");
const jwtToken = require("./resources/jwtToken");

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

global.connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  port: 3306,
  password: "root@123",
  database: "mlm",
});

connection.connect(function (err, result) {
  if (err) {
    console.log("error--->" + err);
  }

  //   logger.info('Connected Id:- ', cnection.threadIdon);
  console.log("Connected Id:- " + connection.threadId);
});

var app = express();

app.listen(1111, () => console.log(`Example app listening on port 1111!`));
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", type: ["json"] }));
app.use(function (req, res, next) {
  console.log(req.url);
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  //"https://mlm-app.vercel.app"
  // res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization');
  res.header("Access-Control-Allow-Origin", "http://localhost:4200"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, authorization, requesttype"
  );
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.post("/panel/login", panelUser.login); //admin  login
app.get(
  "/panel/accessTokenLogin",
  panelUser.accessTokenMiddleWare,
  panelUser.accessTokenLogin
); //admin access token login
app.post(
  "/panel/upload/photo",
  panelUser.accessTokenMiddleWare,
  upload.single("photos"),
  awsWorker.doUpload
); //upload photo on server
app.post(
  "/panel/addSliderImage",
  panelUser.accessTokenMiddleWare,
  homeSlider.addSliderPhoto
); //upload photo on server
app.get(
  "/getSliderImage",
  commonMethods.accessTokenMiddleWare,
  homeSlider.getSliderList
); //upload photo on server
app.post(
  "/panel/verifyCGC",
  panelUser.accessTokenMiddleWare,
  featurePost.verifyCGC
); //upload photo on server
app.post(
  "/panel/deleteSliderImage",
  panelUser.accessTokenMiddleWare,
  homeSlider.deleteSliderImage
); //upload photo on server

app.post("/customer/signup", customer.addUser); //customer signup
app.post("/customer/login", customer.login); //customer login
//get all customers
app.get("/customer/list",panelUser.accessTokenMiddleWare,customer.customerList);
app.post(
  "/customer/verifyPhone",
  customer.accessTokenMiddleWare,
  customer.verifyOTP
); //customer logout
app.post(
  "/customer/accessTokenLogin",
  customer.accessTokenMiddleWare,
  customer.accessTokenLogin
); //customer accesstokenlogin
app.post("/customer/logout", customer.accessTokenMiddleWare, customer.logout); //customer logout
app.post(
  "/customer/applyInviteCode",
  customer.accessTokenMiddleWare,
  customer.applyInviteCode
); //customer logout
app.post(
  "/customer/updateProfile",
  customer.accessTokenMiddleWare,
  customer.updateProfile
); //customer logout
app.post(
  "/upload/photo",
  customer.accessTokenMiddleWare,
  upload.single("photos"),
  awsWorker.doUpload
); //upload photo on server
app.post("/customer/post", customer.accessTokenMiddleWare, homePost.addPost); //customer logout
app.get("/customer/post", customer.accessTokenMiddleWare, homePost.getPostList); //customer logout
app.post(
  "/customer/deletePost",
  customer.accessTokenMiddleWare,
  homePost.deletePost
); //customer logout
app.post(
  "/customer/post/like",
  customer.accessTokenMiddleWare,
  homePost.likePost
); //customer logout
app.post(
  "/customer/post/unlike",
  customer.accessTokenMiddleWare,
  homePost.unlikePost
); //customer logout
app.get(
  "/customer/getReferrals",
  customer.accessTokenMiddleWare,
  transactions.recevieReferralTransactions
); //customer logout
app.get(
  "/customer/getWalletDetails",
  customer.accessTokenMiddleWare,
  transactions.getWalletDetails
); //customer logout
app.post(
  "/feature/post/checkout",
  commonMethods.accessTokenMiddleWare,
  featurePost.createPostCheckout
); //customer logout
app.post(
  "/feature/post/purchase",
  commonMethods.accessTokenMiddleWare,
  featurePost.purchasePost
); //customer logout
app.get(
  "/feature/post",
  commonMethods.accessTokenMiddleWare,
  featurePost.getFeatureList
); //customer logout
app.get(
  "/customer/feature/CGC/pending",
  customer.accessTokenMiddleWare,
  featurePost.getPendingCuurentGrowthList
); //customer logout
// app.post('/customer/subscription/checkout', customer.accessTokenMiddleWare, subscription.checkout)   //customer logout
// app.post('/customer/subscription/purchase', customer.accessTokenMiddleWare, subscription.purchase)   //customer logout
app.post(
  "/customer/subscription/deductWalletAmount",
  customer.accessTokenMiddleWare,
  subscription.deductWalletAmount
); //customer logout
app.post("/customer/forgotPassword", customer.forgotPassword); //customer logout
app.post("/customer/setNewPassword", customer.setNewPassword); //customer logout
app.post("/customer/verifyPhoneOnForgot", customer.verifyPhoneOnForgot); //customer logout
app.get(
  "/customer/notifications",
  customer.accessTokenMiddleWare,
  notification.getNotiList
); //customer logout
app.post(
  "/customer/actionPerformedOnPost",
  customer.accessTokenMiddleWare,
  homePost.actionPerformedOnPost
); //customer logout
app.get(
  "/customer/getPostDetail",
  customer.accessTokenMiddleWare,
  homePost.getPostDetail
); //customer logout

app.get("/test", async (req, res) => {
  console.log("------inTest-------");
  res.send("Test Successfully")

});

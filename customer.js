const jwtToken = require("./jwtToken");
const commonMethods = require("./commonMethods");
const joi = require("joi");
const Promise = require("bluebird");
const constant = require("./constant");
const jwt = require("jsonwebtoken");
const { constants } = require("crypto");
const request = require("request");
var rn = require("randomstring");
const https = require("https");
const { reject } = require("bluebird");

const jwtKey = "gamprs@123";
exports.accessTokenMiddleWare = function (req, res, next) {
  console.log("Headers:----", req.headers);
  console.log("Body:----", req.body);
  console.log("Query:----", req.query);
  var token = "token";
  token = req.headers.authorization;
  if (token == undefined) {
    return res.status(400).json({
      message: constant.RESPONSES.NOT_AUTHENTICATED.message,
      status: constant.RESPONSES.NOT_AUTHENTICATED.status,
      data: {},
    });
  }

  console.log("=======inside accesstoken============");
  token = token.split(" ")[1];
  if (token == undefined || token == null) {
    return res.status(400).json({ status: 400, message: "Bad Request" });
  }
  try {
    var payload = jwt.verify(token, jwtKey);

    console.log(payload);
    if (payload.userName != null && payload.userName != undefined) {
      req.phone = payload.userName;
      return new Promise((resolve, reject) => {
        connection.query(
          "SELECT * FROM Users WHERE `phone` = ?",
          [payload.userName],
          (err, rows) => {
            console.log("=======results==========");
            console.log(err, rows);
            if (err != null || err != undefined) {
              return res.status(400).json({
                message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                data: err,
              });
            } else if (rows.length <= 0) {
              return res
                .status(400)
                .json({ status: 400, message: "Invalid Token" });
            } else if (rows[0].accessToken != token) {
              return res.status(400).json({
                message: "Token Expired",
                status: 400,
                data: {},
              });
            } else if (rows[0].role != constant.USER_ROLE.CUSTOMER) {
              return res.status(400).json({
                message: "Customer Rights required for this action",
                status: 400,
                data: {},
              });
            } else {
              req.userId = rows[0].id;
              req.fullName = rows[0].fullName;
              req.imageStr = rows[0].imageStr;

              next();
            }
          }
        );
      });
    } else {
      return res.status(400).json({ status: 400, message: "Invalid Token" });
    }
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ status: 400, message: "Token Expired" });
    }
    return res.status(400).json({ status: 400, message: "Bad Request" });
  }
};

exports.accessTokenLogin = function (req, res) {
  console.log("-------5----------");
  console.log(req.body);

  let phone = req.phone;
  const schema = joi.object().keys({
    phone: joi.string().required(),
  });

  var userDetails;
  Promise.coroutine(function* () {
    yield joi
      .validate({ phone: phone }, schema)
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT `id`, `fullName`, `email`, `phone`, `accessToken`, `role`, `status`, `referralCode`, `imageStr`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `isVerified`, `verificationCode`, `createdAt`, `updatedAt` FROM `Users` WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else if (!rows[0].isVerified) {
                resolve(rows[0]);
              } else {
                res.send({
                  message: constant.RESPONSES.SUCCESSFULL.message,
                  status: constant.RESPONSES.SUCCESSFULL.status,
                  data: rows[0],
                });
              }
            }
          );
        });
      })
      .then((userDetailsObj) => {
        userDetails = userDetailsObj;

        return sendVerificationCode(userDetails.phone);
      })
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT `id`, `fullName`, `email`, `phone`, `accessToken`, `role`, `status`, `referralCode`, `imageStr`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `isVerified`, `verificationCode`, `createdAt`, `updatedAt` FROM `Users` WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                res.send({
                  message: constant.RESPONSES.SUCCESSFULL.message,
                  status: constant.RESPONSES.SUCCESSFULL.status,
                  data: rows[0],
                });
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

exports.logout = function (req, res) {
  console.log("-------5----------");
  console.log(req.body);

  let phone = req.phone;
  const schema = joi.object().keys({
    phone: joi.string().required(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate({ phone: phone }, schema)
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `accessToken`=? WHERE `phone` = ?",
            [null, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                res.send({
                  message: constant.RESPONSES.SUCCESSFULL.message,
                  status: constant.RESPONSES.SUCCESSFULL.status,
                  data: rows[0],
                });
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

exports.login = function (req, res) {
  console.log("-------1----------");
  console.log(req.body);

  let phone = req.body.phone;
  let password = req.body.password;
  let deviceToken = req.body.deviceToken;

  const schema = joi.object().keys({
    phone: joi.string().required(),
    password: joi.string().required(),
    deviceToken: joi.string().required(),
  });

  var userDetails;
  Promise.coroutine(function* () {
    yield joi
      .validate(
        { phone: phone, password: password, deviceToken: deviceToken },
        schema
      )
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length <= 0) {
                  reject({
                    message: constant.RESPONSES.USER_NOT_EXIST.message,
                    status: constant.RESPONSES.USER_NOT_EXIST.status,
                    data: {},
                  });
                } else if (
                  commonMethods.decryptPassword(rows[0].password) != password
                ) {
                  reject({
                    message: constant.RESPONSES.MOB_AND_PASS_NOT_MATCH.message,
                    status: constant.RESPONSES.MOB_AND_PASS_NOT_MATCH.status,
                    data: {},
                  });
                } else {
                  resolve();
                }
              }
            }
          );
        });
      })
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT `id`, `fullName`, `email`, `phone`, `accessToken`, `role`, `status`, `referralCode`, `imageStr`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `isVerified`, `verificationCode`, `createdAt`, `updatedAt` FROM `Users` WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve(rows[0]);
              }
            }
          );
        });
      })
      .then((userDetails) => {
        let token = jwtToken.genereateToken(phone);
        userDetails.accessToken = token;

        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `accessToken`=?, `deviceToken`=? WHERE `phone` = ?",
            [token, deviceToken, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else if (!userDetails.isVerified) {
                resolve(userDetails);
              } else {
                res.send({
                  message: constant.RESPONSES.SUCCESSFULL.message,
                  status: constant.RESPONSES.SUCCESSFULL.status,
                  data: userDetails,
                });
              }
            }
          );
        });
      })
      .then((userDetailsObj) => {
        userDetails = userDetailsObj;
        return sendVerificationCode(userDetails.phone);
      })
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT `id`, `fullName`, `email`, `phone`, `accessToken`, `role`, `status`, `referralCode`, `imageStr`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `isVerified`, `verificationCode`, `createdAt`, `updatedAt` FROM `Users` WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                res.send({
                  message: constant.RESPONSES.SUCCESSFULL.message,
                  status: constant.RESPONSES.SUCCESSFULL.status,
                  data: rows[0],
                });
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

exports.applyInviteCode = function (req, res) {
  console.log("-------1----------");
  console.log(req.body);

  let phone = req.phone;
  let inviteCode = req.body.inviteCode;
  const schema = joi.object().keys({
    inviteCode: joi.string().required(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate({ inviteCode: inviteCode }, schema)
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length <= 0) {
                  reject({
                    message: constant.RESPONSES.USER_NOT_EXIST.message,
                    status: constant.RESPONSES.USER_NOT_EXIST.status,
                    data: {},
                  });
                } else if (rows[0].referralCode == inviteCode) {
                  reject({
                    message:
                      constant.RESPONSES.SELF_INVITE_CODE_NOT_ALLOWED.message,
                    status:
                      constant.RESPONSES.SELF_INVITE_CODE_NOT_ALLOWED.status,
                    data: {},
                  });
                } else if (
                  rows[0].inviteCode != null &&
                  rows[0].inviteCode != undefined &&
                  rows[0].inviteCode != ""
                ) {
                  reject({
                    message:
                      constant.RESPONSES.INVITE_CODE_ALREADY_APPLIED.message,
                    status:
                      constant.RESPONSES.INVITE_CODE_ALREADY_APPLIED.status,
                    data: {},
                  });
                } else {
                  resolve();
                }
              }
            }
          );
        });
      })
      .then(() => {
        console.log("==========Inside User Duplicate Referral Code==========");

        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `referralCode` = ?",
            [inviteCode],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else if (rows.length <= 0) {
                reject({
                  message: constant.RESPONSES.INVITE_CODE_NOT_VALID.message,
                  status: constant.RESPONSES.INVITE_CODE_NOT_VALID.status,
                  data: {},
                });
              } else {
                resolve(rows[0]);
              }
            }
          );
        });
      })
      .then((refreeDetails) => {
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `inviteCode`=? WHERE `phone` = ?",
            [inviteCode, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve(refreeDetails);
              }
            }
          );
        });
      })
      .then((refreeDetails) => {
        return new Promise((resolve, reject) => {
          connection.query(
            "INSERT INTO `Transactions`(`userId`, `secondUserId`, `type`, `amount`) VALUES (?,?,?,?)",
            [
              refreeDetails.id,
              req.userId,
              constant.TRANSACTION_TYPE.REFERRAL_AMOUNT,
              100,
            ],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve(refreeDetails);
              }
            }
          );
        });
      })
      .then((refreeDetails) => {
        return new Promise((resolve, reject) => {
          connection.query(
            "INSERT INTO `Transactions`(`userId`, `secondUserId`, `type`, `amount`) VALUES (?,?,?,?)",
            [
              req.userId,
              refreeDetails.id,
              constant.TRANSACTION_TYPE.INVITE_CODE_AMOUNT,
              50,
            ],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT `id`, `fullName`, `email`, `phone`, `accessToken`, `role`, `status`, `referralCode`, `imageStr`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `createdAt`, `updatedAt` FROM `Users` WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length > 0) {
                  res.send({
                    message: constant.RESPONSES.SUCCESSFULL.message,
                    status: constant.RESPONSES.SUCCESSFULL.status,
                    data: rows[0],
                  });
                }
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

exports.updateProfile = function (req, res) {
  let phone = req.phone;
  let email = req.body.email;
  let fullName = req.body.fullName;
  let imageStr = req.body.imageStr;
  let whatsappContact = req.body.whatsappContact;
  let companyName = req.body.companyName;
  let companyWebsite = req.body.companyWebsite;
  let roleInCompany = req.body.roleInCompany;
  let state = req.body.state;
  let country = req.body.country;
  var now = new Date();
  var updatedAt = now.toISOString().slice(0, 19).replace("T", " ");

  const schema = joi.object().keys({
    email: joi.string().optional(),
    fullName: joi.string().optional(),
    imageStr: joi.string().optional(),
    whatsappContact: joi.string().optional(),
    companyName: joi.string().optional(),
    companyWebsite: joi.string().optional(),
    roleInCompany: joi.string().optional(),
    state: joi.string().optional(),
    country: joi.string().optional(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate(
        {
          email: email,
          fullName: fullName,
          imageStr: imageStr,
          whatsappContact: whatsappContact,
          companyName: companyName,
          companyWebsite: companyWebsite,
          roleInCompany: roleInCompany,
          state: state,
          country: country,
        },
        schema
      )
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("============email===========");
        if (email == null || email == undefined || email == "") {
          console.log("============Out===========");
          console.log(email);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `email`=? WHERE `phone` = ?",
            [email, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============fullName===========");

        if (fullName == null || fullName == undefined || fullName == "") {
          console.log("============Out===========");
          console.log(fullName);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `fullName`=? WHERE `phone` = ?",
            [fullName, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============imageStr===========");

        if (imageStr == null || imageStr == undefined || imageStr == "") {
          console.log("============Out===========");
          console.log(imageStr);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `imageStr`=? WHERE `phone` = ?",
            [imageStr, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============whatsappContact===========");

        if (
          whatsappContact == null ||
          whatsappContact == undefined ||
          whatsappContact == ""
        ) {
          console.log("============Out===========");
          console.log(whatsappContact);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `whatsappContact`=? WHERE `phone` = ?",
            [whatsappContact, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============companyName===========");

        if (
          companyName == null ||
          companyName == undefined ||
          companyName == ""
        ) {
          console.log("============Out===========");
          console.log(companyName);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `companyName`=? WHERE `phone` = ?",
            [companyName, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============companyWebsite===========");

        if (
          companyWebsite == null ||
          companyWebsite == undefined ||
          companyWebsite == ""
        ) {
          console.log("============Out===========");
          console.log(companyWebsite);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `companyWebsite`=? WHERE `phone` = ?",
            [companyWebsite, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============roleInCompany===========");

        if (
          roleInCompany == null ||
          roleInCompany == undefined ||
          roleInCompany == ""
        ) {
          console.log("============Out===========");
          console.log(roleInCompany);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `roleInCompany`=? WHERE `phone` = ?",
            [roleInCompany, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============state===========");

        if (state == null || state == undefined || state == "") {
          console.log("============Out===========");
          console.log(state);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `state`=? WHERE `phone` = ?",
            [state, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============country===========");

        if (country == null || country == undefined || country == "") {
          console.log("============Out===========");
          console.log(country);
          return true;
        }
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `country`=? WHERE `phone` = ?",
            [country, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        console.log("============updatedAt===========");

        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `updatedAt`=? WHERE `phone` = ?",
            [updatedAt, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT `id`, `fullName`, `email`, `phone`, `accessToken`, `role`, `status`, `referralCode`, `imageStr`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `isVerified`, `verificationCode`, `createdAt`, `updatedAt` FROM `Users` WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length > 0) {
                  res.send({
                    message: constant.RESPONSES.SUCCESSFULL.message,
                    status: constant.RESPONSES.SUCCESSFULL.status,
                    data: rows[0],
                  });
                }
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

let sendVerificationCode = async (phone) => {
  let verificationCode = generateRabndomNumber(6, "numeric");

  return new Promise((resolve, reject) => {
    connection.query(
      "UPDATE `Users` SET `verificationCode`=? WHERE `phone` = ?",
      [verificationCode, phone],
      (err, rows) => {
        console.log(rows, err);

        if (err)
          reject({
            message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
            status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
            data: {},
          });
        else sentOtpTOUserPhoneNumber(phone, verificationCode);
        resolve(verificationCode);
      }
    );
  });
};

let sentOtpTOUserPhoneNumber = async (phone, verificationCode) => {
  let message =
    "Your Otp is " +
    verificationCode +
    " Will be valid till 5 minutes.\n\nRegards\nMLM Pro.";

  let url =
    "http://123.108.46.13/sms-panel/api/http/index.php?username=RANAX&apikey=038B3-9BA71&apirequest=Text&sender=MLMVIP&mobile=" + phone + "&message=" + message + "&route=TRANS&format=JSON";

  console.log("sending OTP message ======");
  console.log(message);



  return new Promise((resolve, reject) => {

    request(url, function (error, response, body) {
      console.log("***************************************");
      console.error('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the HTML for the Google homepage.
    });


  });
};

let generateRabndomNumber = function (digit, charset) {
  var number = rn.generate({
    length: digit,
    charset: charset,
  });
  return number;
};

exports.addUser = function (req, res) {
  console.log("-------1----------");
  console.log(req.body);

  let fullName = req.body.fullName;
  let email = req.body.email;
  let phone = req.body.phone;
  let password = req.body.password;
  let userType = constant.USER_ROLE.CUSTOMER;
  let deviceToken = req.body.deviceToken;

  const schema = joi.object().keys({
    fullName: joi.string().required(),
    phone: joi.string().required(),
    email: joi.string().required(),
    password: joi.string().required(),
    deviceToken: joi.string().required(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate(
        {
          fullName: fullName,
          phone: phone,
          email: email,
          password: password,
          deviceToken: deviceToken,
        },
        schema
      )
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length > 0) {
                  reject({
                    message: constant.RESPONSES.USER_EXIST.message,
                    status: constant.RESPONSES.USER_EXIST.status,
                    data: {},
                  });
                } else {
                  resolve();
                }
              }
            }
          );
        });
      })
      .then(() => {
        console.log("==========Inside User Duplicate Referral Code==========");
        let nameWithoutSpace = fullName.split(" ").join("");
        let refeeralPrefix = nameWithoutSpace.substring(0, 4);
        console.log(refeeralPrefix);
        let likeStr = "%" + refeeralPrefix + "%";
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `referralCode` LIKE ?",
            [likeStr],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                let referralIndex = "000000" + rows.length;
                resolve(refeeralPrefix + referralIndex.substr(-4));
              }
            }
          );
        });
      })
      .then((referralCode) => {
        let encryptedPass = commonMethods.encryptPassword(password);
        let token = jwtToken.genereateToken(phone);

        console.log("=========Inside User Registration===========");
        return new Promise((resolve, reject) => {
          connection.query(
            "INSERT INTO `Users`(`fullName`, `email`,`phone`, `password`, `accessToken`, `deviceToken`, `role`, `referralCode`) VALUES (?,?,?,?,?,?,?,?)",
            [
              fullName,
              email,
              phone,
              encryptedPass,
              token,
              deviceToken,
              userType,
              referralCode,
            ],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        return sendVerificationCode(phone);
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT `id`, `fullName`, `email`, `phone`, `accessToken`, `role`, `status`, `referralCode`, `imageStr`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `isVerified`, `verificationCode`, `createdAt`, `updatedAt` FROM `Users` WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length > 0) {
                  res.send({
                    message: constant.RESPONSES.SUCCESSFULL.message,
                    status: constant.RESPONSES.SUCCESSFULL.status,
                    data: rows[0],
                  });
                }
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};







//Get List Of all Customers according to their role

exports.customerList = async function (req, res) {
  await new Promise((resolve, reject) => {
    connection.query("SELECT `id`, `fullName`, `email`, `phone`, `password`, `role`,`inviteCode`,`createdAt`, `updatedAt`, `imageStr`, `state`, `country`, `status`, `whatsappContact`, `companyName`, `companyWebsite`, `roleInCompany`, `subscriptionType`, `subscriptionExpiryDate`, `isVerified` FROM `Users`  WHERE role = 1 AND isVerified = 1 ORDER By `id` ASC LIMIT 50 OFFSET 0",
      [],
      (err, rows) => {
        console.log(err, rows);
        if (err)
          res.send({
            message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
            status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
            data: {},
          });
        else {
          res.send({
            message: constant.RESPONSES.SUCCESSFULL.message,
            status: constant.RESPONSES.SUCCESSFULL.status,
            data: rows
          });
        }
        resolve();
      }
    );
  });
}


exports.verifyOTP = function (req, res) {
  let phone = req.phone;
  let otp = req.body.otp;

  const schema = joi.object().keys({
    otp: joi.string().required(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate({ otp: otp }, schema)
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length <= 0) {
                  reject({
                    message: constant.RESPONSES.USER_NOT_EXIST.message,
                    status: constant.RESPONSES.USER_NOT_EXIST.status,
                    data: {},
                  });
                } else {
                  resolve(rows[0]);
                }
              }
            }
          );
        });
      })
      .then((userDetails) => {
        if (userDetails.verificationCode != otp) {
          throw {
            message: constant.RESPONSES.INCORRECT_OTP.message,
            status: constant.RESPONSES.INCORRECT_OTP.status,
            data: {},
          };
        } else {
          return true;
        }
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `verificationCode`=?, `isVerified`=? WHERE `phone` = ?",
            [null, true, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                res.send({
                  message: constant.RESPONSES.VERIFIED_OTP.message,
                  status: constant.RESPONSES.VERIFIED_OTP.status,
                  data: rows[0],
                });
              }
            })
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

exports.forgotPassword = function (req, res) {
  let phone = req.body.phone;

  let inviteCode = req.body.inviteCode;
  const schema = joi.object().keys({
    phone: joi.string().required(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate({ phone: phone }, schema)
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length <= 0) {
                  reject({
                    message: constant.RESPONSES.USER_NOT_EXIST.message,
                    status: constant.RESPONSES.USER_NOT_EXIST.status,
                    data: {},
                  });
                } else {
                  resolve();
                }
              }
            }
          );
        });
      })
      .then(() => {
        return sendVerificationCode(phone);
      })
      .then((verificationCode) => {
        res.send({
          message: constant.RESPONSES.SUCCESSFULL.message,
          status: constant.RESPONSES.SUCCESSFULL.status,
          data: {
            otp: verificationCode,
          },
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

exports.setNewPassword = function (req, res) {
  let phone = req.body.phone;
  let password = req.body.password;

  let inviteCode = req.body.inviteCode;
  const schema = joi.object().keys({
    phone: joi.string().required(),
    password: joi.string().required(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate({ phone: phone, password: password }, schema)
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length <= 0) {
                  reject({
                    message: constant.RESPONSES.USER_NOT_EXIST.message,
                    status: constant.RESPONSES.USER_NOT_EXIST.status,
                    data: {},
                  });
                } else {
                  resolve();
                }
              }
            }
          );
        });
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          let encrypetdPass = commonMethods.encryptPassword(password);
          connection.query(
            "UPDATE `Users` SET `password` = ? WHERE `phone` = ?",
            [encrypetdPass, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                res.send({
                  message: constant.RESPONSES.SUCCESSFULL.message,
                  status: constant.RESPONSES.SUCCESSFULL.status,
                  data: {},
                });
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};

exports.verifyPhoneOnForgot = function (req, res) {
  let phone = req.body.phone;
  let otp = req.body.otp;

  const schema = joi.object().keys({
    otp: joi.string().required(),
    phone: joi.string().required(),
  });

  Promise.coroutine(function* () {
    yield joi
      .validate({ phone: phone, otp: otp }, schema)
      .then(
        (result) => {
          return true;
        },
        (err) => {
          throw {
            message: err.details[0].message,
            status: "201",
            data: {},
          };
        }
      )
      .then(() => {
        console.log("====================");
        return new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM Users WHERE `phone` = ?",
            [phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                if (rows.length <= 0) {
                  reject({
                    message: constant.RESPONSES.USER_NOT_EXIST.message,
                    status: constant.RESPONSES.USER_NOT_EXIST.status,
                    data: {},
                  });
                } else {
                  resolve(rows[0]);
                }
              }
            }
          );
        });
      })
      .then((userDetails) => {
        if (userDetails.verificationCode != otp) {
          throw {
            message: constant.RESPONSES.INCORRECT_OTP.message,
            status: constant.RESPONSES.INCORRECT_OTP.status,
            data: {},
          };
        } else {
          return true;
        }
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          connection.query(
            "UPDATE `Users` SET `verificationCode`=?, `isVerified`=? WHERE `phone` = ?",
            [null, true, phone],
            (err, rows) => {
              console.log(err, rows);
              if (err)
                reject({
                  message: constant.RESPONSES.SERVER_SIDE_ERROR.message,
                  status: constant.RESPONSES.SERVER_SIDE_ERROR.status,
                  data: {},
                });
              else {
                res.send({
                  message: constant.RESPONSES.VERIFIED_OTP.message,
                  status: constant.RESPONSES.VERIFIED_OTP.status,
                  data: rows[0],
                });
              }
            }
          );
        });
      })
      .catch((exp) => {
        console.log("-------444----------");
        console.log(exp);
        res.send(exp);
      });
  })();
};


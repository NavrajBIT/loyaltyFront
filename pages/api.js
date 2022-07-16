//****FORMAT OF API CALLS TO THE BLOCKCHAIN. */
//POPPULATED WITH SAMPLE VALUES.

// Install web3.js library
// npm install web3
// OR
// yarn add web3

// documentation here : https://web3js.readthedocs.io

import Contract from "web3-eth-contract";
import Web3 from "web3";

//Set the API endpoint like so...
const apiEndPoint = "http://34.100.155.180:8545";
// Set up multiple endpoints with router for production.

const web3 = new Web3(apiEndPoint);
Contract.setProvider(apiEndPoint);

// Set up API calls
const ContractAddress = "0x33F2a5755843920d3B183cCCA594Ed039d887D1A";
const compiledContract = require("../compiledContract.json");
const ABI = compiledContract["abi"];
const myContract = new Contract(ABI, ContractAddress);
const hexToEvent = {
  "0x339f6fe8bf902a0dda530e650c8a3de3f3e329e9fb61c8035822c2d68acb04c3":
    "pointsAllocated",
  "0xc29117027fb5683fd9adce4683c07052ca12ccc532277f5b8c3039c6735b7f29":
    "userPoints",
  "0x12f4285b54ea369a9ebba8573a153d19bd6e7973c2f6c2021e0551d7b03bac2c":
    "pointsRedeemed",
  "0x5ebfe9d3e35987a08b09902b37a80285a0f7871ebab17d24cf01904c336bf993":
    "redeemDetails",
  "0xc25c39153635e38307a1ea5f18fb182aebb0037838d19ede4d6eddd0ad18822b":
    "pointsExpired",
  "0x3f89f2657dfea821783e53be29fbfad773de186e57d2f5620ce98c51a2921b21":
    "couponModified",
};

//Setup public-private key pair for encryption.
const myAccount = "0x7F2e4A25452f6B73e0E0F6E5cD0769D43E25FaC4";
const privateKey =
  "0x24d1f2a4e4ab3b3dec3c020897610aee76c1ba273b7555060e2e2d079424b180"; // keys shall be provided. Private key should never ever be shared.

// API request for Earning points. Allocate points to a user like so...
// parameters include userId(String), points(integer), expiryDate(epoch time integer), refVia(string), refId(string)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string,
//   points: Points allocated to the user with this request. Integer,
//   couponId: The unique Id of the coupon created,
//   expiryDate: Expiry date of the created coupon in epoch time. Integer.
//   refVia: The refVia input saved with the coupon. String.
//   refId: The refId input saved with the coupon. String.}
const allocatePoints = async (userId, points, expiryDate, refVia, refId) => {
  refVia = refVia + "&&seperator&&" + refId;

  let returnObject = {
    status: 500,
    response: "",
    userId: "",
    points: 0,
    couponId: 0,
    expiryDate: 0,
    refVia: "",
    refId: "",
  };
  let gas = await myContract.methods
    .allocatePoints(userId, points, expiryDate, refVia)
    .estimateGas({ from: myAccount })
    .then((resp) => {
      console.log("Gas required ---- ", resp);
      return resp;
    })
    .catch((err) => {
      console.log(err);
      returnObject["response"] = err["data"]["stack"];
    });
  let txData = myContract.methods
    .allocatePoints(userId, points, expiryDate, refVia)
    .encodeABI();
  let txObject = {
    to: ContractAddress,
    from: myAccount,
    data: txData,
    gas: gas,
  };
  let rawTx = await web3.eth.accounts
    .signTransaction(txObject, privateKey)
    .then((resp) => {
      return resp["rawTransaction"];
    })
    .catch((err) => {
      console.log(err);
    });
  await web3.eth
    .sendSignedTransaction(rawTx)
    .then((resp) => {
      resp.logs.forEach(async (log) => {
        if (hexToEvent[log.topics[0]] == "pointsAllocated") {
          returnObject.status = 200;
          returnObject.response = "Success";
          returnObject.userId = userId;
          returnObject.points = parseInt(log.topics[2]);
          returnObject.couponId = parseInt(log.topics[3]);
          returnObject.expiryDate = await myContract.methods
            .couponIdToExpiry(parseInt(log.topics[3]))
            .call()
            .then((resp) => {
              return resp;
            })
            .catch((err) => {
              return "Error fetching expiry date";
            });
          await myContract.methods
            .couponIdToRefVia(parseInt(log.topics[3]))
            .call()
            .then((resp) => {
              returnObject.refVia = resp.split("&&seperator&&")[0];
              returnObject.refId = resp.split("&&seperator&&")[1];
              return resp;
            })
            .catch((err) => {
              return "Error fetching ref via.";
            });
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });

  return returnObject;
};

// API request for Burning points / redeeming points from a user like so...
// parameters include userId(string), points(integer), refVia(string), refId(string)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success"}
const redeemPoints = async (userId, points, refVia, refId) => {
  refVia = refVia + "&&seperator&&" + refId;
  let returnObject = {
    status: 500,
    response: "",
  };
  let availablePoints = await getPoints(userId)
    .then((res) => {
      return parseInt(res.points);
    })
    .catch((err) => {});
  if (availablePoints < points) {
    returnObject.response = "Not enough points";
    return returnObject;
  }
  let gas = await myContract.methods
    .redeemUserPoints(userId, points, refVia)
    .estimateGas({ from: myAccount })
    .then((resp) => {
      console.log("Gas required ---> " + resp);
      return resp;
    })
    .catch((err) => {
      returnObject["response"] = err;
    });
  let txData = myContract.methods
    .redeemUserPoints(userId, points, refVia)
    .encodeABI();
  let txObject = {
    to: ContractAddress,
    from: myAccount,
    data: txData,
    gas: gas,
  };
  let rawTx = await web3.eth.accounts
    .signTransaction(txObject, privateKey)
    .then((resp) => {
      return resp["rawTransaction"];
    })
    .catch((err) => {
      console.log(err);
    });
  await web3.eth
    .sendSignedTransaction(rawTx)
    .then((resp) => {
      returnObject.response = "Success";
      returnObject.status = 200;
    })
    .catch((err) => {
      console.log(err);
    });
  return returnObject;
};

// API request for getting a user's coin balace...
// parameters include userId(string)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string,
//   points: Total Points available to the user. Integer}

const getPoints = async (userId) => {
  let returnObject = {
    status: 500,
    response: "",
    userId: "",
    points: 0,
  };
  let gas = await myContract.methods
    .getUserPoints(userId)
    .estimateGas({ from: myAccount })
    .then((resp) => {
      return resp;
    })
    .catch((err) => {
      returnObject["response"] = err;
    });
  let txData = myContract.methods.getUserPoints(userId).encodeABI();
  let txObject = {
    to: ContractAddress,
    from: myAccount,
    data: txData,
    gas: gas,
  };
  let rawTx = await web3.eth.accounts
    .signTransaction(txObject, privateKey)
    .then((resp) => {
      return resp["rawTransaction"];
    })
    .catch((err) => {
      console.log(err);
    });
  await web3.eth
    .sendSignedTransaction(rawTx)
    .then((resp) => {
      resp.logs.forEach((log) => {
        if (hexToEvent[log["topics"][0]] === "userPoints") {
          returnObject.status = 200;
          returnObject.response = "Success";
          returnObject.userId = userId;
          returnObject.points = parseInt(log["topics"][2]);
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });

  return returnObject;
};

// API request for getting a user's coin history...
// parameters include userId(string)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//  transactionHistory: Array of all transactions of the user.
// Array elements are objects with the following format:
//   {userId: User Id as a string,
//   type: Type of transaction. Earned, Burned, Redeemed or Modified.
//   points: Points allocated to the user with this request. Integer,
//   couponId: The unique Id of the coupon included in the transaction. OR redeemId and redeemVia in case of redeemed points.}
const getHistory = async (userIdString) => {
  let returnObject = {
    status: 500,
    response: "",
    transactionHistory: [],
  };
  await getPoints(userIdString);
  await myContract.methods
    .userStringToId(userIdString)
    .call()
    .then(async (userId) => {
      await web3.eth
        .getPastLogs({
          fromBlock: "0x0",
          address: ContractAddress,
        })
        .then((res) => {
          res.forEach(async (rec) => {
            if (parseInt(rec.topics[1]) == userId) {
              let transactionObject = {};
              if (hexToEvent[rec.topics[0]] === "pointsAllocated") {
                returnObject.status = 200;
                returnObject.response = "Success";
                transactionObject["userId"] = userIdString;
                transactionObject["type"] = "Earned";
                transactionObject["points"] = parseInt(rec.topics[2]);
                transactionObject["couponId"] = parseInt(rec.topics[3]);
                returnObject.transactionHistory.push(transactionObject);
              }
              if (hexToEvent[rec.topics[0]] === "couponModified") {
                returnObject.status = 200;
                returnObject.response = "Success";
                transactionObject["userId"] = userIdString;
                transactionObject["type"] = "Modified";
                transactionObject["points"] = parseInt(rec.topics[2]);
                transactionObject["couponId"] = parseInt(rec.topics[3]);
                returnObject.transactionHistory.push(transactionObject);
              }
              // if (hexToEvent[rec.topics[0]] === "pointsRedeemed") {
              //   returnObject.status = 200;
              //   returnObject.response = "Success";
              //   transactionObject["userId"] = userIdString;
              //   transactionObject["type"] = "Redeemed";
              //   transactionObject["points"] = parseInt(rec.topics[2]);
              //   transactionObject["couponId"] = parseInt(rec.topics[3]);
              //   returnObject.transactionHistory.push(transactionObject);
              // }
              if (hexToEvent[rec.topics[0]] === "redeemDetails") {
                returnObject.status = 200;
                returnObject.response = "Success";
                transactionObject["userId"] = userIdString;
                transactionObject["type"] = "Redeemed";
                transactionObject["points"] = parseInt(rec.topics[2]);
                let redeemId = parseInt(rec.topics[3]);
                await myContract.methods
                  .redeemIdToRefId(redeemId)
                  .call()
                  .then((res) => {
                    transactionObject["redeemVia"] =
                      res.split("&&seperator&&")[0];
                    transactionObject["redeemId"] =
                      res.split("&&seperator&&")[1];
                  });

                returnObject.transactionHistory.push(transactionObject);
              }
              if (hexToEvent[rec.topics[0]] === "pointsExpired") {
                returnObject.status = 200;
                returnObject.response = "Success";
                transactionObject["userId"] = userIdString;
                transactionObject["type"] = "Expired";
                transactionObject["points"] = parseInt(rec.topics[2]);
                transactionObject["couponId"] = parseInt(rec.topics[3]);
                returnObject.transactionHistory.push(transactionObject);
              }
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });

  return returnObject;
};

// API request for getting the total number of coins that can ever be in circulation.
// Max supply is specified during contract creation.
// returns the max supply of coins(integer)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   maxSupply: Max supply of coins. Integer}
const getMaxSupply = async () => {
  let returnObject = {
    status: 500,
    response: "",
    maxSupply: 0,
  };
  await myContract.methods
    .maxSupply()
    .call()
    .then((resp) => {
      returnObject.status = 200;
      returnObject.response = "Success";
      returnObject.maxSupply = resp;
    })
    .catch((err) => {
      returnObject.response = "Failed";
    });

  return returnObject;
};

// API request for getting the total number of coins in circulation at the time of api call...
// returns the current supply of coins(integer)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   currentSupply: Current supply of points.}
const getCurrentSupply = async () => {
  let returnObject = {
    status: 500,
    response: "",
    currentSupply: 0,
  };
  await myContract.methods
    .totalSupply()
    .call()
    .then((resp) => {
      returnObject.status = 200;
      returnObject.response = "Success";
      returnObject.currentSupply = resp;
    })
    .catch((err) => {
      returnObject.response = "Failed";
    });

  return returnObject;
};

// API request for all details of a coupon with using the unique coupon id.
// parameters include couponId(integer)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string. The owner of this coupon,
//   points: Points assigned in this coupon. Integer,
//   couponId: The unique Id of the this coupon,
//   expiry: Expiry date of the coupon in epoch time. Integer.
//   refVia: The refVia input saved with the coupon. String.
//   refId: The refId input saved with the coupon. String.}
const couponDetails = async (couponId) => {
  let returnObject = {
    status: 500,
    response: "",
    couponId: couponId,
    userId: "",
    points: 0,
    expiry: 0,
    refVia: "",
    refId: "",
  };
  await myContract.methods
    .couponIdToUserId(couponId)
    .call()
    .then(async (resp) => {
      await myContract.methods
        .userIdToString(resp)
        .call()
        .then((resp2) => {
          returnObject.userId = resp2;
        })
        .catch((err) => {
          returnObject.response = "Failed";
        });
    })
    .catch((err) => {
      returnObject.response = "Failed";
    });
  await myContract.methods
    .couponIdToPoints(couponId)
    .call()
    .then((resp) => {
      returnObject.points = parseInt(resp);
    })
    .catch((err) => {
      returnObject.response = "Failed";
    });
  await myContract.methods
    .couponIdToExpiry(couponId)
    .call()
    .then((resp) => {
      returnObject.expiry = parseInt(resp);
    })
    .catch((err) => {
      returnObject.response = "Failed";
    });
  await myContract.methods
    .couponIdToRefVia(couponId)
    .call()
    .then((resp) => {
      returnObject.status = 200;
      returnObject.response = "Success";
      returnObject.refVia = resp.split("&&seperator&&")[0];
      returnObject.refId = resp.split("&&seperator&&")[1];
    })
    .catch((err) => {
      returnObject.response = "Failed";
    });
  console.log(returnObject);
  return returnObject;
};

// API request for modifying the points in a coupon using the coupon id..
// parameters include couponId(integer), points(integer).
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string,
//   points: Modified points assigned in this coupon. Integer,
//   couponId: The unique Id of the coupon }

const modifyCoupon = async (couponId, points) => {
  let returnObject = {
    status: 500,
    response: "",
    couponId: 0,
    userId: "",
    points: 0,
  };
  let gas = await myContract.methods
    .modifyCouponPoints(couponId, points)
    .estimateGas({ from: myAccount })
    .then((resp) => {
      return resp;
    })
    .catch((err) => {
      returnObject["response"] = err;
    });
  let txData = myContract.methods
    .modifyCouponPoints(couponId, points)
    .encodeABI();
  let txObject = {
    to: ContractAddress,
    from: myAccount,
    data: txData,
    gas: gas,
  };
  let rawTx = await web3.eth.accounts
    .signTransaction(txObject, privateKey)
    .then((resp) => {
      return resp["rawTransaction"];
    })
    .catch((err) => {
      console.log(err);
    });
  await web3.eth
    .sendSignedTransaction(rawTx)
    .then((resp) => {
      resp.logs.forEach(async (log) => {
        if (hexToEvent[log["topics"][0]] === "couponModified") {
          returnObject.status = 200;
          returnObject.response = "Success";
          returnObject.couponId = parseInt(log["topics"][3]);
          returnObject.points = parseInt(log["topics"][2]);
          returnObject.userId = await myContract.methods
            .userIdToString(log["topics"][1])
            .call()
            .then((resp) => {
              return resp;
            })
            .catch((err) => {
              return "Error fetching user Id";
            });
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });

  return returnObject;
};

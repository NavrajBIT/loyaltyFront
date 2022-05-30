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
const apiEndPoint = "HTTP://127.0.0.1:8545";
// Set up multiple endpoints with router for production.

const web3 = new Web3(apiEndPoint);
Contract.setProvider(apiEndPoint);

// Set up API calls
const ContractAddress = "0xc2edC08fd8bE4C0e327B19C8577edCF2bae22999";
const compiledContract = require("../compiledContract.json");
const ABI = compiledContract["abi"];
const myContract = new Contract(ABI, ContractAddress);
const hexToEvent = {
  "0x46aefb6c4c70c1593913b0d8f3ff25987bb344f5b361fef5a20cae35ff2bbe84":
    "pointsAllocated",
  "0x97ff9ddf4b40d9907f04692208f062caaffa52ef7354486e482ad5e0c5655c96":
    "userPoints",
  "0xe18bf1e48e24f90f6c01a701b2a85e9b7dbde20be612d81046eb0d3da3abe4ff":
    "pointsBurned",
};

//Setup public-private key pair for encryption.
const myAccount = "0xc388C5e09964A06684C782C6E8090B5CF50c40EA"; // keys shall be provided. Public key can be shared.
const privateKey =
  "e23b2d073aa65b8a57d98525ed241c4767afdd5a4048ec064df4a04dff43730c"; // keys shall be provided. Private key should never ever be shared.

// API request for Earning points. Allocate points to a user like so...
// parameters include userId(String), points(integer), expiryDate(epoch time integer), refVia(string)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string,
//   points: Points allocated to the user with this request. Integer,
//   couponId: The unique Id of the coupon created,
//   expiryDate: Expiry date of the created coupon in epoch time. Integer.
//   refVia: The refVia input saved with the coupon. String.}
const allocatePoints = async (userId, points, expiryDate, refVia) => {};

// API request for Burning points / redeeming points from a user like so...
// parameters include userId(string), points(integer)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success"}
const redeemPoints = async (userId, points) => {};

// API request for getting a user's coin balace...
// parameters include userId(string)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string,
//   points: Total Points available to the user. Integer}

const getPoints = async (userId) => {};

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
//   couponId: The unique Id of the coupon included in the transaction.}
const getHistory = async (userIdString) => {};

// API request for getting the total number of coins that can ever be in circulation.
// Max supply is specified during contract creation.
// returns the max supply of coins(integer)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   maxSupply: Max supply of coins. Integer}
const getMaxSupply = async () => {};

// API request for getting the total number of coins in circulation at the time of api call...
// returns the current supply of coins(integer)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   currentSupply: Current supply of points.}
const getCurrentSupply = async () => {};

// API request for all details of a coupon with using the unique coupon id.
// parameters include couponId(integer)
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string. The owner of this coupon,
//   points: Points assigned in this coupon. Integer,
//   couponId: The unique Id of the this coupon,
//   expiry: Expiry date of the coupon in epoch time. Integer.
//   refVia: The refVia input saved with the coupon. String.}
const couponDetails = async (couponId) => {};

// API request for modifying the points in a coupon using the coupon id..
// parameters include couponId(integer), points(integer).
// Returns object
//   {status: Status code of response. 200 - Success, 500 - Failed.
//   response: "Success",
//   userId: User Id as a string,
//   points: Modified points assigned in this coupon. Integer,
//   couponId: The unique Id of the coupon }
const modifyCoupon = async (couponId, points) => {};

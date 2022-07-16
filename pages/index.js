import Contract from "web3-eth-contract";
import Web3 from "web3";

const web3 = new Web3("http://34.100.155.180:8545");
// const web3 = new Web3(
//   "https://rinkeby.infura.io/v3/af7a38f98bcd4ebbbc7c0c844640104f"
// );
Contract.setProvider("http://34.100.155.180:8545");
// Contract.setProvider(
//   "https://rinkeby.infura.io/v3/af7a38f98bcd4ebbbc7c0c844640104f"
// );
const addressesObject = require("../contractData.json");
const ContractAddress = addressesObject["mainContract"];
const compiledContract = require("../compiledContract.json");
const ABI = compiledContract["abi"];
const myContract = new Contract(ABI, ContractAddress);

const myAccount = "0x7F2e4A25452f6B73e0E0F6E5cD0769D43E25FaC4";
// const myAccount = "0x1F2E67EC9fc910278bc8c242348fC4D032Ce036D";
const privateKey =
  "0x24d1f2a4e4ab3b3dec3c020897610aee76c1ba273b7555060e2e2d079424b180";
// const privateKey =
//   "41dfe67fe4c975db3bed202eb74c26c052caf8c815712a7150e918b572a876d6";

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

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState(
    "Start by allocationg points to some user"
  );
  const [historyArray, setHistoryArray] = useState([]);
  const [maxSupply, setMaxSupply] = useState(
    "Maximum number of points that can be in circulation at a time."
  );
  const [currentSupply, setCurrentSupply] = useState(
    "Total number of points in circulation right now."
  );
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
        console.log("here");
        console.log(err);
        returnObject["response"] = err["data"];
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
    console.log(returnObject);
    return returnObject;
  };
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
        console.log("Gas required ---- ", resp);
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
    console.log(returnObject);
    return returnObject;
  };
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
    console.log(returnObject);
    return returnObject;
  };

  const redeemPoints = async (userId, points, refVia, refId) => {
    refVia = refVia + "&&seperator&&" + refId;
    console.log(refVia);
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
        console.log(resp);
        return resp;
      })
      .catch((err) => {
        console.log("here");
        console.log(err);
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
        // console.log(err);
      });
    await web3.eth
      .sendSignedTransaction(rawTx)
      .then((resp) => {
        returnObject.response = "Success";
        returnObject.status = 200;
      })
      .catch((err) => {
        // console.log(err);
      });
    // console.log(returnObject);
    return returnObject;
  };

  const getHistory = async (userIdString) => {
    let returnObject = {
      status: 500,
      response: "",
      transactionHistory: {},
    };
    await getPoints(userIdString);
    return await myContract.methods
      .userStringToId(userIdString)
      .call()
      .then(async (userId) => {
        return await web3.eth
          .getPastLogs({
            fromBlock: "0x0",
            address: ContractAddress,
          })
          .then(async (res) => {
            let recIndex = 0;
            for (const rec of res) {
              if (parseInt(rec.topics[1]) == userId) {
                let transactionObject = {};
                if (hexToEvent[rec.topics[0]] === "pointsAllocated") {
                  recIndex++;
                  returnObject.status = 200;
                  returnObject.response = "Success";
                  transactionObject["userId"] = userIdString;
                  transactionObject["type"] = "Earned";
                  transactionObject["points"] = parseInt(rec.topics[2]);
                  transactionObject["couponId"] = parseInt(rec.topics[3]);
                  returnObject.transactionHistory[recIndex] = transactionObject;
                }
                if (hexToEvent[rec.topics[0]] === "couponModified") {
                  recIndex++;
                  returnObject.status = 200;
                  returnObject.response = "Success";
                  transactionObject["userId"] = userIdString;
                  transactionObject["type"] = "Modified";
                  transactionObject["points"] = parseInt(rec.topics[2]);
                  transactionObject["couponId"] = parseInt(rec.topics[3]);
                  returnObject.transactionHistory[recIndex] = transactionObject;
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
                  recIndex++;
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

                  returnObject.transactionHistory[recIndex] = transactionObject;
                }
                if (hexToEvent[rec.topics[0]] === "pointsExpired") {
                  recIndex++;
                  returnObject.status = 200;
                  returnObject.response = "Success";
                  transactionObject["userId"] = userIdString;
                  transactionObject["type"] = "Expired";
                  transactionObject["points"] = parseInt(rec.topics[2]);
                  transactionObject["couponId"] = parseInt(rec.topics[3]);
                  returnObject.transactionHistory[recIndex] = transactionObject;
                }
              }
            }
            return returnObject;
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
        console.log(err);
        returnObject.response = "Failed";
      });
    console.log(returnObject);
    return returnObject;
  };
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
    console.log(returnObject);
    return returnObject;
  };

  const getBlock = async () => {
    web3.eth
      .getBlockNumber()
      .then((res) => {
        console.log("response");
        console.log(res);
      })
      .catch((err) => {
        console.log("error");
        console.log(err);
      });

    web3.eth
      .isSyncing()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      <h1>{status}</h1>
      <div>
        <button onClick={() => getMaxSupply()}>Max Supply</button> {maxSupply}
      </div>
      <div>
        <button onClick={() => getCurrentSupply()}>Current Supply</button>{" "}
        {currentSupply}
      </div>
      <div>
        <input type="text" placeholder="User ID" id="userId" />
        <input type="number" placeholder="Points" id="points" />
        <input type="text" placeholder="Ref via" id="refVia" />
        <input type="text" placeholder="Ref id" id="refId" />
        <input type="date" id="expirydate" />
        <input type="time" id="expirytime" />
        <button
          onClick={() => {
            let userId = document.getElementById("userId").value;
            let points = parseInt(document.getElementById("points").value);
            let refVia = document.getElementById("refVia").value;
            let refId = document.getElementById("refId").value;
            let expirydate = document.getElementById("expirydate").value;
            let expirytime = document.getElementById("expirytime").value;
            let expiry = new Date(
              expirydate.toString() + " " + expirytime.toString()
            );
            let epochTime = parseInt(expiry.getTime() / 1000);
            allocatePoints(
              userId.toString(),
              points,
              epochTime,
              refVia.toString(),
              refId
            );
          }}
        >
          Allocate Points
        </button>
      </div>
      <div>
        <input type="text" placeholder="User ID" id="userId2" />
        <button
          onClick={() => {
            let userId = document.getElementById("userId2").value;
            getPoints(userId.toString());
          }}
        >
          Get user points
        </button>
      </div>
      <div>
        <input type="text" placeholder="User ID" id="userId4" />
        <input type="number" placeholder="Points to Redeem" id="points4" />
        <input type="text" placeholder="Ref ID" id="refId4" />
        <input type="text" placeholder="Ref Via" id="refVia4" />
        <button
          onClick={() => {
            let userId = document.getElementById("userId4").value;
            let points = parseInt(document.getElementById("points4").value);
            let refId4 = document.getElementById("refId4").value;
            let refVia4 = document.getElementById("refVia4").value;
            redeemPoints(userId, points, refId4, refVia4);
          }}
        >
          Redeem user points
        </button>
      </div>
      <div>
        <input type="text" placeholder="User ID" id="userId3" />
        <button
          onClick={async () => {
            let userId = document.getElementById("userId3").value;
            let history = await getHistory(userId)
              .then((res) => {
                console.log(res);
              })
              .catch((err) => {
                console.log(err);
              });
          }}
        >
          Get Transaction History
        </button>
      </div>
      <div>
        <input type="number" placeholder="Coupon ID" id="couponid" />
        <button
          onClick={() => {
            let couponid = parseInt(document.getElementById("couponid").value);
            couponDetails(couponid);
          }}
        >
          Coupon Details
        </button>
      </div>
      <div>
        <input type="number" placeholder="Coupon ID" id="couponid2" />
        <input type="number" placeholder="points" id="points6" />
        <button
          onClick={() => {
            let couponid = parseInt(document.getElementById("couponid2").value);
            let points = parseInt(document.getElementById("points6").value);
            modifyCoupon(couponid, points);
          }}
        >
          Modify Coupon
        </button>
        <button
          onClick={() => {
            getBlock();
          }}
        >
          Get Block
        </button>
        <input type="text" placeholder="string to Id" id="stringToId" />
        <button
          onClick={() => {
            let stringToId = document.getElementById("stringToId").value;
            myContract.methods
              .userStringToId(stringToId)
              .call()
              .then((res) => {
                console.log(res);
              })
              .catch((err) => {
                console.log(err);
              });
          }}
        >
          String To Id
        </button>
        <input type="text" placeholder="Id to String" id="IdToString" />
        <button
          onClick={() => {
            let IdToString = document.getElementById("IdToString").value;
            myContract.methods
              .userIdToString(IdToString)
              .call()
              .then((res) => {
                console.log(res);
              })
              .catch((err) => {
                console.log(err);
              });
          }}
        >
          IdToString
        </button>
      </div>
    </>
  );
}

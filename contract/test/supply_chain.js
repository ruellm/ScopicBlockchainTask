const SupplyChain = artifacts.require("SupplyChain");
const truffleAssert = require('truffle-assertions');

contract("SupplyChain", function (accounts) {
  it("should assert true", async function () {
    await SupplyChain.deployed();
    return assert.isTrue(true);
  });

  it("should assert during register empty name", async function () {
    // Get the deployed instance
    
    var conntract = await SupplyChain.deployed();
    let errMsg = "";

    try{
      const timeStamp = Math.floor(Date.now() / 1000);
      var tx = await conntract.registerProduct("", timeStamp, 1);
     
    } catch(error) {
      errMsg = error.reason;
    }
    assert.equal(errMsg, "product name should not be empty", "Error msg should match");
  });

  it("should assert if date is future", async function () {
    // Get the deployed instance
    
    var conntract = await SupplyChain.deployed();
    let errMsg = "";

    try{
      var date = new Date();
      var newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 1);

      const timeStamp = Math.floor(newDate / 1000);
      var tx = await conntract.registerProduct("chocolaate", timeStamp, 1);
     
    } catch(error) {
      errMsg = error.reason;
    }

    assert.equal(errMsg, "production date should not be in the future", 
      "Error msg should match");
  });
 
  it("should assert if location Id is illegal", async function () {
    // Get the deployed instance
    
    var conntract = await SupplyChain.deployed();
    let errMsg = "";

    try{
      const timeStamp = Math.floor(Date.now() / 1000);
      await conntract.registerProduct("chocolaate", timeStamp, 0);
     
    } catch(error) {
      errMsg = error.reason;
    }

    assert.equal(errMsg, "location ID does not exist, Please register the location first..", 
      "Error msg should match");

  });

  it("should return zero for bugos hash history", async function () {
    var contract = await SupplyChain.deployed();
    let len = await contract.getProductHistoryCount.call(1111);

    assert.equal(len, 0, "should returnn 0");
  });

  it("should assert for bugos index history", async function () {
    var conntract = await SupplyChain.deployed();
    let errMsg = "";

    try{
      await conntract.getProductHistory.call(1111, 0);

    } catch(error) {  
      errMsg = error.message;
    }

    assert.isAbove(errMsg.length, 0, 'error message should not be empty');
  });

  it("should assert for location ID not found", async function () {
    var conntract = await SupplyChain.deployed();
    let errMsg = "";

    try{
      await conntract.getLocation.call(1);

    } catch(error) {  
      errMsg = error.message;
    }

    assert.isAbove(errMsg.length, 0, 'error message should not be empty');
  });

  // Success scenario
  it("should register a product", async function () {
    // Get the deployed instance
    
    var conntract = await SupplyChain.deployed();

    const timeStamp = Math.floor(Date.now() / 1000);

    // Pre-requisite: register a a location first
    var locationId = -1;
    var tx = await conntract.registerLocation("Los Angeles, CA");

    // assume that registration of location is succesful above
    tx = await conntract.registerProduct("chocolate", timeStamp, 0);

    let hash = 0;
    let eventPromise = new Promise(function(resolve, reject){
      truffleAssert.eventEmitted(tx, 'ProductRegistered', (ev) => {
        console.log("Product = " + ev.name + " registered with hash = " + ev.hash);
        hash = ev.hash;
        resolve();
      });
    });
   
    await eventPromise;
    
    var productInfo = await conntract.getProductInfo.call(hash);
    var s = await conntract.getProductHistoryCount.call(hash);

    assert.equal(productInfo[0].toNumber(), 0, "Location ID should be 0");
    assert.equal(productInfo[2], "chocolate", "product name should be 'chocolate' ");
    assert.equal(s.toNumber(), 1, "By default a minted product should have 1 history");
  });

  it("should get registered location", async function () {
    // Get the deployed instance
    
    var conntract = await SupplyChain.deployed();

    
    // Pre-requisite: register a a location first
    await conntract.registerLocation("Seattle, WA");
    await conntract.registerLocation("Chicago, IL");
    
    // assume that registration of location is succesful above
    tx = await conntract.getAllLocations();

    var locationArray = [];
    let hash = 0;
    let eventPromise = new Promise(function(resolve, reject){
      truffleAssert.eventEmitted(tx, 'LocationInfo', (ev) => {
        locationArray.push(
          {
            id: ev.index.toNumber(),
            name : ev.name
          }
        );

        if(ev.total == locationArray.length)
          resolve();
      });
    });
   
    await eventPromise;
    
    // result is 3 as data is already added on previous test cases
    assert.equal(locationArray.length, 3, "location size must be 3");
    
    var findId = (name) => {
      for(var i = 0; i < locationArray.length; i++) {
        if(name == locationArray[i].name)
          return locationArray[i].id;
      }
      return -1;
    };

    assert.equal(findId("Los Angeles, CA"), 0, "location id must be 0");
    assert.equal(findId("Seattle, WA"), 1, "location id must be 1");
    assert.equal(findId("Chicago, IL"), 2, "location id must be 2");

  });

  it("should execute transfer transactions", async function () {
    // Get the deployed instance
    
    var conntract = await SupplyChain.deployed();

    // At this stage a product was already registered by unit test before this
    // and contract already contains 1 product
    // query the contract for the product list
    var prodCount = await conntract.getProductTotalCout.call();
    var count = prodCount.toNumber();

    assert.isAbove(count, 0, "Product count should be above 0");

    // get the very first product and perform sanity check
    var productHashBn = await conntract.getProductIdAtIndex.call(0);

    var productInfo = await conntract.getProductInfo.call(productHashBn);
    var s = await conntract.getProductHistoryCount.call(productHashBn);

    assert.equal(productInfo[0].toNumber(), 0, "Location ID should be 0");
    assert.equal(productInfo[2], "chocolate", "product name should be 'chocolate' ");
    assert.equal(s.toNumber(), 1, "By default a minted product should have 1 history");
   
    /// wait for the transaction to get mined, there should be no crash
    await conntract.sellProduct(productHashBn, accounts[1]);

    // recheck information
    productInfo = await conntract.getProductInfo.call(productHashBn);
    s = await conntract.getProductHistoryCount.call(productHashBn);

    assert.equal(productInfo[1], accounts[1], "Product should be owned by new owner");
    assert.equal(s.toNumber(), 2, "should contain 2 histories (Minted and transfer)");

    // query history entry
    var entry0 = await conntract.getProductHistory.call(productHashBn, 0);
    var entry1 = await conntract.getProductHistory.call(productHashBn, 1);

    assert.equal(entry0[0].toNumber(), 0, "First entry in transaction history should be 0 (Created)");
    assert.equal(entry1[0].toNumber(), 1, "Second entry in transaction history should be 1 (Transfer owner)");

    // channge location using the new owner
    // wait for the transaction to get mined, there should be no crash
    await conntract.changeProductLocation(productHashBn, 1, {from: accounts[1]});

    productInfo = await conntract.getProductInfo.call(productHashBn);
    s = await conntract.getProductHistoryCount.call(productHashBn);

    var entry2 = await conntract.getProductHistory.call(productHashBn, 2);

    assert.equal(productInfo[0].toNumber(), 1, "Location ID should be 1");
    assert.equal(s.toNumber(), 3, "should contain 2 histories (Minted, transfer and change location)");
    assert.equal(entry2[0].toNumber(), 2, "Third entry in transaction history should be 2 (Transfer location)");

  });

  it("should handle trasfer errors", async function () {
    // Get the deployed instance
    
    var conntract = await SupplyChain.deployed();

    // At this stage a product was already registered by unit test before this
    // and contract already contains 1 product with 3 histories
    // query the contract for the product list
    var prodCount = await conntract.getProductTotalCout.call();
    var count = prodCount.toNumber();

    assert.isAbove(count, 0, "Product count should be above 0");

    // get the very first product and perform sanity check
    var productHashBn = await conntract.getProductIdAtIndex.call(0);
   
    var errMessage = "";
    var expectedMsg = "Transaction initiator is not an owner of the product or the contract";

    // access  checking
    try{
      /// account 3 is neither owner nor contract creator therer shouuld be an error
      await conntract.sellProduct(productHashBn, accounts[3], {from: accounts[3]});

    } catch(error) {
      errMessage = error.reason;
    }

    assert.equal(errMessage, expectedMsg, "Error msg should match");

    try{
      /// account 3 is neither owner nor contract creator therer shouuld be an error
      await conntract.changeProductLocation(productHashBn, 2, {from: accounts[3]});

    } catch(error) {
      errMessage = error.reason;
    }
    
    assert.equal(errMessage, expectedMsg, "Error msg should match");

    // Product hash should be valid
    try{
      /// account 3 is neither owner nor contract creator therer shouuld be an error
      await conntract.sellProduct(123456, accounts[1]);

    } catch(error) {
      errMessage = error.reason;
    }

    assert.equal(errMessage, "Product id does not exist", "Error msg should match");

    // Location ID checking
    try{
      /// account 3 is neither owner nor contract creator therer shouuld be an error
      await conntract.changeProductLocation(productHashBn, 10);

    } catch(error) {
      errMessage = error.reason;
    }

    assert.equal(errMessage, "Location Id is not valid", "Error msg should match");

  });  
});

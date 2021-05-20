// Created by: Ruell Magpayo (ruellm@yahoo.com)
// For Scopic Ethereum Training Practical Exam
// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;

import "./Ownable.sol";

contract SupplyChain is Ownable {

  /** 
  * Transaction log type
  */
  enum TransactionLogType { CREATED, TRANSFER_OWNER, TRANSFER_LOCATION }
  
  /** 
  * Transaction log entry
  */
  struct TransactionLog {
    
    // Type of history entry
    TransactionLogType transactionType;
    
    // date of when the log was created
    uint date;

    // new locationId (if type TRASFER_LOCATION)
    uint8 locationId;

    // new ownner (if type // new locationId (if type TRASFER_LOCATION))
    address newOwner;
  }


  struct Product {
    
    // Unique integer hash identifier of the product
    // this is auto generated during creation
    uint id;

    // ASCII name of the product, this is user inputted in the frontennd, 
    // that means it can represent any valaue
    string name;

    // Date when this product was created, in unix time stamp (seconds)
    uint productionDate;


    // current owner of a product
    address owner;

    // The current location of the product. This represennt a location ID of a factory or a store
    // instead of representing it as a strig. Storing a string as a location is costly in space specialy
    // that we are tracking history, the cost of deployingn this contract is exponential everytime location ID
    // change as an entry to history will also be needed to be logged.
    // Other than that, reprsenting an address or location as a string is prone to multiple errors as one location
    // can be described in multiple ways, such as a combination of either door number, street, city, state. etc.
    // Example: if the address is 123 Street, El Paso, Texas, USA. can be represented as 
    // (1) El Paso Tx, (2) El Paso, Texas (3) El Paso Texas, (4) 123 St El Paso, USA, (5) El Paso Txs, etc..
    // In summary, using a string to keep track items is a poor design.
    // There fore we use integer to represent locationn instead, where each location represent or has an ID.
    // in this design, if locationId is 0, it means it is not set
    uint8 locationId;

    // Transaction log history
    TransactionLog[] history;
  }

  /** 
  * location tracker
  * Locations are tracked for consistenncy and prevent errors
  */
  string[] _locations;

  // since products are identified with a ranndom integer we use mapping instead of array
  mapping(uint => Product) _products;

  // cache of product Ids - for easy monitoring of all products
  uint[] _productIds;

  // Triggers when a new product is minted
  event ProductRegistered(uint hash, string name, uint8 locationId);

  // Triggers when a nnew locationn is registered
  event LocationAdded(uint id, string name);

  // Triggers when all locations are queried
  event LocationInfo(uint index, uint total, string name);

  // Triggers when product owner changed
  event ProductOwnerChanged(uint hash, address newOwner, address requestor);

  // Triggers whenn a product location changed
  event ProductLocationChanged(uint hash, uint newLocationId , address requestor);

  constructor() Ownable() public {
    // blank
  }

 /**
  * @dev creates a product using name and location Id, hash is auto generated
  * when finis, notify an event that an asset was created
  * Pre-requisite : Location ID should be registered
  */
  function registerProduct(string memory name, uint date, uint8 locationId) public onlyOwner returns (uint) {

    // sanity checking
    // name should not be empty
    require(bytes(name).length > 0, 
        "product name should not be empty");

    // check date should not be in the future, 
    // so i assume it means older time upto currennt date are accepted  
    require(date <= block.timestamp, 
        "production date should not be in the future");

    // checking location validity against registered ones
    require(locationId < _locations.length, 
      "location ID does not exist, Please register the location first..");

    // 1. generate hash 
    // for simplicity use name as seed for hash
    uint rand = uint(keccak256(abi.encodePacked(name)));

    // 2. create a new instance of product
    Product storage  product = _products[rand];
    product.id = rand;
    product.name = name;
    product.locationId = locationId;
    product.owner = msg.sender;
    product.productionDate = block.timestamp;
    
    // 3. add to history record
    product.history.push(TransactionLog({
      transactionType: TransactionLogType.CREATED,
      date : block.timestamp,
      locationId: 0,
      newOwner : product.owner 
    }));

    // 4. emit event
    emit ProductRegistered(rand, name, locationId);

    // 5. Cache product Ids
    _productIds.push(rand);

    return (rand);
  }

 /**
  * @dev register a locationn and returns a location ID
  * Only ownner of the contract can register a location
  */
  function registerLocation(string memory locName) public onlyOwner returns(uint) {
    _locations.push(locName);
    uint id = (_locations.length - 1);

    emit LocationAdded(id, locName);

    return id;
  }

 /**
  * @dev returns the production information, locationId, owner, name and production date
  */
function getProductInfo(uint hash) public view returns(uint8, address, string memory, uint){
  Product memory  product = _products[hash];
  return(product.locationId, product.owner, product.name, product.productionDate);
}

 /**
  * @dev returns the length of a product trannsaction logs
  * this will be use for accessing the logs thru array indexing
  */
function getProductHistoryCount(uint hash) public view returns(uint){
  Product memory  product = _products[hash];
  return (product.history.length);
}

/**
  * @dev returns the location name given the inwdex
*/
function getLocation(uint8 id) public view returns (string memory)  {
  require(id >= 0 && id < _locations.length, "Location Id not found");
  return _locations[id];
}

/**
  * @dev returns the location name given the inwdex
*/
function getLocationCount() public view returns (uint)  {
  return _locations.length;
}

/**
  * @dev returns all locations registered on this contract
  * applicationn must query this after conection to establish list of locations
  * NOTE : This is costly gas wise as event is called mutliple times, this should only be use
  * for debugging purposes.
*/
function getAllLocations() public {
 for(uint i = 0; i < _locations.length; i++) {
    emit LocationInfo(i, _locations.length, _locations[i]);
 }
}


/**
 * @dev returns the transaction logs information
*/
function getProductHistory(uint hash, uint8 index) public view returns(uint, uint, uint8, address){
  Product memory  product = _products[hash];
  
  require(index < product.history.length, "Product history index not found");
  
  return (uint(product.history[index].transactionType),
        product.history[index].date,
        product.history[index].locationId,
        product.history[index].newOwner);
}

/**
 * @dev Transfer ownership of a product
*/
function sellProduct(uint hash, address to) public {
  
  Product storage  product = _products[hash];

  // only owner of the rune or the admin (owner of the contract) are allowed to transfer the product
  require(product.owner == msg.sender || owner() == msg.sender, 
    "Transaction initiator is not an owner of the product or the contract");

  // solidity does not return null for non existent object.
  // therefore if item is set to 0 for its elements, it means data is not foundn
  require(product.id != 0, "Product id does not exist");

  // set new ownner
  product.owner =  to;

  // for transparency notify subscribers that something has changed
  emit ProductOwnerChanged(hash, to, msg.sender);

  // add to transaction history logs
   product.history.push(TransactionLog({
      transactionType: TransactionLogType.TRANSFER_OWNER,
      date : block.timestamp,
      locationId: 0,
      newOwner : to
    }));

}

function changeProductLocation(uint hash, uint8 locationId) public {
    Product storage  product = _products[hash];

  // only owner of the rune or the admin (owner of the contract) are allowed to transfer the product
  require(product.owner == msg.sender || owner() == msg.sender, 
    "Transaction initiator is not an owner of the product or the contract");

  // solidity does not return null for non existent object.
  // therefore if item is set to 0 for its elements, it means data is not foundn
  require(product.id != 0, "Product id does not exist");

  // check location id validity
  require(locationId >= 0 && locationId < _locations.length, "Location Id is not valid");

    // set new ownner
  product.locationId =  locationId;

  // for transparency notify subscribers that something has changed
  emit ProductLocationChanged(hash, locationId ,  msg.sender);

  // add to transaction history logs
  product.history.push(TransactionLog({
      transactionType: TransactionLogType.TRANSFER_LOCATION,
      date : block.timestamp,
      locationId: locationId,
      newOwner : address(0)
    }));
  } 

  function getProductTotalCout() public view returns (uint) {
    return _productIds.length;
  }

  function getProductIdAtIndex(uint index) public view returns (uint) {
    require(index < _productIds.length, "Product Id index not found");
    return _productIds[index];
  }
}

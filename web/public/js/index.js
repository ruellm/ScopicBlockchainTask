/** 
 * Front end demo Dapp for Scopic Ethereum training Practical task
 * author: Ruell Magpayo (ruellm#yahoo.com)
 * May 19, 2021
*/

/**
 * Listener for load
 */
 window.addEventListener('load', function() {

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      window.web3 = new Web3(window.ethereum);
    } else {
      console.log('Injected web3 Not Found!!!')
    }
  })


async function deployContract()
{

  // if not connected to meta mask, conenct and wait
  if(defaultAccoutn == null) {
     defaultAccoutn = await ethereum.request({method: 'eth_requestAccounts'});
  }

  contractInstance= new web3.eth.Contract(CONTRACT_ABI);

  // get the gas
  var   gas = document.getElementById('deployment_estimatedgas').value;

  // 3. This is where the contract gets deployed
  // Callback method gets called *2* 
  // First time : Result = Txn Hash
  // Second time: Result = Contract Address
  contractInstance.options.data = CONTRACT_BYTECODE;

  // For simplicity purposes, use the first Account enabled in metamask for connection
  contractInstance.deploy()
                  .send({
                      from: defaultAccoutn[0],
                      gas: gas,
                  })
                  .on('error', function(error){ 
                    alert("Error occured while deploying contract, please see logs");
                    console.log(error);
                   })
                  .then(function(newContractInstance){
                      console.log(newContractInstance.options.address) // instance with the new contract address
                      document.getElementById('contract_address').value = newContractInstance.options.address;
                      alert("Deployment succesful, contract address has been set, Please click on Connect");
                 }); 
    
}

async  function connectContract()
{
   // if not connected to meta mask, conenct and wait
  if(defaultAccoutn == null) {
    defaultAccoutn = await ethereum.request({method: 'eth_requestAccounts'});
  }

  try{
    var address =  document.getElementById('contract_address').value;
    contractInstance = new web3.eth.Contract(CONTRACT_ABI, address);
    connected = true;
    alert("Contract instance created");
    initializeApp();
  }catch(error) {
    alert("Unable to connect, Possible Invalid address?");
    conected = false;
  }
}

function addTransactionHistory(result) {
  var table = document.getElementById("transaction_history");

  // add a row
  var row = table.insertRow(table.rows.length);
  var cell = row.insertCell(0);

  var type = parseInt(result[0]);
  var logTypes = ["Created", "Transfer to", "Location Changed"];
  var transactionType = logTypes[type];
  
  // innsert first column
  cell.innerHTML = transactionType;

  // Date
  var unixTimeStamp = parseInt(result[1]);
  var date = new Date(unixTimeStamp * 1000);

  var dd = String(date.getDate()).padStart(2, '0');
  var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = date.getFullYear();

  var today = mm + '/' + dd + '/' + yyyy;
  var cell2= row.insertCell(1);
  cell2.innerHTML = today;

  // Locationn ID
  var cell3= row.insertCell(2);
  var list = document.getElementById('locationListBox');
  var index = parseInt(result[2]);
  cell3.innerHTML = type==2?list.options[index].text : "";

  
 // Locationn ID
 var cell4= row.insertCell(3); 
 cell4.innerHTML = type==1? result[3] : "";
}

function viewProduct(hash)
{
  var table = document.getElementById("transaction_history");
  while(table.rows.length > 1) {
    table.deleteRow(1);
  }

  contractInstance.methods.getProductInfo(hash).call({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      alert("Unable to get product details, see console for logs");
      console.log(error);
      return;
    }

    var locationId = parseInt(result[0]);
    var list = document.getElementById('product_view_location');
    for(var i = 0; i < list.options.length; ++i) {
      if(list.options[i].value == locationId) {
        list.options[i].selected = true;
        cache_locationName = list.options[i].text;
        break;
      }
    }
    
    document.getElementById('product_view_hash').value = hash;
    document.getElementById('product_view_owner').value = result[1];
    document.getElementById('product_viwq_name').value = result[2];

    // cache value for sanity check
    
    cache_ownner_address = result[1];

    var unixTimeStamp = parseInt(result[3]);
    var date = new Date(unixTimeStamp * 1000);

    const datePicker = document.getElementById('product_view_date');
    datePicker.valueAsDate = date;

    document.getElementById("view_product").style.display = "block";

    contractInstance.methods.getProductHistoryCount(hash).call({from: defaultAccoutn[0]}, function(error, result){
      if(error) {
        alert("Unable to get product history");
        console.log(error);
        return;
      }
  
      var count = parseInt(result);
      for(let i = 0; i < count; i++) {
        contractInstance.methods.getProductHistory(hash, i).call(null, function(error, result){
          if(error)
          {
            console.log("Error in getting Transaction history at index " + i + " withe error " + error);
            return;
          }
  
          addTransactionHistory(result);
  
        });
      }
    });
  });
}

function addProductId(hash) {
  var table = document.getElementById("product_table");
  for (var i = 0, row; row = table.rows[i]; i++) {
      if( row.cells[0].innerHTML == hash) {
          return;
     }
  }

  // add a row
  var row = table.insertRow(table.rows.length);
  var cell = row.insertCell(0);
  cell.innerHTML = hash;

  var cell2= row.insertCell(1);
  cell2.innerHTML="<Button onclick=\"viewProduct('" + hash + "')\"> Details </Button>";;
  
}

async function refreshProductList()
{
  if(contractInstance == null) {
    return;
  }

  contractInstance.methods.getProductTotalCout().call({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      console.log(error);
      return;
    }

    var count = parseInt(result);
    for(let i = 0; i < count; i++) {
      contractInstance.methods.getProductIdAtIndex(i).call(null, function(error, result){
        if(error)
        {
          console.log("Error in getting Product at index " + i + " withe error " + error);
          return;
        }

       // add product id
       addProductId(result);

      });
    }
  });
}

function addProduct()
{
  if(connected == false) {
    alert("Not connected to a contract");
    return;
  }

  var productName = document.getElementById("product_name").value;
  if(productName.length == 0) {
    alert("Product name should not be empty");
    return;
  }

  var index = -1;
  var list = document.getElementById('locationListBox');
  for(var i = 0; i < list.options.length; ++i)
      if(list.options[i].selected) {
        index = list.options[i].value;
        break;
      }

  if(index == -1){
    alert("Locationn is empty, perhaps you need to register a location first?");
    return;
  }

  var prodDate = new Date(document.getElementById('production_date').value);
  const timeStamp = Math.floor(prodDate.getTime() / 1000);

  // sennd transactionn
  contractInstance.methods.registerProduct(productName, timeStamp, index).send({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      console.log(error);
      alert("Error occured when registering a product");
      return;
    }

    alert("Transaction sent succesfully");
  });
}

function addLocation(name, index) {
  // check if already added
  var list = document.getElementById('locationListBox');
  for(var i = 0; i < list.options.length; ++i)
      if(list.options[i].text == name)
        return;
  
  var opt = document.createElement("option");
  opt.text = name;
  opt.value = index;
  list.options.add(opt);

  // update the location listbox in view product as well
  var list_prod_view = document.getElementById('product_view_location');
  var opt2 = document.createElement("option");
  opt2.text = name;
  opt2.value = index;
  list_prod_view.options.add(opt2);

}

async function refreshLocationList()
{
  if(contractInstance == null) {
    console.log("Connect or deploy a contract first");
    return;
  }

  contractInstance.methods.getLocationCount().call({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      console.log(error);
      return;
    }

    var count = parseInt(result);
    for(let i = 0; i < count; i++) {
      contractInstance.methods.getLocation(i).call(null, function(error, result){
        if(error)
        {
          console.log("Error in getting location information " + error);
          return;
        }

        addLocation(result, i);

      });
    }
  });
}

function registerLocation()
{
  if(connected == false) {
    alert("Not connected to a contract");
    return;
  }

  var locationName = document.getElementById("location_name_reg").value;
  if(locationName.length==0) {
    alert("Location name should not be empty");
    return;
  }

  contractInstance.methods.registerLocation(locationName).send({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      console.log(error);
      return;
    }

    alert("Transaction sent succesfully");
  });
}

function initializeApp()
{
  setInterval(()=>{
    refreshProductList();
    refreshLocationList();
  }, 1000);
}


function hideProductDetail()
{
  document.getElementById("view_product").style.display = "none";
}

function updateLocation()
{
  // 
  var list = document.getElementById('product_view_location');
  var locationName = "";
  var index=-1;
  for(var i = 0; i < list.options.length; ++i)
      if(list.options[i].selected) {
        index = list.options[i].value;
        locationName = list.options[i].text;
        break;
      }

  var resp = confirm("You are about to change the location of the product to \n\n" 
    + locationName +" from " +cache_locationName+ "\n\nOnly owner of the product or contract can do this!\n\nProceed?");

  if(!resp) return;
  
  var hash = document.getElementById('product_view_hash').value;
  contractInstance.methods.changeProductLocation(hash, index).send({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      alert("Error sending transaction, please see logs");
      console.log(error);
      return;
    }

    alert("Transaction sent succesfully");
  });
  
}

function transferOwner()
{
  var newOwner = document.getElementById('product_view_owner').value;
  
  if(newOwner == cache_ownner_address || newOwner.length == 0)
    return;

  var resp = confirm("You are about to TRANSFER ownership of this product\n\nTO\n" 
    + newOwner +"\nFROM address\n" + cache_ownner_address+ "\n\nOnly owner of the product or contract can do this!\nProceed?");

  if(!resp) return;
  
  var hash = document.getElementById('product_view_hash').value;
  try{
  contractInstance.methods.sellProduct(hash, newOwner).send({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      alert("Error sending transaction, please see logs");
      console.log(error);
      return;
    }

    alert("Transaction sent succesfully");
  });
  }catch(error){
    alert("Error sending transaction, please check logs");
  }
}

var contractInstance = null;
var connected = false;

var defaultAccoutn = null;
let deploy_btn = document.getElementById("deploy_new_contract_btn");
deploy_btn.addEventListener("click", deployContract, false);

let connect_btn = document.getElementById("connect_contract");
connect_btn.addEventListener("click", connectContract, false);


let add_product_btn = document.getElementById("add_product");
add_product_btn.addEventListener("click", addProduct, false);

let register_location_btn = document.getElementById("register_location");
register_location_btn.addEventListener("click", registerLocation, false);

var cache_locationName = "";
var cache_ownner_address = "";

let update_location_btn = document.getElementById("update_location");
update_location_btn.addEventListener("click", updateLocation, false);

let transfer_owner_btn = document.getElementById("transfer_owner");
transfer_owner_btn.addEventListener("click", transferOwner, false);


// set default date to today
document.getElementById('production_date').valueAsDate = new Date();
document.getElementById("view_product").style.display = "none";
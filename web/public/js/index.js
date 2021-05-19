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

  var address =  document.getElementById('contract_address').value;
  contractInstance = new web3.eth.Contract(CONTRACT_ABI, address);

  alert("Contract instance created");
  initializeApp();
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
  cell2.innerHTML="<button>View</button>";
}

async function refreshProductList()
{
  if(contractInstance == null) {
    return;
  }

  contractInstance.methods.getProductTotalCout().call({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      console.logs(error);
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
  const timeStamp = Math.floor(Date.now() / 1000);

  // sennd transactionn
  contractInstance.methods.registerProduct(productName, timeStamp, index).send({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      console.logs(error);
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
  if(contractInstance == null) {
    alert("No contract deployed or connected");
    return;
  }

  var locationName = document.getElementById("location_name_reg").value;
  contractInstance.methods.registerLocation(locationName).send({from: defaultAccoutn[0]}, function(error, result){
    if(error) {
      console.logs(error);
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

var contractInstance = null;

var defaultAccoutn = null;
let deploy_btn = document.getElementById("deploy_new_contract_btn");
deploy_btn.addEventListener("click", deployContract, false);

let connect_btn = document.getElementById("connect_contract");
connect_btn.addEventListener("click", connectContract, false);


let add_product_btn = document.getElementById("add_product");
add_product_btn.addEventListener("click", addProduct, false);

let register_location_btn = document.getElementById("register_location");
register_location_btn.addEventListener("click", registerLocation, false);

// set default date to today
document.getElementById('production_date').valueAsDate = new Date();
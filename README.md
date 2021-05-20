# ScopicBlockchainTask
Scopic Practical task for Ethereum course

## General
There are two projects
1. Web Dapp - the web frontend that utilizes web3 to communicate with the contract.
2. smart contract - the backend itself, it contains the smart contract code, deployment and unit tests

# Version requirement

Truffle v5.3.2 (core: 5.3.2). <br/>
Solidity v0.5.16 (solc-js). <br/>
Node v15.10.0. <br/>
Web3.js v1.3.5  <br/>
<br/>
Tested with Ganache v2.5.4. <br/>
Smart contract is built with Solidity version >=0.6.2 <0.9.0;  <br/>
<br/>
# Smart Contract
To build the smart contract
1. Go to the contract folder and do
```
truffle compile
```
2. Install dependency for test case
```
npm install
```
3. Run the unit tests
```
truffle test
```

# Web Dapp
1. Go to web folder, install dependencies.
```
npm install
```
2. Run the nodejs express application.
```
node app.js
```
3. open the browser at http://localhost:3000/
follow the instructions in the page.


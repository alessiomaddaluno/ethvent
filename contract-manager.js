const ethers = require('ethers');
const web3 = require('web3');
const fs = require('fs');

/*
    Search for event<id> and returns a json associated.
*/
function getEventById(id){
    data = fs.readFileSync('public/events.json', 'utf8');
    var arrayOfEvents = JSON.parse(data);
    for(var i=0; i < arrayOfEvents.events.length ; i++) {
        if(arrayOfEvents.events[i]['event-id'] === id){
            return(arrayOfEvents.events[i]);
        }
    }
    return null;
}

/*
    Opens events.json and remove event with id passed as argument.
*/
function removeEvent(id){
    let f = {};
    data = fs.readFileSync('public/events.json', 'utf8');
    var arrayOfEvents = JSON.parse(data);
    
    for(var i=0; i < arrayOfEvents.events.length ; i++) {
        if(arrayOfEvents.events[i]['event-id'] === id){
            delete arrayOfEvents.events[i];
            f['events'] = arrayOfEvents.events.filter(e=>{return e!=null});
            fs.writeFile('public/events.json', JSON.stringify(f), 'utf-8', (err) => {
                if(err) throw err       
            })
            
            return 0;
        }
    }
    return -1;
}

/*
    Create a new instance of http blockchain provider 
*/
function getWeb3Provider(provider){
    let currentProvider = new web3.providers.HttpProvider(provider);
    return new ethers.providers.Web3Provider(currentProvider);
}

/*
    Create a new instance of a wallet, passing his private key as argument.
    !!! INSICURE. JUST FOR LEARNING PURPOSE !!!
*/
function getWallet(privateKey,web3Provider){
    return new ethers.Wallet(privateKey, web3Provider);
}

/*
    Deploy checkInEvent and registerEvent contracts for a new event. The registration
    for the event will cost <eventDeposit> ether.
*/
async function deployContracts(wallet, eventDeposit){
    
    let contractsAddresses = {RegisterEvent:'0x0',CheckInEvent:'0x0'};
    
    // Get the ABI of the contracts
    const checkInContract  = JSON.parse(fs.readFileSync('./build/contracts/CheckInEvent.json', 'utf8'));
    const registerContract = JSON.parse(fs.readFileSync('./build/contracts/RegisterEvent.json', 'utf8'));
    
    // Create an instance of a Contract Factory
    let factoryCheckIn  = new ethers.ContractFactory(checkInContract.abi, checkInContract.bytecode, wallet);
    let factoryRegister = new ethers.ContractFactory(registerContract.abi, registerContract.bytecode, wallet);

    //Make the instance chain
    let instanceCheckIn = await factoryCheckIn.deploy(0);
    await instanceCheckIn.deployed();
    let instanceRegister = await factoryRegister.deploy(web3.utils.toWei(eventDeposit),instanceCheckIn.address);
    await instanceRegister.deployed();
    
    //Save the contracts addresses just deployed
    contractsAddresses.RegisterEvent = instanceRegister.address;
    contractsAddresses.CheckInEvent = instanceCheckIn.address;
    
    return contractsAddresses;
}

async function removeContracts(id,wallet,web3Provider){
    let event = getEventById(id);
    const checkInContract = JSON.parse(fs.readFileSync('./build/contracts/CheckInEvent.json', 'utf8'));
    let contract = new ethers.Contract(event['chk-address'],checkInContract.abi,web3Provider);
    let contractWithSigner = contract.connect(wallet);
    await contractWithSigner.bookingTimeout();
}

exports.getWeb3Provider = getWeb3Provider;
exports.getWallet = getWallet;
exports.deployContracts = deployContracts;
exports.getEventById = getEventById;
exports.removeEvent = removeEvent;
exports.removeContracts = removeContracts;
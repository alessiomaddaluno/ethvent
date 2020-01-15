const express = require('express');                     // Express framework for routing 
const bodyParser = require('body-parser');              // Body parser for handle http requests
const fs = require('fs');                               // Filesystem module
const crypto = require('crypto');                       // Used for hashing the event title to get and id 
const contractManager = require('./contract-manager');  // Module for handle events, checkinEvent and registerEvent
const logo = require('asciiart-logo');                  // Fancy ascii logo 
const pjson = require('./package.json');                // Information of this node app
const settings = require('./settings.json');            // Settings for the app

const app = express();                                  // Instance of Express
const port = settings['port'];                          // Set the port


app.set('view engine', 'ejs');                          // Set the ejs template engine
app.use(express.static("public"));                      // Set the static file directory 
app.use(bodyParser.urlencoded({ extended: true }));     // Enable the body parser

const web3Provider = contractManager.getWeb3Provider(settings['url_provider']); // Instance of web3 provider 

/*
    Root of the app. 
    Display home directory listing all the avaiable events.
*/
app.get('/', (req, res) => {
    var arrayOfEvents = {};
    fs.readFile('public/events.json', 'utf-8', (err, data) => {
        if (err) throw err;
        arrayOfEvents = JSON.parse(data);
      res.render('index',arrayOfEvents);
    })
})

/*
    Create Event.
    Display the interface for creating a new event. 
*/
app.get('/createEvent',(req,res) => {
    res.render('createEvent');
})

/*
    Handle post request from /createEvent.
    Get all the event information and deploy the contracts. 
    Save the contracts and event information to events.json.
*/
app.post('/createEvent', (req,res) => {
    //Status of the deployment of the contract
    let status = {status:0,error:'Evento creato con successo!'};
    //Wallet of the owner of this service
    let wallet; 
    //Addresses of the RegisterEvent & CheckInEvent contracts
    let contractsAddresses;
    //Read the json contacts file
    fs.readFile('public/events.json', 'utf-8', async (err, data) => {
        if (err) throw err;  
        var arrayOfObjects = JSON.parse(data);
        event = req.body;
        delete event['submit'];  //Clear the submit 
        // Generate an id for the event - THIS METHOD IS NOT SECURE
        event['event-id'] = crypto.createHash('md5').update(event['event-title']).digest('hex');
        // Convert date from YYYY-mm-dd to dd-mm-YYYY
        event['event-date'] = event['event-date'].split("-").reverse().join("-");
        // Get service owner wallet
        wallet = contractManager.getWallet(settings['privateKey'],web3Provider);
        // Wait for the deploy 
        try {
            contractsAddresses = await contractManager.deployContracts(wallet,event['event-price']);
        } catch (error) {
            console.log(error);
        }
        // Get the addresses of the contracts
        event['reg-address'] = contractsAddresses.RegisterEvent;
        event['chk-address'] = contractsAddresses.CheckInEvent;
        // Add the new event to the file
        arrayOfObjects.events.push(event);
        fs.writeFile('public/events.json', JSON.stringify(arrayOfObjects), 'utf-8', (err) => {
            if(err) throw err       
        })
    })
    res.render('createEvent',status);
})
/*
    Show event information in detail.
*/
app.get('/event', (req,res) => {
    
    const checkInContract = JSON.parse(fs.readFileSync('./build/contracts/CheckInEvent.json', 'utf8'));
    const registerContract = JSON.parse(fs.readFileSync('./build/contracts/RegisterEvent.json', 'utf8'));
    
    let config = {
        'provider': settings['url_provider'],
        'registerABI': checkInContract.abi,
        'checkInABI': registerContract.abi,
    }
    
    res.render('event',{event:contractManager.getEventById(req.query.id),'config':config});
})
/*
    Simulate a timeOut for the check in to the event. For more info consult the report.
*/
app.get('/simulateTimeout', (req,res) => {
    contractManager.removeContracts(req.query.id,contractManager.getWallet(settings['privateKey'],web3Provider),web3Provider);
    contractManager.removeEvent(req.query.id);
    res.redirect('/');
})

app.listen(port, () => {
    console.log(logo(pjson).render());
    console.log("Listen on port: "+settings['port']);
    console.log("Blockchain Provider: "+settings['url_provider']);
    console.log("\n");
})



pragma solidity ^0.5.0;

interface BookingManagerContract {
    function checkBooking(address _booked) external returns (bool);
    function getEventDeposit() external returns (uint);
    function bookingTimeout() external;
}

interface CheckInContract {
    function setRegister(address _contract) external;
}

contract RegisterEvent is BookingManagerContract {

    address payable owner;              //owner of the contract
    mapping (address => bool) booked;   // wallets booked to the event
    uint eventRate;                     // Rate of the event (in ether)
    address payable _checkIn;           // Address of the check-in contract
    CheckInContract checkin;            // check in contract itself

    /*
        Constructor of the contract. 
            eventBookingRate - Rate of the event managed by the contract
            _checkInContract - Address of the check in contract

    */
    constructor(uint256 eventBookingRate,address payable _checkInContract) public {
        owner = msg.sender;
        eventRate = eventBookingRate;          
        _checkIn = _checkInContract;
        checkin = CheckInContract(_checkIn);
        checkin.setRegister(address(this));
    }

    /*
        Make a booking for the event
    */
    function book() public payable{
        // Checks if the amount of Ethereum is correct
        require(
            msg.value == eventRate,
            'Quantità di ether errata per la prenotazione'
        );
        // Checks if the sender address is already booked up
        if(checkAlreadyBooked(msg.sender)){
            revert('È già presente una prenotazione per questo wallet');
        }
        // Registers the new address
        registerNewBooking(msg.sender);
        // Transfers the Eth to the checkIn Contract
        _checkIn.transfer(msg.value);
    }

    /*
        Checks if _wallet is already booked for the event
        @returns true if it's booked, false otherwise
    */
    function checkAlreadyBooked(address _wallet) public view returns (bool) {
        return (booked[_wallet]==true) ? true : false;
    }

    /*
        Registers _newBooked address
    */
    function registerNewBooking(address _newBooked) internal {
        booked[_newBooked] = true;
    }

    /*
        Returns true if there is a valid booking for _booked. Prevents multiple checks.
    */
    function checkBooking(address _booked) external returns (bool){
        if(booked[_booked]==true){
            booked[_booked] = false;
            return true;
        }
        return false;
    }

    /*
        Retuns the booking rate for the event
    */
    function getEventDeposit() external returns (uint) {
        return eventRate;
    }

    /*
        Destroy the contract
    */
    function bookingTimeout() external {
        require(
            _checkIn==msg.sender,
            'Questa funzione è abilitata solo per il proprietario del contratto.'
        );
        selfdestruct(owner);
    }

}


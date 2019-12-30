pragma solidity ^0.5.0;

interface BookingManagerContract {
    function checkBooking(address _booked) external returns (bool);
    function getEventDeposit() external returns (uint);
    function bookingTimeout() external;
}

interface CheckInContract {
    function setRegister(address _contract) external;
}

contract CheckInEvent is CheckInContract{

    address payable owner;                   //owner of the contract
    address _registerContract;               //Address of the Register contract
    BookingManagerContract registerContract; //Register contract in contract itself
    uint256 limitDate;                       //Limit date for the checkin

    constructor(uint256 date) public{
        owner = msg.sender; //set the owner of the contract
        limitDate = date;   //set the limit date of the event
    }

    /*
        Override Fallback function for accepting payaments from the Register contract
    */
    function () external payable  {
        require(
            address(registerContract) == msg.sender,
            'Solo il Register associato può inviare eher a tale contratto'
        );
    }
    
    /*
        Set the Register contract address
    */
    function setRegister(address _contract) external {
        if(_registerContract == address(0x0)){
            _registerContract = _contract;
            registerContract = BookingManagerContract(_registerContract);
        }
    }

    /*
        Check-In for the event
    */
    function checkIn() public {
        //Check if msg.sender have a valid booking in the register contract
        if(!registerContract.checkBooking(msg.sender)){
            revert('Prenotazione non valida');
        }
        //Refound the Ethereum
        msg.sender.transfer(registerContract.getEventDeposit());
    }
    
    /*
        Destroy the contract and trigger the Register destruction as well
    */
    function bookingTimeout() public {
        require(
            owner == msg.sender,
            'Questa funzione è abilitata solo per il proprietario del contratto'
        );
        require (
            now >= limitDate,
            'Limite per effettuare il check-in non ancora raggiunto'
        ); 
        // Destroy Register
        registerContract.bookingTimeout();
        selfdestruct(owner);
    }

}
pragma solidity ^0.4.24;

import "../../math/SafeMath.sol";
import "./ERC20.sol";

contract StandardToken is ERC20 {
    using SafeMath for uint256;

    mapping(address => uint256) balances;

    mapping (address => mapping (address => uint256)) allowed;
    //use address as index, and the value is uint256: similar to dictionary

    // should be private after write mint funtion
    uint256 internal _totalSupply;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    //if we change ledger => we need to send transaction fee to miner
    //if we won't change ledger, but we are going to access ledger =>
    //we are not going to pay fee by declare view or pure
    /**
    * @dev Gets the balance of the specified address.
    * @param _who The address to query the the balance of.
    * @return An uint256 representing the amount owned by the passed address.
    */
    function balanceOf(address _who) public view returns (uint256) {
        return balances[_who];
    }

    /**
    * @dev transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        //_to!=address(0) => cannot to access to the address not exist

        //msg_sender: who call this function; we only can transfer our money to others
        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
    * @dev Function to check the amount of tokens that an owner allowed to a spender.
    * @param _owner address The address which owns the funds.
    * @param _spender address The address which will spend the funds.
    * @return A uint256 specifying the amount of tokens still available for the spender.
    */
    function allowance(address _owner, address _spender) public view returns (uint256) {
        return allowed[_owner][_spender];
    }

    /**
    * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
    * @param _spender The address which will spend the funds.
    * @param _value The amount of tokens to be spent.
    */
    function approve(address _spender, uint256 _value) public returns (bool) {

        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        require((_value == 0) || (allowed[msg.sender][_spender] == 0));

        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
    * @dev Transfer tokens from one address to another
    * @param _from address The address which you want to send tokens from
    * @param _to address The address which you want to transfer to
    * @param _value uint256 the amount of tokens to be transferred
    */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));

        uint _allowance = allowed[_from][msg.sender];

        // Check is not needed because sub(_allowance, _value) will already throw if this condition is not met
        // require (_value <= _allowance);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = _allowance.sub(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    /**
    * approve should be called when allowed[_spender] == 0. To increment
    * allowed value is better to use this function to avoid 2 calls (and wait until
    * the first transaction is mined)
    * From MonolithDAO Token.sol
    */
    function increaseApproval (address _spender, uint _addedValue)
        public returns (bool success) {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseApproval (address _spender, uint _subtractedValue)
        public returns (bool success) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

}

/**
 * @title NHMToken
 */
contract ProjectToken is StandardToken {

    string public constant name = "Project";
    string public constant symbol = "PJ";
    uint8 public constant decimals = 18; // only two deciminals, token cannot be divided past 1/100th

    uint256 public constant INITIAL_SUPPLY =  10000 ether; // 100 * 18 decimals

    /**
    * @dev Contructor that gives msg.sender all of existing tokens.
    */
    constructor() public{
        _totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }
}
pragma solidity ^0.5.16;

import "./Claimable.sol";
import "./ERC20.sol";
import "./SafeMath.sol";
import "./ProjectToken.sol";


contract Base is Claimable{
 
ERC20 erc20Token;

struct Info{
        string productInfo;
        string productName;
        string gameID;
        string buyID;
        uint256 tradeTime;
        uint256 tradePrice;
        uint256 status;
        address selleraddress;    
        address buyeraddress;
}
address tokenAdd;
uint productNum = 0 ;
mapping(uint => Info) tradeInfo;
constructor(address _erc20TokenAddress) public{
        tokenAdd = _erc20TokenAddress;
        erc20Token = ERC20(_erc20TokenAddress);
}
function newProduct ()public returns (uint) {
        productNum++;
}
function uploadProduct(string memory title ,string memory proName , string memory ID , uint price) public returns (uint) {
     newProduct();
     tradeInfo[productNum].productInfo=title;
     tradeInfo[productNum].productName=proName;
     tradeInfo[productNum].gameID=ID;
     tradeInfo[productNum].tradePrice=price;
     tradeInfo[productNum].status=0;
     tradeInfo[productNum].selleraddress=msg.sender;
     return productNum;
}

function saveBuyerAddress(uint pn) public {
    tradeInfo[pn].buyeraddress=msg.sender;
}




//event tradeResult(address indexed seller, uint256 sellPrice);
    
    function successTrade(uint pn) public {
        
        require(erc20Token.balanceOf(address(this)) >= tradeInfo[pn].tradePrice);
        erc20Token.transferFrom(address(this),tradeInfo[pn].selleraddress ,tradeInfo[pn].tradePrice);
        tradeInfo[pn].status=3;
       // emit tradeResult(msg.sender, tradeInfo[pn].tradePrice);
    }
    
//event tradeResult2(address indexed buyer, uint256 sellPrice);    
    function failTrade(uint pn) public {
        require(erc20Token.balanceOf(address(this)) >= tradeInfo[pn].tradePrice);
        erc20Token.transferFrom(address(this),tradeInfo[pn].buyeraddress,tradeInfo[pn].tradePrice);
        tradeInfo[pn].status=4;
        //emit tradeResult(msg.sender, tradeInfo[pn].tradePrice);    
        
    }
    

    
     //event BuyProduct(address indexed buy, uint256 sellPrice);
     //event Transfer(address indexed buy, address indexed to, uint256 _value);
    
    function Pay(uint pn) public {
         require(erc20Token.balanceOf(msg.sender) >= tradeInfo[pn].tradePrice);
         require(erc20Token.approve(address(this),tradeInfo[pn].tradePrice));
         erc20Token.transferFrom(msg.sender,address(this), tradeInfo[pn].tradePrice);  
         saveBuyerAddress(pn);
         tradeInfo[pn].status=1;
        //emit BuyProduct(msg.sender,tradeInfo[pn].tradePrice);
        //emit Transfer(msg.sender,address(this),tradeInfo[pn].tradePrice);
    }
    
function getProductInfo(uint pNum) public view returns (string memory){
    return tradeInfo[pNum].productInfo;
}
function getProductName(uint pNum) public view returns (string memory){
    return tradeInfo[pNum].productName;
}
function getProductPrice(uint pNum) public view returns (uint){
    return tradeInfo[pNum].tradePrice;
}
function getSellerID(uint pNum) public view returns (string memory){
    return tradeInfo[pNum].gameID;
}
function returncontractAddress() public view returns (address){
    return address(this);
}
function getTradePrice() public view returns (uint256) {
        return tradeInfo[productNum].tradePrice;
}
function getBalance() public payable returns (uint256){
    return erc20Token.balanceOf(msg.sender);
}
function getTradeStatus(uint pNum) public view returns(uint){
    return tradeInfo[pNum].status;
}
function returnBuyerAddress(uint pn)public view returns(address){
    return tradeInfo[pn].buyeraddress;
}
function returnSellerAddress(uint pn)public view returns(address){
    return tradeInfo[pn].selleraddress;
}
function setTradeStatus(uint pn,uint n)public {
    tradeInfo[pn].status=n;
}
function setBuyerID(uint pn,string memory str) public {
    tradeInfo[pn].buyID=str;
}
function getBuyerID(uint pn) public view returns(string memory){
    return tradeInfo[pn].buyID;
}
function returnTokenAdd()public view returns(address){
    return tokenAdd;
}

function currentProductNum() public view returns (uint){
    return productNum;
}
    
    
}
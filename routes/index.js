const express = require('express');
const router = express.Router();
const Provider = require('@truffle/hdwallet-provider');
var Web3 = require('web3');
const infuraURL = 'https://ropsten.infura.io/v3/76b5cbba7f2946218de13d39cd617659';
var identityKey = 'skey';
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var users = require('./users').items;
console.log(users);


var web3 = new Web3(infuraURL);
var privateKey = '';
var provider;


web3.eth.net.getId().then(console.log);

web3.eth.net.isListening().then((s) => {
	console.log('True');
}).catch((e) => {
	console.log('False');
})


const contract = require('../contract/Base.json');
const tokenContract = require('../contract/ProjectToken.json');
var Personal = require('web3-eth-personal');
var personal = new Personal(Personal.givenProvider);





/* GET home page. */
router.get('/', async function (req, res, next) {
	
	res.render('index');
	
});

//初始session
router.use(session({

		name: identityKey,
		secret: 'ethproject',
		store: new FileStore(),
		saveUninitialized: false,
		resave: false,
	cookie: {
			maxAge: 1200 * 1000
		}

}));

//登入
router.post('/login', async function (req, res) {

	var user = findUser(req.body.name, req.body.privatekey);
	
	if (user) {
		req.session.name = user.name;
		req.session.privatekey = user.privatekey;

	}
		
	setKeytoWeb3(req.body.privatekey);
	
	res.send({
		privatekey: req.body.name
	})
	
});

// 取得當前session中登入的帳號
router.get('/SessionAccount', async function (req, res, next) {
		var sess = req.session;
		var loginUser = sess.name;

		var isLogined = !!loginUser;
		if (isLogined) {
			res.send({
				nowAcc: loginUser,
			})
		}
		
	});

var findUser = function (name, privatekey) {
	return users.find(function (item) {
		return item.name === name && item.privatekey === privatekey;
	});
};


function setKeytoWeb3(key) {
	provider = new Provider(key, infuraURL);
	//web3 = new Web3(provider);
	web3.setProvider(provider);

	web3.eth.net.getId().then(console.log);
	web3.eth.net.isListening().then((s) => {
		console.log('Success');
	}).catch((e) => {
		console.log('False');
	})
}

function resetWeb3() {
	web3.setProvider(infuraURL);
	web3.eth.net.getId().then(console.log);
	web3.eth.net.isListening().then((s) => {
		console.log('True');
	}).catch((e) => {
		console.log('False');
	})
}


router.post('/unlock', function (req, res, next) {

	web3.eth.personal.unlockAccount(req.body.account, req.body.password, 60)
		.then(function (result) {
			res.send('true')
		})
		.catch(function (err) {
			res.send('false')
		})
});

//取得一帳戶的以太幣和此合約所用的ERC-20數量
router.get('/allBalance', async function (req, res, next) {
	
	let bank = new web3.eth.Contract(contract.abi);
	let erc20 = new web3.eth.Contract(tokenContract.abi);
	bank.options.address = req.query.address;
	erc20.options.address = req.query.erc20Address;
	if (!!req.session.name) {
		setKeytoWeb3(req.session.privatekey);
		req.query.account = req.session.name;

		let ethBalance = await web3.eth.getBalance(req.query.account)
		let accountTokenBalance = await erc20.methods.balanceOf(req.query.account).call()
		let tokenBalance = await bank.methods.getBalance().call({ from: req.query.account })

		res.send({
			ethBalance: web3.utils.fromWei(ethBalance, 'ether'),
			accountTokenBalance: web3.utils.fromWei(accountTokenBalance, 'ether'),
			tokenBalance: web3.utils.fromWei(tokenBalance, 'ether')
		})
	resetWeb3();
	}
	else {
		res.send({ login: 1 })
	}
	});


// 上架商品
router.post('/Info', async function (req, res, next) {
	if (!!req.session.name) {
		setKeytoWeb3(req.session.privatekey);
		req.body.account = req.session.name;
		let bank = new web3.eth.Contract(contract.abi);
		bank.options.address = req.body.address;

		let productnum = await bank.methods.currentProductNum().call();
		productnum = parseInt(productnum, 10) + 1;
		uploadproduct = await bank.methods.uploadProduct(req.body.info, req.body.name, req.body.ID, web3.utils.toWei(req.body.price, 'ether')).send({
			from: req.body.account,
			gas: 3400000
		})
			.on('receipt', function (receipt) {
				console.log(receipt)
				res.send({
					receipt: receipt,
					productnum: productnum

				});

			})
			.on('error', function (error) {
				res.send(error.toString());
			})
		
	}
	else {
		res.send({ login: 1 })
	} 
});
// 目前商品編號
router.get('/currentProductNum', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.query.address;
	let productnum = await bank.methods.currentProductNum().call()

	res.send({
		productnum: productnum
	})
});

// 取得合約內所有的商品
router.get('/products', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.query.address;
	let currentProdNum = await bank.methods.currentProductNum().call()
	let products = [];
	products = [];
	products.splice(0, products.length);
	for (i = 1; i <=currentProdNum; i++) {
		let pd = await bank.methods.getProductName(i).call()
		products.push(pd);
	}

	res.send(products);
	
});

// 當查看商品資訊
router.get('/Info', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.query.address;
	
	
	let prod_price = await bank.methods.getProductPrice(req.query.nowProduct).call()
	let prod_info = await bank.methods.getProductInfo(req.query.nowProduct).call()
	let sellerID = await bank.methods.getSellerID(req.query.nowProduct).call()
	let status = await bank.methods.getTradeStatus(req.query.nowProduct).call()

	res.send({
		status: status,
		prod_price: web3.utils.fromWei(prod_price, 'ether'),
		prod_info: prod_info,
		sellerID: sellerID
	})

});



//取得目前交易狀態
router.get('/TradeStatus', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.query.address;

	let status = await bank.methods.getTradeStatus(req.query.nowProduct).call()
	res.send({
		status: status
	})
});

//設定交易狀態
router.post('/TradeStatus', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.body.address;
	if (!!req.session.name) {
		setKeytoWeb3(req.session.privatekey);
		req.body.account = req.session.name;
		bank.methods.setTradeStatus(req.body.nowProduct, req.body.setValue).send({
			from: req.body.account,
			gas: 3400000
		})
			.on('receipt', function (receipt) {
				res.send(receipt);
			})
			.on('error', function (error) {
				res.send(error.toString());
			})
			
	}
	else {
		res.send({ login: 1 })
	}
});

//紀錄買家遊戲ID
router.post('/BuyerID', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.body.address;
	if (!!req.session.name) {
		setKeytoWeb3(req.session.privatekey);
		req.body.account = req.session.name;
		bank.methods.setBuyerID(req.body.nowProduct, req.body.buyerid).send({
			from: req.body.account,
			gas: 3400000
		})
			.on('receipt', function (receipt) {
				res.send(receipt);
			})
			.on('error', function (error) {
				res.send(error.toString());
			})
	
	}

});

//取得買家紀錄在合約內的遊戲ID
router.get('/BuyerId', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.query.address;
	let flag = 0;
	if (!!req.session.name) {
		req.query.account = req.session.name;
		let seller = await bank.methods.returnSellerAddress(req.query.nowProduct).call()
		let buyerID = await bank.methods.getBuyerID(req.query.nowProduct).call()
		if (req.query.account == seller) {
			flag = 1;
		}
		res.send({
			buyerID: buyerID,
			flag: flag
		})
	}
	else {
		res.send({ login: 1 })
	}
});


// 購買鍵 買家支付至合約端
router.post('/buy', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	let erc20 = new web3.eth.Contract(tokenContract.abi);
	bank.options.address = req.body.address;
	erc20.options.address = req.body.erc20Address;
	let value = await bank.methods.getProductPrice(req.body.nowProduct).call();
	if (!!req.session.name) {
		setKeytoWeb3(req.session.privatekey);
		req.body.account = req.session.name;

		erc20.methods.approve(bank.options.address, web3.utils.toWei(value, 'ether')).send({
			from: req.body.account,
			gas: 340000
		})
			.on('receipt', function (receipt) {
			res.send(receipt);
		})
			.on('error', function (error) {
				res.send(error.toString());
			})
			
		
		bank.methods.Pay(req.body.nowProduct).send({
			from: req.body.account,
			gas: 340000
		})
			.on('receipt', function (receipt) {
				res.send(receipt);
			})
			.on('error', function (error) {
				res.send(error.toString());
			})
			

	}
	else {
		res.send({ login: 1 })
	}
	
});

router.get('/successtrade', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	let erc20 = new web3.eth.Contract(tokenContract.abi);
	bank.options.address = req.query.address;
	erc20.options.address = req.query.erc20Address;


	if (!!req.session.name) {
		req.query.account = req.session.name;
		let add1 = await bank.methods.returnSellerAddress(req.query.nowProduct).call()
		if (req.query.account != add1) {
			b1 = 0;
		}
		else { b1 = 1; }
		res.send({
			b1: b1
		})
	}
	else {
		res.send({ login: 1 })
	}
});




//買家領收商品 合約將款項交付給賣家
router.post('/withdraw', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.body.address;
	let value = bank.methods.getProductPrice(req.body.nowProduct).call();
	let add2 = await bank.methods.returnBuyerAddress(req.body.nowProduct).call()

	if (!!req.session.name) {
		setKeytoWeb3(req.session.privatekey);
		req.body.account = req.session.name;

		if (req.body.account != add2) {
			b2 = 0;
		}
		else {
			b2 = 1;
			bank.methods.successTrade(req.body.nowProduct).send({
				from: req.body.account,
				gas: 3400000
			})
				.on('receipt', function (receipt) {
					res.send(receipt);
				})
				.on('error', function (error) {
					res.send(error.toString());
				})
		}
		res.send({
			b2: b2
		})
		
	}
	else {
		res.send({ login: 1 })
	}

});


//退款(在此因沒有驗證是否退款的機制,執行此函式目前是會直接退款回給買家)
router.post('/refund', async function (req, res, next) {
	let bank = new web3.eth.Contract(contract.abi);
	bank.options.address = req.body.address;
	let value = bank.methods.getProductPrice(req.body.nowProduct).call();
	let add3 = await bank.methods.returnBuyerAddress(req.body.nowProduct).call()
	if (!!req.session.name) {
		setKeytoWeb3(req.session.privatekey);
		req.body.account = req.session.name;

		if (req.body.account != add3) {
			b3 = 0;
		}
		else {
			b3 = 1;

			bank.methods.failTrade(req.body.nowProduct).send({
				from: req.body.account,
				gas: 3400000
			})
				.on('receipt', function (receipt) {
					res.send(receipt);
				})
				.on('error', function (error) {
					res.send(error.toString());
				})
		}
		res.send({
			b3: b3
		})
	}
	else {
		res.send({ login: 1 })
	}
});




function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = router;
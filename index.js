"use strict";

let decimal = require('bignumber.js'); // TODO use gmp binding (eg. node-gmp)
let assert = require('assert');
let moment = require('moment');
let pad = require('pad');
let _ = require('underscore');

function Transaction(metadata) {
  if (!(this instanceof Transaction)) return new Transaction(metadata);
  _.extend(this, metadata);
  this.postings = [];
}

Transaction.prototype.transfer = function(fromAccount, toAccount, amount, metadata) {
  assert(fromAccount instanceof Account);
  assert(toAccount instanceof Account);
  assert(amount.plus);
  this.postings.push(new Posting(fromAccount, amount.neg(), metadata));
  this.postings.push(new Posting(toAccount, amount, metadata));
  return this;
};

Transaction.prototype.valid = function() {
  let sum = this.postings.reduce(function(sum, posting) {
    assert(posting instanceof Posting);
    return sum.plus(posting.amount);
  }, decimal('0'));

  return sum.equals(decimal('0'));
};

Transaction.prototype.toLedger = function() {
  assert(this.date instanceof Date);
  assert(this.payee);

  let str = moment(this.date).format('YYYY-MM-DD') + " " + this.payee;
  if (this.note) str += '    ; ' + this.note;
  this.postings.forEach(function(posting) {
    str += "\n    " + posting.toLedger();
  });
  return str;
};

function Posting(account, amount, metadata) {
  if (!(this instanceof Posting)) return new Posting(account, amount, metadata);
  assert(account instanceof Account);
  assert(amount.plus);

  _.extend(this, metadata);

  this.account = account;
  this.amount = amount;
}

Posting.prototype.toLedger = function() {
  assert(this.account.name.match(/^([\w:.@-]( (?!$))?)+$/));

  let str = pad(this.account.name, 40) + '  ' + pad(10, this.amount.toFixed());
  if (this.note) str += '  ; ' + this.note;
  return str;
};

function Account(name, metadata) {
  if (!(this instanceof Account)) return new Account(name, metadata);
  _.extend(this, metadata);
  this.name = name;
}

function BalanceMap() {
  this.balances = new Map();

  // HACK nodejs 0.11.13 does not support Map iteration, so we keep track of
  // keys in an array
  this.accounts = [];
}

BalanceMap.prototype.get = function(account) {
  if (this.balances.has(account))
    return this.balances.get(account);

  assert(account instanceof Account);
  return decimal(0);
};

BalanceMap.prototype.has = function(account) {
  return this.balances.has(account);
};

BalanceMap.prototype.set = function(account, value) {
  if (!this.balances.has(account))
    this.accounts.push(account);

  this.balances.set(account, value);
};

BalanceMap.prototype.addPosting = function(posting) {
  assert(posting instanceof Posting);
  this.set(posting.account, this.get(posting.account).plus(posting.amount));
};

BalanceMap.prototype.addTransaction = function(transaction) {
  assert(transaction instanceof Transaction);

  let self = this;
  transaction.postings.forEach(function(posting) {
    self.addPosting(posting);
  });
};

BalanceMap.prototype.toJSON = function() {
  let self = this;
  let json = {};
  this.accounts.forEach(function(account) {
    json[account.name] = self.balances.get(account).toString();
  });
  return json;
}

BalanceMap.fromJSON = function(json, account_lookup) {
  let map = new BalanceMap();
  _.forEach(json, function(balance, account_name) {
    let account = account_lookup(account_name);
    map.set(account, decimal(balance));
  });
  return map;
}

exports.Transaction = Transaction;
exports.Posting = Posting;
exports.Account = Account;
exports.BalanceMap = BalanceMap;

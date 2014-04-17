"use strict"

let decimal = require('bignumber.js'); // TODO use gmp binding (eg. node-gmp)
let assert = require('better-assert');
let moment = require('moment');
let pad = require('pad');
let _ = require('underscore');

function Transaction(metadata) {
  _.extend(this, metadata);
  this.postings = [];
}

Transaction.prototype.transfer = function(fromAccount, toAccount, amount, metadata) {
  this.postings.push(new Posting(fromAccount, amount.neg(), metadata));
  this.postings.push(new Posting(toAccount, amount, metadata));
  return this;
}

Transaction.prototype.valid = function() {
  let sum = this.postings.reduce(function(sum, posting) {
    assert(posting instanceof Posting);
    return sum.plus(posting.amount);
  }, decimal('0'));
  
  return sum.equals(decimal('0'));
}

Transaction.prototype.toLedger = function() {
  assert(this.date instanceof Date);
  assert(this.payee);

  let str = moment(new Date()).format('YYYY-MM-DD') + " " + this.payee;
  if (this.note) str += '    ; ' + this.note;
  this.postings.forEach(function(posting) {
    str += "\n    " + posting.toLedger();
  });
  return str;
}

function Posting(account, amount, metadata) {
  assert(account instanceof Account);
  assert(amount instanceof decimal);

  _.extend(this, metadata);

  this.account = account;
  this.amount = amount;
}

Posting.prototype.toLedger = function() {
  assert(this.account.name.match(/^([\w:.@-]( (?!$))?)+$/))

  let str = pad(this.account.name, 40) + pad(10, this.amount.toFixed(2));
  if (this.note) str += '  ; ' + this.note;
  return str;
}

function Account(name, metadata) {
  _.extend(this, metadata);
  this.name = name;
}

function reduceBalance(balances, transaction) {
  if (!balances) balances = new Map();
  function addPosting(posting) {
    if (!balances.has(posting.account))
      balances.set(posting.account, decimal('0'))
    balances.set(posting.account, balances.get(posting.account).plus(posting.amount));
  }

  if (transaction instanceof Transaction)
    transaction.postings.forEach(addPosting);
  else 
    addPosting(transaction);

  return balances;
}

exports.Transaction = Transaction
exports.Posting = Posting
exports.Account = Account
exports.reduceBalance = reduceBalance;

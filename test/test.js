"use strict"

let ledger = require('..');
let decimal = require('bignumber.js');
let assert = require('better-assert');

describe('Account', function() {
  it('should work', function() {
    let account = new ledger.Account('foobar');

    assert(account.name == 'foobar');
  });
});

describe('Posting', function() {
  it('should work', function() {
    let account = new ledger.Account('foobar');
    let posting = new ledger.Posting(account, decimal('0.3'), {note: 'a note'});

    assert(posting.account === account);
    assert(posting.amount.equals(decimal('0.3')));
    assert(posting.note === 'a note');
  });
});

describe('Transaction', function() {
  it('should work', function() {
    let date = new Date();
    let account1 = new ledger.Account('foo');
    let account2 = new ledger.Account('bar');
    let transaction = new ledger.Transaction({date: date});
    
    transaction.transfer(account1, account2, decimal('5'), {note: 'bla'});

    assert(transaction.valid());
    assert(transaction.date === date);

    assert(transaction.postings[0].account === account1);
    assert(transaction.postings[0].amount.equals(decimal('-5')));
    assert(transaction.postings[0].note === 'bla');

    assert(transaction.postings[1].account === account2);
    assert(transaction.postings[1].amount.equals(decimal('5')));
    assert(transaction.postings[1].note === 'bla');
  });
});

describe('reduceBalance', function() {
  it('should work with postings', function() {
    let account1 = new ledger.Account('foo');
    let account2 = new ledger.Account('bar');

    let bal;

    bal = ledger.reduceBalance(bal, new ledger.Posting(account1, decimal('5')));
    bal = ledger.reduceBalance(bal, new ledger.Posting(account1, decimal('2')));

    bal = ledger.reduceBalance(bal, new ledger.Posting(account2, decimal('2')));
    bal = ledger.reduceBalance(bal, new ledger.Posting(account2, decimal('7')));

    assert(bal.get(account1).equals(decimal('7')));
    assert(bal.get(account2).equals(decimal('9')));
  });

  it('should work with transactions', function() {
    let account1 = new ledger.Account('foo');
    let account2 = new ledger.Account('bar');
    let account3 = new ledger.Account('baz');

    let trans1 = new ledger.Transaction();
    trans1.transfer(account1, account2, decimal('3.0'));
    trans1.transfer(account1, account2, decimal('4.0'));

    let trans2 = new ledger.Transaction();
    trans2.transfer(account2, account3, decimal('1.0'));

    let bal;
    bal = ledger.reduceBalance(bal, trans1);
    bal = ledger.reduceBalance(bal, trans2);

    assert(bal.get(account1).equals(decimal('-7')));
    assert(bal.get(account2).equals(decimal('6')));
    assert(bal.get(account3).equals(decimal('1')));
  });
});

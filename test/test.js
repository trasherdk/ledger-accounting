"use strict"

let ledger = require('..');
let decimal = require('bignumber.js');
let expect = require('expect.js');

describe('Account', function() {
  it('should work', function() {
    let account = ledger.Account('foobar');

    expect(account.name).to.be('foobar');
  });
});

describe('Posting', function() {
  it('should work', function() {
    let account = ledger.Account('foobar');
    let posting = ledger.Posting(account, decimal('0.3'), {note: 'a note'});

    expect(posting.account).to.be(account);
    expect(posting.amount.equals(decimal('0.3'))).to.be.ok();
    expect(posting.note).to.be('a note');
  });

});

describe('Transaction', function() {
  it('should work', function() {
    let date = new Date();
    let account1 = ledger.Account('foo');
    let account2 = ledger.Account('bar');
    let transaction = ledger.Transaction({date: date});

    transaction.transfer(account1, account2, decimal('5'), {note: 'bla'});

    expect(transaction.valid()).to.be.ok();
    expect(transaction.date).to.be(date);

    expect(transaction.postings[0].account).to.be(account1);
    expect(transaction.postings[0].amount.equals(decimal('-5')));
    expect(transaction.postings[0].note).to.be('bla');

    expect(transaction.postings[1].account).to.be(account2);
    expect(transaction.postings[1].amount.equals(decimal('5')));
    expect(transaction.postings[1].note).to.be('bla');
  });

  it('should generate ledger', function() {
    let date = new Date('2000-1-1');
    let account1 = ledger.Account('foo');
    let account2 = ledger.Account('bar');
    let transaction = ledger.Transaction({date: date, payee: 'foo bar'});
    transaction.transfer(account1, account2, decimal('5'));

    let generated = transaction.toLedger();
    expect(generated).to.be.ok();

    let expected =
      "2000-01-01 foo bar\n"      +
      "  foo    -5\n"   +
      "  bar     5";

    function normalize(str) {
      return str.replace(/ +/g, ' ');
    }

    expect(normalize(generated)).to.be(normalize(expected));
  });
});

describe('BalanceMap', function() {
  it('should add postings', function() {
    let account1 = ledger.Account('foo');
    let account2 = ledger.Account('bar');

    let bal = new ledger.BalanceMap();

    expect(bal.has(account1)).to.not.be.ok();

    bal.addPosting(ledger.Posting(account1, decimal('5')));
    bal.addPosting(ledger.Posting(account1, decimal('2')));

    bal.addPosting(ledger.Posting(account2, decimal('2')));
    bal.addPosting(ledger.Posting(account2, decimal('7')));

    expect(bal.has(account1)).to.be.ok();

    expect(bal.get(account1)).to.eql(decimal('7'));
    expect(bal.get(account2)).to.eql(decimal('9'));
  });

  it('should work with transactions', function() {
    let account1 = ledger.Account('foo');
    let account2 = ledger.Account('bar');
    let account3 = ledger.Account('baz');

    let trans1 = ledger.Transaction();
    trans1.transfer(account1, account2, decimal('3.0'));
    trans1.transfer(account1, account2, decimal('4.0'));

    let trans2 = ledger.Transaction();
    trans2.transfer(account2, account3, decimal('1.0'));

    let bal = new ledger.BalanceMap();
    bal.addTransaction(trans1);
    bal.addTransaction(trans2);

    expect(bal.get(account1)).to.eql(decimal('-7'));
    expect(bal.get(account2)).to.eql(decimal('6'));
    expect(bal.get(account3)).to.eql(decimal('1'));
  });
});

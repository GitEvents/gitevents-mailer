'use strict';

var test = require('tape');
var mailerPlugin = require('../lib');

function fakeRenderer(data, done) {
  setImmediate(done.bind(null), null, {
    subject: 'fake subject',
    html: 'fake html body',
    text: 'fake plain text body'
  });
}

var fakeProvider = {
  send: function (from, to, cc, bcc, subject, bodies, opts, done) {
    setImmediate(done.bind(null), null, {
      from: from,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      bodies: bodies,
      options: opts
    });
  }
};

var sendParams = {
  from: {
    name: 'Ivan',
    address: 'ivan@te.st'
  }
};

test('GitEvents-Mailer', function (t) {

  test('plugin', function (t) {
    t.equal(typeof mailerPlugin, 'function', 'exports a function');
    t.throws(mailerPlugin.bind(null, 'options'), /options must be an object/i,
           'exported function takes one options parameter which must be an object');
    t.throws(mailerPlugin.bind(null, { some: 'options' }), /required/i,
            'exported function options parameter requires provider, renderer and sendParams');
    t.throws(mailerPlugin.bind(null, { renderer: fakeRenderer }), /required/i,
            'exported function options parameter requires provider, sendParams as well');
    t.throws(mailerPlugin.bind(null, { renderer: fakeRenderer, provider: fakeProvider }), /required/i,
            'exported function options parameter requires sendParams as well');
    t.throws(mailerPlugin.bind(null, {
      renderer: {},
      provider: fakeProvider,
      sendParams: sendParams }),
      /must be a function/i,
      'exported function options parameter requires renderer to be a function');

    t.throws(mailerPlugin.bind(null, {
      renderer: {  },
      provider: fakeProvider,
      sendParams: sendParams }),
      /must be a function/i, 'exported function options parameter requires renderer to be a function');

    t.throws(mailerPlugin.bind(null, {
      renderer: fakeRenderer,
      provider: { received: function () { } },
      sendParams: sendParams
    }), /.*send.* method/i, 'exported function options parameter requires provider to have send method');

    t.throws(mailerPlugin.bind(null, {
      renderer: fakeRenderer,
      provider: fakeProvider,
      sendParams: { to: 'some' }
    }), /from must be an Object/i, 'exported function options parameter requires sendParmas to have `from` property');

    t.throws(mailerPlugin.bind(null, {
      renderer: fakeRenderer,
      provider: fakeProvider,
      sendParams: { from: { address: 'ivan@te.st' } }
    }), /from must have .*name.*/i,
    'exported function options parameter requires sendParams#from to have `name` property');

    t.throws(mailerPlugin.bind(null, {
      renderer: fakeRenderer,
      provider: fakeProvider,
      sendParams: { from: { name: 'ivan' } }
    }), /from must have .*address.*/i,
    'exported function options parameter requires sendParams#from to have `address` property');

    t.doesNotThrow(mailerPlugin.bind(null, { renderer: fakeRenderer, provider: fakeProvider, sendParams: sendParams }),
            'exported function returns a mailer object when options contains all the expected parameters');
    t.end();
  });

  test('mailer object', function (t) {
    var mailer = mailerPlugin({ renderer: fakeRenderer, provider: fakeProvider, sendParams: sendParams });
    var to = [{ name: 'Bill', address: 'bill@te.st' }];

    t.plan(9);
    t.equals(typeof mailer.send, 'function', 'has a `send` method');
    mailer.send(to, null, function (err, allParams) {
      t.equals(err, null, 'send does not return any error');
      t.equals(allParams.from, sendParams.from);
      t.equals(allParams.to, to);
      t.equals(allParams.cc, sendParams.cc);
      t.equals(allParams.bcc, sendParams.bcc);
      t.equals(allParams.subject, 'fake subject');
      t.deepEqual(allParams.bodies, { html: 'fake html body', text: 'fake plain text body' });
      t.equals(allParams.options, sendParams.options);
    });
  });

  t.end();
});

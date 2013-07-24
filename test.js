
var opts = {
    commands: [
    {
        name: 'Uptime for great victory',
        command: 'uptime',
        regex: 'up (\\d+) days'
    }]
};

var d = new (require('./index'))(opts, {
    on : function(x,cb){
        setTimeout(cb, 100);
    },
    log: {
        debug: console.log,
        info: console.log,
        warn: console.log,
        error: console.log
    },
    opts: {
        cloudHost : "zendo.ninja.is",
        apiHost : "api.ninja.is",
        streamHost : "stream.ninja.is"
    },
    token: 'XXX'
});

d.save = function() {
    console.log('Driver.save', opts);
};

d.on('register', function(value) {
    console.log('Driver.register');

    console.log('Registered device : ', value.name);
    var device = value;

    device.on('data', function(data) {
        console.log('Device emitted data - ' + data);
    });

    setTimeout(function() {
        device.write('');
    }, 1000);

});

d.save = function() {
    console.log('Saved opts', opts);
};


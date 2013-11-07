
var opts = {
    commands: {
        uptime: {
            name: 'uptime',
            command: 'sysctl kern.boottime',
            regex: 'sec = (\\d+),'
        }
    }
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
d.config({
    method: 'addSubmit',
    params: {
        name: 'uptime',
        command: 'sysctl kern.boottime',
        regex: 'sec = (\\d+),'
    }
}, function(e, val) {
    console.log('Ran config', e, val);
});


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


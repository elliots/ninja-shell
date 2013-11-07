var util = require('util'),
  stream = require('stream'),
  exec = require('child_process').exec;

util.inherits(Driver,stream);
util.inherits(Device,stream);

function Driver(opts,app) {

  this._commands = (opts.commands = opts.commands || []);
  this._app = app;

  app.on('client::up',function(){
    for (var id in this._commands) {
      this.createCommandDevice(id, this._commands[id]);
    }
  }.bind(this));

}

Driver.prototype.createCommandDevice = function(id, cmd) {
  var d = new Device(this._app, id, cmd.name, cmd.command, cmd.regex);
  this.emit('register', d);
};

Driver.prototype.addCommand = function(id, name, command, regex) {

  var cmd = {
    name: name,
    command: command,
    regex: regex
  };

  this._commands[id] = cmd;
  this.save();

  this.createCommandDevice(id, cmd);
};


Driver.prototype.config = function(rpc,cb) {

  console.log('RPC CONFIG', rpc);

  var self = this;

  if (!rpc) {
    return cb(null,{"contents":[
      { "type": "submit", "name": "Add Command", "rpc_method": "add" }
    ]});
  }

  switch (rpc.method) {
    case 'add':
      cb(null, {
        "contents":[
          { "type": "paragraph", "text":"Please enter a command, and an optional regex to run on the stdout"},
          { "type": "input_field_text", "field_name": "name", "value": "", "label": "Name", "placeholder": "Uptime in days", "required": true},
          { "type": "paragraph", "text":"Note : The name is also used as the device id."},
          { "type": "input_field_text", "field_name": "command", "value": "", "label": "Command", "placeholder": "uptime", "required": true},
          { "type": "input_field_text", "field_name": "regex", "value": "", "label": "RegEx (JS string)", "placeholder": "up (\\\\d+) days", "required": false},
          { "type": "paragraph", "text":"Note : If you provide a regex, the result of the first capturing group will be returned, or if there are no capturing groups the whole match string. "},
          { "type": "submit", "name": "Add Command", "rpc_method": "addSubmit" }
        ]
      });
      break;
    case 'addSubmit':
      try {
        if (rpc.params.regex) {
          new RegExp(rpc.params.regex);
        }

        var id = rpc.params.name.replace(/[^a-zA-Z0-9]/g, '');

        var existing = !!this._commands[id];

        self.addCommand(id, rpc.params.name, rpc.params.command, rpc.params.regex || null);
        cb(null, {
          "contents": [
            { "type":"paragraph", "text":"Command added." + (existing?" Existing command with id '" + id + "' replaced.":'')},
            { "type":"close", "text":"Close"}
          ]
        });
      } catch(e) {
        self.emit('announcement',{"contents": [
          { "type": "heading",      "text": "Error Parsing Regular Expression" },
          { "type": "paragraph",    "text": e+''}
        ]});
      }

      break;
    default:
      log('Unknown rpc method', rpc.method, rpc);
  }
};


function Device(app, id, name, command, regex) {
  var self = this;

  this._app = app;
  this._command = command;
  if (regex) {
    this._regex = new RegExp(regex);
  }

  this.writeable = true;
  this.readable = true;
  this.V = 0;
  this.D = 330;
  this.G = 'shell' + id;
  this.name = 'Shell : ' + name;
}

Device.prototype.write = function(data) {
  this._app.log.info('ninja-shell : Executing : ' + this._command);
  exec(this._command, function(error, stdout, stderr) {
    console.log(error, stderr);
    var result = (stdout+'');

    console.log('result : ', result);
    if (this._regex) {
      result = result.match(this._regex);
      console.log('result from regex', this._regex, result);
      if (result && result.length) {
        this.emit('data', result.pop());
      } else {
        this.emit('data', '');
      }
    } else {
       this.emit('data', result);
    }
  }.bind(this));
};

module.exports = Driver;

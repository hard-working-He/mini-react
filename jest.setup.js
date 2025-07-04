global.MessageChannel = class MessageChannel {
  constructor() {
    this.port1 = {
      onmessage: null
    };
    this.port2 = {
      postMessage: jest.fn(() => {
        if (this.port1.onmessage) {
          this.port1.onmessage();
        }
      })
    };
  }
};

global.performance = {
  now: jest.fn(() => Date.now())
}; 
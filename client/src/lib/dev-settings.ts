export const DevSettings = {
  simulateNetworkDelay: false,
  networkDelayMs: 500,

  async wait() {
    // console.log('DevSettings.wait called, delay:', this.simulateNetworkDelay);
    if (this.simulateNetworkDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.networkDelayMs));
    }
  },
};

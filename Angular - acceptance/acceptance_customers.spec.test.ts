import axios from 'axios';
import * as chai from 'chai';
import * as dotenv from 'dotenv';

const expect = chai.expect;
dotenv.config();

process.env.NODE_ENV = 'test';
const baseURL = process.env.BASE_URL;
axios.create({
  baseURL: process.env.BASE_URL,
});
const config = {
  baseURL: process.env.BASE_URL,
  timeout: 20000,
  headers: { Authorization: `Basic ${process.env.API_KEY}` },
};

describe('Acceptance Tests', () => {
  // tslint:disable-next-line:no-empty
  before(async () => {
    const chars: string = 'abcdefghijklmnopqrstuvwxyz1234567890';
    let userName: string = '';
    for (let i = 0; i < 15; i++) {
      userName += chars[Math.floor(Math.random() * chars.length)];
    }
    const data = {
      name: userName,
      email: userName + '@gmail.com',
      password: 'admin123',
    };
    const url = baseURL + '/v1/signup';
    await axios.post(url, data);

    // TODO: create new user address
  });
  // TODO: Assert on the data which is returned in the response all test cases;

  it('responds with stats data for customer dashboard', async () => {
    config.baseURL = baseURL + '/v1/customer/getStatsForDashboard';
    const result = await axios(config);
    expect(result).to.have.property('status', 200);
    expect(result.data).to.have.property('stats');
    expect(result.data.stats).to.have.property('pendingToActivation');
    expect(result.data.stats).to.have.property('WaitingForFormApprovel');
    expect(result.data.stats).to.have.property('WaitingForIdApprovel');
    expect(result.data.stats).to.have.property('WaitingForChangeOfAddress');
    expect(result.data.stats).to.have.property('WaitingForRecovation');
  });

  it('responds with breakdown of assignment data for customer dashboard grid', async () => {
    config.baseURL = baseURL + '/v1/customer/getBreakdownOfAssignments';
    const result = await axios(config);
    expect(result).to.have.property('status', 200);
    expect(result.data).to.have.property('breakdownAssignments');
    const breakdownAssignments = result.data;
    if (breakdownAssignments && breakdownAssignments.length > 0) {
      expect(breakdownAssignments.length).to.be.above(0);
      expect(breakdownAssignments[0].name).not.equal(null);
    }
  });

  it('responds with customer statuses data for customer dashboard grid', async () => {
    config.baseURL = baseURL + '/v1/customer/customerStatuses';
    const result = await axios(config);
    expect(result).to.have.property('status', 200);
    expect(result.data).to.have.property('filterStatusCountData');
    const customerStatues = result.data;
    if (customerStatues && customerStatues.length > 0) {
      expect(customerStatues.length).to.be.above(0);
      expect(customerStatues[0].name).not.equal(null);
    }
  });

  it('responds with dashboard boxes stats data for customer dashboard grid', async () => {
    config.baseURL = baseURL + '/v1/customer/dashboardBoxesStats';
    const result = await axios(config);
    expect(result).to.have.property('status', 200);
    expect(result.data).to.have.property('dashboardBoxes');
  });

  it('responds with address data', async () => {
    config.baseURL = baseURL + '/v1/user/10/addresses';
    const result = await axios(config);
    expect(result).to.have.property('status', 200);
    expect(result.data).to.have.property('addresses');
    expect(result.data).to.have.property('boxActionData');
    const address = result.data;
    if (address && address.length > 0) {
      expect(address.length).to.be.above(0);
      expect(address[0].address_line).not.equal(null);
    }
  });
  // tslint:disable-next-line:no-empty
  after(() => {});
});

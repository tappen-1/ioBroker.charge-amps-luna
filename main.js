'use strict';

const utils = require('@iobroker/adapter-core');
const axios = require('axios');

const API_BASE_URL = 'https://eapi.charge.space/api/v5';

class ChargeAmpsLuna extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'charge-amps-luna',
        });

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.apiClient = null;
        this.authToken = null;
        this.pollTimer = null;
    }

    async onReady() {
        try {
            this.log.info('Adapter starting...');

            // Get config
            const config = this.config;

            if (!config.apiUsername || !config.apiPassword) {
                this.log.warn('API credentials not configured');
                return;
            }

            if (!config.chargePointId) {
                this.log.warn('Charge Point ID not configured');
                return;
            }

            // Initialize API client
            this.apiClient = axios.create({
                baseURL: API_BASE_URL,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Subscribe to state changes
            this.subscribeStates('chargepoint.charging.start');
            this.subscribeStates('chargepoint.charging.stop');
            this.subscribeStates('chargepoint.connector.current');

            // Authenticate and start polling
            await this.authenticate();
            await this.createStates();
            this.startPolling();

        } catch (error) {
            this.log.error('Error in onReady: ' + error.message);
        }
    }

    async authenticate() {
        try {
            this.log.debug('Authenticating with Charge Amps API...');

            const response = await this.apiClient.post('/auth/login', {
                username: this.config.apiUsername,
                password: this.config.apiPassword
            });

            this.authToken = response.data.access_token;
            this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;

            await this.setState('info.connection', true, true);
            this.log.info('Successfully authenticated');

        } catch (error) {
            await this.setState('info.connection', false, true);
            this.log.error('Authentication failed: ' + error.message);
            throw error;
        }
    }

    async createStates() {
        try {
            this.log.debug('Creating state objects...');

            // States are already defined in io-package.json instanceObjects
            // Just ensure they exist
            const states = {
                'chargepoint': {type: 'channel'},
                'chargepoint.charging': {type: 'channel'},
                'chargepoint.power': {type: 'channel'},
                'chargepoint.energy': {type: 'channel'},
                'chargepoint.connector': {type: 'channel'}
            };

            for (const [id, obj] of Object.entries(states)) {
                await this.setObjectNotExists(id, {
                    type: obj.type,
                    common: { name: id },
                    native: {}
                });
            }

        } catch (error) {
            this.log.error('Error creating states: ' + error.message);
        }
    }

    startPolling() {
        const pollInterval = (this.config.pollInterval || 30) * 1000;

        const poll = async () => {
            try {
                await this.pollStatus();
            } catch (error) {
                this.log.error('Polling error: ' + error.message);
            } finally {
                this.pollTimer = setTimeout(poll, pollInterval);
            }
        };

        poll();
    }

    async pollStatus() {
        try {
            const chargePointId = this.config.chargePointId;
            const response = await this.apiClient.get(`/chargepoints/${chargePointId}/status`);
            const data = response.data;

            // Update states
            if (data) {
                await this.setState('chargepoint.id', data.id || '', true);
                await this.setState('chargepoint.name', data.name || '', true);
                await this.setState('chargepoint.connected', data.connected || false, true);

                if (data.connectors && data.connectors.length > 0) {
                    const connector = data.connectors[0];

                    const isCharging = connector.status === 'Occupied' || connector.chargingSession;
                    await this.setState('chargepoint.charging.active', isCharging, true);

                    if (connector.measuredCurrent !== undefined) {
                        await this.setState('chargepoint.power.current', connector.measuredCurrent, true);
                    }
                    if (connector.measuredVoltage !== undefined) {
                        await this.setState('chargepoint.power.voltage', connector.measuredVoltage, true);
                    }
                    if (connector.measuredPower !== undefined) {
                        await this.setState('chargepoint.power.power', connector.measuredPower, true);
                    }

                    if (connector.totalEnergy !== undefined) {
                        await this.setState('chargepoint.energy.total', connector.totalEnergy / 1000, true);
                    }
                    if (connector.sessionEnergy !== undefined) {
                        await this.setState('chargepoint.energy.session', connector.sessionEnergy / 1000, true);
                    }
                }
            }

        } catch (error) {
            this.log.error('Error polling status: ' + error.message);
        }
    }

    async onStateChange(id, state) {
        if (!state || state.ack === true) {
            return;
        }

        try {
            const chargePointId = this.config.chargePointId;
            const connectorId = 1;

            if (id === this.namespace + '.chargepoint.charging.start') {
                this.log.info('Starting charging...');
                await this.apiClient.put(`/chargepoints/${chargePointId}/connectors/${connectorId}/remotestart`);
                await this.setState(id, false, true);
                await this.pollStatus();

            } else if (id === this.namespace + '.chargepoint.charging.stop') {
                this.log.info('Stopping charging...');
                await this.apiClient.put(`/chargepoints/${chargePointId}/connectors/${connectorId}/remotestop`);
                await this.setState(id, false, true);
                await this.pollStatus();

            } else if (id === this.namespace + '.chargepoint.connector.current') {
                const current = state.val;
                if (current >= 6 && current <= 32) {
                    this.log.info('Setting max current to ' + current + 'A');
                    await this.apiClient.put(`/chargepoints/${chargePointId}/connectors/${connectorId}/settings`, {
                        maxCurrent: current
                    });
                } else {
                    this.log.warn('Current must be between 6 and 32A');
                }
            }

        } catch (error) {
            this.log.error('Error handling state change: ' + error.message);
        }
    }

    onUnload(callback) {
        try {
            if (this.pollTimer) {
                clearTimeout(this.pollTimer);
            }
            this.log.info('Adapter cleaned up');
            callback();
        } catch (e) {
            callback();
        }
    }
}

if (require.main === module) {
    new ChargeAmpsLuna();
} else {
    module.exports = (options) => new ChargeAmpsLuna(options);
}

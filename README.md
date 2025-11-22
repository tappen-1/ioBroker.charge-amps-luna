# ioBroker.charge-amps-luna

[![NPM version](http://img.shields.io/npm/v/iobroker.charge-amps-luna.svg)](https://www.npmjs.com/package/iobroker.charge-amps-luna)
[![MIT License](https://img.shields.io/github/license/yourusername/ioBroker.charge-amps-luna)](https://github.com/yourusername/ioBroker.charge-amps-luna/blob/master/LICENSE)

# Charge Amps Luna Wallbox Integration

ioBroker adapter for the Charge Amps Luna wallbox to enable monitoring and control through ioBroker.

## Features

- Real-time status monitoring of charging sessions
- Remote start/stop charging functionality
- Current limiting (6-32A) support
- Power and energy tracking (voltage, current, power, energy consumption)
- Automatic polling with configurable intervals
- Easy configuration through admin interface

## Quick Start

### Installation

1. Install the adapter in ioBroker
2. Configure your Charge Amps API credentials:
   - Log in to [Charge Amps Dashboard](https://dashboard.charge.space/)
   - Note your username (email address) and password
   - Find your Charge Point ID in the Luna wallbox settings
3. Set the polling interval (10-300 seconds, default: 30)

### Configuration

The adapter requires the following settings:
- **API Username**: Your Charge Amps email address
- **API Password**: Your Charge Amps password
- **Charge Point ID**: The ID of your Luna wallbox from the Charge Amps dashboard
- **Poll Interval**: How often to update data (10-300 seconds)

## API Documentation

Official Charge Amps API documentation is available at:
https://eapi.charge.space/swagger/index.html

## Adapter Features

The adapter provides the following state objects:

### Charging Control
- `chargepoint.charging.active` - Current charging status
- `chargepoint.charging.start` - Trigger to start charging
- `chargepoint.charging.stop` - Trigger to stop charging

### Power Metrics
- `chargepoint.power.current` - Current in Amperes (A)
- `chargepoint.power.voltage` - Voltage in Volts (V)
- `chargepoint.power.power` - Power consumption in Watts (W)

### Energy Tracking
- `chargepoint.energy.total` - Total energy consumed (kWh)
- `chargepoint.energy.session` - Energy consumed in current session (kWh)

### Charge Point Settings
- `chargepoint.connector.current` - Maximum current setting (6-32A)

## Development

To contribute to this adapter, please fork the repository and submit a pull request.

### Building from Source

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

## License

MIT License

## Copyright

Copyright (c) 2024 ioBroker.charge-amps-luna contributors

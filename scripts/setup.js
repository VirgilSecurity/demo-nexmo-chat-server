const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { VirgilCrypto } = require('virgil-crypto');
const chalk = require('chalk');

const HEX_REGEXP = /^[0-9a-fA-F]+$/;

const virgilCrypto = new VirgilCrypto();

const writeFileAsync = promisify(fs.writeFile);

inquirer.prompt([
    { 
        type: 'input',
        name: 'virgil.appId',
        message: 'Enter your Virgil Security Application ID',
        validate: (input => {
            if (HEX_REGEXP.test(input)) {
                return true;
            }

            return 'Invalid Virgil Application ID, must be 32 characters in HEX.';
        })
    },
    {
        type: 'input',
        name: 'virgil.apiKeyId',
        message: 'Enter your Virgil Security API Key ID',
        validate: (input => {
            if (HEX_REGEXP.test(input)) {
                return true;
            }

            return 'Invalid Virgil API Key ID, must be 32 characters in HEX.';
        })
    },
    {
        type: 'input',
        name: 'virgil.apiKey',
        message: 'Enter your Virgil Security API Key private key',
        validate: (input => {
            try {
                virgilCrypto.importPrivateKey(input);
            } catch (ignore) {
                return 'The input is not a private key.'
            }
            return true;
        })
    },
    {
        type: 'input',
        name: 'nexmo.appConfigPath',
        message: 'Enter the path to your Nexmo app conifg file',
        default: '.nexmo-app',
        filter: input =>  path.isAbsolute(input) ? input : path.resolve(process.cwd(), input),
        validate: filename => 
            fs.existsSync(filename) || `Cannot read ${filename}. Make sure the file exists.`
    },
    {
        type: 'input',
        name: 'nexmo.apiKey',
        message: 'Enter your Nexmo API Key',
        validate: input => HEX_REGEXP.test(input) || 'Invalid Nexmo API Key. Must be a string in HEX'
    },
    {
        type: 'input',
        name: 'nexmo.apiSecret',
        message: 'Enter your Nexmo API Secret',
        validate: input => HEX_REGEXP.test(input) || 'Invalid Nexmo API Secret. Must be a string in HEX'
    }
]).then(answers => {
    Object.assign(answers, {
        virgilAuth: generateVirgilAuthKeyPair()
    });
    const parsedNexmoConfig = parseNexmoAppConfig(
        fs.readFileSync(answers.nexmo.appConfigPath, { encoding: 'utf8' })
    );
    Object.assign(answers.nexmo, parsedNexmoConfig);
    
    const configPaths = {
        auth: path.resolve(process.cwd(), '.env.auth'),
        web: path.resolve(process.cwd(), '.env.web'),
        test: path.resolve(process.cwd(), '.env.test')
    };

    const relativeToCwd = absolute => path.relative(process.cwd(), absolute);

    return Promise.all([
        writeFileAsync(
            configPaths.auth,
            generateVirgilAuthConfig(answers)
        ),
        writeFileAsync(
            configPaths.web,
            generateWebConfig(answers)
        ),
        writeFileAsync(
            configPaths.test,
            generateTestConfig(answers)
        )
    ]).then(() => {
        console.log(chalk`
        {bold The server is set up}
        Virgil Auth config written to {cyan ${relativeToCwd(configPaths.auth)}}
        Main Web app config written to {cyan ${relativeToCwd(configPaths.web)}}
        Test config written to {cyan ${relativeToCwd(configPaths.test)}}

        Run {bold docker-compose up} to start the server
        `);
    });
}).catch(error => {
    console.log(chalk.red('Unexpected error occurred'), error);
});

function generateVirgilAuthKeyPair () {
    const authKeyPair = virgilCrypto.generateKeys();
    return {
        privateKey: virgilCrypto.exportPrivateKey(authKeyPair.privateKey).toString('base64'),
        publicKey: virgilCrypto.exportPublicKey(authKeyPair.publicKey).toString('base64')
    };
}

function parseNexmoAppConfig (src) {
    return src.split('\n').reduce((result, line) => {
        const keyValuePair = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (keyValuePair) {
            const key = keyValuePair[1];
            let value = keyValuePair[2] || '';

            const len = value.length;
            if (len > 0 && value.startsWith('"') && value.endsWith('"')) {
                value = value.replace(/\\n/gm, '\n');
            }

            value = value.replace(/(^['"]|['"]$)/g, '').trim();
            result[key] = value;
        }

        return result;
    }, {});
}

function generateVirgilAuthConfig (rootConfig) {
    return Object.entries({
        'APP_ID': rootConfig.virgil.appId,
        'API_KEY_ID': rootConfig.virgil.apiKeyId,
        'API_KEY': rootConfig.virgil.apiKey,
        'KEY': rootConfig.virgilAuth.privateKey,
        'DB': 'mongodb://mongo:27017/virgil-auth'
    })
    .map(entry => entry.join('='))
    .join('\n');
}

function generateWebConfig (rootConfig) {
    return Object.entries({
        'VIRGIL_APP_ID': rootConfig.virgil.appId,
        'VIRGIL_API_KEY_ID': rootConfig.virgil.apiKeyId,
        'VIRGIL_API_KEY': rootConfig.virgil.apiKey,
        'VIRGIL_AUTH_URL': 'http://auth:8080',
        'VIRGIL_AUTH_PUBLIC_KEY': rootConfig.virgilAuth.publicKey,
        'NEXMO_API_KEY': rootConfig.nexmo.apiKey,
        'NEXMO_API_SECRET': rootConfig.nexmo.apiSecret,
        'NEXMO_APP_ID': rootConfig.nexmo.app_id,
        'NEXMO_APP_PRIVATE_KEY': Buffer.from(rootConfig.nexmo.private_key, 'utf8').toString('base64')
    })
    .map(entry => entry.join('='))
    .join('\n');
}

function generateTestConfig (rootConfig) {
    return Object.entries({
        'VIRGIL_AUTH_URL': 'http://localhost:8080',
        'VIRGIL_AUTH_PUBLIC_KEY': rootConfig.virgilAuth.publicKey
    })
    .map(entry => entry.join('='))
    .join('\n');
}